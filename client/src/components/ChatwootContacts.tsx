import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Deal, PipelineStage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Phone,
  Mail,
  Search,
  UserIcon,
  DollarSign,
  PlusCircleIcon,
} from "lucide-react";
import AddDealModal from "@/components/AddDealModal";
import { Settings } from "@shared/schema";

interface ChatwootContactsProps {
  pipelineStages: PipelineStage[];
  settings: Settings | undefined;
}

interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
}

export default function ChatwootContacts({ pipelineStages, settings }: ChatwootContactsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ChatwootContact | null>(null);
  
  // Encontre o estágio padrão para contatos do Chatwoot
  const defaultStage = pipelineStages.find(stage => stage.isDefault);
  
  // Buscar contatos do Chatwoot quando há uma configuração válida
  const { data: chatwootContacts, isLoading } = useQuery<ChatwootContact[]>({
    queryKey: ['/api/chatwoot/contacts'],
    enabled: !!settings?.chatwootApiKey
  });
  
  // Busca negócios existentes no estágio padrão
  const { data: defaultStageDeals, isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    select: (deals) => deals.filter(deal => defaultStage && deal.stageId === defaultStage.id),
    enabled: !!defaultStage
  });
  
  // Filtra contatos com base no termo de busca
  const filteredContacts = chatwootContacts?.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone_number?.toLowerCase().includes(searchLower) ||
      contact.company_name?.toLowerCase().includes(searchLower)
    );
  });
  
  // Verifica se um contato já está em um negócio
  const isContactInDeal = (contactId: number) => {
    return defaultStageDeals?.some(deal => {
      return deal.chatwootContactId === contactId.toString();
    });
  };
  
  if (!settings?.chatwootApiKey) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center py-8">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Sem conexão com Chatwoot</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure a API do Chatwoot para sincronizar contatos.
          </p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-500">Carregando contatos do Chatwoot...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <AddDealModal 
        isOpen={isAddDealModalOpen} 
        onClose={() => {
          setIsAddDealModalOpen(false);
          setSelectedContact(null);
        }} 
        pipelineStages={pipelineStages}
        selectedContact={selectedContact}
      />
      
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-4 py-2 bg-white border-b">
          <h2 className="text-lg font-semibold">Contatos do Chatwoot</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 h-9 w-60"
                placeholder="Buscar contatos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 flex-grow overflow-y-auto">
          {filteredContacts && filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                  {isContactInDeal(contact.id) ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      No funil
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSelectedContact(contact);
                        setIsAddDealModalOpen(true);
                      }}
                    >
                      <PlusCircleIcon className="h-3.5 w-3.5" />
                      <span>Criar negócio</span>
                    </Button>
                  )}
                </div>
                
                <div className="mt-2 space-y-1">
                  {contact.company_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{contact.company_name}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{contact.phone_number}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 flex items-center justify-center h-40 text-gray-500">
              {searchTerm ? (
                <p>Nenhum contato encontrado com "{searchTerm}"</p>
              ) : (
                <p>Nenhum contato disponível. Sincronize contatos pelo Chatwoot.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}