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
    sortOrder: "desc"
  });
  
  // Fetch deals
  const { data: allDeals = [], isLoading: isDealsLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Fetch pipeline stages
  const { data: pipelineStages = [], isLoading: isStagesLoading } = useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline-stages'],
  });
  
  // Apply filters and sorting to deals
  useEffect(() => {
    let result = [...allDeals];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(deal => 
        deal.name.toLowerCase().includes(searchLower) ||
        (deal.companyName && deal.companyName.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(deal => filters.status.includes(deal.status));
    }
    
    // Apply stage filter
    if (filters.stageId !== undefined) {
      result = result.filter(deal => deal.stageId === filters.stageId);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const sortMultiplier = filters.sortOrder === "asc" ? 1 : -1;
      
      switch (filters.sortBy) {
        case "name":
          return sortMultiplier * a.name.localeCompare(b.name);
        case "value":
          return sortMultiplier * ((a.value || 0) - (b.value || 0));
        case "company":
          return sortMultiplier * ((a.companyName || "").localeCompare(b.companyName || ""));
        case "date":
        default:
          return sortMultiplier * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
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
    setFilters(newFilters);
  };
  
  // Calculate total pipeline value
  const calculateTotalValue = () => {
    return filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  };
  
  // Organize deals by stage
  const getDealsByStage = (stageId: number) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };
  
  // Refresh pipeline data manually
  const refreshPipelineData = () => {
    // This will trigger a refetch of the deals data
    queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
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