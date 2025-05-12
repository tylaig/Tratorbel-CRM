import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Deal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import { 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MapIcon, 
  Home, 
  Building2, 
  HardDrive, 
  Settings2,
  Cpu 
} from "lucide-react";

export default function Heatmap() {
  const [mapView, setMapView] = useState<"state" | "city" | "machines">("state");
  
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Processar os dados para o mapa de calor
  const stateData = processStateData(deals || []);
  const cityData = processCityData(deals || []);
  const machineData = processMachineData(deals || []);
  
  return (
    <div>
      <div className="mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MapIcon className="mr-2 h-5 w-5 text-primary" />
            Análise Geográfica
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Distribuição de oportunidades e vendas por região
          </p>
        </div>
      </div>
      
      <Tabs value={mapView} onValueChange={(v) => setMapView(v as "state" | "city" | "machines")}>
        <TabsList className="mb-4">
          <TabsTrigger value="state" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Por Estado
          </TabsTrigger>
          <TabsTrigger value="city" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            Por Cidade
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-1">
            <Cpu className="h-4 w-4" />
            Por Equipamentos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="state">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  Distribuição por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-[400px] rounded-md overflow-hidden">
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex flex-col">
                          <div className="flex-1 flex">
                            <div className="bg-yellow-100 flex-1 p-4 border border-primary/20">
                              <div className="font-medium">Norte</div>
                              <div className="mt-2 text-sm text-gray-600">
                                {stateData.filter(s => ['AM', 'PA', 'RO', 'RR', 'AC', 'AP', 'TO'].includes(s.name)).reduce((acc, state) => acc + state.count, 0)} 
                                {' '}negócios
                              </div>
                            </div>
                            <div className="bg-blue-100 flex-1 p-4 border border-primary/20">
                              <div className="font-medium">Nordeste</div>
                              <div className="mt-2 text-sm text-gray-600">
                                {stateData.filter(s => ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'].includes(s.name)).reduce((acc, state) => acc + state.count, 0)} 
                                {' '}negócios
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex">
                            <div className="bg-green-100 flex-1 p-4 border border-primary/20">
                              <div className="font-medium">Centro-Oeste</div>
                              <div className="mt-2 text-sm text-gray-600">
                                {stateData.filter(s => ['MT', 'MS', 'GO', 'DF'].includes(s.name)).reduce((acc, state) => acc + state.count, 0)} 
                                {' '}negócios
                              </div>
                            </div>
                            <div className="bg-orange-100 flex-1 p-4 border border-primary/20">
                              <div className="font-medium">Sudeste</div>
                              <div className="mt-2 text-sm text-gray-600">
                                {stateData.filter(s => ['MG', 'ES', 'RJ', 'SP'].includes(s.name)).reduce((acc, state) => acc + state.count, 0)} 
                                {' '}negócios
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="bg-purple-100 h-full p-4 border border-primary/20">
                              <div className="font-medium">Sul</div>
                              <div className="mt-2 text-sm text-gray-600">
                                {stateData.filter(s => ['PR', 'SC', 'RS'].includes(s.name)).reduce((acc, state) => acc + state.count, 0)} 
                                {' '}negócios
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Top Estados</h3>
                      <div className="space-y-3">
                        {stateData.length > 0 ? (
                          stateData.map((state, index) => (
                            <div key={index} className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center">
                                <span className="font-medium">{state.name}</span>
                              </div>
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Negócios</div>
                                  <div className="font-medium">{state.count}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Valor</div>
                                  <div className="font-medium">{formatCurrency(state.value)}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            Nenhum dado disponível para exibição
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="city">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="mr-2 h-5 w-5 text-primary" />
                  Distribuição por Cidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Cidade</th>
                          <th className="text-left py-2 px-4">Estado</th>
                          <th className="text-right py-2 px-4">Negócios</th>
                          <th className="text-right py-2 px-4">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cityData.length > 0 ? (
                          cityData.map((city, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{city.name}</td>
                              <td className="py-3 px-4">{city.state}</td>
                              <td className="py-3 px-4 text-right">{city.count}</td>
                              <td className="py-3 px-4 text-right font-medium">{formatCurrency(city.value)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8">
                              <div className="flex flex-col items-center justify-center">
                                <Building2 className="h-10 w-10 text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-500">Sem dados de cidade</h3>
                                <p className="mt-1 text-sm text-gray-400 max-w-md text-center">
                                  Adicione cidade e estado aos seus negócios no formulário de edição para visualizar estatísticas geográficas.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="machines">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Cpu className="mr-2 h-5 w-5 text-primary" />
                  Distribuição por Equipamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Tipos de Equipamento</h3>
                      <div className="h-[300px] rounded-md border border-primary/10 p-4">
                        <div className="space-y-4">
                          {machineData.map((machine, index) => (
                            <div key={index} className="relative">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{machine.brand}</span>
                                <span className="text-sm text-gray-600">{machine.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                                <div 
                                  className="bg-primary h-4 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (machine.count / Math.max(...machineData.map(m => m.count))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                          
                          {machineData.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full py-6">
                              <Settings2 className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-lg font-medium text-gray-500">Sem dados de máquinas</h3>
                              <p className="mt-1 text-sm text-gray-400 max-w-md text-center px-4">
                                Registre equipamentos nas negociações para visualizar estatísticas por marca.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Top Marcas</h3>
                      <div className="space-y-2">
                        {machineData.length > 0 ? (
                          machineData.map((machine, index) => (
                            <div key={index} className="flex items-center justify-between border-b pb-2">
                              <div className="font-medium">{machine.brand}</div>
                              <div className="text-right">{machine.count} máquinas</div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center border rounded-md">
                            <div className="flex flex-col items-center justify-center">
                              <HardDrive className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-lg font-medium text-gray-500">Sem dados de máquinas</h3>
                              <p className="mt-1 text-sm text-gray-400 max-w-md text-center px-4">
                                Registre os equipamentos nos negócios para visualizar estatísticas de marca.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Funções auxiliares para processar os dados
function processStateData(deals: Deal[]) {
  // Usando um objeto simples para evitar conflitos com o Map do JavaScript
  const stateData: Record<string, { count: number; value: number }> = {
    // Definir estados brasileiros para garantir que todos apareçam no mapa
    'SP': { count: 0, value: 0 },
    'RJ': { count: 0, value: 0 },
    'MG': { count: 0, value: 0 },
    'ES': { count: 0, value: 0 },
    'RS': { count: 0, value: 0 },
    'SC': { count: 0, value: 0 },
    'PR': { count: 0, value: 0 },
    'MT': { count: 0, value: 0 },
    'MS': { count: 0, value: 0 },
    'GO': { count: 0, value: 0 },
    'DF': { count: 0, value: 0 },
    'BA': { count: 0, value: 0 },
    'SE': { count: 0, value: 0 },
    'AL': { count: 0, value: 0 },
    'PE': { count: 0, value: 0 },
    'PB': { count: 0, value: 0 },
    'RN': { count: 0, value: 0 },
    'CE': { count: 0, value: 0 },
    'PI': { count: 0, value: 0 },
    'MA': { count: 0, value: 0 },
    'TO': { count: 0, value: 0 },
    'PA': { count: 0, value: 0 },
    'AP': { count: 0, value: 0 },
    'AM': { count: 0, value: 0 },
    'RR': { count: 0, value: 0 },
    'AC': { count: 0, value: 0 },
    'RO': { count: 0, value: 0 }
  };
  
  // Processar dados reais dos deals para análise geográfica
  deals.forEach(deal => {
    // Usar apenas dados com estado definido para garantir análise geográfica precisa
    if (deal.state) {
      const state = deal.state.toUpperCase();
      
      if (stateData[state]) {
        stateData[state].count += 1;
        stateData[state].value += (deal.value || 0);
      }
    }
  });
  
  // Não adicionamos dados fictícios, apenas utilizamos dados reais dos negócios
  
  return Object.entries(stateData)
    .map(([name, data]) => ({ name, ...data }))
    .filter(item => item.count > 0)  // Filtra apenas estados com dados
    .sort((a, b) => b.value - a.value);
}

function processCityData(deals: Deal[]) {
  // Usando um objeto simples para evitar conflitos com o Map do JavaScript
  const cityData: Record<string, { count: number; value: number; state: string }> = {};
  
  // Cidades principais para garantir dados de demonstração
  const defaultCities = [
    { city: 'SÃO PAULO', state: 'SP' },
    { city: 'RIO DE JANEIRO', state: 'RJ' },
    { city: 'BELO HORIZONTE', state: 'MG' },
    { city: 'SALVADOR', state: 'BA' },
    { city: 'FORTALEZA', state: 'CE' },
    { city: 'RECIFE', state: 'PE' },
    { city: 'PORTO ALEGRE', state: 'RS' },
    { city: 'CURITIBA', state: 'PR' },
    { city: 'GOIÂNIA', state: 'GO' },
    { city: 'BELÉM', state: 'PA' }
  ];
  
  // Inicializar as cidades principais com valores zerados
  defaultCities.forEach(({ city, state }) => {
    const key = `${city}, ${state}`;
    cityData[key] = { count: 0, value: 0, state };
  });
  
  deals.forEach(deal => {
    if (deal.city && deal.state) {
      const city = deal.city.toUpperCase();
      const state = deal.state.toUpperCase();
      const key = `${city}, ${state}`;
      
      if (!cityData[key]) {
        cityData[key] = { count: 0, value: 0, state };
      }
      
      cityData[key].count += 1;
      cityData[key].value += (deal.value || 0);
    } else {
      // Se não tiver cidade/estado, não incluir no cálculo geográfico
      // para garantir que apenas dados reais apareçam no mapa
      return;
    }
  });
  
  return Object.entries(cityData)
    .map(([key, data]) => {
      // Extrair cidade do nome da chave e usar o estado do objeto 
      return { 
        name: key.split(',')[0].trim(),
        count: data.count,
        value: data.value,
        state: data.state
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
}

// Processa dados combinando estatísticas de marcas de máquinas
function processMachineData(deals: Deal[]) {
  // Objeto vazio para armazenar apenas marcas que existem de fato
  const brandData: Record<string, number> = {};
  
  // Adicionamos algumas estatísticas iniciais para demonstração
  // Normalmente estes dados viriam de uma chamada API para client-machines
  // Nesta implementação, consultaríamos a API real para obter as máquinas associadas a cada deal
  // Por exemplo:
  // Usando useQuery para consultar as máquinas de cada deal e depois contabilizar por marca
  // Para fins desta implementação, deixaremos os dados vazios até termos dados reais
  
  // Em uma implementação real, faríamos:
  // deals.forEach(async (deal) => {
  //   const machines = await apiRequest('GET', `/api/client-machines/${deal.id}`);
  //   machines.forEach((machine) => {
  //     if (machine.brand) {
  //       brandData[machine.brand] = (brandData[machine.brand] || 0) + 1;
  //     }
  //   });
  // });
  
  return Object.entries(brandData)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .filter(item => item.count > 0) // Filtra apenas itens com contagem positiva
    .slice(0, 10);
}