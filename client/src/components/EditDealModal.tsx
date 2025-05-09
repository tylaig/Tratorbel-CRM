import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
import { 
  Edit2Icon, 
  Trash2Icon,
  MessageCircleIcon,
  ReceiptIcon,
  FileTextIcon,
  ClipboardListIcon,
  PlusCircleIcon,
  PlusIcon,
  TrashIcon
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

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
      setStatus(deal.status || "in_progress");
    }
  }, [deal]);

  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return null;

      const quoteTotal = calculateQuoteTotal();
      const payload = {
        name,
        companyName,
        stageId: parseInt(stageId),
        value: parseFloat(value.replace(/[^\d.-]/g, "") || "0"),
        quoteValue: quoteTotal,
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

  const [activeTab, setActiveTab] = useState("details");
  const [newActivity, setNewActivity] = useState("");
  const [quoteItems, setQuoteItems] = useState<{description: string, quantity: number, unitPrice: number}[]>([
    { description: "", quantity: 1, unitPrice: 0 }
  ]);

  // Adicionar novo item na cotação
  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  // Atualizar item de cotação
  const updateQuoteItem = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const newItems = [...quoteItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteItems(newItems);
  };

  // Calcular total da cotação
  const calculateQuoteTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

    const removeQuoteItem = (index: number) => {
    const newItems = [...quoteItems];
    newItems.splice(index, 1);
    setQuoteItems(newItems);
  };

  // Mock de atividades para demonstração
  const mockActivities = [
    { 
      id: 1, 
      type: 'message', 
      text: 'Cliente solicitou orçamento para peças de trator', 
      date: new Date(2025, 4, 7) 
    },
    { 
      id: 2, 
      type: 'note', 
      text: 'Enviado catálogo de peças por e-mail', 
      date: new Date(2025, 4, 8) 
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2Icon className="h-5 w-5 text-primary" />
            {name || "Negócio"} {companyName ? `- ${companyName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Gerencie todos os detalhes do negócio.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <FileTextIcon className="h-4 w-4" />
              <span>Detalhes</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-1">
              <MessageCircleIcon className="h-4 w-4" />
              <span>Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="quote" className="flex items-center gap-1">
              <ReceiptIcon className="h-4 w-4" />
              <span>Cotação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-1">
            <div className="grid gap-4 py-2">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid gap-2">
                <Label htmlFor="deal-value">Valor (R$)</Label>
                <Input
                  id="deal-value"
                  value={value}
                  onChange={handleValueChange}
                  placeholder="0,00"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="p-1">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="new-activity">Nova Atividade</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="new-activity"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Adicione uma nova atividade..."
                    className="flex-1"
                  />
                  <Button className="self-end flex gap-1" disabled={!newActivity.trim()}>
                    <PlusCircleIcon className="h-4 w-4" />
                    <span>Adicionar</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                <h3 className="text-sm font-medium text-gray-500">Histórico de Atividades</h3>
                {mockActivities.map(activity => (
                  <Card key={activity.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        {activity.type === 'message' ? (
                          <MessageCircleIcon className="h-4 w-4 text-blue-500 mt-1" />
                        ) : (
                          <ClipboardListIcon className="h-4 w-4 text-green-500 mt-1" />
                        )}
                        <div>
                          <p className="text-sm text-gray-800">{activity.text}</p>
                          <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quote" className="p-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-500">Itens da Cotação</h3>
                  <Button variant="outline" size="sm" onClick={addQuoteItem} className="flex items-center gap-1">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar Item</span>
                  </Button>
                </div>

                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                    <div className="col-span-6">Descrição</div>
                    <div className="col-span-2 text-center">Quantidade</div>
                    <div className="col-span-2 text-center">Preço Unitário</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>

                  <div className="max-h-[250px] overflow-y-auto">
                    {quoteItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-2 border-b last:border-0 items-center">
                        <div className="col-span-6">
                          <Input
                            value={item.description}
                            onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                            placeholder="Descrição do item"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="text-sm text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) => updateQuoteItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="text-sm text-center"
                          />
                        </div>
                        <div className="col-span-2 text-right font-mono text-sm">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end p-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">Total da Cotação:</div>
                    <div className="text-lg font-mono font-bold text-primary">{formatCurrency(calculateQuoteTotal())}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            className="flex items-center gap-2" 
            onClick={handleDelete}
          >
            <Trash2Icon className="h-4 w-4" />
            <span>Excluir</span>
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