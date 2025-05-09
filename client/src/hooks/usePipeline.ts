import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PipelineStage, Deal } from "@shared/schema";

export function usePipeline() {
  const [pipelineData, setPipelineData] = useState<{
    pipelineStages: PipelineStage[];
    deals: Deal[];
  }>({
    pipelineStages: [],
    deals: [],
  });
  
  // Fetch pipeline stages
  const stagesQuery = useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline-stages'],
  });
  
  // Fetch deals
  const dealsQuery = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Update pipeline data when queries complete
  useEffect(() => {
    if (stagesQuery.data && dealsQuery.data) {
      setPipelineData({
        pipelineStages: stagesQuery.data,
        deals: dealsQuery.data,
      });
    }
  }, [stagesQuery.data, dealsQuery.data]);
  
  // Calculate stage statistics
  const calculateStageStats = (stageId: number) => {
    if (!dealsQuery.data) return { count: 0, value: 0 };
    
    const stageDeals = dealsQuery.data.filter(deal => deal.stageId === stageId);
    const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    return {
      count: stageDeals.length,
      value: totalValue,
    };
  };
  
  // Refresh pipeline data
  const refreshPipelineData = () => {
    stagesQuery.refetch();
    dealsQuery.refetch();
  };
  
  return {
    pipelineStages: pipelineData.pipelineStages,
    deals: pipelineData.deals,
    isLoading: stagesQuery.isLoading || dealsQuery.isLoading,
    calculateStageStats,
    refreshPipelineData,
  };
}
