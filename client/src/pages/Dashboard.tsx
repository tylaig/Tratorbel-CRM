import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import FilterBar, { FilterOptions } from "@/components/FilterBar";
import ApiConfigModal from "@/components/ApiConfigModal";
import AddDealModal from "@/components/AddDealModal";
import { usePipeline } from "@/hooks/usePipeline";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Settings } from "@shared/schema";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
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
          // Save settings
          await apiRequest('POST', '/api/settings', {
            chatwootApiKey: urlApiKey,
            chatwootUrl: urlChatwootUrl,
            accountId: urlAccountId
          });
          
          // Clean URL after saving
          window.history.replaceState({}, '', '/');
          
          // Refresh settings first
          await queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
          
          // Wait for sync to complete
          const syncResponse = await apiRequest('POST', '/api/chatwoot/sync', {});
          
          // Only after sync completes, refresh the deals
          if (syncResponse.success) {
            await queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
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
      return await apiRequest('POST', '/api/chatwoot/sync', {});
    },
    onSuccess: () => {
      toast({
        title: "Sincronização concluída",
        description: "Os contatos foram sincronizados com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      refreshPipelineData();
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
  
  const handleSync = () => {
    syncMutation.mutate();
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleViewMode = (mode: "kanban" | "list") => {
    setViewMode(mode);
  };
  
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
      />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50 px-4">
          <FilterBar 
            onFilterChange={updateFilters}
            activeFilters={filters}
          />
          
          {viewMode === "kanban" ? (
            <KanbanBoard pipelineStages={pipelineStages} />
          ) : (
            <ListView pipelineStages={pipelineStages} />
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
