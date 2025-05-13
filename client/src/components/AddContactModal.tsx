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
import { UserPlusIcon } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatters";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contactId: string, contactName: string) => void;
}

export default function AddContactModal({ isOpen, onClose, onContactCreated }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const { toast } = useToast();
  
  const addContactMutation = useMutation({
    mutationFn: async () => {
      console.log("Criando novo contato no Chatwoot");
      const payload = {
        name,
        email: email || null,
        phone_number: phone.replace(/\D/g, '') || null, // Remove não-dígitos
        company_name: companyName || null
      };
      
      console.log("Dados do novo contato:", payload);
      const result = await apiRequest('/api/chatwoot/contacts', 'POST', payload);
      console.log("Contato criado com sucesso:", result);
      return result;
    },
    onSuccess: async (data) => {
      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso ao Chatwoot.",
        variant: "default",
      });
      
      // Invalidar cache de contatos
      await queryClient.invalidateQueries({ queryKey: ['/api/chatwoot/contacts'] });
      
      // Chama a função de callback com o ID e nome do contato criado
      if (onContactCreated && data?.payload?.contact?.id) {
        onContactCreated(
          data.payload.contact.id.toString(),
          data.payload.contact.name
        );
      }
      
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o contato. Por favor, tente novamente.",
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
    // Formata o telefone conforme o usuário digita
    const formattedPhone = formatPhoneNumber(value);
    setPhone(formattedPhone);
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
          </DialogDescription>
        </DialogHeader>
        
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