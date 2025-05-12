import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatPhoneNumber } from "@/lib/formatters";
import { Lead } from "@shared/schema";
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
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Phone,
  Mail,
  Search,
  User,
  UserPlus,
  PlusCircleIcon,
} from "lucide-react";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string, contactName: string) => void;
}

// Interface para contatos do Chatwoot
interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
}

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSelectContact,
}: AdvancedSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chatwoot");
  const { toast } = useToast();

  // Verifica se o termo de busca tem pelo menos 2 caracteres
  const canSearch = searchTerm.trim().length >= 2;
  
  // Busca de contatos no Chatwoot
  const {
    data: chatwootResponse,
    isLoading: isChatwootLoading,
    refetch: refetchChatwoot,
  } = useQuery<{ payload: ChatwootContact[]; meta: any }>({
    queryKey: ["/api/chatwoot/contacts", searchTerm],
    queryFn: async () => {
      if (!canSearch) return { payload: [], meta: { count: 0 } };
      const response = await apiRequest(
        "GET",
        `/api/chatwoot/contacts?q=${encodeURIComponent(searchTerm.trim())}`
      );
      return response.data;
    },
    enabled: false, // Não buscar automaticamente ao montar
  });

  // Busca de leads no banco de dados
  const {
    data: leadsResponse,
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery<{ results: Lead[] }>({
    queryKey: ["/api/leads/search", searchTerm],
    queryFn: async () => {
      if (!canSearch) return { results: [] };
      const response = await apiRequest(
        "GET",
        `/api/leads/search?q=${encodeURIComponent(searchTerm.trim())}`
      );
      return response.data;
    },
    enabled: false, // Não buscar automaticamente ao montar
  });

  // Extrair resultados
  const chatwootContacts = chatwootResponse?.payload || [];
  const leads = leadsResponse?.results || [];

  // Função para executar a busca quando o usuário clicar em buscar
  const handleSearch = () => {
    if (!canSearch) {
      toast({
        title: "Termo de busca muito curto",
        description: "Digite pelo menos 2 caracteres para buscar",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTab === "chatwoot") {
      refetchChatwoot();
    } else {
      refetchLeads();
    }
  };

  // Buscar quando o termo de busca mudar e tiver pelo menos 2 caracteres
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (canSearch) {
        if (activeTab === "chatwoot") {
          refetchChatwoot();
        } else {
          refetchLeads();
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, activeTab, refetchChatwoot, refetchLeads, canSearch]);

  // Função para lidar com a seleção de um contato
  const handleSelectContact = (id: string, name: string) => {
    onSelectContact(id, name);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Busca Avançada de Contatos</DialogTitle>
          <DialogDescription>
            Busque contatos por nome, e-mail, telefone ou empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8"
                placeholder="Digite nome, telefone, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!canSearch}>
              Buscar
            </Button>
          </div>

          {/* Tabs para alternar entre Chatwoot e Leads */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chatwoot">Contatos Chatwoot</TabsTrigger>
              <TabsTrigger value="leads">Leads Cadastrados</TabsTrigger>
            </TabsList>

            {/* Lista de contatos do Chatwoot */}
            <TabsContent value="chatwoot" className="max-h-96 overflow-y-auto">
              {isChatwootLoading ? (
                <div className="flex justify-center py-8">
                  <p>Carregando contatos...</p>
                </div>
              ) : chatwootContacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {chatwootContacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        handleSelectContact(
                          contact.id.toString(),
                          contact.name || "Sem nome"
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{contact.name || "Sem nome"}</h3>
                          {contact.company_name && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{contact.company_name}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone_number && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{formatPhoneNumber(contact.phone_number)}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectContact(
                              contact.id.toString(),
                              contact.name || "Sem nome"
                            );
                          }}
                        >
                          Selecionar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : searchTerm.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p>Nenhum contato encontrado com "{searchTerm}"</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Tente outros termos ou verifique se o contato existe no Chatwoot
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p>Digite um termo para buscar contatos</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Você pode buscar por nome, email, telefone ou empresa
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Lista de leads cadastrados */}
            <TabsContent value="leads" className="max-h-96 overflow-y-auto">
              {isLeadsLoading ? (
                <div className="flex justify-center py-8">
                  <p>Carregando leads...</p>
                </div>
              ) : leads.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {leads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        handleSelectContact(
                          lead.id.toString(),
                          lead.name || "Sem nome"
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{lead.name || "Sem nome"}</h3>
                          {lead.companyName && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{lead.companyName}</span>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="mr-1 h-3 w-3 text-gray-400" />
                              <span>{formatPhoneNumber(lead.phone)}</span>
                            </div>
                          )}
                          {lead.chatwootContactId && (
                            <div className="text-xs text-blue-500 mt-1">
                              Sincronizado com Chatwoot
                            </div>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectContact(
                              lead.id.toString(),
                              lead.name || "Sem nome"
                            );
                          }}
                        >
                          Selecionar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : searchTerm.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p>Nenhum lead encontrado com "{searchTerm}"</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Tente outros termos ou verifique se o lead foi cadastrado
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p>Digite um termo para buscar leads</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Você pode buscar por nome, email, telefone ou empresa
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}