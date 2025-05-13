import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Building, Phone, AtSign, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/formatters";

// Definindo o hook useDebounce no próprio arquivo para evitar dependências
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact?: (contactId: string, contactName: string) => void;
  onSelect?: (contactId: string, contactName: string) => void;
}

export default function AdvancedSearchModal({ isOpen, onClose, onSelectContact, onSelect }: AdvancedSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/chatwoot/contacts', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { contacts: [] };
      const res = await fetch(`/api/chatwoot/contacts?query=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      return {
        contacts: data?.payload || []
      };
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false
  });

  const contacts = data?.contacts || [];

  const handleSelectContact = (contact: ChatwootContact) => {
    // Use qualquer uma das funções de callback que foi fornecida
    if (onSelect) {
      onSelect(contact.id.toString(), contact.name);
    } else if (onSelectContact) {
      onSelectContact(contact.id.toString(), contact.name);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Busca Avançada de Contatos
          </DialogTitle>
          <DialogDescription>
            Pesquise contatos por nome, empresa, telefone ou email.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Input
            placeholder="Digite no mínimo 2 caracteres para pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-500">Buscando contatos...</span>
          </div>
        )}

        {!isLoading && debouncedSearch.length >= 2 && contacts.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-gray-500">
              Nenhum contato encontrado para "{debouncedSearch}".
            </p>
          </div>
        )}

        {!isLoading && contacts.length > 0 && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-3">
              {contacts.map((contact: ChatwootContact) => (
                <Card 
                  key={contact.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectContact(contact)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      {contact.name || "Sem nome"}
                    </CardTitle>
                    {contact.company_name && (
                      <CardDescription className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.company_name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-gray-600">
                    {contact.phone_number && (
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {formatPhoneNumber(contact.phone_number)}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center">
                        <AtSign className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.email}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(contact);
                      }}
                    >
                      Selecionar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}