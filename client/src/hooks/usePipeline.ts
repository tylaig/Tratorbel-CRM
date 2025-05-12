import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Deal, PipelineStage } from "@shared/schema";
import { FilterOptions } from "@/components/FilterBar";

export function usePipeline() {
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: [],
    sortBy: "date",
    sortOrder: "desc",
    hideClosed: true // Por padrão, escondemos negócios fechados (vendidos ou perdidos)
  });
  
  // Fetch deals com configurações para garantir atualização imediata
  const { data: allDeals = [], isLoading: isDealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    staleTime: 0,                // Considerar dados obsoletos imediatamente (sempre buscar dados frescos)
    refetchOnMount: true,        // Recarregar quando o componente for montado
    refetchOnWindowFocus: true,  // Recarregar quando a janela ganhar foco
  });
  
  // Fetch pipeline stages com configurações para garantir atualização imediata
  const { data: pipelineStages = [], isLoading: isStagesLoading } = useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline-stages'],
    staleTime: 0,                // Considerar dados obsoletos imediatamente (sempre buscar dados frescos)
    refetchOnMount: true,        // Recarregar quando o componente for montado
    refetchOnWindowFocus: true,  // Recarregar quando a janela ganhar foco
  });
  
  // Apply filters and sorting to deals
  useEffect(() => {
    let result = [...allDeals];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(deal => {
        // Nome do negócio é garantido que existe
        if (deal.name.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Outros campos podem não existir, então verificamos antes
        // A maioria dos campos estão em leadData (já que usamos joins no backend)
        const leadData = (deal as any).leadData || {};
        
        return (
          // Campos do Deal diretamente
          (deal.notes && deal.notes.toLowerCase().includes(searchLower)) ||
          
          // Campos do Lead (podem existir em leadData)
          (leadData.companyName && leadData.companyName.toLowerCase().includes(searchLower)) ||
          (leadData.name && leadData.name.toLowerCase().includes(searchLower)) ||
          (leadData.phone && leadData.phone.toLowerCase().includes(searchLower)) ||
          (leadData.email && leadData.email.toLowerCase().includes(searchLower)) ||
          (leadData.city && leadData.city.toLowerCase().includes(searchLower)) ||
          (leadData.state && leadData.state.toLowerCase().includes(searchLower)) ||
          (leadData.address && leadData.address.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply status filters (status e saleStatus)
    if (filters.status && filters.status.length > 0) {
      result = result.filter(deal => {
        // O filtro pode ser por status ou por saleStatus
        // O status se refere ao estado do negócio (em andamento, concluído, etc.)
        // O saleStatus se refere ao resultado da venda (ganho, perdido, aberto)
        
        // Verificar se algum dos filtros aplicados corresponde ao status do negócio
        const matchStatus = deal.status && filters.status.includes(deal.status);
        
        return matchStatus;
      });
    }
    
    // Filtro específico para excluir negócios ganhos ou perdidos do pipeline
    if (filters.hideClosed) {
      result = result.filter(deal => 
        deal.saleStatus !== 'won' && 
        deal.saleStatus !== 'lost'
      );
    }
    
    // Apply stage filter
    if (filters.stageId !== undefined) {
      result = result.filter(deal => deal.stageId === filters.stageId);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const sortMultiplier = filters.sortOrder === "asc" ? 1 : -1;
      const leadDataA = (a as any).leadData || {};
      const leadDataB = (b as any).leadData || {};
      
      switch (filters.sortBy) {
        case "name":
          return sortMultiplier * (a.name || "").localeCompare(b.name || "");
        case "value":
          return sortMultiplier * ((a.value || 0) - (b.value || 0));
        case "company":
          // Use companyName do leadData se disponível
          const companyA = leadDataA.companyName || "";
          const companyB = leadDataB.companyName || "";
          return sortMultiplier * companyA.localeCompare(companyB);
        case "date":
        default:
          // Se a data for inválida, use a data atual como fallback
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
          return sortMultiplier * (dateA - dateB);
      }
    });
    
    setFilteredDeals(result);
  }, [allDeals, filters]);
  
  // Calculate stats for a stage
  const calculateStageStats = (stageId: number) => {
    const stageDeals = filteredDeals.filter(deal => deal.stageId === stageId);
    const value = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    return {
      count: stageDeals.length,
      value
    };
  };
  
  // Update filters
  const updateFilters = (newFilters: FilterOptions) => {
    // Garantir que sempre temos um valor para hideClosed (true por padrão)
    const updatedFilters = {
      ...newFilters,
      hideClosed: newFilters.hideClosed !== undefined ? newFilters.hideClosed : true
    };
    
    console.log("Aplicando filtros:", updatedFilters);
    setFilters(updatedFilters);
  };
  
  // Calculate total pipeline value
  const calculateTotalValue = () => {
    return filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  };
  
  // Organize deals by stage
  const getDealsByStage = (stageId: number) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };
  
  // Refresh pipeline data manually com recarregamento forçado
  const refreshPipelineData = async () => {
    try {
      // Invalidar o cache para forçar uma nova requisição
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] })
      ]);
      
      // Forçar recarregamento imediato dos dados
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/deals'] }),
        queryClient.refetchQueries({ queryKey: ['/api/pipeline-stages'] })
      ]);
    } catch (error) {
      console.error("Erro ao atualizar dados do pipeline:", error);
    }
  };

  return {
    deals: filteredDeals,
    pipelineStages,
    filters,
    updateFilters,
    isLoading: isDealsLoading || isStagesLoading,
    calculateStageStats,
    calculateTotalValue,
    getDealsByStage,
    refreshPipelineData
  };
}