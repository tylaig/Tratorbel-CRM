import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import ChatwootContacts from "@/components/ChatwootContacts";
// Importação de SalesResultStages removida
import FilterBar, { FilterOptions } from "@/components/FilterBar";
import ApiConfigModal from "@/components/ApiConfigModal";
import AddDealModal from "@/components/AddDealModal";
import InitializeDB from "@/components/InitializeDB";
import { usePipeline } from "@/hooks/usePipeline";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Pipeline } from "@shared/schema";
import HeatmapView from "@/pages/Heatmap";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "contacts" | "heatmap" | "results">("kanban");
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Estado para controlar o pipeline ativo
  const [activePipelineId, setActivePipelineId] = useState<number | null>(null);
  
  // Fetch a lista de pipelines disponíveis
  const { data: pipelines = [] } = useQuery<Pipeline[]>({
    queryKey: ['/api/pipelines'],
  });

  // Fetch o pipeline padrão
  const { data: defaultPipeline } = useQuery<Pipeline>({
    queryKey: ['/api/pipelines/default'],
    onSuccess: (data) => {
      if (data?.id && !activePipelineId) {
        setActivePipelineId(data.id);
      }
    }
  });
  
  const { pipelineStages, refreshPipelineData, filters, updateFilters } = usePipeline(activePipelineId);
  
  // Get settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings | undefined>({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      if (data?.activePipelineId) {
        setActivePipelineId(data.activePipelineId);
      }
    }
  });

  // Handle URL parameters for API configuration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlApiKey = params.get('api_key');
    const urlChatwootUrl = params.get('url');
    const urlAccountId = params.get('id');

    // If URL has all parameters, save them
    if (urlApiKey && urlChatwootUrl && urlAccountId) {
      const saveSettings = async () => {
        try {
          // Save settings and get response
          await apiRequest('/api/settings', 'POST', {
            chatwootApiKey: urlApiKey,
            chatwootUrl: urlChatwootUrl,
            accountId: urlAccountId
          });
          
          // Clean URL and refresh page
          window.history.replaceState({}, '', '/');
          
          // Refresh settings first and wait for it
          await queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
          await queryClient.refetchQueries({ queryKey: ['/api/settings'] });
          
          // Wait for sync to complete
          const syncResponse = await apiRequest('/api/chatwoot/sync', 'POST', {});
          
          // Only after sync completes, refresh the deals and wait for the refetch
          if (syncResponse.success) {
            await queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
            await queryClient.refetchQueries({ queryKey: ['/api/deals'] });
            await queryClient.refetchQueries({ queryKey: ['/api/pipeline-stages'] });
            // Force a state update to trigger re-render
            refreshPipelineData();
          }
        } catch (error) {
          console.error('Failed to save settings from URL:', error);
        }
      };
      saveSettings();
    }
    // Show modal only if no URL parameters and no existing config
    else if (!isLoadingSettings && !settings?.chatwootApiKey && !isApiModalOpen) {
      setIsApiModalOpen(true);
    }
  }, [isLoadingSettings]);
  
  // Sync with Chatwoot
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/chatwoot/sync', 'POST', {});
    },
    onSuccess: async () => {
      // Invalidar todas as consultas relevantes
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatwoot/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
      
      try {
        // Refetch das consultas em vez de recarregar a página
        await queryClient.refetchQueries({ queryKey: ['/api/deals'] });
        await queryClient.refetchQueries({ queryKey: ['/api/chatwoot/contacts'] });
        await queryClient.refetchQueries({ queryKey: ['/api/pipeline-stages'] });
        
        // Forçar atualização dos dados do pipeline
        refreshPipelineData();
      } catch (error) {
        console.error("Erro ao atualizar dados após sincronização:", error);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Chatwoot. Verifique suas configurações.",
        variant: "destructive",
      });
      console.error("Sync error:", error);
    }
  });
  
  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      
      // Exibir informações detalhadas sobre a sincronização
      if (result && result.synced !== undefined) {
        let description = "Os contatos foram sincronizados com sucesso.";
        
        // Se houver novos negócios, mostrar quantos
        if (result.newDeals && result.newDeals.length > 0) {
          description = `${result.synced} contatos sincronizados. ${result.newDeals.length} novo(s) negócio(s) criado(s).`;
        } else {
          description = `${result.synced} contatos sincronizados. Nenhum novo negócio criado.`;
        }
        
        toast({
          title: "Sincronização concluída",
          description: description,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleViewMode = (mode: "kanban" | "list" | "contacts" | "heatmap" | "results") => {
    setViewMode(mode);
  };
  
  // Estado para controlar a exibição do modal de inicialização do DB
  const [showDBInitializer, setShowDBInitializer] = useState(false);
  // Flag para controlar a verificação do banco de dados
  const [dbCheckPerformed, setDbCheckPerformed] = useState(false);
  
  // Atualizar dados do pipeline periodicamente
  useEffect(() => {
    // Atualizar imediatamente ao montar
    refreshPipelineData();
    
    // Configurar atualização a cada 5 segundos
    const interval = setInterval(() => {
      refreshPipelineData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Verificar erros 500 nas requisições para exibir o inicializador de DB
  // Mas apenas uma vez durante o carregamento da página
  useEffect(() => {
    // Não fazer a verificação se já foi realizada
    if (dbCheckPerformed) return;
    
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/pipeline-stages');
        if (response.status === 500) {
          setShowDBInitializer(true);
        }
        // Marcar que a verificação foi realizada
        setDbCheckPerformed(true);
      } catch (error) {
        console.error('Erro ao verificar status do banco de dados:', error);
        setShowDBInitializer(true);
        // Marcar que a verificação foi realizada mesmo com erro
        setDbCheckPerformed(true);
      }
    };
    
    checkDatabaseStatus();
  }, [dbCheckPerformed]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="flex-none">
        <Header 
          toggleSidebar={toggleSidebar}
          viewMode={viewMode} 
          toggleViewMode={toggleViewMode}
          onOpenApiConfig={() => setIsApiModalOpen(true)}
          hasApiConfig={!!settings?.chatwootApiKey}
          activePipelineId={activePipelineId}
          onPipelineChange={(pipelineId) => setActivePipelineId(pipelineId)}
        />
      </div>
      
      {/* Conteúdo principal - tudo abaixo do cabeçalho */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <main className="flex-grow flex flex-col overflow-hidden bg-gray-50">
          {/* Mostrar o inicializador de banco de dados quando necessário */}
          {showDBInitializer && (
            <div className="px-4 pt-6 pb-4 flex-none">
              <InitializeDB />
            </div>
          )}
          
          {/* Barra de filtros - tamanho fixo - somente quando um pipeline estiver selecionado */}
          {activePipelineId && viewMode !== "contacts" && viewMode !== "heatmap" && viewMode !== "results" && (
            <div className="px-4 py-3 bg-gray-50 border-b flex-none">
              <FilterBar 
                onFilterChange={updateFilters}
                activeFilters={filters}
                activePipelineId={activePipelineId}
                isDefaultPipeline={defaultPipeline?.id === activePipelineId}
              />
            </div>
          )}
          
          {/* Área de conteúdo com scroll */}
          <div className="flex-grow overflow-auto">
            {!activePipelineId && (
              <div className="flex items-center justify-center flex-col p-8">
                <div className="bg-blue-950 border-2 border-yellow-500 rounded-lg p-8 max-w-md text-center shadow-lg">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">Nenhum Pipeline Selecionado</h3>
                  <p className="text-white mb-4">
                    Selecione um pipeline no menu superior para visualizar e gerenciar seus negócios.
                  </p>
                  <p className="text-sm text-gray-200">
                    Se não houver nenhum pipeline disponível, entre em contato com o administrador para configurar os pipelines.
                  </p>
                </div>
              </div>
            )}
            
            {activePipelineId && viewMode === "kanban" && (
              <div className="h-full overflow-auto">
                <KanbanBoard 
                  pipelineStages={pipelineStages} 
                  filters={filters} 
                  activePipelineId={activePipelineId}
                  onAddDeal={() => setIsAddDealModalOpen(true)}
                />
              </div>
            )}
            
            {activePipelineId && viewMode === "list" && (
              <div className="px-4 overflow-y-auto h-full">
                <ListView 
                  pipelineStages={pipelineStages} 
                  filters={filters} 
                  activePipelineId={activePipelineId} 
                />
              </div>
            )}
            
            {activePipelineId && viewMode === "contacts" && (
              <div className="px-4 overflow-y-auto h-full">
                <ChatwootContacts pipelineStages={pipelineStages} settings={settings} />
              </div>
            )}
            
            {activePipelineId && viewMode === "heatmap" && (
              <div className="px-4 overflow-y-auto h-full">
                <HeatmapView />
              </div>
            )}
            
            {/* Bloco de resultados de vendas removido conforme solicitado */}
          </div>
        </main>
      </div>
      
      <ApiConfigModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
        existingSettings={settings}
      />
      
      <AddDealModal 
        isOpen={isAddDealModalOpen} 
        onClose={() => setIsAddDealModalOpen(false)} 
        pipelineStages={pipelineStages}
      />
    </div>
  );
}
