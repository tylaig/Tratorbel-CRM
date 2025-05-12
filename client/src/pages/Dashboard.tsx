import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import ChatwootContacts from "@/components/ChatwootContacts";
import SalesResultStages from "@/components/SalesResultStages";
import FilterBar, { FilterOptions } from "@/components/FilterBar";
import ApiConfigModal from "@/components/ApiConfigModal";
import AddDealModal from "@/components/AddDealModal";
import InitializeDB from "@/components/InitializeDB";
import { usePipeline } from "@/hooks/usePipeline";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Settings } from "@shared/schema";
import HeatmapView from "@/pages/Heatmap";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "contacts" | "heatmap" | "results">("kanban");
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { pipelineStages, refreshPipelineData, filters, updateFilters } = usePipeline();
  
  // Get settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings | undefined>({
    queryKey: ['/api/settings'],
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
    <div className="flex flex-col h-screen">
      <Header 
        toggleSidebar={toggleSidebar}
        viewMode={viewMode} 
        toggleViewMode={toggleViewMode}
        onOpenApiConfig={() => setIsApiModalOpen(true)}
        onAddDeal={() => setIsAddDealModalOpen(true)}
        onSync={handleSync}
        syncLoading={syncMutation.isPending}
        hasApiConfig={!!settings?.chatwootApiKey}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-gray-50 px-4 pt-6 overflow-y-auto">
          {/* Mostrar o inicializador de banco de dados quando necessário */}
          {showDBInitializer && (
            <div className="mb-6">
              <InitializeDB />
            </div>
          )}
          
          {viewMode !== "contacts" && viewMode !== "heatmap" && viewMode !== "results" && (
            <FilterBar 
              onFilterChange={updateFilters}
              activeFilters={filters}
            />
          )}
          
          {viewMode === "kanban" && (
            <KanbanBoard pipelineStages={pipelineStages} filters={filters} />
          )}
          
          {viewMode === "list" && (
            <ListView pipelineStages={pipelineStages} filters={filters} />
          )}
          
          {viewMode === "contacts" && (
            <ChatwootContacts pipelineStages={pipelineStages} settings={settings} />
          )}
          
          {viewMode === "heatmap" && (
            <HeatmapView />
          )}
          
          {viewMode === "results" && (
            <SalesResultStages pipelineStages={pipelineStages} filters={filters} />
          )}
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
