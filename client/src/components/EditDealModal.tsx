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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit2Icon, 
  Trash2Icon,
  MessageCircleIcon,
  ReceiptIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  CheckCircle2Icon,
  XCircleIcon,
  PlusCircleIcon,
  UserIcon,
  BuildingIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  CreditCardIcon,
  CheckIcon,
  XIcon
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DealOutcomeForm from "@/components/DealOutcomeForm";
import LeadActivities from "@/components/LeadActivities";
import ClientMachines from "@/components/ClientMachines";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  pipelineStages: PipelineStage[];
}

export default function EditDealModal({ isOpen, onClose, deal, pipelineStages }: EditDealModalProps) {
  // Campos básicos
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [stageId, setStageId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [activeTab, setActiveTab] = useState("details");
  
  // Campos de tipo de cliente
  const [isCompany, setIsCompany] = useState(false);
  
  // Campos pessoa jurídica
  const [cnpj, setCnpj] = useState("");
  const [corporateName, setCorporateName] = useState("");
  
  // Campos pessoa física
  const [cpf, setCpf] = useState("");
  const [stateRegistration, setStateRegistration] = useState("");
  
  // Campos de contato
  const [clientCode, setClientCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Campos de endereço
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const { toast } = useToast();

  // Carregar dados do deal quando o modal abrir
  useEffect(() => {
    if (deal) {
      // Campos básicos
      setName(deal.name);
      setCompanyName(deal.companyName || "");
      setStageId(deal.stageId.toString());
      setValue(formatCurrency(deal.value || 0));
      setStatus(deal.status || "in_progress");
      
      // Tipo de cliente
      setIsCompany(deal.isCompany || false);
      
      // Campos pessoa jurídica
      setCnpj(deal.cnpj || "");
      setCorporateName(deal.corporateName || "");
      
      // Campos pessoa física
      setCpf(deal.cpf || "");
      setStateRegistration(deal.stateRegistration || "");
      
      // Campos de contato
      setClientCode(deal.clientCode || "");
      setEmail(deal.email || "");
      setPhone(deal.phone || "");
      
      // Campos de endereço
      setAddress(deal.address || "");
      setAddressNumber(deal.addressNumber || "");
      setAddressComplement(deal.addressComplement || "");
      setNeighborhood(deal.neighborhood || "");
      setCity(deal.city || "");
      setState(deal.state || "");
      setZipCode(deal.zipCode || "");
    }
  }, [deal]);

  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) return null;

      const quoteTotal = calculateQuoteTotal();
      const payload = {
        // Campos básicos
        name,
        companyName,
        stageId: parseInt(stageId),
        value: parseFloat(value.replace(/[^\d.-]/g, "") || "0"),
        quoteValue: quoteTotal,
        status,
        
        // Tipo de cliente
        isCompany,
        
        // Campos pessoa jurídica
        cnpj,
        corporateName,
        
        // Campos pessoa física
        cpf,
        stateRegistration,
        
        // Campos de contato
        clientCode,
        email,
        phone,
        
        // Campos de endereço
        address,
        addressNumber,
        addressComplement,
        neighborhood,
        city,
        state,
        zipCode,
        
        // Items da cotação
        quoteItems: quoteItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
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
    // Campos básicos
    setName("");
    setCompanyName("");
    setStageId("");
    setValue("");
    setStatus("in_progress");
    
    // Tipo de cliente
    setIsCompany(false);
    
    // Campos pessoa jurídica
    setCnpj("");
    setCorporateName("");
    
    // Campos pessoa física
    setCpf("");
    setStateRegistration("");
    
    // Campos de contato
    setClientCode("");
    setEmail("");
    setPhone("");
    
    // Campos de endereço
    setAddress("");
    setAddressNumber("");
    setAddressComplement("");
    setNeighborhood("");
    setCity("");
    setState("");
    setZipCode("");
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
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <FileTextIcon className="h-4 w-4" />
              <span>Detalhes</span>
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              <span>Cliente</span>
            </TabsTrigger>
            <TabsTrigger value="city" className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              <span>Cidade</span>
            </TabsTrigger>
            <TabsTrigger value="machines" className="flex items-center gap-1">
              <PlusCircleIcon className="h-4 w-4" />
              <span>Máquinas</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-1">
              <MessageCircleIcon className="h-4 w-4" />
              <span>Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="quote" className="flex items-center gap-1">
              <ReceiptIcon className="h-4 w-4" />
              <span>Cotação</span>
            </TabsTrigger>
            <TabsTrigger value="outcome" className="flex items-center gap-1">
              <CheckCircle2Icon className="h-4 w-4" />
              <span>Resultado</span>
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

          <TabsContent value="client" className="p-1">
            <div className="grid gap-4 py-2">
              {/* Tipo de Cliente (PF ou PJ) */}
              <div className="flex items-center space-x-2 border-b pb-4">
                <div className="flex-1">
                  <Label htmlFor="client-type" className="text-base">Tipo de Cliente</Label>
                  <div className="text-sm text-muted-foreground">Selecione o tipo de cliente</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="client-type" className={!isCompany ? "font-bold" : ""}>Pessoa Física</Label>
                  <Switch
                    id="client-type"
                    checked={isCompany}
                    onCheckedChange={setIsCompany}
                  />
                  <Label htmlFor="client-type" className={isCompany ? "font-bold" : ""}>Pessoa Jurídica</Label>
                </div>
              </div>

              {/* Campos específicos conforme tipo de cliente */}
              {isCompany ? (
                /* Campos para Pessoa Jurídica */
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="corporate-name">Razão Social</Label>
                    <Input
                      id="corporate-name"
                      value={corporateName}
                      onChange={(e) => setCorporateName(e.target.value)}
                      placeholder="Razão Social Completa"
                    />
                  </div>
                </div>
              ) : (
                /* Campos para Pessoa Física */
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state-registration">Inscrição Estadual</Label>
                    <Input
                      id="state-registration"
                      value={stateRegistration}
                      onChange={(e) => setStateRegistration(e.target.value)}
                      placeholder="Inscrição Estadual"
                    />
                  </div>
                </div>
              )}

              {/* Código do Cliente */}
              <div className="grid gap-2">
                <Label htmlFor="client-code">Código do Cliente</Label>
                <Input
                  id="client-code"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  placeholder="Código do cliente no sistema"
                />
              </div>

              {/* Contato */}
              <div className="grid gap-2 border-t pt-4">
                <h3 className="font-medium flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-primary" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="grid gap-2 border-t pt-4">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-primary" />
                  Endereço Completo
                </h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Logradouro</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua/Av./Estrada"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="address-number">Número</Label>
                      <Input
                        id="address-number"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="Nº"
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="address-complement">Complemento</Label>
                      <Input
                        id="address-complement"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        placeholder="Complemento"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Estado"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip-code">CEP</Label>
                      <Input
                        id="zip-code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="p-1">
            <ClientMachines dealId={deal?.id || null} isExisting={!!deal?.id} />
          </TabsContent>

          <TabsContent value="activities" className="p-1">
            <LeadActivities deal={deal} />
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

          <TabsContent value="outcome" className="p-1">
            <div className="py-2">
              <h3 className="text-lg font-medium mb-4">
                {deal?.saleStatus === "won" ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2Icon className="h-5 w-5" />
                    <span>Negócio Ganho</span>
                  </div>
                ) : deal?.saleStatus === "lost" ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircleIcon className="h-5 w-5" />
                    <span>Negócio Perdido</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      {deal?.lostReason && `Razão: ${deal.lostReason}`}
                    </span>
                  </div>
                ) : (
                  <span>Concluir Negócio</span>
                )}
              </h3>
              
              {!deal?.saleStatus && (
                <DealOutcomeForm deal={deal} onSuccess={onClose} />
              )}
              
              {deal?.saleStatus && (
                <div className="p-4 bg-gray-50 rounded-md mb-4">
                  {deal.saleStatus === "won" ? (
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">Este negócio foi concluído com sucesso.</p>
                      <p>Valor final: {deal.value ? formatCurrency(deal.value) : "Não informado"}</p>
                      <p className="text-sm text-gray-500">Concluído em: {formatDate(new Date(deal.updatedAt))}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-700 font-medium">Este negócio foi perdido.</p>
                      <p>Motivo: {deal.lostReason || "Não informado"}</p>
                      {deal.lostNotes && <p>Notas: {deal.lostNotes}</p>}
                      <p className="text-sm text-gray-500">Registrado em: {formatDate(new Date(deal.updatedAt))}</p>
                    </div>
                  )}
                </div>
              )}
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