import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { type PipelineStage } from "@shared/schema";

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
import { PlusIcon } from "lucide-react";

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
  // Campos básicos
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactId, setContactId] = useState("");
  const [stageId, setStageId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("in_progress");
  
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
  
  // Get Chatwoot contacts
  const { data: contactsData } = useQuery<{ payload: ChatwootContact[] }>({
    queryKey: ['/api/chatwoot/contacts'],
    enabled: isOpen,
  });
  
  const contacts = contactsData?.payload || [];
  
  const addDealMutation = useMutation({
    mutationFn: async () => {
      const selectedContact = contacts.find(c => c.id.toString() === contactId);
      
      const payload = {
        // Campos básicos
        name,
        companyName: companyName || selectedContact?.company_name || "",
        contactName: selectedContact?.name || "",
        contactId: contactId,
        chatwootContactId: contactId,
        stageId: parseInt(stageId),
        value: parseFloat(value.replace(/[^\d.-]/g, "") || "0"),
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
        email: email || selectedContact?.email || "",
        phone: phone || selectedContact?.phone_number || "",
        
        // Campos de endereço
        address,
        addressNumber,
        addressComplement,
        neighborhood,
        city,
        state,
        zipCode
      };
      return await apiRequest('POST', '/api/deals', payload);
    },
    onSuccess: () => {
      toast({
        title: "Negócio adicionado",
        description: "O negócio foi adicionado com sucesso ao seu pipeline.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
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
        // Se não houver estágio padrão, use o primeiro estágio
        setStageId(pipelineStages[0].id.toString());
      }
    }
  }, [isOpen, selectedContact, pipelineStages]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-primary" />
            Adicionar Novo Negócio
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar um novo negócio ao pipeline.
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
            <Label htmlFor="deal-contact">Contato do Chatwoot</Label>
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
    </Dialog>
  );
}
