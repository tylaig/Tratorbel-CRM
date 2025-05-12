import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Deal, LossReason } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

interface DealOutcomeFormProps {
  deal: Deal | null;
  onSuccess: () => void;
}

export default function DealOutcomeForm({ deal, onSuccess }: DealOutcomeFormProps) {
  const [outcome, setOutcome] = useState<"won" | "lost" | "">("");
  const [lossReason, setLossReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [finalValue, setFinalValue] = useState(deal?.value ? formatCurrency(deal.value) : "");
  
  const { toast } = useToast();
  
  // Carregar motivos de perda
  const { data: lossReasons = [] } = useQuery<LossReason[]>({
    queryKey: ['/api/loss-reasons'],
    enabled: outcome === "lost",
  });
  
  useEffect(() => {
    // Resetar estado quando o deal mudar
    if (deal) {
      setOutcome("");
      setLossReason("");
      setCustomReason("");
      setNotes("");
      setFinalValue(deal.value ? formatCurrency(deal.value) : "");
    }
  }, [deal]);
  
  // Format currency input
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(rawValue) / 100;
    
    if (!isNaN(numericValue)) {
      setFinalValue(formatCurrency(numericValue));
    } else if (rawValue === "") {
      setFinalValue("");
    }
  };
  
  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return null;
      
      // Parsear valor numérico
      const numericValue = finalValue
        ? parseFloat(finalValue.replace(/[^\d,]/g, "").replace(",", "."))
        : 0;
      
      const payload: any = {
        saleStatus: outcome,
        value: numericValue,
      };
      
      // Adicionar motivo de perda se aplicável
      if (outcome === "lost") {
        // Se for "Outro", usar o motivo personalizado
        payload.lostReason = lossReason === "other" ? customReason : lossReason;
        payload.lostNotes = notes;
      }
      
      return await apiRequest('PUT', `/api/deals/${deal.id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: outcome === "won" ? "Negócio Fechado!" : "Negócio Marcado como Perdido",
        description: outcome === "won" 
          ? "O negócio foi movido para a lista de vendas concluídas." 
          : "O negócio foi movido para a lista de oportunidades perdidas.",
        variant: "default",
      });
      
      // Invalidar cache para forçar atualização dos dados
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // Notificar componente pai
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar o status do negócio. Tente novamente.",
        variant: "destructive",
      });
      console.error("Update deal error:", error);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outcome) {
      toast({
        title: "Selecione um Resultado",
        description: "Você precisa selecionar se o negócio foi ganho ou perdido.",
        variant: "destructive",
      });
      return;
    }
    
    if (outcome === "lost" && !lossReason) {
      toast({
        title: "Motivo Obrigatório",
        description: "Por favor, selecione um motivo para a perda do negócio.",
        variant: "destructive",
      });
      return;
    }
    
    updateDealMutation.mutate();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Resultado do Negócio</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              type="button"
              variant={outcome === "won" ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                outcome === "won" ? "border-green-500 bg-green-50 text-green-700" : ""
              }`}
              onClick={() => setOutcome("won")}
            >
              <CheckCircle2Icon className={`h-5 w-5 ${outcome === "won" ? "text-green-500" : "text-gray-400"}`} />
              <span>Ganho</span>
            </Button>
            
            <Button
              type="button"
              variant={outcome === "lost" ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                outcome === "lost" ? "border-red-500 bg-red-50 text-red-700" : ""
              }`}
              onClick={() => setOutcome("lost")}
            >
              <XCircleIcon className={`h-5 w-5 ${outcome === "lost" ? "text-red-500" : "text-gray-400"}`} />
              <span>Perdido</span>
            </Button>
          </div>
        </div>
        
        {outcome === "won" && (
          <div className="space-y-2">
            <Label htmlFor="final-value">Valor Final</Label>
            <Input
              id="final-value"
              value={finalValue}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
            />
            <p className="text-sm text-gray-500">Informe o valor final do negócio fechado.</p>
          </div>
        )}
        
        {outcome === "lost" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="loss-reason">Motivo da Perda</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger id="loss-reason">
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {lossReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.reason}>
                      {reason.reason}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Outro (especificar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {lossReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Motivo Personalizado</Label>
                <Input
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Especifique o motivo"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                <span>Observações</span>
                <AlertCircleIcon className="h-3.5 w-3.5 text-gray-400" />
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais sobre a perda"
                rows={3}
              />
              <p className="text-sm text-gray-500">
                Descreva qualquer informação adicional que possa ser útil para futura análise.
              </p>
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="submit"
          disabled={updateDealMutation.isPending}
          className={
            outcome === "won" 
              ? "bg-green-600 hover:bg-green-700" 
              : outcome === "lost" 
                ? "bg-red-600 hover:bg-red-700" 
                : ""
          }
        >
          {updateDealMutation.isPending 
            ? "Salvando..." 
            : outcome === "won" 
              ? "Confirmar Venda" 
              : outcome === "lost" 
                ? "Confirmar Perda" 
                : "Confirmar"
          }
        </Button>
      </div>
    </form>
  );
}