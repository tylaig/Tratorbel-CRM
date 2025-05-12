import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3Icon, 
  CalendarIcon, 
  CheckCircleIcon, 
  DollarSignIcon, 
  HistoryIcon, 
  PieChartIcon,
  XCircleIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function Historical() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"all" | "month" | "quarter" | "year">("all");
  
  // Carregar todos os negócios
  const { data: allDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Filtrar negócios por período de tempo selecionado
  const filteredDeals = allDeals.filter(deal => {
    if (timeRange === "all") return true;
    
    const dealDate = new Date(deal.updatedAt);
    const now = new Date();
    
    if (timeRange === "month") {
      // Último mês
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return dealDate >= lastMonth;
    } else if (timeRange === "quarter") {
      // Último trimestre
      const lastQuarter = new Date();
      lastQuarter.setMonth(lastQuarter.getMonth() - 3);
      return dealDate >= lastQuarter;
    } else if (timeRange === "year") {
      // Último ano
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return dealDate >= lastYear;
    }
    
    return true;
  });
  
  // Separar por status
  const wonDeals = filteredDeals.filter(deal => deal.saleStatus === "won");
  const lostDeals = filteredDeals.filter(deal => deal.saleStatus === "lost");
  const activeDeals = filteredDeals.filter(deal => !deal.saleStatus);
  
  // Calcular estatísticas
  const totalWonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const totalLostValue = lostDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const totalPotentialValue = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  
  // Calcular taxa de conversão
  const conversionRate = wonDeals.length + lostDeals.length > 0 
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) 
    : 0;
  
  // Calcular ticket médio
  const averageTicket = wonDeals.length > 0 ? totalWonValue / wonDeals.length : 0;
  
  // Calcular valor médio por estágio
  const valueByStage: Record<number, { total: number, count: number, name: string }> = {};
  
  filteredDeals.forEach(deal => {
    if (!valueByStage[deal.stageId]) {
      valueByStage[deal.stageId] = { 
        total: 0, 
        count: 0, 
        name: "Estágio " + deal.stageId // Fallback se não conseguirmos o nome
      };
    }
    
    if (deal.value) {
      valueByStage[deal.stageId].total += deal.value;
      valueByStage[deal.stageId].count++;
    }
  });
  
  // Razões de perda
  const lossReasons: Record<string, number> = {};
  
  lostDeals.forEach(deal => {
    const reason = deal.lostReason || "Não especificado";
    lossReasons[reason] = (lossReasons[reason] || 0) + 1;
  });
  
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
                  <HistoryIcon className="h-6 w-6 text-blue-600" />
                  Histórico de Desempenho
                </h1>
                <p className="text-gray-500">
                  Análise histórica do funil de vendas e conversões
                </p>
              </div>
              
              <Tabs 
                value={timeRange} 
                onValueChange={(v) => setTimeRange(v as "all" | "month" | "quarter" | "year")}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-4 w-full md:w-auto">
                  <TabsTrigger value="all" className="text-xs md:text-sm">
                    Todo Período
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs md:text-sm">
                    Último Mês
                  </TabsTrigger>
                  <TabsTrigger value="quarter" className="text-xs md:text-sm">
                    Trimestre
                  </TabsTrigger>
                  <TabsTrigger value="year" className="text-xs md:text-sm">
                    Último Ano
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Taxa de Conversão</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100">
                      <PieChartIcon className="h-5 w-5 text-green-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span>{conversionRate}%</span>
                    )}
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
                      <span>{formatCurrency(averageTicket)}</span>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Vendas Fechadas</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-green-100">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span>{wonDeals.length}</span>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Oportunidades Perdidas</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-1 rounded-md bg-red-100">
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span>{lostDeals.length}</span>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            {/* Gráficos de valor total */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valor Total Ganho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-green-100">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          {wonDeals.length} {wonDeals.length === 1 ? "negócio" : "negócios"}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {isLoading ? (
                        <Skeleton className="h-8 w-28" />
                      ) : (
                        formatCurrency(totalWonValue)
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valor Perdido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-red-100">
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          {lostDeals.length} {lostDeals.length === 1 ? "negócio" : "negócios"}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {isLoading ? (
                        <Skeleton className="h-8 w-28" />
                      ) : (
                        formatCurrency(totalLostValue)
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valor em Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-blue-100">
                        <BarChart3Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          {activeDeals.length} {activeDeals.length === 1 ? "negócio" : "negócios"}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {isLoading ? (
                        <Skeleton className="h-8 w-28" />
                      ) : (
                        formatCurrency(totalPotentialValue)
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Gráficos detalhados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valor Médio por Estágio</CardTitle>
                  <CardDescription>
                    Comparação do valor médio dos negócios em cada etapa do funil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : Object.keys(valueByStage).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(valueByStage)
                        .filter(([_, data]) => data.count > 0)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([stageId, data]) => {
                          const averageValue = data.count > 0 ? data.total / data.count : 0;
                          
                          // Calcular a largura da barra baseada no maior valor médio
                          const maxAverage = Math.max(
                            ...Object.values(valueByStage)
                              .filter(d => d.count > 0)
                              .map(d => d.total / d.count)
                          );
                          
                          const percentage = maxAverage > 0 ? (averageValue / maxAverage) * 100 : 0;
                          
                          return (
                            <div key={stageId} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">Estágio {stageId}</span>
                                <span>{formatCurrency(averageValue)}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 text-right">
                                {data.count} {data.count === 1 ? "negócio" : "negócios"}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Sem dados suficientes para análise.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Motivos de Perda</CardTitle>
                  <CardDescription>
                    Distribuição dos principais motivos que levaram à perda de oportunidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : Object.keys(lossReasons).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(lossReasons)
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
                      <p className="text-gray-500">Nenhum registro de oportunidade perdida.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Timeline de atividades */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Linha do Tempo de Atividades</CardTitle>
                <CardDescription>
                  Histórico recente de conclusões de negócios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="relative">
                    {/* Linha vertical */}
                    <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-gray-200" />
                    
                    <div className="space-y-8 relative">
                      {filteredDeals
                        .filter(deal => deal.saleStatus)
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .slice(0, 10)
                        .map((deal, index) => (
                          <div key={deal.id} className="flex gap-4">
                            <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0">
                              <div className={`rounded-full p-1.5 ${deal.saleStatus === "won" ? "bg-green-100" : "bg-red-100"}`}>
                                {deal.saleStatus === "won" ? (
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircleIcon className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 pt-0.5">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                <p className="text-sm font-medium">
                                  {deal.name} 
                                  {deal.companyName && <span className="text-gray-500"> - {deal.companyName}</span>}
                                </p>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {formatDate(new Date(deal.updatedAt))}
                                </span>
                              </div>
                              
                              <p className="mt-1 text-sm">
                                <span className={deal.saleStatus === "won" ? "text-green-700" : "text-red-700"}>
                                  {deal.saleStatus === "won" ? "Negócio fechado" : "Oportunidade perdida"}
                                </span>
                                {deal.value && <span className="ml-2 font-mono">{formatCurrency(deal.value)}</span>}
                              </p>
                              
                              {deal.lostReason && (
                                <p className="mt-1 text-sm text-gray-600">
                                  Motivo: {deal.lostReason}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      }
                      
                      {filteredDeals.filter(deal => deal.saleStatus).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Nenhum histórico de atividades disponível.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}