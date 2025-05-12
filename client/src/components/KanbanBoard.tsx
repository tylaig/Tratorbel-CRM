import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Deal, PipelineStage } from "@shared/schema";
import { formatCurrency, formatTimeAgo } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2Icon, 
  MoreVerticalIcon, 
  Building, 
  PlusIcon,
  PlusCircleIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditDealModal from "@/components/EditDealModal";
import EditStageModal from "@/components/EditStageModal";
import AddStageModal from "@/components/AddStageModal";

interface KanbanBoardProps {
  pipelineStages: PipelineStage[];
}

interface StageWithDeals extends PipelineStage {
  deals: Deal[];
  totalValue: number;
}

export default function KanbanBoard({ pipelineStages }: KanbanBoardProps) {
  const [boardData, setBoardData] = useState<StageWithDeals[]>([]);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const { toast } = useToast();
  
  // Get deals
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });
  
  // Update deal stage when dragged
  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: number; stageId: number }) => {
      return await apiRequest('PUT', `/api/deals/${dealId}`, { stageId });
    },
    onMutate: async ({ dealId, stageId }) => {
      // Lógica de atualização otimista é movida para aqui
      // Cancelar consultas de fundo para evitar sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: ['/api/deals'] });
      
      // Salvar o estado anterior para poder fazer rollback se necessário
      const previousDeals = queryClient.getQueryData<Deal[]>(['/api/deals']);
      
      // Atualização otimista da UI com a alteração
      if (deals) {
        const updatedDeals = deals.map(deal => 
          deal.id === dealId ? { ...deal, stageId } : deal
        );
        
        // Atualizar o cache com a nova lista otimista
        queryClient.setQueryData(['/api/deals'], updatedDeals);
        
        // Reorganizar o board com os dados atualizados
        // Filtrar estágios que não estão ocultos
        const visibleStages = pipelineStages.filter(stage => !stage.isHidden);
        
        const stagesWithDeals = visibleStages.map(stage => {
          const stageDeals = updatedDeals.filter(deal => deal.stageId === stage.id);
          const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
          
          return {
            ...stage,
            deals: stageDeals,
            totalValue
          };
        });
        
        setBoardData(stagesWithDeals);
      }
      
      // Retornar o contexto para usar em caso de erro
      return { previousDeals };
    },
    onSuccess: () => {
      // Invalidar a consulta para buscar os dados atualizados do servidor
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    },
    onError: (error, _, context) => {
      // Em caso de erro, reverter para o estado anterior
      if (context?.previousDeals) {
        queryClient.setQueryData(['/api/deals'], context.previousDeals);
        // Reorganizar o board com os dados anteriores
        organizeBoardData();
      }
      
      toast({
        title: "Erro ao mover negócio",
        description: "Não foi possível mover o negócio para outra etapa. Tentando novamente.",
        variant: "destructive",
      });
      console.error("Move deal error:", error);
    }
  });
  
  // Função para organizar dados do quadro
  const organizeBoardData = () => {
    if (pipelineStages.length > 0 && deals) {
      // Filtrar estágios que não estão ocultos (isHidden === false)
      const visibleStages = pipelineStages.filter(stage => !stage.isHidden);
      
      const stagesWithDeals = visibleStages.map(stage => {
        const stageDeals = deals.filter(deal => deal.stageId === stage.id);
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
  
  // Organize deals by stage quando os dados mudam
  useEffect(() => {
    organizeBoardData();
  }, [pipelineStages, deals]);
  
  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // If there's no destination or the item is dropped back in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Get the deal ID and target stage ID
    const dealId = parseInt(draggableId);
    const targetStageId = parseInt(destination.droppableId);
    
    // Mostrar feedback de transição para o usuário
    toast({
      title: "Negócio movido",
      description: "Negócio movido com sucesso para nova etapa.",
      variant: "default",
      duration: 1500,
    });
    
    // Update the deal's stage in the database
    updateDealMutation.mutate({ dealId, stageId: targetStageId });
    
    // Reorganizar o board imediatamente para feedback visual
    const currentDeals = queryClient.getQueryData<Deal[]>(['/api/deals']) || [];
    const updatedDealsData = currentDeals.map(deal => {
      if (deal.id === dealId) {
        // Mantemos o mesmo tipo de Date para updatedAt
        return { ...deal, stageId: targetStageId };
      }
      return deal;
    });
    
    // Atualizar o queryClient para refletir a mudança
    queryClient.setQueryData(['/api/deals'], updatedDealsData);
    
    // Forçar a reorganização visual do board
    organizeBoardData();
  };
  
  // Get status badge based on deal status
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em andamento</Badge>;
      case 'waiting':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Aguardando</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em andamento</Badge>;
    }
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
      
      <div className="flex flex-col h-full">
        <div className="flex justify-end px-4 py-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAddStageModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Estágio</span>
          </Button>
        </div>
        <div className="flex overflow-x-auto px-2 board-container" style={{ minHeight: 'calc(100vh - 170px)' }}>
        {boardData.map((stage) => (
          <div key={stage.id} className="kanban-column flex-shrink-0 w-72 mx-2 flex flex-col h-full">
            <div className="flex flex-col bg-white rounded-t-lg border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{stage.name}</h3>
                  <div className="flex items-center">
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
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">{stage.deals.length} negócios</span>
                  <span className="text-sm font-mono font-medium text-gray-700">{formatCurrency(stage.totalValue)}</span>
                </div>
              </div>
            </div>
            
            <Droppable droppableId={stage.id.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[200px] rounded-b-lg border-x border-b border-gray-200 p-2 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-gray-100'}`}
                >
                  {stage.deals.length > 0 ? (
                    stage.deals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 mb-2 cursor-move ${snapshot.isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'} transition-shadow`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeal(deal);
                              setIsEditDealModalOpen(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-800">{deal.name}</h4>
                              <span className="font-mono text-sm font-medium text-gray-700">{formatCurrency(deal.value || 0)}</span>
                            </div>
                            {deal.companyName && (
                              <div className="mt-2">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Building className="mr-2 h-4 w-4 text-gray-400" />
                                  <span>{deal.companyName}</span>
                                </div>
                              </div>
                            )}
                            <div className="mt-2 flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                {getStatusBadge(deal.status || 'in_progress')}
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Cotação:</span> {formatCurrency(deal.quoteValue || 0)}
                                  </div>
                                  <div className="text-xs font-medium text-gray-700">
                                    <span>Total:</span> {formatCurrency((deal.value || 0) + (deal.quoteValue || 0))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Nesta etapa: {formatTimeAgo(new Date(deal.stageStartedAt || deal.updatedAt))}</span>
                                <span>Total: {formatTimeAgo(new Date(deal.createdAt))}</span>
                              </div>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      <div className="text-center p-4">
                        <p>Arraste para cá,</p>
                        <p>para adicionar negócios nessa etapa</p>
                      </div>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
      </div>
    </DragDropContext>
  );
}
