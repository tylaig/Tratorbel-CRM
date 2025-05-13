import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { UserPlusIcon, AlertCircle, Loader2 } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatters";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contactId: string, contactName: string, contact?: any) => void;
}

export default function AddContactModal({ isOpen, onClose, onContactCreated }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const { toast } = useToast();
  
  const [errorMessage, setErrorMessage] = useState("");
  
  const addContactMutation = useMutation({
    mutationFn: async () => {
      console.log("Criando novo contato no Chatwoot");
      
      // Reset error message
      setErrorMessage("");
      
      const payload = {
        name,
        email: email || null,
        phone_number: formatE164Phone(phone), // Formato E.164 (+5511999999999)
        company_name: companyName || null
      };
      
      console.log("Dados do novo contato:", payload);
      
      try {
        const result = await apiRequest('/api/chatwoot/contacts', 'POST', payload);
        console.log("Contato criado com sucesso:", result);
        return result;
      } catch (error: any) {
        // Extrair mensagens de erro da API
        const errorData = error?.data || {};
        const errorMessage = errorData.message || "Erro desconhecido";
        console.log("Erro detalhado do servidor:", errorData);
        
        if (errorMessage.includes("Email has already been taken")) {
          throw new Error("O email informado já está sendo usado por outro contato.");
        } else if (errorMessage.includes("Phone number has already been taken")) {
          throw new Error("Este número de telefone já está cadastrado para outro contato. Por favor, use um número diferente.");
        } else if (errorMessage.includes("Este número de telefone já está cadastrado")) {
          throw new Error("Este número de telefone já está cadastrado para outro contato. Por favor, use um número diferente.");
        } else if (errorMessage.includes("Phone number should be in e164 format")) {
          throw new Error("O número de telefone precisa estar no formato internacional. Verifique o formato e tente novamente.");
        } else {
          throw new Error(`Erro ao criar contato: ${errorMessage}`);
        }
      }
    },
    onSuccess: async (data) => {
      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso ao Chatwoot.",
        variant: "default",
      });
      
      // Invalidar cache de contatos
      await queryClient.invalidateQueries({ queryKey: ['/api/chatwoot/contacts'] });
      
      // Chama a função de callback com o ID e nome do contato criado e o objeto completo
      if (onContactCreated && data?.payload?.contact?.id) {
        // Invalidar cache de contatos para atualizar a lista
        await queryClient.invalidateQueries({ queryKey: ['/api/chatwoot/contacts'] });
        
        // Depois de 500ms para dar tempo de atualizar o cache, chamar o callback
        setTimeout(() => {
          onContactCreated(
            data.payload.contact.id.toString(),
            data.payload.contact.name,
            data.payload.contact
          );
        }, 500);
      }
      
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Não foi possível adicionar o contato. Por favor, tente novamente.";
      
      // Set the error message for display
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erro ao adicionar",
        description: errorMsg,
        variant: "destructive",
      });
      console.error("Add contact error:", error);
    }
  });
  
  const handleSave = () => {
    if (!name) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do contato é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    addContactMutation.mutate();
  };
  
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompanyName("");
  };
  
  const formatPhone = (value: string) => {
    // Formata o telefone para exibição conforme o usuário digita
    const formattedPhone = formatPhoneNumber(value);
    setPhone(formattedPhone);
  };
  
  // Converte o telefone para o formato E.164 (padrão internacional)
  const formatE164Phone = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Se o telefone estiver vazio, retorna vazio
    if (digitsOnly.length === 0) {
      return '';
    }
    
    // Se já começar com código do Brasil (55), certifique-se de que está no formato correto
    if (digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
      return `+${digitsOnly}`;
    }
    
    // Se tiver 10 ou 11 dígitos (padrão brasileiro com DDD), adiciona +55
    if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
      return `+55${digitsOnly}`;
    }
    
    // Para outros formatos, apenas adiciona o + no início
    return `+${digitsOnly}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5 text-yellow-400" />
            Adicionar Novo Contato
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para adicionar um novo contato ao Chatwoot. 
            Para adicionar um contato que já existe no sistema, use o botão de busca.
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-3 mb-2 border border-red-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name" className="required">Nome do Contato</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do contato"
              disabled={addContactMutation.isPending}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled={addContactMutation.isPending}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contact-phone">Telefone</Label>
            <Input
              id="contact-phone"
              value={phone}
              onChange={(e) => formatPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={addContactMutation.isPending}
            />
            <p className="text-xs text-amber-600">
              <span className="font-medium">Importante:</span> Use o formato (31) 99871-0945 com código de área. 
              O sistema converterá automaticamente para o formato internacional.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contact-company">Empresa</Label>
            <Input
              id="contact-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa (opcional)"
              disabled={addContactMutation.isPending}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={addContactMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={addContactMutation.isPending}
            className="bg-yellow-400 text-blue-950 hover:bg-yellow-500 font-medium"
          >
            {addContactMutation.isPending ? "Adicionando..." : "Adicionar Contato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}