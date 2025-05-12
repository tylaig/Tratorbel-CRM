import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  FilterIcon, 
  Search, 
  SortDesc, 
  Tag, 
  X
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);
  
  const { toast } = useToast();
  
  // Aplicar filtros
  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsFilterOpen(false);
    toast({
      title: "Filtros aplicados",
      description: "Os negócios foram filtrados conforme suas preferências.",
      variant: "default",
    });
  };
  
  // Limpar filtros
  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search: "",
      status: [],
      sortBy: "date",
      sortOrder: "desc",
      hideClosed: true // Por padrão, escondemos negócios fechados (vendidos ou perdidos)
    };
    
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setIsFilterOpen(false);
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
      variant: "default",
    });
  };
  
  // Aplicar ordenação
  const applySorting = (sortBy: "name" | "value" | "date" | "company", sortOrder: "asc" | "desc") => {
    const newFilters = { ...localFilters, sortBy, sortOrder };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    setIsSortOpen(false);
  };
  
  // Toggle status filter
  const toggleStatus = (status: string) => {
    let newStatusFilters: string[];
    
    if (localFilters.status.includes(status)) {
      newStatusFilters = localFilters.status.filter(s => s !== status);
    } else {
      newStatusFilters = [...localFilters.status, status];
    }
    
    const newFilters = { ...localFilters, status: newStatusFilters };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    
    // Fechar o popover após alteração
    setTimeout(() => {
      // Usando um pequeno atraso para garantir que a interface seja atualizada
      if (newStatusFilters.length === 0) {
        setIsStatusOpen(false);
      }
    }, 300);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setLocalFilters(prev => ({ ...prev, search: searchTerm }));
    
    // Debounce search for better performance
    const timer = setTimeout(() => {
      onFilterChange({ ...localFilters, search: searchTerm });
    }, 300);
    
    return () => clearTimeout(timer);
  };
  
  // Status options with colors
  const statusOptions = [
    { value: "in_progress", label: "Em andamento", color: "blue", bgColor: "bg-blue-100", borderColor: "border-blue-200", textColor: "text-blue-800" },
    { value: "waiting", label: "Aguardando", color: "yellow", bgColor: "bg-yellow-100", borderColor: "border-yellow-200", textColor: "text-yellow-800" },
    { value: "completed", label: "Concluído", color: "green", bgColor: "bg-green-100", borderColor: "border-green-200", textColor: "text-green-800" },
    { value: "canceled", label: "Cancelado", color: "red", bgColor: "bg-red-100", borderColor: "border-red-200", textColor: "text-red-800" },
  ];
  
  // Format active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.status.length > 0) count++;
    if (localFilters.sortBy !== "date" || localFilters.sortOrder !== "desc") count++;
    if (localFilters.hideClosed === false) count++; // Considerar como filtro ativo se mostrar negócios concluídos
    return count;
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      {/* Filtros */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
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
                  setLocalFilters({
                    ...localFilters,
                    hideClosed: !checked
                  });
                }}
              />
              <Label
                htmlFor="show-closed-deals"
                className="text-sm font-medium cursor-pointer"
              >
                Mostrar negócios concluídos (ganhos/perdidos)
              </Label>
            </div>
            
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Ordenação */}
      <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <SortDesc className="h-4 w-4" />
            <span>Ordenar</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="space-y-4">
            <h4 className="font-medium">Ordenar por</h4>
            
            <div className="grid gap-2">
              <Button 
                variant={localFilters.sortBy === "name" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("name", "asc")}
              >
                Nome (A-Z)
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "name" && localFilters.sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("name", "desc")}
              >
                Nome (Z-A)
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "value" && localFilters.sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("value", "desc")}
              >
                Maior valor
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "value" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("value", "asc")}
              >
                Menor valor
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "date" && localFilters.sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("date", "desc")}
              >
                Mais recentes
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "date" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("date", "asc")}
              >
                Mais antigos
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "company" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("company", "asc")}
              >
                Empresa (A-Z)
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "company" && localFilters.sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("company", "desc")}
              >
                Empresa (Z-A)
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "date" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("date", "asc")}
              >
                Mais antigos
              </Button>
              
              <Button 
                variant={localFilters.sortBy === "company" && localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => applySorting("company", "asc")}
              >
                Empresa (A-Z)
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Status */}
      <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
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
          <div className="space-y-4">
            <h4 className="font-medium">Filtrar por status</h4>
            
            <div className="grid gap-2">
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