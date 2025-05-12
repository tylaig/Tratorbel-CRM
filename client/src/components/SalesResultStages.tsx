import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal, PipelineStage } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Edit2Icon,
  MoreVerticalIcon,
  Building,
  UserCircle,
  InfoIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditDealModal from "@/components/EditDealModal";
import { FilterOptions } from "@/components/FilterBar";

interface SalesResultStagesProps {
  pipelineStages: PipelineStage[];
  filters?: FilterOptions;
}

export default function SalesResultStages({ pipelineStages, filters }: SalesResultStagesProps) {
  // State para filtro de performance de vendas
  const [salePerformanceFilter, setSalePerformanceFilter] = useState<string>("all");
  // State para filtro de razão de perda
  const [lossReasonFilter, setLossReasonFilter] = useState<string>("all");
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Use os filtros do componente pai ou crie um padrão
  const activeFilters = filters || {
    search: "",
    status: [],
    sortBy: "date",
    sortOrder: "desc",
    hideClosed: false
  };

  // Get deals com configurações para garantir atualização imediata
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 2000,
  });

  // Get loss reasons para filtrar as vendas perdidas
  const { data: lossReasons } = useQuery({
    queryKey: ['/api/loss-reasons'],
  });

  // Função para filtrar os deals por status de venda (perdido/ganho) e filtros adicionais
  const getFilteredDeals = (status: 'won' | 'lost') => {
    if (!deals) return [];

    let filteredDeals = deals.filter(deal => deal.saleStatus === status);

    // Aplicar filtro de texto de busca
    if (activeFilters.search) {
      const searchLower = activeFilters.search.toLowerCase();
      filteredDeals = filteredDeals.filter(deal => 
        deal.name.toLowerCase().includes(searchLower)
      );
    }

    // Para vendas ganhas, filtrar por performance se um filtro específico estiver selecionado
    if (status === 'won' && salePerformanceFilter !== 'all') {
      filteredDeals = filteredDeals.filter(deal => 
        deal.salePerformance === salePerformanceFilter
      );
    }

    // Para vendas perdidas, filtrar por motivo de perda se um filtro específico estiver selecionado
    if (status === 'lost' && lossReasonFilter !== 'all') {
      filteredDeals = filteredDeals.filter(deal => 
        deal.lostReason === lossReasonFilter
      );
    }

    // Ordenação
    if (activeFilters.sortBy === 'date') {
      filteredDeals.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return activeFilters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (activeFilters.sortBy === 'value') {
      filteredDeals.sort((a, b) => {
        const valueA = a.value || 0;
        const valueB = b.value || 0;
        return activeFilters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
    } else if (activeFilters.sortBy === 'name') {
      filteredDeals.sort((a, b) => {
        return activeFilters.sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      });
    }

    return filteredDeals;
  };

  // Função para abrir o modal de edição de um deal
  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsEditDealModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Seção de Vendas Ganhas */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-green-600">Vendas Realizadas</h2>
          <Select 
            value={salePerformanceFilter} 
            onValueChange={setSalePerformanceFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as performances</SelectItem>
              <SelectItem value="below_quote">Abaixo da cotação</SelectItem>
              <SelectItem value="according_to_quote">De acordo com a cotação</SelectItem>
              <SelectItem value="above_quote">Acima da cotação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!isLoading && getFilteredDeals('won').map(deal => (
            <Card key={deal.id} className="p-4 border border-green-200 bg-green-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 truncate">{deal.name}</h3>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                        <Edit2Icon className="mr-2 h-4 w-4" />
                        <span>Editar negócio</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Building className="mr-1 h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 truncate">{deal.companyName || 'Sem empresa'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Valor: <span className="font-semibold text-gray-900">{formatCurrency(deal.value || 0)}</span>
                  </div>
                  
                  <Badge 
                    className={`
                      ${deal.salePerformance === 'below_quote' ? 'bg-yellow-500' : ''}
                      ${deal.salePerformance === 'according_to_quote' ? 'bg-green-500' : ''}
                      ${deal.salePerformance === 'above_quote' ? 'bg-blue-500' : ''}
                    `}
                  >
                    {deal.salePerformance === 'below_quote' && 'Abaixo da cotação'}
                    {deal.salePerformance === 'according_to_quote' && 'De acordo com a cotação'}
                    {deal.salePerformance === 'above_quote' && 'Acima da cotação'}
                    {!deal.salePerformance && 'Não categorizado'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}

          {getFilteredDeals('won').length === 0 && (
            <div className="col-span-full flex justify-center items-center p-6 border rounded-lg border-dashed text-gray-500">
              Nenhuma venda realizada encontrada com os filtros atuais
            </div>
          )}
        </div>
      </div>

      {/* Seção de Vendas Perdidas */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-red-600">Vendas Perdidas</h2>
          <Select 
            value={lossReasonFilter} 
            onValueChange={setLossReasonFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motivos</SelectItem>
              {lossReasons && lossReasons.map((reason: any) => (
                <SelectItem key={reason.id} value={reason.reason}>
                  {reason.reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!isLoading && getFilteredDeals('lost').map(deal => (
            <Card key={deal.id} className="p-4 border border-red-200 bg-red-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 truncate">{deal.name}</h3>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                        <Edit2Icon className="mr-2 h-4 w-4" />
                        <span>Editar negócio</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Building className="mr-1 h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 truncate">{deal.companyName || 'Sem empresa'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Valor cotado: <span className="font-semibold text-gray-900">{formatCurrency(deal.quoteValue || 0)}</span>
                  </div>
                  
                  <Badge variant="secondary">
                    {deal.lostReason || 'Motivo não especificado'}
                  </Badge>
                </div>

                {deal.lostNotes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-semibold">Observações:</p>
                    <p className="text-xs text-gray-500">{deal.lostNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {getFilteredDeals('lost').length === 0 && (
            <div className="col-span-full flex justify-center items-center p-6 border rounded-lg border-dashed text-gray-500">
              Nenhuma venda perdida encontrada com os filtros atuais
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição de negócio */}
      {selectedDeal && (
        <EditDealModal
          isOpen={isEditDealModalOpen}
          onClose={() => setIsEditDealModalOpen(false)}
          deal={selectedDeal}
          pipelineStages={pipelineStages}
          onSaved={() => setIsEditDealModalOpen(false)}
        />
      )}
    </div>
  );
}