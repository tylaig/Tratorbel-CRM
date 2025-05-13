import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pipeline } from "@shared/schema";

interface PipelineSelectorProps {
  activePipelineId: number | null;
  onPipelineChange: (pipelineId: number) => void;
}

export default function PipelineSelector({
  activePipelineId,
  onPipelineChange,
}: PipelineSelectorProps) {
  // Buscar pipelines disponíveis
  const { data: pipelines = [], isLoading } = useQuery<Pipeline[]>({
    queryKey: ['/api/pipelines'],
  });

  // Se não houver pipelines ativos ou estiver carregando, não mostrar o seletor
  if (isLoading || pipelines.length === 0) {
    return null;
  }

  return (
    <div className="w-[200px]">
      <Select
        value={activePipelineId?.toString() || ""}
        onValueChange={(value) => onPipelineChange(Number(value))}
      >
        <SelectTrigger className="h-9 border-2 border-yellow-500 bg-blue-950 text-yellow-400 hover:bg-blue-900">
          <SelectValue placeholder="Selecionar pipeline" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}