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
import { format } from "date-fns";
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
  Phone,
  User2,
  Calendar as CalendarIcon,
  User as User2Icon
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
  activePipelineId: number | null;
  onAddDeal: () => void; // Função para abrir o modal de adicionar negócio
}

interface StageWithDeals extends PipelineStage {
  deals: Deal[];
  totalValue: number;
}

export default function KanbanBoard({ pipelineStages, filters, activePipelineId, onAddDeal }: KanbanBoardProps) {
  const [boardData, setBoardData] = useState<StageWithDeals[]>([]);
  const { toast } = useToast();
  
  // Estado para o modal de edição de negócio
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  
  // Estado para o modal de edição de estágio
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  
  // Estado para o modal de adição de estágio
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  
  // Estado para o modal de adição de negócio
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<PipelineStage | null>(null);
  
  // Estado para o modal de resultado de negócio
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [targetStageInfo, setTargetStageInfo] = useState<{ id: number, type: 'completed' | 'lost' | null }>({ id: 0, type: null });
  
  // Obter todos os negócios
  const { data: deals, isLoading, isError } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Mutation para atualizar um negócio
  const updateDealMutation = useMutation({
    mutationFn: async (data: { dealId: number, stageId?: number, order?: number }) => {
      return apiRequest(`/api/deals/${data.dealId}`, 'PUT', data);
    }
  });
  
  // Função para organizar os dados do quadro com base nos estágios e negócios disponíveis
  const organizeBoardData = () => {
    if (pipelineStages && deals) {
      console.log("KanbanBoard recebeu estágios:", pipelineStages.length, pipelineStages.map(s => s.name));
      
      let filteredDeals = [...deals];
      const activeFilters = filters || { search: "", status: [], sortBy: "date", sortOrder: "desc", hideClosed: true };
      
      console.log("Filtros aplicados:", activeFilters);
      console.log("Pipeline ativo:", activePipelineId);
      
      // Filtrar por pipeline ativo
      if (activePipelineId) {
        filteredDeals = filteredDeals.filter(deal => deal.pipelineId === activePipelineId);
      }
      
      // Filtrar por busca
      if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        filteredDeals = filteredDeals.filter(deal => 
          deal.name.toLowerCase().includes(searchTerm) || 
          deal.leadData?.name?.toLowerCase().includes(searchTerm) ||
          deal.leadData?.companyName?.toLowerCase().includes(searchTerm) ||
          deal.leadData?.phone?.toLowerCase().includes(searchTerm) ||
          deal.leadData?.email?.toLowerCase().includes(searchTerm)
        );
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
          // Para todos os pipelines, mostrar todos os negócios nos seus respectivos estágios
          // Removido o tratamento especial para negócios concluídos (ganhos/perdidos)
          stageDeals = filteredDeals.filter(deal => 
            deal.stageId === stage.id
          );
        }
        // Para o estágio de vendas realizadas, mostrar deals marcados como ganhos
        else if (stage.stageType === "completed") {
          stageDeals = filteredDeals.filter(deal => 
            deal.saleStatus === "won"
          );
        }
        // Para o estágio de vendas perdidas, mostrar deals marcados como perdidos
        else if (stage.stageType === "lost") {
          stageDeals = filteredDeals.filter(deal => 
            deal.saleStatus === "lost"
          );
        }
        
        // Calcular o valor total dos negócios no estágio
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
  }, [pipelineStages, deals, filters]);
  
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
      
      // Se estivermos movendo para um estágio diferente
      if (sourceStageId !== targetStageId) {
        updateData.stageId = targetStageId;
      }
      
      // Calcular nova ordem
      updateData.order = destination.index;
      
      // Atualizar estado localmente para feedback visual imediato
      const newBoardData = [...boardData];
      
      // Remover o deal da origem
      const sourceStageIndex = newBoardData.findIndex(s => s.id === sourceStageId);
      if (sourceStageIndex >= 0) {
        newBoardData[sourceStageIndex] = {
          ...newBoardData[sourceStageIndex],
          deals: newBoardData[sourceStageIndex].deals.filter(d => d.id !== dealId)
        };
      }
      
      // Adicionar o deal ao destino na posição correta
      const targetStageIndex = newBoardData.findIndex(s => s.id === targetStageId);
      if (targetStageIndex >= 0 && movedDeal) {
        const updatedDeal = { ...movedDeal, stageId: targetStageId };
        const targetDeals = [...newBoardData[targetStageIndex].deals];
        targetDeals.splice(destination.index, 0, updatedDeal);
        
        newBoardData[targetStageIndex] = {
          ...newBoardData[targetStageIndex],
          deals: targetDeals
        };
      }
      
      // Atualizar os valores totais dos estágios
      newBoardData.forEach(stage => {
        stage.totalValue = stage.deals.reduce((sum, d) => sum + (d.value || 0), 0);
        return stage;
      });
      
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
      organizeBoardData(); // Recarregue os dados para voltar ao estado anterior em caso de erro
      toast({
        title: "Erro ao mover negócio",
        description: "Não foi possível atualizar a posição. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Helper function para obter o status badge com a classe CSS correta
  const getStatusBadge = (status: string | null) => {
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
      <div className="flex flex-col h-full">
        {/* Modals */}
        <EditDealModal 
          isOpen={isEditDealModalOpen}
          onClose={() => {
            setIsEditDealModalOpen(false);
            setSelectedDeal(null);
          }}
          deal={selectedDeal}
          pipelineStages={pipelineStages}
        />
        
        <EditStageModal 
          isOpen={isEditStageModalOpen}
          onClose={() => {
            setIsEditStageModalOpen(false);
            setSelectedStage(null);
          }}
          stage={selectedStage}
        />
        
        <AddStageModal 
          isOpen={isAddStageModalOpen}
          onClose={() => setIsAddStageModalOpen(false)}
          pipelineStages={pipelineStages}
        />
        
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
        
        {/* Header com botões */}
        <div className="flex justify-between items-center px-4 py-2 mb-2 flex-none">
          <div className="flex-grow">
            <Button
              variant="default"
              size="sm"
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 shadow-sm border-none flex items-center gap-1"
              onClick={() => {
                if (onAddDeal) {
                  onAddDeal();
                } else {
                  if (pipelineStages.length === 0) {
                    toast({
                      title: "Não é possível adicionar um negócio",
                      description: "Crie pelo menos um estágio primeiro.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const defaultStage = pipelineStages.find(s => s.stageType === "normal" || s.stageType === null);
                  setSelectedStageForNewDeal(defaultStage || pipelineStages[0]);
                  setIsAddDealModalOpen(true);
                }
              }}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="font-medium">Novo Negócio</span>
            </Button>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-yellow-400 hover:text-blue-950"
            onClick={() => setIsAddStageModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Estágio</span>
          </Button>
        </div>
        
        {/* Kanban Board */}
        <div className="flex overflow-x-auto px-2 board-container flex-1">
          {boardData.map((stage) => (
            <div 
              key={stage.id} 
              className={`kanban-column flex-shrink-0 w-72 mx-2 flex flex-col ${
                stage.stageType === "completed" ? "stage-completed" : 
                stage.stageType === "lost" ? "stage-lost" : ""
              }`}
            >
              <div className={`flex flex-col rounded-t-lg border shadow-sm hover:shadow-md transition-shadow h-full ${
                stage.stageType === "completed" 
                  ? "bg-gradient-to-b from-green-100 to-green-50 border-green-300 dark:from-green-900/40 dark:to-green-900/20 dark:border-green-700" 
                  : stage.stageType === "lost" 
                    ? "bg-gradient-to-b from-red-100 to-red-50 border-red-300 dark:from-red-900/40 dark:to-red-900/20 dark:border-red-700"
                    : "bg-gradient-to-b from-gray-100 to-gray-50 border-gray-300 dark:from-gray-900/40 dark:to-gray-900/20 dark:border-gray-700"
              }`}>
                {/* Stage header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 backdrop-blur-sm z-10">
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
                      className="w-full mt-2 text-xs flex items-center justify-center gap-1 text-gray-500 hover:bg-yellow-400 hover:text-blue-950 dark:text-gray-400 dark:hover:bg-yellow-400 dark:hover:text-blue-950"
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
                
                {/* Deals list */}
                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      className={`deal-list p-2 rounded-b-lg ${
                        snapshot.isDraggingOver
                          ? "droppable-hover bg-yellow-50 dark:bg-yellow-900/20"
                          : stage.stageType === "completed" ? "bg-green-50 dark:bg-green-900/30" 
                          : stage.stageType === "lost" ? "bg-red-50 dark:bg-red-900/30"
                          : "bg-gray-50 dark:bg-gray-900/20"
                      }`}
                      ref={provided.innerRef}
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
                              style={{
                                ...provided.draggableProps.style,
                                // Efeitos visuais durante o arraste
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? '0 8px 15px rgba(0, 0, 0, 0.15)' : '',
                                transform: snapshot.isDragging && provided.draggableProps.style?.transform 
                                  ? `${provided.draggableProps.style.transform} rotate(1deg)` 
                                  : provided.draggableProps.style?.transform,
                                zIndex: snapshot.isDragging ? 9999 : undefined,
                              }}
                              className={`mb-2 p-3 group border-l-4 ${
                                snapshot.isDragging
                                  ? "shadow-lg dark:bg-gray-700 ring-2 ring-yellow-400 ring-opacity-50 deal-card-dragging"
                                  : "shadow-sm hover:shadow-md bg-gray-50 dark:bg-gray-800"
                              } ${
                                deal.status === "completed" 
                                  ? "border-l-green-500" 
                                  : deal.status === "canceled" 
                                    ? "border-l-red-500"
                                    : "border-l-yellow-500"
                              } cursor-pointer rounded-md`}
                              onClick={() => {
                                setSelectedDeal(deal);
                                setIsEditDealModalOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate max-w-[180px]">
                                    {deal.name}
                                  </div>
                                </div>
                                <div>
                                  {getStatusBadge(deal.status)}
                                </div>
                              </div>
                              
                              <div className="space-y-1 mt-2">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <User2Icon className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">
                                    {deal.leadData?.name || "Contato não definido"}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Building className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">
                                    {deal.leadData?.companyName || "Empresa não definida"}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Phone className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">
                                    {deal.leadData?.phone || "Telefone não definido"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                                  {formatTimeAgo(deal.updatedAt)}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-800 dark:text-yellow-300">
                                  {formatCurrency(deal.value || 0)}
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
            </div>
          ))}
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
      </div>
    </DragDropContext>
  );
}