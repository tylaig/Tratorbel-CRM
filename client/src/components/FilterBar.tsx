import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  FilterIcon, 
  Search, 
  ArrowDownIcon,
  ArrowUpIcon,
  Tag, 
  X,
  CheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
  // Usando useEffect para garantir que os filtros locais estejam sempre sincronizados com os ativos
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);
  
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);
  
  const { toast } = useToast();
  
  // Limpar filtros
  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      status: [],
      sortBy: "date",
      sortOrder: "desc",
      hideClosed: true
    };
    
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
    });
  };
  
  // Aplicar filtros de forma imediata
  const applyFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...localFilters, ...newFilters };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  // Alternar status
  const toggleStatus = (status: string) => {
    let newStatusFilters: string[];
    
    if (localFilters.status.includes(status)) {
      newStatusFilters = localFilters.status.filter(s => s !== status);
    } else {
      newStatusFilters = [...localFilters.status, status];
    }
    
    applyFilters({ status: newStatusFilters });
  };
  
  // Controlar a busca com debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setLocalFilters(prev => ({ ...prev, search: searchTerm }));
    
    const timer = setTimeout(() => {
      onFilterChange({ ...localFilters, search: searchTerm });
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  // Status options with colors
  const statusOptions = [
    { value: "in_progress", label: "Em andamento", bgColor: "bg-blue-100", borderColor: "border-blue-200", textColor: "text-blue-800" },
    { value: "waiting", label: "Aguardando", bgColor: "bg-yellow-100", borderColor: "border-yellow-200", textColor: "text-yellow-800" },
    { value: "completed", label: "Concluído", bgColor: "bg-green-100", borderColor: "border-green-200", textColor: "text-green-800" },
    { value: "canceled", label: "Cancelado", bgColor: "bg-red-100", borderColor: "border-red-200", textColor: "text-red-800" }
  ];
  
  // Opções de ordenação
  const sortOptions = [
    { id: "name-asc", label: "Nome (A-Z)", sortBy: "name", sortOrder: "asc" },
    { id: "name-desc", label: "Nome (Z-A)", sortBy: "name", sortOrder: "desc" },
    { id: "value-desc", label: "Maior valor", sortBy: "value", sortOrder: "desc" },
    { id: "value-asc", label: "Menor valor", sortBy: "value", sortOrder: "asc" },
    { id: "date-desc", label: "Mais recentes", sortBy: "date", sortOrder: "desc" },
    { id: "date-asc", label: "Mais antigos", sortBy: "date", sortOrder: "asc" },
    { id: "company-asc", label: "Empresa (A-Z)", sortBy: "company", sortOrder: "asc" },
    { id: "company-desc", label: "Empresa (Z-A)", sortBy: "company", sortOrder: "desc" }
  ];
  
  // Contagem de filtros ativos
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.status.length > 0) count++;
    if (localFilters.sortBy !== "date" || localFilters.sortOrder !== "desc") count++;
    if (localFilters.hideClosed === false) count++;
    return count;
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      {/* Filtro - Mostrar/Ocultar Concluídos */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 relative">
            <FilterIcon className="h-4 w-4" />
            <span>Filtros</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Filtrar negócios</h4>
            
            <div className="space-y-2">
              <Label htmlFor="filter-search">Busca</Label>
              <Input
                id="filter-search"
                placeholder="Nome, empresa, etc."
                value={localFilters.search}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="show-closed-deals"
                checked={!localFilters.hideClosed}
                onCheckedChange={(checked) => {
                  applyFilters({ hideClosed: !checked });
                }}
              />
              <Label
                htmlFor="show-closed-deals"
                className="text-sm font-medium cursor-pointer"
              >
                Mostrar negócios concluídos (ganhos/perdidos)
              </Label>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Tudo
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Ordenação - Simplificada */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            {localFilters.sortOrder === "asc" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
            <span>Ordenar</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="space-y-2">
            <h4 className="font-medium mb-2">Ordenar por</h4>
            
            <div className="grid gap-1">
              {sortOptions.map(option => (
                <Button 
                  key={option.id}
                  variant="ghost"
                  size="sm"
                  className={`justify-start h-9 px-2 ${
                    localFilters.sortBy === option.sortBy && 
                    localFilters.sortOrder === option.sortOrder 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : ""
                  }`}
                  onClick={() => applyFilters({ 
                    sortBy: option.sortBy as any, 
                    sortOrder: option.sortOrder as any 
                  })}
                >
                  <div className="flex items-center w-full">
                    <span>{option.label}</span>
                    {localFilters.sortBy === option.sortBy && 
                     localFilters.sortOrder === option.sortOrder && (
                      <CheckIcon className="h-4 w-4 ml-auto" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Status - Simplificado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 relative">
            <Tag className="h-4 w-4" />
            <span>Status</span>
            {localFilters.status.length > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {localFilters.status.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="space-y-2">
            <h4 className="font-medium mb-2">Filtrar por status</h4>
            
            <div className="grid gap-1">
              {statusOptions.map(status => (
                <div
                  key={status.value}
                  className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                    localFilters.status.includes(status.value) 
                      ? `${status.bgColor} border ${status.borderColor}` 
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleStatus(status.value)}
                >
                  <span className={localFilters.status.includes(status.value) ? status.textColor : 'text-gray-700'}>
                    {status.label}
                  </span>
                  {localFilters.status.includes(status.value) && (
                    <X className="h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar negócios"
          className="pl-10"
          value={localFilters.search}
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
}