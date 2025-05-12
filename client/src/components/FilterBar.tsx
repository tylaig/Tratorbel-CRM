import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  SlidersHorizontal,
  XCircle,
  Trophy,
  XCircleIcon,
  CheckCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export interface FilterOptions {
  search: string;
  status: string[];
  stageId?: number;
  hideClosed?: boolean; // Ocultar negócios vencidos/perdidos do pipeline
  winReason?: string; // Filtrar por motivo de ganho (below_quote, according_to_quote, above_quote)
  lossReason?: string; // Filtrar por motivo de perda (um dos motivos cadastrados)
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export default function FilterBar({ onFilterChange, activeFilters }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>(activeFilters);
  const { toast } = useToast();
  const [activeFilterTab, setActiveFilterTab] = useState<string>("status");
  
  // Buscar motivos de perda
  const { data: lossReasons = [] } = useQuery({
    queryKey: ['/api/loss-reasons'],
  });
  
  // Log inicial para debug
  useEffect(() => {
    console.log("FilterBar recebeu activeFilters:", activeFilters);
  }, []);
  
  // Sincronizar com prop activeFilters
  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);
  
  // Aplicar filtros imediatamente
  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  // Alternar status
  const toggleStatus = (status: string) => {
    let newStatus: string[];
    
    if (filters.status.includes(status)) {
      // Remover status se já estiver selecionado
      newStatus = filters.status.filter(s => s !== status);
    } else {
      // Adicionar status se não estiver selecionado
      newStatus = [...filters.status, status];
    }
    
    // Atualizar o estado local e propagar para o componente pai
    setFilters(prev => ({ ...prev, status: newStatus }));
    onFilterChange({ ...filters, status: newStatus });
  };
  
  // Aplicar filtro de desempenho (vendas bem sucedidas)
  const applyWinReasonFilter = (reason: string) => {
    // Limpar o filtro de perda se estiver ativo
    if (filters.lossReason) {
      updateFilter({ winReason: reason, lossReason: undefined });
    } else {
      updateFilter({ winReason: reason });
    }
  };
  
  // Aplicar filtro de motivo de perda
  const applyLossReasonFilter = (reason: string) => {
    // Limpar o filtro de ganho se estiver ativo
    if (filters.winReason) {
      updateFilter({ lossReason: reason, winReason: undefined });
    } else {
      updateFilter({ lossReason: reason });
    }
  };
  
  // Resetar filtros
  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      status: [],
      hideClosed: true,
      winReason: undefined,
      lossReason: undefined
    };
    
    // Atualizar o estado local e propagar para o componente pai
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos."
    });
  };
  
  // Status disponíveis - Mantendo exatamente os mesmos valores do campo status no banco
  const statusOptions = [
    { value: "in_progress", label: "Em andamento", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "waiting", label: "Aguardando", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: "completed", label: "Concluído", color: "bg-green-100 text-green-700 border-green-200" },
    { value: "canceled", label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" }
  ];
  
  // Opções de desempenho de venda
  const winReasonOptions = [
    { value: "below_quote", label: "Abaixo da cotação", color: "bg-red-100 text-red-800 hover:bg-red-200" },
    { value: "according_to_quote", label: "De acordo com a cotação", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
    { value: "above_quote", label: "Acima da cotação", color: "bg-green-100 text-green-800 hover:bg-green-200" }
  ];
  
  // Controlar mudança no campo de busca com debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setFilters(prev => ({ ...prev, search: searchTerm }));
    
    const timer = setTimeout(() => {
      updateFilter({ search: searchTerm });
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  // Verificar se há filtros ativos
  const hasActiveFilters = (): boolean => {
    return !!(
      filters.search || 
      filters.status.length > 0 || 
      filters.winReason || 
      filters.lossReason || 
      filters.hideClosed === false
    );
  };
  
  return (
    <div className="mb-4">
      {/* Barra de filtros principal */}
      <div className="flex flex-col space-y-2">
        {/* Primeira linha: Busca e limpar filtros */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar negócios por nome, empresa, cidade..."
              className="pl-10"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Botão limpar filtros - visível se qualquer filtro estiver ativo */}
          {hasActiveFilters() && (
            <Button variant="outline" size="sm" onClick={resetFilters} title="Limpar todos os filtros">
              <XCircle className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
        
        {/* Segunda linha: Tabs para diferentes tipos de filtro */}
        <Tabs value={activeFilterTab} onValueChange={setActiveFilterTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="status">Status do Negócio</TabsTrigger>
            <TabsTrigger value="win">Motivos de Ganho</TabsTrigger>
            <TabsTrigger value="loss">Motivos de Perda</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da tab status */}
          <TabsContent value="status" className="pt-2">
            <div className="flex gap-1 flex-wrap">
              {statusOptions.map(option => (
                <Badge 
                  key={option.value}
                  variant={filters.status.includes(option.value) ? "default" : "outline"}
                  className={filters.status.includes(option.value) ? option.color : ""}
                  onClick={() => toggleStatus(option.value)}
                  style={{ cursor: "pointer" }}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </TabsContent>
          
          {/* Conteúdo da tab motivos de ganho */}
          <TabsContent value="win" className="pt-2">
            <div className="flex gap-1 flex-wrap">
              <Badge 
                variant={!filters.winReason ? "default" : "outline"}
                className={!filters.winReason ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : ""}
                onClick={() => applyWinReasonFilter(undefined)}
                style={{ cursor: "pointer" }}
              >
                Todos
              </Badge>
              
              {winReasonOptions.map(option => (
                <Badge 
                  key={option.value}
                  variant={filters.winReason === option.value ? "default" : "outline"}
                  className={filters.winReason === option.value ? option.color : ""}
                  onClick={() => applyWinReasonFilter(option.value)}
                  style={{ cursor: "pointer" }}
                >
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  {option.label}
                </Badge>
              ))}
            </div>
          </TabsContent>
          
          {/* Conteúdo da tab motivos de perda */}
          <TabsContent value="loss" className="pt-2">
            <div className="flex gap-1 flex-wrap">
              <Badge 
                variant={!filters.lossReason ? "default" : "outline"}
                className={!filters.lossReason ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : ""}
                onClick={() => applyLossReasonFilter(undefined)}
                style={{ cursor: "pointer" }}
              >
                Todos
              </Badge>
              
              {lossReasons.map((reason: any) => (
                <Badge 
                  key={reason.id}
                  variant={filters.lossReason === reason.reason ? "default" : "outline"}
                  className={filters.lossReason === reason.reason ? "bg-red-100 text-red-800 hover:bg-red-200" : ""}
                  onClick={() => applyLossReasonFilter(reason.reason)}
                  style={{ cursor: "pointer" }}
                >
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  {reason.reason}
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}