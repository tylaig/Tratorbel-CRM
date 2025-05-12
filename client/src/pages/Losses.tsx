import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal, LossReason } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  XCircleIcon, 
  SearchIcon, 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Building2Icon,
  CalendarIcon,
  AlertOctagonIcon, 
  BarChart3Icon,
  PieChartIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import EditDealModal from "@/components/EditDealModal";

export default function Losses() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "value" | "reason">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Carregar negócios perdidos
  const { data: lostDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status/lost'],
  });
  
  // Carregar estágios para o modal de edição
  const { data: pipelineStages = [] } = useQuery({
    queryKey: ['/api/pipeline-stages'],
  });
  
  // Carregar motivos de perda
  const { data: lossReasons = [] } = useQuery<LossReason[]>({
    queryKey: ['/api/loss-reasons'],
  });

  // Filtrar negócios por termo de busca
  const filteredDeals = lostDeals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.companyName && deal.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (deal.lostReason && deal.lostReason.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Ordenar negócios
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc"
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortBy === "value") {
      const aValue = a.value || 0;
      const bValue = b.value || 0;
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      const aReason = a.lostReason || "";
      const bReason = b.lostReason || "";
      return sortOrder === "asc"
        ? aReason.localeCompare(bReason)
        : bReason.localeCompare(aReason);
    }
  });
  
  // Calcular estatísticas de razões de perda
  const reasonStats = lostDeals.reduce((acc, deal) => {
    const reason = deal.lostReason || "Não especificado";
    if (!acc[reason]) {
      acc[reason] = 0;
    }
    acc[reason]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Encontrar o motivo mais comum
  let topReason = "Nenhum";
  let topReasonCount = 0;
  
  Object.entries(reasonStats).forEach(([reason, count]) => {
    if (count > topReasonCount) {
      topReason = reason;
      topReasonCount = count;
    }
  });
  
  // Abrir modal de edição
  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsEditModalOpen(true);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        viewMode="list" 
        toggleViewMode={() => {}}
        onOpenApiConfig={() => {}}
        onAddDeal={() => {}}
        onSync={() => {}}
        syncLoading={false}
        hasApiConfig={true}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-gray-50 px-4 pt-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                  Oportunidades Perdidas
                </h1>
                <p className="text-gray-500">
                  Análise de oportunidades que não se converteram em vendas
                </p>
              </div>
              
              <div className="w-full md:w-auto flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar perdas..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Perdas</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-red-100">
                      <AlertOctagonIcon className="h-5 w-5 text-red-600" />
                    </div>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : lostDeals.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Principal Razão</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-100">
                      <PieChartIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <span className="truncate max-w-[180px]" title={topReason}>
                        {topReason}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Valor Potencial Perdido</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-gray-100">
                      <BarChart3Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      formatCurrency(
                        lostDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
                      )
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle>Registro de Perdas</CardTitle>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={sortBy === "date" ? "bg-gray-100" : ""}
                      onClick={() => {
                        if (sortBy === "date") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("date");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Data
                      {sortBy === "date" && (
                        sortOrder === "asc" ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={sortBy === "value" ? "bg-gray-100" : ""}
                      onClick={() => {
                        if (sortBy === "value") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("value");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      <BarChart3Icon className="h-4 w-4 mr-1" />
                      Valor
                      {sortBy === "value" && (
                        sortOrder === "asc" ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={sortBy === "reason" ? "bg-gray-100" : ""}
                      onClick={() => {
                        if (sortBy === "reason") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("reason");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <PieChartIcon className="h-4 w-4 mr-1" />
                      Motivo
                      {sortBy === "reason" && (
                        sortOrder === "asc" ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  // Skeleton loading
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-md p-4">
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="flex mt-2 gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sortedDeals.length > 0 ? (
                  <div className="space-y-4">
                    {sortedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleDealClick(deal)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full p-1 bg-red-100">
                              <XCircleIcon className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{deal.name}</h3>
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                                {deal.companyName && (
                                  <span className="flex items-center gap-1">
                                    <Building2Icon className="h-3.5 w-3.5" />
                                    {deal.companyName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  Registrado em {formatDate(new Date(deal.updatedAt))}
                                </span>
                              </div>
                              {deal.lostReason && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-700 rounded-full">
                                    {deal.lostReason}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-gray-500 font-mono text-lg font-semibold text-right">
                            {deal.value ? formatCurrency(deal.value) : "-"}
                          </div>
                        </div>
                        
                        {deal.lostNotes && (
                          <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                            <p className="whitespace-pre-wrap">{deal.lostNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma oportunidade perdida encontrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Gráfico de distribuição de motivos */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Distribuição de Motivos de Perda</CardTitle>
                <CardDescription>
                  Análise dos principais motivos que levaram à perda de oportunidades
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : Object.keys(reasonStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(reasonStats)
                      .sort(([, countA], [, countB]) => countB - countA)
                      .map(([reason, count]) => {
                        const percentage = Math.round((count / lostDeals.length) * 100);
                        
                        return (
                          <div key={reason} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{reason}</span>
                              <span>{count} {count === 1 ? "ocorrência" : "ocorrências"} ({percentage}%)</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-600 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum motivo de perda registrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Modal de edição */}
      <EditDealModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        deal={selectedDeal}
        pipelineStages={pipelineStages}
      />
    </div>
  );
}