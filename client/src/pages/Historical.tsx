import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { Deal } from "@shared/schema";

// Mock data para os charts (será substituído por dados reais depois)
const salesByMonth = [
  { name: "Jan", total: 120000 },
  { name: "Fev", total: 140000 },
  { name: "Mar", total: 90000 },
  { name: "Abr", total: 220000 },
  { name: "Mai", total: 180000 },
  { name: "Jun", total: 160000 },
];

const lossReasons = [
  { name: "Preço", value: 12, fill: "#f87171" },
  { name: "Concorrência", value: 8, fill: "#fb923c" },
  { name: "Prazo", value: 5, fill: "#fbbf24" },
  { name: "Indisponibilidade", value: 3, fill: "#a3e635" },
  { name: "Outros", value: 2, fill: "#22d3ee" },
];

export default function Historical() {
  const { data: wonDeals = [], isLoading: isLoadingWon } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status', 'won'],
    queryFn: async () => {
      const res = await fetch('/api/deals/sale-status/won');
      if (!res.ok) throw new Error('Erro ao carregar dados');
      return res.json();
    }
  });
  
  const { data: lostDeals = [], isLoading: isLoadingLost } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status', 'lost'],
    queryFn: async () => {
      const res = await fetch('/api/deals/sale-status/lost');
      if (!res.ok) throw new Error('Erro ao carregar dados');
      return res.json();
    }
  });
  
  const { data: allDeals = [], isLoading: isLoadingAll } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    queryFn: async () => {
      const res = await fetch('/api/deals');
      if (!res.ok) throw new Error('Erro ao carregar dados');
      return res.json();
    }
  });
  
  // Cálculos para os cards
  const totalWonValue = wonDeals.reduce((acc, deal) => acc + (deal.value || 0), 0);
  const totalLostValue = lostDeals.reduce((acc, deal) => acc + (deal.value || 0), 0);
  const totalOpenValue = allDeals
    .filter(deal => deal.status !== "won" && deal.status !== "lost")
    .reduce((acc, deal) => acc + (deal.value || 0), 0);
  
  const conversionRate = wonDeals.length + lostDeals.length > 0 
    ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 
    : 0;
    
  const totalClients = new Set([
    ...wonDeals.map(d => d.contactId), 
    ...lostDeals.map(d => d.contactId)
  ]).size;
  
  const avgDealValue = wonDeals.length > 0 
    ? totalWonValue / wonDeals.length 
    : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <BarChart3Icon className="h-8 w-8 text-primary mr-2" />
        <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vendas Totais</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWonValue)}</div>
            <p className="text-xs text-gray-500 mt-1">{wonDeals.length} negócios fechados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Perdas</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLostValue)}</div>
            <p className="text-xs text-gray-500 mt-1">{lostDeals.length} oportunidades perdidas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taxa de Conversão</CardTitle>
            <PieChartIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {wonDeals.length} ganhos / {wonDeals.length + lostDeals.length} totais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDealValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Por negócio fechado</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Mês</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                        currency: 'BRL',
                      }).format(value)
                    } 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))} 
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar dataKey="total" fill="#0e7490" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Motivos de Perda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lossReasons}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {lossReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} negócios`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Resumo de Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">Em aberto</span>
                </div>
                <div className="font-medium">{formatCurrency(totalOpenValue)}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                  <span className="text-sm">Vendas</span>
                </div>
                <div className="font-medium">{formatCurrency(totalWonValue)}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Perdas</span>
                </div>
                <div className="font-medium">{formatCurrency(totalLostValue)}</div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-800 mr-2"></div>
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="font-bold">
                  {formatCurrency(totalOpenValue + totalWonValue + totalLostValue)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Métricas Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <UsersIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de Clientes</p>
                  <p className="text-xl font-bold">{totalClients}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Negócios Fechados</p>
                  <p className="text-xl font-bold">{wonDeals.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Oportunidades Perdidas</p>
                  <p className="text-xl font-bold">{lostDeals.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <CalendarIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">No Pipeline</p>
                  <p className="text-xl font-bold">
                    {allDeals.filter(d => d.status !== "won" && d.status !== "lost").length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}