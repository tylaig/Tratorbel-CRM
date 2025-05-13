import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Deal as BaseDeal, PipelineStage } from "@shared/schema";

interface Deal extends BaseDeal {
  leadData?: {
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}
import { formatCurrency, formatTimeAgo } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2Icon, 
  MoreVerticalIcon, 
  Building, 
  PlusIcon,
  UserCircle,
  InfoIcon,
  Plus,
  Phone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditDealModal from "@/components/EditDealModal";
import AddDealModal from "@/components/AddDealModal";
import EditStageModal from "@/components/EditStageModal";
import AddStageModal from "@/components/AddStageModal";
import DealOutcomeModal from "@/components/DealOutcomeModal";
import { FilterOptions } from "@/components/FilterBar";

interface KanbanBoardProps {
  pipelineStages: PipelineStage[];
  filters?: FilterOptions;
  activePipelineId?: number | null;
}

interface StageWithDeals extends PipelineStage {
  deals: Deal[];
  totalValue: number;
}

export default function KanbanBoard({ pipelineStages, filters, activePipelineId }: KanbanBoardProps) {
  // Logamos os estágios recebidos do componente pai
  console.log("KanbanBoard recebeu estágios:", pipelineStages?.length, pipelineStages?.map(s => s.name));
  
  // Use os filtros do componente pai ou crie um padrão
  const activeFilters = filters || {
    search: "",
    status: [] as string[],
    sortBy: "date",
    sortOrder: "desc",
    hideClosed: true,
    winReason: null as string | null,
    lostReason: null as string | null
  };
  const [boardData, setBoardData] = useState<StageWithDeals[]>([]);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<PipelineStage | null>(null);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [targetStageInfo, setTargetStageInfo] = useState<{id: number, type: 'completed' | 'lost' | null}>({ id: 0, type: null });
  const { toast } = useToast();
  
  // Get deals com configurações para garantir atualização imediata e tempo real
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    refetchOnMount: true,         // Recarregar ao montar
    refetchOnWindowFocus: true,   // Recarregar quando a janela ganhar foco
    staleTime: 0,                 // Considerar dados obsoletos imediatamente (sempre buscar dados frescos)
    refetchInterval: 2000,        // Recarregar a cada 2 segundos para garantir dados atualizados
  });
  
  // Update deal stage or order when dragged
  const updateDealMutation = useMutation({
    mutationFn: async (data: { 
      dealId: number; 
      stageId?: number; 
      order?: number
    }) => {
      return await apiRequest(`/api/deals/${data.dealId}`, 'PUT', data);
    }
  });
  
  // Função para organizar dados do quadro
  const organizeBoardData = () => {
    if (pipelineStages.length > 0 && deals) {
      console.log("Filtros aplicados:", activeFilters);
      console.log("Pipeline ativo:", activePipelineId);
      
      // Filtrar todos os deals com base nos filtros
      let filteredDeals = [...deals];
      
      // Filtrar por termo de busca
      if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        filteredDeals = filteredDeals.filter(deal => {
          // Buscar em vários campos
          return (
            deal.name?.toLowerCase().includes(searchTerm) ||
            deal.notes?.toLowerCase().includes(searchTerm)
          );
        });
      }
      
      // Filtrar por status
      if (activeFilters.status && activeFilters.status.length > 0) {
        filteredDeals = filteredDeals.filter(deal => 
          activeFilters.status.includes(deal.status || '')
        );
      }
      
      // Filtrar por motivo de ganho
      if (activeFilters.winReason) {
        filteredDeals = filteredDeals.filter(deal => 
          deal.saleStatus === 'won' && deal.salePerformance === activeFilters.winReason
        );
      }
      
      // Filtrar por motivo de perda
      if (activeFilters.lostReason) {
        filteredDeals = filteredDeals.filter(deal => 
          deal.saleStatus === 'lost' && deal.lostReason === activeFilters.lostReason
        );
      }
      
      // Ocultar negócios fechados se a opção estiver ativada
      if (activeFilters.hideClosed) {
        // Não aplicamos esse filtro aqui pois a lógica de distribuição por estágios já trata isso
      }
      
      console.log("Negócios filtrados:", filteredDeals.length);
      
      // Filtrar estágios que não estão ocultos (isHidden === false ou undefined)
      const visibleStages = pipelineStages.filter(stage => stage.isHidden !== true);
      console.log("Estágios visíveis:", visibleStages.length, visibleStages.map(s => s.name));
      
      // Separar os estágios especiais (completed e lost) dos normais
      const normalStages = visibleStages.filter(stage => stage.stageType !== "completed" && stage.stageType !== "lost");
      const completedStages = visibleStages.filter(stage => stage.stageType === "completed");
      const lostStages = visibleStages.filter(stage => stage.stageType === "lost");
      
      // Reordenar os estágios para que os especiais fiquem no final
      const orderedStages = [...normalStages, ...completedStages, ...lostStages];
      console.log("Estágios ordenados:", orderedStages.map(s => s.name + (s.stageType ? ` (${s.stageType})` : "")));
      
      const stagesWithDeals = orderedStages.map(stage => {
        let stageDeals: Deal[] = [];
        
        // Para estágios normais, mostrar os deals corretamente com base no pipeline
        if (stage.stageType === "normal") {
          if (activePipelineId === 1) {
            // No pipeline Comercial, ocultar negócios concluídos (ganhos/perdidos) nos estágios normais
            stageDeals = filteredDeals.filter(deal => 
              deal.stageId === stage.id && 
              deal.saleStatus !== 'won' && 
              deal.saleStatus !== 'lost'
            );
          } else {
            // Para outros pipelines (ex: Compras/Logística), mostrar todos os negócios, incluindo concluídos
            stageDeals = filteredDeals.filter(deal => 
              deal.stageId === stage.id
            );
          }
        }
        // Para o estágio de vendas realizadas, mostrar deals marcados como ganhos
        else if (stage.stageType === "completed") {
          stageDeals = filteredDeals.filter(deal => deal.saleStatus === 'won');
        } 
        // Para o estágio de vendas perdidas, mostrar deals marcados como perdidos
        else if (stage.stageType === "lost") {
          stageDeals = filteredDeals.filter(deal => deal.saleStatus === 'lost');
        }
        
        // Calcular o total baseado no valor do deal
        const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        return {
          ...stage,
          deals: stageDeals,
          totalValue
        };
      });
      
      setBoardData(stagesWithDeals);
    }
  };
  
  // Organize deals by stage quando os dados ou filtros mudam
  useEffect(() => {
    organizeBoardData();
  }, [pipelineStages, deals, activeFilters]);
  
  // Handle drag and drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não houver destino, não fazemos nada
    if (!destination) {
      return;
    }
    
    // Get the deal ID and source/target stage IDs
    const dealId = parseInt(draggableId);
    const sourceStageId = parseInt(source.droppableId);
    const targetStageId = parseInt(destination.droppableId);
    
    try {
      // Fazer uma cópia dos dados atuais
      if (!deals) return;
      
      // Encontrar o deal que está sendo movido
      const movedDeal = deals.find(d => d.id === dealId);
      if (!movedDeal) return;
      
      // Encontrar o estágio de destino para verificar se é um estágio especial
      const targetStage = pipelineStages.find(s => s.id === targetStageId);
      if (!targetStage) return;
      
      // Se for um estágio especial (concluído ou perdido), abrir o modal de confirmação
      if (targetStage.stageType === 'completed' || targetStage.stageType === 'lost') {
        // Configurar o estado para o modal
        setSelectedDeal(movedDeal);
        setTargetStageInfo({
          id: targetStageId,
          type: targetStage.stageType as 'completed' | 'lost'
        });
        setIsOutcomeModalOpen(true);
        
        // Não prosseguir com a operação de drag, o modal vai cuidar disso
        return;
      }
      
      // Dados atualizados que enviaremos para o servidor
      const updateData: { dealId: number; stageId?: number; order?: number } = { 
        dealId 
      };
      
      // Vamos criar uma cópia para manipular o novo estado do board
      let newBoardData = [...boardData];
      
      // Caso 1: Reordenação dentro da mesma coluna - mover para cima ou para baixo
      if (source.droppableId === destination.droppableId) {
        // Encontrar o estágio relevante
        const stageIndex = newBoardData.findIndex(s => s.id === sourceStageId);
        if (stageIndex === -1) return;
        
        // Criar uma cópia dos deals desse estágio
        const stageDeals = [...newBoardData[stageIndex].deals];
        
        // Remover o deal da posição atual
        const [removedDeal] = stageDeals.splice(source.index, 1);
        
        // Inserir o deal na nova posição
        stageDeals.splice(destination.index, 0, removedDeal);
        
        // Atualizar as posições dos deals
        const updatedStageDeals = stageDeals.map((deal, index) => ({
          ...deal,
          order: index
        }));
        
        // Atualizar o estado do estágio
        newBoardData[stageIndex] = {
          ...newBoardData[stageIndex],
          deals: updatedStageDeals,
          // Use apenas o valor do deal (que já inclui o valor da cotação quando apropriado)
          totalValue: updatedStageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
        };
        
        // Definir a nova ordem para o servidor
        updateData.order = destination.index;
      } 
      // Caso 2: Movendo entre colunas diferentes
      else {
        // Adicionar o dealId ao estágio de destino
        updateData.stageId = targetStageId;
        
        // Atualizar o deal local com o novo stageId
        const updatedDeals = deals.map(deal => 
          deal.id === dealId ? { ...deal, stageId: targetStageId } : deal
        );
        
        // Atualizar o queryCache local para feedback imediato
        queryClient.setQueryData(['/api/deals'], updatedDeals);
        
        // Atualizar o board visualmente
        newBoardData = newBoardData.map(stage => {
          // Adicionar o deal à nova coluna
          if (stage.id === targetStageId) {
            // Remover o deal da coluna antiga se já existir por algum motivo
            const filteredDeals = stage.deals.filter(d => d.id !== dealId);
            // Adicionar o deal na nova posição
            const newDeals = [...filteredDeals];
            newDeals.splice(destination.index, 0, {...movedDeal, stageId: targetStageId, order: destination.index});
            
            return {
              ...stage,
              deals: newDeals,
              totalValue: newDeals.reduce((sum, d) => sum + (d.value || 0), 0)
            };
          } 
          // Remover o deal da coluna original
          else if (stage.id === sourceStageId) {
            const newDeals = stage.deals.filter(d => d.id !== dealId);
            return {
              ...stage,
              deals: newDeals,
              totalValue: newDeals.reduce((sum, d) => sum + (d.value || 0), 0)
            };
          }
          return stage;
        });
      }
      
      // Aplicar a mudança visual imediatamente
      setBoardData(newBoardData);
      
      // Enviar a atualização ao servidor em paralelo
      updateDealMutation.mutate({
        dealId,
        ...(updateData.stageId !== undefined ? { stageId: updateData.stageId } : {}),
        ...(updateData.order !== undefined ? { order: updateData.order } : {})
      }, {
        onSuccess: async () => {
          // Criar uma entrada no histórico de atividades para essa movimentação
          const activityText = updateData.stageId 
            ? `Negócio movido para a etapa "${boardData.find(s => s.id === targetStageId)?.name || 'Nova etapa'}"`
            : `Negócio reordenado dentro da etapa "${boardData.find(s => s.id === sourceStageId)?.name || 'Atual'}"`;
            
          try {
            // Adicionar atividade de movimentação ao histórico
            await apiRequest('/api/lead-activities', 'POST', {
              dealId: dealId,
              description: activityText,
              activityType: 'move'
            });
            
            // Forçar atualização completa dos dados
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['/api/deals'] }),
              queryClient.invalidateQueries({ queryKey: ['/api/lead-activities'] })
            ]);
            
            // Recarregar explicitamente os dados para garantir atualização na UI
            await Promise.all([
              queryClient.refetchQueries({ queryKey: ['/api/deals'] })
            ]);
            
            toast({
              title: "Negócio movido",
              description: "Posição atualizada com sucesso.",
              variant: "default",
              duration: 1500,
            });
          } catch (error) {
            console.error("Erro ao registrar atividade de movimentação:", error);
            // Ainda assim, invalidar o cache de deals para garantir que os dados estejam atualizados
            queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
          }
        }
      });
    } catch (error) {
      console.error("Erro ao mover negócio:", error);
      
      // Restaurar a disposição original do quadro
      organizeBoardData();
      
      // Recarregar todos os dados do servidor de forma assíncrona
      queryClient.fetchQuery({ queryKey: ['/api/deals'] });
      
      toast({
        title: "Erro ao mover",
        description: "Não foi possível mover o negócio. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Get status badge based on deal status
  const getStatusBadge = (status: string | null | undefined) => {
    const statusMap: Record<string, string> = {
      'in_progress': 'Em andamento',
      'waiting': 'Aguardando',
      'completed': 'Concluído',
      'canceled': 'Cancelado'
    };
    
    // Usar a classe CSS status-badge que definimos em index.css
    return (
      <Badge 
        variant="secondary" 
        className={`status-badge ${status || 'in_progress'}`}
      >
        {statusMap[status || 'in_progress'] || 'Em andamento'}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-500">Carregando pipeline...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Modal de edição de negócio */}
      <EditDealModal 
        isOpen={isEditDealModalOpen}
        onClose={() => {
          setIsEditDealModalOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        pipelineStages={pipelineStages}
      />
      
      {/* Modal de edição de estágio */}
      <EditStageModal 
        isOpen={isEditStageModalOpen}
        onClose={() => {
          setIsEditStageModalOpen(false);
          setSelectedStage(null);
        }}
        stage={selectedStage}
      />
      
      {/* Modal de adição de estágio */}
      <AddStageModal 
        isOpen={isAddStageModalOpen}
        onClose={() => setIsAddStageModalOpen(false)}
        pipelineStages={pipelineStages}
      />
      
      {/* Modal de definição de resultado de negócio */}
      {selectedDeal && (
        <DealOutcomeModal
          isOpen={isOutcomeModalOpen}
          onClose={() => {
            setIsOutcomeModalOpen(false);
            setSelectedDeal(null);
            setTargetStageInfo({ id: 0, type: null });
          }}
          deal={selectedDeal}
          targetStageId={targetStageInfo.id}
          targetStageType={targetStageInfo.type}
        />
      )}
      
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-4 py-2 mb-1 sticky top-0 bg-white z-10">
          {activeFilters.hideClosed && activePipelineId === 1 && (
            <div className="text-sm text-amber-800 flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-md border border-amber-200">
              <InfoIcon size={16} />
              <span>Negócios concluídos estão ocultos no funil Comercial</span>
            </div>
          )}
          <div className="flex-grow"></div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAddStageModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Estágio</span>
          </Button>
        </div>
        <div className="flex overflow-x-auto px-2 board-container h-full">
          {boardData.map((stage) => {
            // Definir classes e estilos específicos com base no tipo de estágio
            let stageClass = "";
            if (stage.stageType === "completed") {
              stageClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
            } else if (stage.stageType === "lost") {
              stageClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
            }
            
            return (
              <div key={stage.id} className="kanban-column flex-shrink-0 w-72 mx-2 flex flex-col max-h-full">
                <div className={`flex flex-col bg-white dark:bg-gray-900 rounded-t-lg border shadow-sm hover:shadow-md transition-shadow ${stageClass}`}>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {stage.stageType === "completed" && (
                          <span className="h-3 w-3 bg-green-600 dark:bg-green-500 rounded-full"></span>
                        )}
                        {stage.stageType === "lost" && (
                          <span className="h-3 w-3 bg-red-600 dark:bg-red-500 rounded-full"></span>
                        )}
                        {!stage.stageType && (
                          <span className="h-3 w-3 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
                        )}
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{stage.name}</h3>
                        <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                          {stage.deals.length}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        {!stage.isSystem && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVerticalIcon className="h-4 w-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStage(stage);
                                  setIsEditStageModalOpen(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit2Icon className="h-4 w-4" />
                                <span>Editar Estágio</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{stage.deals.length} negócios</span>
                      <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{formatCurrency(stage.totalValue)}</span>
                    </div>
                    
                    {/* Botão de adicionar negócio na coluna */}
                    {!stage.isSystem && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 text-xs flex items-center justify-center gap-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        onClick={() => {
                          setSelectedStageForNewDeal(stage);
                          setIsAddDealModalOpen(true);
                        }}
                      >
                        <PlusIcon className="h-3 w-3" />
                        <span>Adicionar Negócio</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      className={`deal-list p-2 rounded-b-lg overflow-y-auto ${
                        snapshot.isDraggingOver
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                      ref={provided.innerRef}
                      style={{ height: "calc(100vh - 250px)" }}
                      {...provided.droppableProps}
                    >
                      {stage.deals.map((deal, index) => (
                        <Draggable
                          key={deal.id.toString()}
                          draggableId={deal.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 group ${
                                snapshot.isDragging
                                  ? "shadow-lg dark:bg-gray-700"
                                  : "shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
                              } cursor-pointer`}
                              onClick={() => {
                                setSelectedDeal(deal);
                                setIsEditDealModalOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{deal.name}</div>
                                </div>
                                <div>
                                  {getStatusBadge(deal.status)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="col-span-2">
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Building className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="truncate">
                                      {deal.leadData?.companyName || "Empresa não definida"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                                  <span className="truncate">
                                    {deal.leadData?.phone || "Telefone não definido"}
                                  </span>
                                </div>
                                
                                <div className="text-sm font-medium text-right text-gray-900 dark:text-white">
                                  {formatCurrency(deal.value || 0)}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Atualizado {formatTimeAgo(deal.updatedAt)}
                                </span>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Modal de adição de negócio */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => {
          setIsAddDealModalOpen(false);
          setSelectedStageForNewDeal(null);
        }}
        initialStageId={selectedStageForNewDeal?.id}
        pipelineStages={pipelineStages}
      />
    </DragDropContext>
  );
}