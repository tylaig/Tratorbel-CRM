import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Deal, type PipelineStage } from "@shared/schema";
import { formatCurrency, formatTimeAgo } from "@/lib/formatters";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2Icon, MoreVerticalIcon, AlertCircleIcon, InfoIcon } from "lucide-react";
import { FilterOptions } from "@/components/FilterBar";

interface ListViewProps {
  pipelineStages: PipelineStage[];
  filters?: FilterOptions;
}

export default function ListView({ pipelineStages, filters }: ListViewProps) {
  // Use os filtros do componente pai ou crie um padrão
  const activeFilters = filters || {
    search: "",
    status: [],
    sortBy: "date",
    sortOrder: "desc",
    hideClosed: true
  };
  const [stageMap, setStageMap] = useState<Map<number, string>>(new Map());
  
  // Fetch deals
  const { data: allDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    refetchOnMount: true,        // Recarregar quando o componente for montado
    refetchOnWindowFocus: true,  // Recarregar quando a janela ganhar foco
    staleTime: 0,                // Considerar dados obsoletos imediatamente
  });
  
  // Filtrar deals baseado nos mesmos critérios do KanbanBoard
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  
  // Aplicar filtros sempre que allDeals ou activeFilters mudarem
  useEffect(() => {
    let result = [...allDeals];
    
    // Aplicar filtro de busca
    if (activeFilters.search) {
      const searchLower = activeFilters.search.toLowerCase();
      result = result.filter(deal => 
        deal.name.toLowerCase().includes(searchLower) ||
        (deal.companyName && deal.companyName.toLowerCase().includes(searchLower)) ||
        (deal.contactName && deal.contactName.toLowerCase().includes(searchLower)) ||
        (deal.contactId && deal.contactId.toLowerCase().includes(searchLower)) ||
        (deal.chatwootContactId && deal.chatwootContactId.toLowerCase().includes(searchLower)) ||
        (deal.email && deal.email.toLowerCase().includes(searchLower)) ||
        (deal.phone && deal.phone.toLowerCase().includes(searchLower)) ||
        (deal.address && deal.address.toLowerCase().includes(searchLower)) ||
        (deal.city && deal.city.toLowerCase().includes(searchLower)) ||
        (deal.state && deal.state.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar filtro de status
    if (activeFilters.status && activeFilters.status.length > 0) {
      result = result.filter(deal => {
        const matchStatus = deal.status && activeFilters.status.includes(deal.status);
        const matchSaleStatus = deal.saleStatus && activeFilters.status.includes(deal.saleStatus);
        return matchStatus || matchSaleStatus;
      });
    }
    
    // Filtrar negócios concluídos se hideClosed estiver ativo
    if (activeFilters.hideClosed) {
      result = result.filter(deal => 
        deal.saleStatus !== 'won' && 
        deal.saleStatus !== 'lost'
      );
    }
    
    // Aplicar filtro de estágio
    if (activeFilters.stageId !== undefined) {
      result = result.filter(deal => deal.stageId === activeFilters.stageId);
    }
    
    // Aplicar ordenação
    result.sort((a, b) => {
      const sortMultiplier = activeFilters.sortOrder === "asc" ? 1 : -1;
      
      switch (activeFilters.sortBy) {
        case "name":
          return sortMultiplier * (a.name || "").localeCompare(b.name || "");
        case "value":
          return sortMultiplier * ((a.value || 0) - (b.value || 0));
        case "company":
          return sortMultiplier * ((a.companyName || "").localeCompare(b.companyName || ""));
        case "date":
        default:
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
          return sortMultiplier * (dateA - dateB);
      }
    });
    
    setFilteredDeals(result);
  }, [allDeals, activeFilters]);
  
  // Create a map of stage IDs to stage names
  useEffect(() => {
    if (pipelineStages.length > 0) {
      const map = new Map();
      pipelineStages.forEach(stage => {
        map.set(stage.id, stage.name);
      });
      setStageMap(map);
    }
  }, [pipelineStages]);
  
  // Get status badge based on deal status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em andamento</Badge>;
      case 'waiting':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Aguardando</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-500">Carregando negócios...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-4">
      {activeFilters.hideClosed && (
        <div className="mb-4 text-sm text-amber-800 flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-md border border-amber-200">
          <InfoIcon size={16} />
          <span>Negócios concluídos estão ocultos</span>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Negócio</TableHead>
              <TableHead className="font-medium">Empresa</TableHead>
              <TableHead className="font-medium">Etapa</TableHead>
              <TableHead className="font-medium">Valor</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Atualizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals && filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{deal.name}</TableCell>
                  <TableCell>{deal.companyName || "-"}</TableCell>
                  <TableCell>{stageMap.get(deal.stageId) || "-"}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(deal.value || 0)}</TableCell>
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatTimeAgo(new Date(deal.updatedAt))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Edit2Icon className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MoreVerticalIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircleIcon className="h-8 w-8 mb-2 text-gray-400" />
                    <p className="mb-1">Nenhum negócio encontrado</p>
                    {activeFilters.hideClosed && allDeals.length > filteredDeals.length ? (
                      <p className="text-sm">Existem {allDeals.length - filteredDeals.length} negócios concluídos que estão ocultos</p>
                    ) : activeFilters.search || activeFilters.status.length > 0 || activeFilters.stageId ? (
                      <p className="text-sm">Tente remover alguns filtros para ver mais resultados</p>
                    ) : (
                      <p className="text-sm">Adicione um novo negócio ou configure a integração com o Chatwoot</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
