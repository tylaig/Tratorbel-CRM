import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Pipeline } from "@shared/schema";

interface PipelineSelectorProps {
  onPipelineChange: (pipelineId: number) => void;
  activePipelineId?: number | null;
}

export default function PipelineSelector({ onPipelineChange, activePipelineId }: PipelineSelectorProps) {
  const { toast } = useToast();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(activePipelineId?.toString() || "");

  // Buscar todas as pipelines disponíveis
  const { data: pipelines, isLoading } = useQuery<Pipeline[]>({
    queryKey: ['/api/pipelines'],
    refetchOnWindowFocus: true,
    staleTime: 60000, // 1 minuto
  });

  // Buscar pipeline padrão
  const { data: defaultPipeline } = useQuery<Pipeline>({
    queryKey: ['/api/pipelines/default'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });

  // Atualizar configurações ao mudar de pipeline
  const updateSettingsMutation = useMutation({
    mutationFn: async (pipelineId: number) => {
      return await apiRequest('/api/settings', 'POST', {
        activePipelineId: pipelineId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar pipeline ativo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o funil ativo. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Se não tiver pipeline ativo e tiver pipeline padrão, usar o padrão
  useEffect(() => {
    if (!selectedPipelineId && defaultPipeline) {
      setSelectedPipelineId(defaultPipeline.id.toString());
      onPipelineChange(defaultPipeline.id);
    }
  }, [defaultPipeline, selectedPipelineId]);

  // Ao receber activePipelineId de fora, atualizar o estado local
  useEffect(() => {
    if (activePipelineId && activePipelineId.toString() !== selectedPipelineId) {
      setSelectedPipelineId(activePipelineId.toString());
    }
  }, [activePipelineId]);

  // Função para mudar o pipeline ativo
  const handlePipelineChange = (value: string) => {
    const pipelineId = parseInt(value);
    if (!isNaN(pipelineId)) {
      setSelectedPipelineId(value);
      onPipelineChange(pipelineId);
      updateSettingsMutation.mutate(pipelineId);
    }
  };

  if (isLoading || !pipelines || pipelines.length === 0) {
    return null;
  }

  return (
    <div className="w-48">
      <Select value={selectedPipelineId} onValueChange={handlePipelineChange}>
        <SelectTrigger className="w-full text-xs">
          <SelectValue placeholder="Selecione o funil" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Funis disponíveis</SelectLabel>
            {pipelines.map((pipeline) => (
              <SelectItem 
                key={pipeline.id} 
                value={pipeline.id.toString()}
                className="text-sm"
              >
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}