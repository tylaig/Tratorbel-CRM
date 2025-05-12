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
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapIcon className="mr-2 h-6 w-6 text-primary" />
            Mapa de Calor
          </h1>
          <p className="text-gray-500 mt-1">
            Análise geográfica de oportunidades e vendas por região
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
                    <div className="h-[400px] bg-gray-100 rounded-md p-4 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MapIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Visualização do mapa do Brasil</p>
                        <p className="text-sm">(Implementação visual futura)</p>
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
                            <td colSpan={4} className="py-6 text-center text-gray-500">
                              Nenhum dado disponível para exibição
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
                      <div className="h-[300px] bg-gray-100 rounded-md p-4 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>Distribuição por tipo de equipamento</p>
                          <p className="text-sm">(Implementação visual futura)</p>
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
      </Tabs>
    </div>
  );
}

// Funções auxiliares para processar os dados
function processStateData(deals: Deal[]) {
  // Usando um objeto simples para evitar conflitos com o Map do JavaScript
  const stateData: Record<string, { count: number; value: number }> = {};
  
  deals.forEach(deal => {
    if (deal.state) {
      const state = deal.state.toUpperCase();
      if (!stateData[state]) {
        stateData[state] = { count: 0, value: 0 };
      }
      stateData[state].count += 1;
      stateData[state].value += (deal.value || 0);
    }
  });
  
  return Object.entries(stateData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function processCityData(deals: Deal[]) {
  // Usando um objeto simples para evitar conflitos com o Map do JavaScript
  const cityData: Record<string, { count: number; value: number; state: string }> = {};
  
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

function processMachineData(deals: Deal[]) {
  // Usando um objeto simples para evitar conflitos com o Map do JavaScript
  const brandData: Record<string, number> = {};
  
  deals.forEach(deal => {
    // Este é um exemplo. Você precisaria ajustar para a sua estrutura de dados real.
    // Assumindo que há informações de máquinas associadas aos negócios
    if (deal.machineCount && deal.machineCount > 0) {
      // Aqui seria necessário ter acesso às máquinas do cliente
      // Como exemplo, estamos apenas contando pelo campo machineCount
      const brand = "Marca Exemplo"; // Isso seria obtido dos dados reais
      
      if (!brandData[brand]) {
        brandData[brand] = 0;
      }
      
      brandData[brand] += deal.machineCount;
    }
  });
  
  return Object.entries(brandData)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}