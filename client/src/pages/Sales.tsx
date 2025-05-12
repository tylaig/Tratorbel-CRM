import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircleIcon, SearchIcon, ArrowDownIcon, ArrowUpIcon, Building2Icon, CalendarIcon, DollarSignIcon, BarChart3Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import EditDealModal from "@/components/EditDealModal";

export default function Sales() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "value" | "company">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Carregar negócios concluídos com sucesso
  const { data: wonDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status/won'],
  });
  
  // Carregar estágios para o modal de edição
  const { data: pipelineStages = [] } = useQuery({
    queryKey: ['/api/pipeline-stages'],
  });

  // Filtrar negócios por termo de busca
  const filteredDeals = wonDeals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.companyName && deal.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (deal.contactName && deal.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
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
      const aCompany = a.companyName || "";
      const bCompany = b.companyName || "";
      return sortOrder === "asc"
        ? aCompany.localeCompare(bCompany)
        : bCompany.localeCompare(aCompany);
    }
  });
  
  // Calcular valor total
  const totalValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  
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
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className="flex-1 bg-gray-50 px-4 pt-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  Vendas Concluídas
                </h1>
                <p className="text-gray-500">
                  Todas as oportunidades fechadas com sucesso
                </p>
              </div>
              
              <div className="w-full md:w-auto flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar vendas..."
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
                  <CardDescription>Total de Vendas</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100">
                      <BarChart3Icon className="h-5 w-5 text-green-600" />
                    </div>
                    {isLoading ? <Skeleton className="h-8 w-16" /> : wonDeals.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Ticket Médio</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100">
                      <DollarSignIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      formatCurrency(wonDeals.length ? totalValue / wonDeals.length : 0)
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Valor Total</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100">
                      <DollarSignIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      formatCurrency(totalValue)
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle>Histórico de Vendas</CardTitle>
                  
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
                      <DollarSignIcon className="h-4 w-4 mr-1" />
                      Valor
                      {sortBy === "value" && (
                        sortOrder === "asc" ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={sortBy === "company" ? "bg-gray-100" : ""}
                      onClick={() => {
                        if (sortBy === "company") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("company");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      <Building2Icon className="h-4 w-4 mr-1" />
                      Empresa
                      {sortBy === "company" && (
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
                            <div className="mt-1 rounded-full p-1 bg-green-100">
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
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
                                  Fechado em {formatDate(new Date(deal.updatedAt))}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-green-700 font-mono text-lg font-semibold text-right">
                            {deal.value ? formatCurrency(deal.value) : "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma venda concluída encontrada.</p>
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