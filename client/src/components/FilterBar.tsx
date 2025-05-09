import { useState } from "react";
import { 
  FilterIcon, 
  ListOrdered, 
  TagIcon, 
  SearchIcon, 
  Download, 
  FolderInput 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FilterBar() {
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    in_progress: false,
    waiting: false,
    completed: false,
    canceled: false,
  });
  
  const [sortOption, setSortOption] = useState<string | null>(null);
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };
  
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-400" />
                <span>Filtros</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuCheckboxItem
                checked={statusFilters.in_progress}
                onCheckedChange={() => handleStatusFilterChange('in_progress')}
              >
                Valor acima de R$ 1.000
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.waiting}
                onCheckedChange={() => handleStatusFilterChange('waiting')}
              >
                Valor abaixo de R$ 1.000
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.completed}
                onCheckedChange={() => handleStatusFilterChange('completed')}
              >
                Sem empresa
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.canceled}
                onCheckedChange={() => handleStatusFilterChange('canceled')}
              >
                Sem contato
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-gray-400" />
                <span>Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuCheckboxItem
                checked={sortOption === 'name_asc'}
                onCheckedChange={() => setSortOption('name_asc')}
              >
                Nome (A-Z)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOption === 'name_desc'}
                onCheckedChange={() => setSortOption('name_desc')}
              >
                Nome (Z-A)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOption === 'value_asc'}
                onCheckedChange={() => setSortOption('value_asc')}
              >
                Valor (menor para maior)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOption === 'value_desc'}
                onCheckedChange={() => setSortOption('value_desc')}
              >
                Valor (maior para menor)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOption === 'updated_asc'}
                onCheckedChange={() => setSortOption('updated_asc')}
              >
                Atualizado (mais antigo)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOption === 'updated_desc'}
                onCheckedChange={() => setSortOption('updated_desc')}
              >
                Atualizado (mais recente)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-gray-400" />
                <span>Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuCheckboxItem
                checked={statusFilters.in_progress}
                onCheckedChange={() => handleStatusFilterChange('in_progress')}
              >
                Em andamento
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.waiting}
                onCheckedChange={() => handleStatusFilterChange('waiting')}
              >
                Aguardando
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.completed}
                onCheckedChange={() => handleStatusFilterChange('completed')}
              >
                Concluído
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.canceled}
                onCheckedChange={() => handleStatusFilterChange('canceled')}
              >
                Cancelado
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="text" 
              placeholder="Buscar negócios..." 
              className="pl-10 h-9"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            <span>Exportar</span>
          </Button>
          
          <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
            <FolderInput className="h-4 w-4 text-gray-400" />
            <span>Importar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
