import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  SlidersHorizontal,
  XCircle
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

export interface FilterOptions {
  search: string;
  status: string[];
  sortBy: "name" | "value" | "date" | "company";
  sortOrder: "asc" | "desc";
  stageId?: number;
  hideClosed?: boolean; // Ocultar negócios vencidos/perdidos do pipeline
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export default function FilterBar({ onFilterChange, activeFilters }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(activeFilters);
  const { toast } = useToast();
  
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
      console.log(`Removendo status ${status}, nova lista:`, newStatus);
    } else {
      // Adicionar status se não estiver selecionado
      newStatus = [...filters.status, status];
      console.log(`Adicionando status ${status}, nova lista:`, newStatus);
    }
    
    // Atualizar o estado local e propagar para o componente pai
    setFilters(prev => ({ ...prev, status: newStatus }));
    onFilterChange({ ...filters, status: newStatus });
    
    console.log("Filtros atualizados:", { ...filters, status: newStatus });
  };
  
  // Resetar filtros
  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      status: [],
      sortBy: "date",
      sortOrder: "desc",
      hideClosed: true
    };
    
    // Atualizar o estado local e propagar para o componente pai
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    
    console.log("Filtros redefinidos para padrão:", defaultFilters);
    
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
  
  // Opções de ordenação
  const sortOptions = [
    { value: "name-asc", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
    { value: "value-desc", label: "Maior valor" },
    { value: "value-asc", label: "Menor valor" },
    { value: "date-desc", label: "Mais recentes" },
    { value: "date-asc", label: "Mais antigos" },
    { value: "company-asc", label: "Empresa (A-Z)" },
    { value: "company-desc", label: "Empresa (Z-A)" }
  ];
  
  // Verificar quantos filtros estão ativos
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) {
      count++;
      console.log("Status ativos:", filters.status);
    }
    if (filters.hideClosed === false) count++;
    if (filters.sortBy !== "date" || filters.sortOrder !== "desc") count++;
    return count;
  };
  
  // Controlar mudança no campo de busca com debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setFilters(prev => ({ ...prev, search: searchTerm }));
    
    const timer = setTimeout(() => {
      updateFilter({ search: searchTerm });
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  // Processar mudança na ordenação
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-") as [
      "name" | "value" | "date" | "company", 
      "asc" | "desc"
    ];
    
    updateFilter({ sortBy, sortOrder });
  };
  
  // Valor atual de ordenação
  const currentSortValue = `${filters.sortBy}-${filters.sortOrder}`;
  
  return (
    <div className="mb-4">
      {/* Barra de filtros simplificada */}
      <div className="flex items-center space-x-2">
        {/* Campo de busca sempre visível */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar negócios por nome, empresa, cidade..."
            className="pl-10"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Ordenação sempre visível */}
        <Select
          value={currentSortValue}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenação" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Botão limpar filtros */}
        {filters.search && (
          <Button variant="ghost" size="icon" onClick={resetFilters} title="Limpar filtros">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}