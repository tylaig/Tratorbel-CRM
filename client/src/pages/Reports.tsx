import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal, PipelineStage } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { usePipeline } from "@/hooks/usePipeline";

// Cores para os gráficos
const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const { pipelineStages, deals, calculateStageStats } = usePipeline();
  
  // Preparar dados para o gráfico de barras por estágio
  const stageData = pipelineStages.map(stage => {
    const stats = calculateStageStats(stage.id);
    return {
      name: stage.name,
      valor: stats.value,
      quantidade: stats.count
    };
  });
  
  // Preparar dados para o gráfico de pizza por estágio
  const pieData = pipelineStages.map(stage => {
    const stats = calculateStageStats(stage.id);
    return {
      name: stage.name,
      value: stats.value
    };
  });
  
  // Calcular o valor total em pipeline
  const totalPipelineValue = stageData.reduce((total, item) => total + item.valor, 0);
  
  // Calcular o total de negócios
  const totalDeals = deals?.length || 0;
  
  // Calcular o valor médio por negócio
  const averageDealValue = totalDeals > 0 ? totalPipelineValue / totalDeals : 0;
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleViewMode = (mode: "kanban" | "list") => {
    setViewMode(mode);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header 
        toggleSidebar={toggleSidebar}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
        onOpenApiConfig={() => {}}
        onAddDeal={() => {}}
        onSync={() => {}}
        syncLoading={false}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total em Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total de Negócios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeals}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Valor Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(averageDealValue)}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Valor por Estágio</CardTitle>
                <CardDescription>Distribuição de valores em cada estágio do pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stageData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value as number)}
                        labelFormatter={(label) => `Estágio: ${label}`}
                      />
                      <Bar dataKey="valor" fill="#8884d8" name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Estágio</CardTitle>
                <CardDescription>Proporção de valores em cada estágio do pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}