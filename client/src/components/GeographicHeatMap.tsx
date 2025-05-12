import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MapPin, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/formatters';
import type { Deal } from '@shared/schema';

// Lista de estados brasileiros com suas siglas e regiões
const estados = [
  { nome: 'Acre', sigla: 'AC', regiao: 'Norte' },
  { nome: 'Alagoas', sigla: 'AL', regiao: 'Nordeste' },
  { nome: 'Amapá', sigla: 'AP', regiao: 'Norte' },
  { nome: 'Amazonas', sigla: 'AM', regiao: 'Norte' },
  { nome: 'Bahia', sigla: 'BA', regiao: 'Nordeste' },
  { nome: 'Ceará', sigla: 'CE', regiao: 'Nordeste' },
  { nome: 'Distrito Federal', sigla: 'DF', regiao: 'Centro-Oeste' },
  { nome: 'Espírito Santo', sigla: 'ES', regiao: 'Sudeste' },
  { nome: 'Goiás', sigla: 'GO', regiao: 'Centro-Oeste' },
  { nome: 'Maranhão', sigla: 'MA', regiao: 'Nordeste' },
  { nome: 'Mato Grosso', sigla: 'MT', regiao: 'Centro-Oeste' },
  { nome: 'Mato Grosso do Sul', sigla: 'MS', regiao: 'Centro-Oeste' },
  { nome: 'Minas Gerais', sigla: 'MG', regiao: 'Sudeste' },
  { nome: 'Pará', sigla: 'PA', regiao: 'Norte' },
  { nome: 'Paraíba', sigla: 'PB', regiao: 'Nordeste' },
  { nome: 'Paraná', sigla: 'PR', regiao: 'Sul' },
  { nome: 'Pernambuco', sigla: 'PE', regiao: 'Nordeste' },
  { nome: 'Piauí', sigla: 'PI', regiao: 'Nordeste' },
  { nome: 'Rio de Janeiro', sigla: 'RJ', regiao: 'Sudeste' },
  { nome: 'Rio Grande do Norte', sigla: 'RN', regiao: 'Nordeste' },
  { nome: 'Rio Grande do Sul', sigla: 'RS', regiao: 'Sul' },
  { nome: 'Rondônia', sigla: 'RO', regiao: 'Norte' },
  { nome: 'Roraima', sigla: 'RR', regiao: 'Norte' },
  { nome: 'Santa Catarina', sigla: 'SC', regiao: 'Sul' },
  { nome: 'São Paulo', sigla: 'SP', regiao: 'Sudeste' },
  { nome: 'Sergipe', sigla: 'SE', regiao: 'Nordeste' },
  { nome: 'Tocantins', sigla: 'TO', regiao: 'Norte' }
];

// Lista de regiões brasileiras
const regioes = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

type FilterType = 'state' | 'city' | 'region';

export default function GeographicHeatMap() {
  const [filterType, setFilterType] = useState<FilterType>('state');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Buscar todos os negócios para análise geográfica
  const { data: allDeals = [], isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deals');
      return (response as unknown) as Deal[];
    },
  });

  // Buscar negócios com status "won"
  const { data: wonDeals = [], isLoading: isLoadingWonDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status/won'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deals/sale-status/won');
      return (response as unknown) as Deal[];
    },
  });
  
  // Buscar negócios com status "lost"
  const { data: lostDeals = [], isLoading: isLoadingLostDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals/sale-status/lost'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deals/sale-status/lost');
      return (response as unknown) as Deal[];
    },
  });

  // Filtra os negócios com base no tipo de filtro e termo de busca
  const filteredDeals = useMemo(() => {
    if (!searchTerm.trim() || !Array.isArray(allDeals)) return allDeals;
    
    return allDeals.filter((deal: Deal) => {
      if (filterType === 'state') {
        return deal.state?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (filterType === 'city') {
        return deal.city?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (filterType === 'region') {
        // Encontrar a região baseada no estado
        const estado = estados.find(e => 
          e.sigla.toLowerCase() === deal.state?.toLowerCase() || 
          e.nome.toLowerCase() === deal.state?.toLowerCase()
        );
        return estado?.regiao.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [allDeals, filterType, searchTerm]);

  // Análise de negócios por localização
  const locationAnalysis = useMemo(() => {
    const results: Record<string, { 
      total: number, 
      won: number, 
      lost: number, 
      value: number,
      winRate: number
    }> = {};
    
    // Inicializa com os estados ou regiões
    if (filterType === 'region') {
      regioes.forEach(regiao => {
        results[regiao] = { total: 0, won: 0, lost: 0, value: 0, winRate: 0 };
      });
    } else if (filterType === 'state') {
      estados.forEach(estado => {
        results[estado.sigla] = { total: 0, won: 0, lost: 0, value: 0, winRate: 0 };
      });
    }
    
    // Conta os negócios por localização
    if (Array.isArray(allDeals)) {
    allDeals.forEach((deal: Deal) => {
      let key: string | undefined;
      
      if (filterType === 'state') {
        key = deal.state || 'Desconhecido';
      } else if (filterType === 'city') {
        key = deal.city || 'Desconhecido';
      } else if (filterType === 'region') {
        // Encontrar a região baseada no estado
        const estado = estados.find(e => 
          e.sigla.toLowerCase() === deal.state?.toLowerCase() || 
          e.nome.toLowerCase() === deal.state?.toLowerCase()
        );
        key = estado?.regiao || 'Desconhecido';
      }
      
      if (!key) return;
      
      if (!results[key]) {
        results[key] = { total: 0, won: 0, lost: 0, value: 0, winRate: 0 };
      }
      
      results[key].total += 1;
      
      if (deal.saleStatus === 'won') {
        results[key].won += 1;
        results[key].value += deal.value || 0;
      } else if (deal.saleStatus === 'lost') {
        results[key].lost += 1;
      }
    });
    }
    
    // Calcula taxa de vitória
    Object.keys(results).forEach(key => {
      const totalCompleted = results[key].won + results[key].lost;
      results[key].winRate = totalCompleted > 0 
        ? Math.round((results[key].won / totalCompleted) * 100) 
        : 0;
    });
    
    return results;
  }, [allDeals, filterType]);

  // Ordenar localizações por número total de negócios
  const sortedLocations = useMemo(() => {
    if (!locationAnalysis) return [];
    return Object.entries(locationAnalysis)
      .filter(([_, data]) => data.total > 0) // Mostra apenas locais com dados
      .sort((a, b) => b[1].total - a[1].total);
  }, [locationAnalysis]);

  // Gera classes CSS para o mapa de calor com base no número de negócios
  const getHeatMapClass = (total: number) => {
    if (!locationAnalysis) return 'heat-level-0';
    
    const values = Object.values(locationAnalysis).map(data => data.total);
    if (values.length === 0) return 'heat-level-0';
    
    const max = Math.max(...values);
    const intensity = max === 0 ? 0 : Math.min(Math.ceil((total / max) * 10), 10);
    return `heat-level-${intensity}`;
  };

  // Gera a cor baseada na taxa de vitória
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-500';
    if (winRate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Análise Geográfica de Negócios
          </CardTitle>
          <CardDescription>
            Visualize o desempenho de vendas por localização para identificar áreas de alta performance e oportunidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Label htmlFor="filter-type">Filtrar por</Label>
              <Select 
                value={filterType} 
                onValueChange={(value) => setFilterType(value as FilterType)}
              >
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Tipo de filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">Estado</SelectItem>
                  <SelectItem value="city">Cidade</SelectItem>
                  <SelectItem value="region">Região</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-2/3">
              <Label htmlFor="search">Buscar</Label>
              <Input 
                id="search" 
                placeholder={`Buscar por ${filterType === 'state' ? 'estado' : filterType === 'city' ? 'cidade' : 'região'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoadingDeals || isLoadingWonDeals || isLoadingLostDeals ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-muted/30">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Total de Negócios</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{allDeals.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                      Vendas Concluídas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{wonDeals.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                      Vendas Perdidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{lostDeals.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                      Valor Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {formatCurrency(wonDeals.reduce((total: number, deal: Deal) => total + (deal.value || 0), 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-md">
                <div className="grid grid-cols-5 bg-muted/50 p-3 rounded-t-md">
                  <div className="col-span-2 font-medium">Localização</div>
                  <div className="font-medium text-center">Negócios</div>
                  <div className="font-medium text-center">Taxa de Sucesso</div>
                  <div className="font-medium text-right">Valor Total</div>
                </div>
                
                <div className="divide-y">
                  {sortedLocations.map(([location, data]) => (
                    <div key={location} className={`grid grid-cols-5 p-3 ${getHeatMapClass(data.total)}`}>
                      <div className="col-span-2 font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {location}
                      </div>
                      <div className="text-center">
                        {data.total} <span className="text-xs text-muted-foreground">({data.won}/{data.lost})</span>
                      </div>
                      <div className={`text-center ${getWinRateColor(data.winRate)}`}>
                        {data.winRate}%
                      </div>
                      <div className="text-right">
                        {formatCurrency(data.value)}
                      </div>
                    </div>
                  ))}
                  
                  {sortedLocations.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="mb-4 flex justify-center">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-lg font-medium text-muted-foreground">Sem dados geográficos</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Adicione cidade e estado aos seus negócios através do editor para visualizar dados no mapa de calor.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {filterType === 'state' && searchTerm === '' && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Análise por Região</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regioes.map(regiao => {
                      const data = locationAnalysis[regiao] || { total: 0, won: 0, lost: 0, value: 0, winRate: 0 };
                      if (data.total === 0) return null;
                      
                      return (
                        <Card key={regiao} className="border-l-4" style={{ borderLeftColor: getWinRateColor(data.winRate).replace('text-', 'border-').replace('-500', '-400') }}>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">{regiao}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground">Negócios</span>
                                <p className="font-medium">{data.total}</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Taxa de Sucesso</span>
                                <p className={`font-medium ${getWinRateColor(data.winRate)}`}>{data.winRate}%</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Ganhos/Perdidos</span>
                                <p className="font-medium">{data.won}/{data.lost}</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Valor Total</span>
                                <p className="font-medium">{formatCurrency(data.value)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <style>{`
        .heat-level-1 { background-color: rgba(59, 130, 246, 0.05); }
        .heat-level-2 { background-color: rgba(59, 130, 246, 0.1); }
        .heat-level-3 { background-color: rgba(59, 130, 246, 0.15); }
        .heat-level-4 { background-color: rgba(59, 130, 246, 0.2); }
        .heat-level-5 { background-color: rgba(59, 130, 246, 0.25); }
        .heat-level-6 { background-color: rgba(59, 130, 246, 0.3); }
        .heat-level-7 { background-color: rgba(59, 130, 246, 0.35); }
        .heat-level-8 { background-color: rgba(59, 130, 246, 0.4); }
        .heat-level-9 { background-color: rgba(59, 130, 246, 0.45); }
        .heat-level-10 { background-color: rgba(59, 130, 246, 0.5); }
      `}</style>
    </div>
  );
}