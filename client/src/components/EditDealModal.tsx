import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { type PipelineStage, type Deal } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2Icon, Trash2Icon } from "lucide-react";

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  pipelineStages: PipelineStage[];
}

export default function EditDealModal({ isOpen, onClose, deal, pipelineStages }: EditDealModalProps) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [stageId, setStageId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("in_progress");
  
  const { toast } = useToast();
  
  // Carregar dados do deal quando o modal abrir
  useEffect(() => {
    if (deal) {
      setName(deal.name);
      setCompanyName(deal.companyName || "");
      setStageId(deal.stageId.toString());
      setValue(formatCurrency(deal.value || 0));
      setStatus(deal.status);
    }
  }, [deal]);
  
  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return null;
      
      const payload = {
        name,
        companyName,
        stageId: parseInt(stageId),
        value: parseFloat(value.replace(/[^\d.-]/g, "") || "0"),
        status
      };
      return await apiRequest('PUT', `/api/deals/${deal.id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Negócio atualizado",
        description: "As alterações foram salvas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o negócio. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Update deal error:", error);
    }
  });
  
  const deleteDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return null;
      return await apiRequest('DELETE', `/api/deals/${deal.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Negócio excluído",
        description: "O negócio foi excluído com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o negócio. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Delete deal error:", error);
    }
  });
  
  const handleSave = () => {
    if (!name || !stageId) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do negócio e etapa do funil são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    updateDealMutation.mutate();
  };
  
  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este negócio?")) {
      deleteDealMutation.mutate();
    }
  };
  
  const resetForm = () => {
    setName("");
    setCompanyName("");
    setStageId("");
    setValue("");
    setStatus("in_progress");
  };
  
  // Format currency input
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(rawValue) / 100;
    
    if (!isNaN(numericValue)) {
      setValue(formatCurrency(numericValue));
    } else if (rawValue === "") {
      setValue("");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2Icon className="h-5 w-5 text-primary" />
            Editar Negócio
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes do negócio conforme necessário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deal-name">Nome do Negócio</Label>
            <Input
              id="deal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do negócio"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deal-company">Empresa</Label>
            <Input
              id="deal-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Digite o nome da empresa"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deal-stage">Etapa</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger id="deal-stage">
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id.toString()}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deal-value">Valor (R$)</Label>
            <Input
              id="deal-value"
              value={value}
              onChange={handleValueChange}
              placeholder="0,00"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deal-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="deal-status">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            className="flex items-center gap-2" 
            onClick={handleDelete}
          >
            <Trash2Icon className="h-4 w-4" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateDealMutation.isPending || deleteDealMutation.isPending}
            >
              {updateDealMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}