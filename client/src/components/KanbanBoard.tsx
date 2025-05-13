import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  CalendarIcon, 
  MoreVerticalIcon, 
  Phone,
  User2Icon,
  Building,
  MessagesSquareIcon,
  PlusIcon,
  Edit2Icon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTimeAgo } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

import EditStageModal from "./EditStageModal";
import AddStageModal from "./AddStageModal";
import EditDealModal from "./EditDealModal";
import DealOutcomeModal from "./DealOutcomeModal";
import AddDealModal from "./AddDealModal";

interface BaseDeal {
  id: number;
  name: string;
  leadId: number;
  stageId: number;
  pipelineId: number;
  value: number | null;
  status: string | null;
  saleStatus: string | null;
  lostReason: string | null;
  performanceReason: string | null;
  chatwootContactId: string | null;
  chatwootConversationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Deal extends BaseDeal {
  leadData?: {
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface PipelineStage {
  id: number;
  name: string;
  pipelineId: number;
  order: number;
  createdAt: Date;
  isDefault: boolean | null;
  isHidden: boolean | null;
  isSystem: boolean | null;
  stageType: string | null;
}

interface FilterOptions {
  search: string;
  status: string[];
  sortBy: string;
  sortOrder: string;
  hideClosed: boolean;
  stageId?: number | null;
}

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
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<PipelineStage | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [targetStageInfo, setTargetStageInfo] = useState<{ id: number, type: string | null }>({ id: 0, type: null });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchDeals = async () => {
      if (!activePipelineId) return;
      
      try {
        let url = `/api/deals?pipelineId=${activePipelineId}`;
        if (filters) {
          if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
          if (filters.stageId) url += `&stageId=${filters.stageId}`;
          if (filters.status && filters.status.length > 0) {
            filters.status.forEach(status => {
              url += `&status=${encodeURIComponent(status)}`;
            });
          }
          
          if (filters.sortOrder && filters.sortBy) {
            url += `&sortBy=${filters.sortBy}&sortOrder=${filters.sortOrder}`;
          }
          
          if (filters.hideClosed) {
            url += `&hideClosed=true`;
          }
        }
        
        const deals: Deal[] = await apiRequest(url, 'GET');
        
        console.log("Fetched deals:", deals.length);
        
        // Preparar todos os negócios para processamento
        const processedDeals: { [id: number]: boolean } = {};

        const stagesWithDeals = pipelineStages
          .filter(stage => !stage.isHidden) // Só mostrar os estágios visíveis
          .map((stage) => {
            // Filtrar negócios para este estágio, com tratamento especial para estágios de vendas realizadas/perdidas
            let stageDeals: Deal[] = [];
            
            if (stage.stageType === "completed") {
              // Para estágio "Vendas Realizadas", mostrar TODOS os negócios com status "won",
              // mesmo que estejam em outro estágio (será corrigido automaticamente)
              stageDeals = deals.filter(deal => 
                (deal.stageId === stage.id || deal.saleStatus === "won") &&
                deal.pipelineId === stage.pipelineId
              );
            } else if (stage.stageType === "lost") {
              // Para estágio "Vendas Perdidas", mostrar TODOS os negócios com status "lost",
              // mesmo que estejam em outro estágio (será corrigido automaticamente)
              stageDeals = deals.filter(deal => 
                (deal.stageId === stage.id || deal.saleStatus === "lost") &&
                deal.pipelineId === stage.pipelineId
              );
            } else {
              // Para estágios normais, só mostrar negócios deste estágio que NÃO estão completos/perdidos
              stageDeals = deals.filter(deal => 
                deal.stageId === stage.id && 
                deal.saleStatus !== "won" && 
                deal.saleStatus !== "lost"
              );
            }
            
            // Marcar todos os negócios deste estágio como processados
            stageDeals.forEach(deal => {
              processedDeals[deal.id] = true;
            });
            
            const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            
            // Calcule o valor total do estágio
            return {
              ...stage,
              deals: stageDeals,
              totalValue
            };
          })
          .sort((a, b) => {
            // Ordenação especial para colocar estágios completados e perdidos por último
            if (a.stageType === "completed" && b.stageType !== "completed") return 1;
            if (a.stageType !== "completed" && b.stageType === "completed") return -1;
            if (a.stageType === "lost" && b.stageType !== "lost") return 1;
            if (a.stageType !== "lost" && b.stageType === "lost") return -1;
            return a.order - b.order;
          });
        
        console.log("Stages with deals:", stagesWithDeals.map(s => `${s.name} (${s.deals.length})`));
        setBoardData(stagesWithDeals);
      } catch (error) {
        console.error("Error fetching deals:", error);
        toast({
          title: "Erro ao carregar negócios",
          description: "Não foi possível carregar os negócios.",
          variant: "destructive",
        });
      }
    };
    
    fetchDeals();
  }, [pipelineStages, activePipelineId, filters, toast]);
  
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não tiver destino ou se o destino for o mesmo que a origem, não fazer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const sourceStage = boardData.find(stage => stage.id.toString() === source.droppableId);
    const destStage = boardData.find(stage => stage.id.toString() === destination.droppableId);
    
    if (!sourceStage || !destStage) {
      return;
    }
    
    const dealId = parseInt(draggableId);
    const deal = sourceStage.deals.find(d => d.id === dealId);
    
    if (!deal) {
      return;
    }
    
    // Verificar se é uma mudança para um estágio especial (completado/perdido)
    if (destStage.stageType === "completed" || destStage.stageType === "lost") {
      setSelectedDeal(deal);
      setTargetStageInfo({ id: destStage.id, type: destStage.stageType });
      setIsOutcomeModalOpen(true);
      return; // Não continuar com a movimentação aqui, será feita após o modal
    }
    
    // Reordenar localmente para feedback visual imediato
    const updatedBoardData = [...boardData];
    
    // Remover o negócio do estágio de origem
    const sourceBoardIndex = updatedBoardData.findIndex(stage => stage.id === sourceStage.id);
    const [movedDeal] = updatedBoardData[sourceBoardIndex].deals.splice(source.index, 1);
    
    // Adicionar o negócio ao estágio de destino
    const destBoardIndex = updatedBoardData.findIndex(stage => stage.id === destStage.id);
    updatedBoardData[destBoardIndex].deals.splice(destination.index, 0, movedDeal);
    
    // Atualizar o estado local imediatamente para feedback visual
    setBoardData(updatedBoardData);
    
    // Fazer a atualização no servidor
    try {
      await apiRequest(`/api/deals/${dealId}`, 'PUT', {
        stageId: destStage.id,
        pipelineId: destStage.pipelineId
      });
      
      queryClient.invalidateQueries(['/api/deals']);
      toast({
        title: "Negócio movido",
        description: `"${deal.name}" foi movido para ${destStage.name}`,
      });
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast({
        title: "Erro ao mover negócio",
        description: "Não foi possível atualizar o estágio do negócio.",
        variant: "destructive",
      });
      // Reverter a alteração local em caso de erro
      fetchUpdatedData();
    }
  };
  
  const fetchUpdatedData = async () => {
    queryClient.invalidateQueries(['/api/deals']);
  };
  
  // Helper para gerar badges de status
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    return (
      <span className={`status-badge ${status.toLowerCase()} px-2 py-0.5 text-xs font-medium rounded-full border`}>
        {status === 'in_progress' && 'Em andamento'}
        {status === 'waiting' && 'Aguardando'}
        {status === 'completed' && 'Concluído'}
        {status === 'canceled' && 'Cancelado'}
      </span>
    );
  };
  
  // Em caso de não ter estágios ou dados
  if (boardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessagesSquareIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum estágio encontrado</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
          {activePipelineId 
            ? "Adicione estágios ao funil para começar a gerenciar seus negócios."
            : "Selecione um funil para visualizar os estágios."}
        </p>
        {activePipelineId && (
          <Button onClick={() => setIsAddStageModalOpen(true)}>
            Adicionar Estágio
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full">
        {/* Botão oculto para ser clicado pelo Header para adicionar estágio */}
        <button
          id="add-stage-button"
          className="hidden"
          onClick={() => setIsAddStageModalOpen(true)}
          aria-hidden="true"
        />
        
        {/* Modais */}
        {selectedDeal && (
          <EditDealModal
            isOpen={isEditDealModalOpen}
            onClose={() => {
              setIsEditDealModalOpen(false);
              setSelectedDeal(null);
            }}
            deal={selectedDeal}
            pipelineStages={pipelineStages}
            onSaved={() => {
              fetchUpdatedData();
            }}
          />
        )}
        
        <EditStageModal 
          isOpen={isEditStageModalOpen}
          onClose={() => setIsEditStageModalOpen(false)}
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
        
        {/* Espaço oculto para o botão de adicionar estágio */}
        <div className="hidden">
          <button
            id="add-stage-button"
            onClick={() => setIsAddStageModalOpen(true)}
            aria-hidden="true"
          />
        </div>
        
        {/* Área principal de rolagem horizontal com os estágios */}
        <div className="flex overflow-x-auto px-2 board-container flex-1 mt-2">
          {boardData.map((stage) => (
            <div 
              key={stage.id} 
              className="kanban-column flex-shrink-0 w-72 mx-2 flex flex-col"
            >
              {/* Cabeçalho da coluna */}
              <div className={`p-3 rounded-t-lg border shadow-sm ${
                stage.stageType === "completed" 
                  ? "bg-gradient-to-b from-green-100 to-green-50 border-green-300 dark:from-green-900/40 dark:to-green-900/20 dark:border-green-700" 
                  : stage.stageType === "lost" 
                    ? "bg-gradient-to-b from-red-100 to-red-50 border-red-300 dark:from-red-900/40 dark:to-red-900/20 dark:border-red-700"
                    : "bg-gradient-to-b from-gray-100 to-gray-50 border-gray-300 dark:from-gray-900/40 dark:to-gray-900/20 dark:border-gray-700"
              }`}>
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
              
              {/* Área de cards/droppable */}
              <Droppable droppableId={stage.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    className={`deal-list p-2 rounded-b-lg border border-t-0 ${
                      snapshot.isDraggingOver
                        ? "droppable-hover bg-yellow-50 dark:bg-yellow-900/20"
                        : stage.stageType === "completed" 
                          ? "bg-green-50 dark:bg-green-900/30 border-green-300" 
                          : stage.stageType === "lost" 
                            ? "bg-red-50 dark:bg-red-900/30 border-red-300"
                            : "bg-gray-50 dark:bg-gray-900/20 border-gray-300"
                    } flex-1 max-h-[calc(100vh-180px)] overflow-y-auto`}
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