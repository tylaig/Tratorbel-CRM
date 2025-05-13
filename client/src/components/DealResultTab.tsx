import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Deal, LossReason, SalePerformanceReason } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";

import { Label } from "@/components/ui/label";
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
  BadgeCheckIcon,
  BadgeXIcon,
  PencilIcon,
  SaveIcon,
} from "lucide-react";

interface DealResultTabProps {
  deal: Deal;
}

export default function DealResultTab({ deal }: DealResultTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [lossReason, setLossReason] = useState(deal.lostReason || "");
  const [salePerformance, setSalePerformance] = useState(deal.salePerformance || "");
  const [notes, setNotes] = useState(deal.lostNotes || "");
  
  const { toast } = useToast();
  
  // Carregar motivos de perda
  const { data: lossReasons = [] } = useQuery<LossReason[]>({
    queryKey: ['/api/loss-reasons'],
    enabled: deal.saleStatus === "lost" || isEditing,
  });
  
  // Carregar motivos de desempenho
  const { data: performanceReasons = [] } = useQuery<SalePerformanceReason[]>({
    queryKey: ['/api/sale-performance-reasons'],
    enabled: deal.saleStatus === "won" || isEditing,
  });
  
  // Atualizar estados quando o deal mudar
  useEffect(() => {
    if (deal) {
      setLossReason(deal.lostReason || "");
      setSalePerformance(deal.salePerformance || "");
      setNotes(deal.lostNotes || "");
      console.log("Deal atualizado em DealResultTab:", { 
        id: deal.id, 
        saleStatus: deal.saleStatus, 
        lostReason: deal.lostReason 
      });
    }
  }, [deal]);
  
  // Mutation para atualizar deal
  const updateDealMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      
      // Adicionar informações específicas com base no status
      if (deal.saleStatus === "won") {
        payload.salePerformance = salePerformance;
      } else if (deal.saleStatus === "lost") {
        payload.lostReason = lossReason;
        payload.lostNotes = notes;
      }
      
      return await apiRequest(`/api/deals/${deal.id}`, 'PUT', payload);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Informações de resultado atualizadas com sucesso.",
        variant: "default",
      });
      
      // Invalidar cache para forçar atualização dos dados
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // Sair do modo de edição
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar as informações. Tente novamente.",
        variant: "destructive",
      });
      console.error("Update deal error:", error);
    }
  });
  
  const handleSave = () => {
    if (deal.saleStatus === "lost" && !lossReason) {
      toast({
        title: "Motivo Obrigatório",
        description: "Por favor, selecione um motivo para a perda do negócio.",
        variant: "destructive",
      });
      return;
    }
    
    if (deal.saleStatus === "won" && !salePerformance) {
      toast({
        title: "Desempenho Obrigatório",
        description: "Por favor, indique como foi o desempenho da venda.",
        variant: "destructive",
      });
      return;
    }
    
    updateDealMutation.mutate();
  };

  // Se não for um negócio com status de ganho ou perda, mostrar mensagem apropriada
  if (deal.saleStatus !== "won" && deal.saleStatus !== "lost") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">Resultado Pendente</h3>
        <p className="text-gray-500 mt-2">
          Este negócio ainda está em andamento. Utilize a aba Resultado para marcá-lo como ganho ou perdido.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Resultado do Negócio</h3>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
          </Button>
        ) : (
          <Button 
            onClick={handleSave}
            variant="default" 
            size="sm"
            className="flex items-center gap-1"
            disabled={updateDealMutation.isPending}
          >
            <SaveIcon className="h-4 w-4" />
            <span>{updateDealMutation.isPending ? "Salvando..." : "Salvar"}</span>
          </Button>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-md p-4 border">
        <div className="flex items-center gap-3 mb-2">
          {deal.saleStatus === "won" ? (
            <div className="flex items-center gap-2 text-green-600">
              <BadgeCheckIcon className="h-6 w-6" />
              <span className="font-medium">Negócio Ganho</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <BadgeXIcon className="h-6 w-6" />
              <span className="font-medium">Negócio Perdido</span>
            </div>
          )}
          
          {deal.value && deal.value > 0 && (
            <div className="ml-auto text-gray-700 font-medium">
              {formatCurrency(Number(deal.value))}
            </div>
          )}
        </div>
        
        {/* Detalhes específicos para negócios ganhos */}
        {deal.saleStatus === "won" && (
          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-gray-700">Desempenho da Venda:</Label>
              {isEditing ? (
                <Select value={salePerformance} onValueChange={setSalePerformance}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o desempenho" />
                  </SelectTrigger>
                  <SelectContent>
                    {performanceReasons.map((reason) => (
                      <SelectItem key={reason.id} value={reason.reason}>
                        {reason.reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 text-sm bg-white p-2 rounded border">
                  {deal.salePerformance ? (
                    <span className={
                      deal.salePerformance === "Abaixo da cotação" 
                        ? "text-red-600" 
                        : deal.salePerformance === "Acima da cotação" 
                          ? "text-green-600" 
                          : "text-blue-600"
                    }>
                      {deal.salePerformance}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Não informado</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Detalhes específicos para negócios perdidos */}
        {deal.saleStatus === "lost" && (
          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-gray-700">Motivo da Perda:</Label>
              {isEditing ? (
                <Select value={lossReason} onValueChange={setLossReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {lossReasons.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id.toString()}>
                        {reason.reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 text-sm bg-white p-2 rounded border">
                  {deal.lostReason ? (
                    // Buscar o nome da razão pelo ID
                    lossReasons.find(item => item.id.toString() === deal.lostReason)?.reason || 
                    <span className="text-gray-500 italic">Razão não encontrada (ID: {deal.lostReason})</span>
                  ) : (
                    <span className="text-gray-500 italic">Não informado</span>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-gray-700">Observações:</Label>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais sobre a perda"
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 text-sm bg-white p-2 rounded border min-h-[80px]">
                  {deal.lostNotes || <span className="text-gray-500 italic">Nenhuma observação</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}