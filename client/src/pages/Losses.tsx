import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  XCircleIcon, 
  SearchIcon,
  EyeIcon,
  ClipboardIcon,
  AlertCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Deal } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Losses() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status', 'lost'],
    queryFn: async () => {
      const res = await fetch('/api/deals/sale-status/lost');
      if (!res.ok) throw new Error('Erro ao carregar dados');
      return res.json();
    }
  });
  
  const filteredDeals = deals.filter(deal => 
    deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <XCircleIcon className="h-6 w-6 text-red-500" />
          Oportunidades Perdidas
        </h1>
        
        <div className="relative w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nome ou empresa"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor Estimado</TableHead>
              <TableHead>Motivo da Perda</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Carregando dados...
                </TableCell>
              </TableRow>
            ) : filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhuma oportunidade perdida encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    {deal.contactName || "Cliente não informado"}
                  </TableCell>
                  <TableCell>{deal.companyName || "-"}</TableCell>
                  <TableCell>{formatDate(deal.updatedAt)}</TableCell>
                  <TableCell className="font-medium text-gray-600">
                    {formatCurrency(deal.value || 0)}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {deal.lostReason || "Não especificado"}
                            </Badge>
                            {deal.lostNotes && (
                              <AlertCircleIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TooltipTrigger>
                        {deal.lostNotes && (
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{deal.lostNotes}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}