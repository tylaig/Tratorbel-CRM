import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPhoneNumber } from "@/lib/formatters";
import { type PipelineStage, type Deal } from "@shared/schema";
import ClientCities from "@/components/ClientCities";
import AdvancedSearchModal from "@/components/AdvancedSearchModal";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PlusIcon } from "lucide-react";

// A função formatPhoneNumber foi movida para lib/formatters.ts

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineStages: PipelineStage[];
  selectedContact?: ChatwootContact | null;
}

interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
}

export default function AddDealModal({ isOpen, onClose, pipelineStages, selectedContact }: AddDealModalProps) {
  // Estado para o modal de busca avançada
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  
  // Campos básicos
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactId, setContactId] = useState("");
  const [stageId, setStageId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("in_progress");
  
  // Campos de tipo de cliente
  const [clientCategory, setClientCategory] = useState("final_consumer"); // "final_consumer" (Consumidor Final) ou "reseller" (Revenda)
  const [clientType, setClientType] = useState("person"); // "person" (Pessoa Física) ou "company" (Pessoa Jurídica)
  const [isCompany, setIsCompany] = useState(false); // campo legado
  
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
  
  // Get Chatwoot contacts
  const { data: contactsData } = useQuery<{ payload: ChatwootContact[] }>({
    queryKey: ['/api/chatwoot/contacts'],
    enabled: isOpen,
  });
  
  const contacts = contactsData?.payload || [];
  
  // Preencher os dados do contato selecionado quando disponível
  useEffect(() => {
    if (selectedContact) {
      setName(selectedContact.name || "");
      setCompanyName(selectedContact.company_name || "");
      setContactId(selectedContact.id.toString());
      
      // Se tiver nome de empresa, assume que é pessoa jurídica consumidor final
      if (selectedContact.company_name) {
        setClientCategory("final_consumer");
        setClientType("company");
        setIsCompany(true);
        setCorporateName(selectedContact.company_name);
      } else {
        // Se não tiver empresa, assume que é pessoa física consumidor final
        setClientCategory("final_consumer");
        setClientType("person");
      }
      
      // Preencher dados de contato
      setEmail(selectedContact.email || "");
      setPhone(formatPhoneNumber(selectedContact.phone_number) || "");
    }
  }, [selectedContact]);
  
  const addDealMutation = useMutation({
    mutationFn: async () => {
      const selectedContact = contacts.find(c => c.id.toString() === contactId);
      
      // Primeiro vamos verificar se já existe um lead para este contato
      let leadId: number;
      if (contactId) {
        try {
          // Tentar buscar um lead existente pelo chatwootContactId
          const leadsResponse = await apiRequest('GET', `/api/leads/search?q=${contactId}`);
          const existingLeads = leadsResponse.data?.results || [];
          
          if (existingLeads.length > 0) {
            // Se encontrar, usar o id do lead existente
            leadId = existingLeads[0].id;
          } else {
            // Se não encontrar, criar um novo lead
            const leadPayload = {
              name: selectedContact?.name || name,
              companyName: companyName || selectedContact?.company_name || "",
              chatwootContactId: contactId,
              clientCategory,
              clientType,
              isCompany: clientType === "company",
              cnpj,
              corporateName,
              cpf,
              stateRegistration,
              clientCode,
              email: email || selectedContact?.email || "",
              phone: phone || formatPhoneNumber(selectedContact?.phone_number) || "",
              address,
              addressNumber,
              addressComplement,
              neighborhood,
              city,
              state,
              zipCode
            };
            
            const leadResponse = await apiRequest('POST', '/api/leads', leadPayload);
            leadId = leadResponse.data.id;
          }
        } catch (error) {
          console.error("Erro ao obter/criar lead:", error);
          throw new Error("Falha ao criar ou obter lead necessário para o negócio");
        }
      } else {
        throw new Error("É necessário selecionar um contato para criar um negócio");
      }
      
      // Agora criamos o deal com o leadId
      const payload = {
        // Campos básicos
        name,
        leadId,  // Campo obrigatório - ID do lead
        stageId: parseInt(stageId),
        value: parseFloat(value.replace(/[^\d.-]/g, "") || "0"),
        status,
        notes: "",
        chatwootContactId: contactId,
        chatwootAgentId: null,
        chatwootAgentName: null,
        chatwootConversationId: null,
        saleStatus: null,
        quoteValue: null
      };
      
      return await apiRequest('POST', '/api/deals', payload);
    },
    onSuccess: async (data) => {
      toast({
        title: "Negócio adicionado",
        description: "O negócio foi adicionado com sucesso ao seu pipeline.",
        variant: "default",
      });
      
      // Abordagem 1: Adicionar o novo deal diretamente ao cache para atualização instantânea
      queryClient.setQueryData<any[]>(['/api/deals'], (oldData = []) => {
        return [...oldData, data];
      });
      
      // Abordagem 2: Também invalidar e forçar recarregamento para garantir consistência
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] }),
        queryClient.refetchQueries({ queryKey: ['/api/deals'] })
      ]);
      
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o negócio. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Add deal error:", error);
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
    
    addDealMutation.mutate();
  };
  
  const resetForm = () => {
    // Campos básicos
    setName("");
    setCompanyName("");
    setContactId("");
    setStageId("");
    setValue("");
    setStatus("in_progress");
    
    // Tipo de cliente
    setClientCategory("final_consumer");
    setClientType("person");
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
  
  // Set company name when contact changes
  const handleContactChange = (value: string) => {
    setContactId(value);
    const selectedContact = contacts.find(c => c.id.toString() === value);
    if (selectedContact?.company_name) {
      setCompanyName(selectedContact.company_name);
    }
  };
  
  // Preencher dados quando houver um contato pré-selecionado
  useEffect(() => {
    if (isOpen && selectedContact) {
      // Defina o contactId
      setContactId(selectedContact.id.toString());
      
      // Defina o nome do negócio como o nome do contato, caso não esteja já definido
      if (!name) {
        setName(selectedContact.name || "Novo negócio");
      }
      
      // Defina a empresa se disponível
      if (selectedContact.company_name) {
        setCompanyName(selectedContact.company_name);
      }
      
      // Encontre o estágio padrão e defina-o como o estágio inicial
      const defaultStage = pipelineStages.find(stage => stage.isDefault);
      if (defaultStage) {
        setStageId(defaultStage.id.toString());
      } else if (pipelineStages.length > 0) {
        setStageId(pipelineStages[0].id.toString());
      }
    }
  }, [isOpen, selectedContact, pipelineStages, name]);
  
  // Função para lidar com a seleção de contato da busca avançada
  const handleAdvancedSearchSelect = (contactId: string, contactName: string) => {
    setContactId(contactId);
    const selectedContact = contacts.find(c => c.id.toString() === contactId);
    
    // Se encontrar o contato nos contatos do Chatwoot, usar seus dados
    if (selectedContact) {
      if (!name) setName(selectedContact.name || "Novo negócio");
      if (selectedContact.company_name) setCompanyName(selectedContact.company_name);
      if (selectedContact.email) setEmail(selectedContact.email);
      if (selectedContact.phone_number) setPhone(formatPhoneNumber(selectedContact.phone_number));
    } else {
      // Se não encontrar, usar os dados básicos fornecidos pelo parâmetro
      if (!name) setName(contactName || "Novo negócio");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-primary" />
            Adicionar Novo Negócio
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar um novo negócio ao pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="city">Cidade</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
          </TabsList>
          
          {/* Aba de Informações Básicas */}
          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid gap-4">
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="deal-contact">Contato do Chatwoot</Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-6 px-0 text-primary"
                    onClick={() => setIsAdvancedSearchOpen(true)}
                  >
                    Busca avançada
                  </Button>
                </div>
                <Select value={contactId} onValueChange={handleContactChange}>
                  <SelectTrigger id="deal-contact">
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.name} {contact.email ? `(${contact.email})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Nenhum contato disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
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
          </TabsContent>
          
          {/* Aba de Informações do Cliente */}
          <TabsContent value="client" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client-category">Categoria do Cliente</Label>
                <Select 
                  value={clientCategory} 
                  onValueChange={(value) => {
                    setClientCategory(value);
                    // Se for Revenda, forçar para Pessoa Jurídica
                    if (value === "reseller") {
                      setClientType("company");
                      setIsCompany(true);
                      setCpf("");
                      setStateRegistration("");
                    }
                  }}
                >
                  <SelectTrigger id="client-category">
                    <SelectValue placeholder="Selecione a categoria do cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="final_consumer">Consumidor Final</SelectItem>
                    <SelectItem value="reseller">Revenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {clientCategory === "final_consumer" && (
                <div className="grid gap-2">
                  <Label htmlFor="client-type">Tipo de Cliente</Label>
                  <Select 
                    value={clientType} 
                    onValueChange={(value) => {
                      setClientType(value);
                      setIsCompany(value === "company"); // manter compatibilidade
                      
                      // Resetar campos não relevantes quando muda o tipo
                      if (value === "person") {
                        setCnpj("");
                        setCorporateName("");
                      } else if (value === "company") {
                        setCpf("");
                        setStateRegistration("");
                      }
                    }}
                  >
                    <SelectTrigger id="client-type">
                      <SelectValue placeholder="Selecione o tipo de cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Pessoa Física</SelectItem>
                      <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {clientType === "company" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="deal-company">Nome Fantasia</Label>
                    <Input
                      id="deal-company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome fantasia"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="deal-corporate">Razão Social</Label>
                    <Input
                      id="deal-corporate"
                      value={corporateName}
                      onChange={(e) => setCorporateName(e.target.value)}
                      placeholder="Razão social"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="deal-cnpj">CNPJ</Label>
                    <Input
                      id="deal-cnpj"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </>
              ) : clientType === "person" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="deal-cpf">CPF</Label>
                    <Input
                      id="deal-cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="deal-state-registration">Inscrição Estadual</Label>
                    <Input
                      id="deal-state-registration"
                      value={stateRegistration}
                      onChange={(e) => setStateRegistration(e.target.value)}
                      placeholder="Inscrição estadual"
                    />
                  </div>
                </>
              ) : (
                // Consumidor final não tem campos específicos
                <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
                  Este tipo de cliente não requer documentos específicos.
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="deal-client-code">Código Cliente</Label>
                <Input
                  id="deal-client-code"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  placeholder="Código do cliente"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deal-email">Email</Label>
                  <Input
                    id="deal-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="deal-phone">Telefone</Label>
                  <Input
                    id="deal-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Aba de Cidade */}
          <TabsContent value="city" className="space-y-4 py-4">
            <ClientCities 
              dealId={null}
              isExisting={false}
              currentCity={city}
              currentState={state}
              onCityChange={(cityValue, stateValue) => {
                setCity(cityValue);
                setState(stateValue);
              }}
            />
          </TabsContent>
          
          {/* Aba de Endereço */}
          <TabsContent value="address" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deal-address">Endereço</Label>
                <Input
                  id="deal-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deal-address-number">Número</Label>
                  <Input
                    id="deal-address-number"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    placeholder="Número"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="deal-address-complement">Complemento</Label>
                  <Input
                    id="deal-address-complement"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    placeholder="Complemento"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deal-neighborhood">Bairro</Label>
                <Input
                  id="deal-neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deal-city">Cidade</Label>
                  <Input
                    id="deal-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="deal-state">Estado</Label>
                  <Input
                    id="deal-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Estado"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deal-zipcode">CEP</Label>
                <Input
                  id="deal-zipcode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={addDealMutation.isPending}
          >
            {addDealMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Modal de busca avançada */}
      <AdvancedSearchModal 
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSelectContact={handleAdvancedSearchSelect}
      />
    </Dialog>
  );
}