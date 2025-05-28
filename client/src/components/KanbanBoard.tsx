import { useEffect, useState, useMemo } from "react";
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
  ArrowRightIcon,
  DollarSignIcon,
  CheckCircle2Icon,
  XCircleIcon,
  GripIcon
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  winReason?: string | null;
  lostReason?: string | null;
}

interface KanbanBoardProps {
  pipelineStages: PipelineStage[];
  filters?: FilterOptions;
  activePipelineId: number | null;
  onAddDeal: () => void; // Função para abrir o modal de adicionar negócio
  deals?: any[]; // Aceita Deal[] ou ExtendedDeal[]
  userId?: number | null;
}

interface StageWithDeals extends PipelineStage {
  deals: Deal[];
  totalValue: number;
}

export default function KanbanBoard({ pipelineStages, filters, activePipelineId, onAddDeal, deals = [], userId }: KanbanBoardProps) {
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<PipelineStage | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [targetStageInfo, setTargetStageInfo] = useState<{ id: number, type: string | null }>({ id: 0, type: null });
  const [isDragging, setIsDragging] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Buscar deals filtrados por userId se fornecido
  // Se userId for null ou undefined, mostrar todos (admin)
  const filteredDeals = userId ? deals.filter(d => d.userId === userId) : deals;
  
  // useMemo para derivar boardData sempre que dados mudarem
  const boardData: StageWithDeals[] = useMemo(() => {
    if (!activePipelineId) return [];
    let dealsData: Deal[] = [];
    if (filteredDeals) {
      dealsData = filteredDeals.filter(deal => deal.pipelineId === activePipelineId);
    }
    // Preparar todos os negócios para processamento
    const processedDeals: { [id: number]: boolean } = {};
    const stagesWithDeals = pipelineStages
      .filter(stage => !stage.isHidden)
      .map((stage) => {
        let stageDeals: Deal[] = [];
        if (stage.stageType === "completed") {
          // Mostrar todos os ganhos, independente do pipeline
          stageDeals = deals.concat(dealsData).filter(
            (deal, idx, arr) =>
              (deal.stageId === stage.id || deal.saleStatus === "won") &&
              // Remover duplicatas caso o mesmo deal esteja em deals e dealsData
              arr.findIndex(d => d.id === deal.id) === idx
          );
        } else if (stage.stageType === "lost") {
          stageDeals = dealsData.filter(deal => (deal.stageId === stage.id || deal.saleStatus === "lost") && deal.pipelineId === stage.pipelineId);
        } else {
          stageDeals = dealsData.filter(deal => deal.stageId === stage.id && deal.saleStatus !== "won" && deal.saleStatus !== "lost");
        }
        stageDeals.forEach(deal => { processedDeals[deal.id] = true; });
        const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        return { ...stage, deals: stageDeals, totalValue };
      })
      .sort((a, b) => {
        if (a.stageType === "completed" && b.stageType !== "completed") return 1;
        if (a.stageType !== "completed" && b.stageType === "completed") return -1;
        if (a.stageType === "lost" && b.stageType !== "lost") return 1;
        if (a.stageType !== "lost" && b.stageType === "lost") return -1;
        return a.order - b.order;
      });
    return stagesWithDeals;
  }, [pipelineStages, activePipelineId, filters, filteredDeals, deals]);
  
  const onDragStart = () => {
    setIsDragging(true);
  };
  
  const onDragEnd = async (result: DropResult) => {
    setIsDragging(false);
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
    // Buscar o deal em qualquer coluna (não só na source)
    const deal = boardData.flatMap(stage => stage.deals).find(d => d.id === dealId);
    
    if (!deal) {
      toast({
        title: "Negócio não encontrado",
        description: "Não foi possível localizar o negócio para movimentação.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se é uma mudança para um estágio especial (completado/perdido)
    if (destStage.stageType === "completed" || destStage.stageType === "lost") {
      setSelectedDeal(deal);
      setTargetStageInfo({ id: destStage.id, type: destStage.stageType });
      setIsOutcomeModalOpen(true);
      return; // Não continuar com a movimentação aqui, será feita após o modal
    }
    
    try {
      await apiRequest(`/api/deals/${dealId}`, 'PUT', {
        stageId: destStage.id,
        pipelineId: destStage.pipelineId
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
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
    }
  };
  
  const handleAddDeal = (stage: PipelineStage) => {
    setSelectedStageForNewDeal(stage);
    setIsAddDealModalOpen(true);
  };
  
  // Helper para gerar badges de status
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      in_progress: { label: 'Em progresso', variant: 'secondary' },
      waiting: { label: 'Aguardando', variant: 'outline' },
      completed: { label: 'Concluído', variant: 'secondary' },
      canceled: { label: 'Cancelado', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'default' };
    
    return (
      <Badge variant={statusInfo.variant} className="text-[9px] px-1.5 py-0 h-4">
        {statusInfo.label}
      </Badge>
    );
  };
  
  // Em caso de não ter estágios ou dados
  if (boardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
        <MessagesSquareIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum estágio encontrado</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          {activePipelineId 
            ? "Adicione estágios ao funil para começar a gerenciar seus negócios."
            : "Selecione um funil para visualizar os estágios."}
        </p>
        {activePipelineId && (
          <Button onClick={() => setIsAddStageModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Estágio
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
              deal={{
                order: null,
                userId: 0,
                quoteValue: null,
                salePerformance: null,
                ...selectedDeal
              }}
              pipelineStages={pipelineStages}
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
              deal={{
                order: null,
                userId: 0,
                quoteValue: null,
                salePerformance: null,
                ...selectedDeal
              }}
              targetStageId={targetStageInfo.id}
              targetStageType={targetStageInfo.type as any}
            />
          )}
          
          <AddDealModal
            isOpen={isAddDealModalOpen}
            onClose={() => {
              setIsAddDealModalOpen(false);
              setSelectedStageForNewDeal(null);
            }}
            initialStageId={selectedStageForNewDeal?.id}
            pipelineStages={pipelineStages}
          />
          
          {/* Área principal de rolagem horizontal com os estágios */}
          <div className="flex overflow-x-auto pb-4 px-2 board-container flex-1 mt-2 gap-3">
            {boardData.map((stage) => (
              <div 
                key={stage.id} 
                className="kanban-column flex-shrink-0 w-72 flex flex-col"
              >
                {/* Cabeçalho da coluna */}
                <div className={`p-3 rounded-t-lg border shadow-sm kanban-column-header ${
                  stage.stageType === "completed" 
                    ? "bg-gradient-to-b from-green-50 to-green-100/30 border-green-200 dark:from-green-950/40 dark:to-green-900/20 dark:border-green-800" 
                    : stage.stageType === "lost" 
                      ? "bg-gradient-to-b from-red-50 to-red-100/30 border-red-200 dark:from-red-950/40 dark:to-red-900/20 dark:border-red-800"
                      : "bg-gradient-to-b from-card to-background border-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stage.stageType === "completed" && (
                        <span className="h-3 w-3 bg-green-500 dark:bg-green-400 rounded-full"></span>
                      )}
                      {stage.stageType === "lost" && (
                        <span className="h-3 w-3 bg-red-500 dark:bg-red-400 rounded-full"></span>
                      )}
                      {!stage.stageType && (
                        <span className="h-3 w-3 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                      )}
                      <h3 className="font-semibold text-foreground">{stage.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-xs font-medium bg-background/80 dark:bg-background/30">
                        {stage.deals.length}
                      </Badge>
                      
                      {!stage.isSystem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
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
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <DollarSignIcon className="h-3.5 w-3.5" />
                      <span className="font-medium">{formatCurrency(stage.totalValue)}</span>
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-xs gap-1 bg-background/80 hover:bg-background"
                          onClick={() => handleAddDeal(stage)}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          <span>Negócio</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adicionar novo negócio neste estágio</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {/* Área de cards/droppable - altura ajustada para rolagem */}
                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <ScrollArea 
                      className={`deal-list rounded-b-lg border border-t-0 ${
                        snapshot.isDraggingOver
                          ? "droppable-hover bg-yellow-50/70 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                          : stage.stageType === "completed" 
                            ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                            : stage.stageType === "lost" 
                              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                              : "bg-card/30 dark:bg-card/10 border-border"
                      } flex-1 h-[calc(100vh-220px)]`}
                    >
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-2 min-h-[100px]"
                      >
                        {stage.deals.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground text-sm">
                            <p>Nenhum negócio neste estágio</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleAddDeal(stage)}
                            >
                              <PlusIcon className="h-3.5 w-3.5 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        )}
                        
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
                                style={{
                                  ...provided.draggableProps.style,
                                  // Efeitos visuais durante o arraste
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                  transform: snapshot.isDragging && provided.draggableProps.style?.transform 
                                    ? `${provided.draggableProps.style.transform} rotate(1deg)` 
                                    : provided.draggableProps.style?.transform,
                                }}
                                className={`mb-2 group border-l-4 ${
                                  snapshot.isDragging
                                    ? "shadow-lg dark:bg-card/90 ring-2 ring-primary/30 deal-card-dragging"
                                    : "shadow-sm hover:shadow-md bg-background dark:bg-card/80"
                                } ${
                                  deal.status === "completed" 
                                    ? "border-l-green-500" 
                                    : deal.status === "canceled" 
                                      ? "border-l-red-500"
                                      : deal.status === "in_progress"
                                        ? "border-l-blue-500"
                                        : "border-l-yellow-500"
                                } cursor-pointer rounded-md text-sm transition-all hover:translate-y-[-2px]`}
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsEditDealModalOpen(true);
                                }}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="h-5 flex items-center justify-end px-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <GripIcon className="h-3 w-3 text-muted-foreground" />
                                </div>
                                
                                <CardContent className="p-3 pt-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground truncate max-w-[180px]">
                                        {deal.name}
                                      </div>
                                    </div>
                                    <div>
                                      {getStatusBadge(deal.status)}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-1 mb-2">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <User2Icon className="w-3 h-3 mr-1 text-primary/70 flex-shrink-0" />
                                      <span className="truncate">
                                        {deal.leadData?.name || "N/D"}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Building className="w-3 h-3 mr-1 text-primary/70 flex-shrink-0" />
                                      <span className="truncate">
                                        {deal.leadData?.companyName || "N/D"}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <Separator className="my-1.5" />
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {formatTimeAgo(deal.updatedAt)}
                                    </span>
                                    <Badge variant="outline" className="px-1.5 py-0.5 text-xs font-medium bg-primary/5 text-primary border-primary/20">
                                      {formatCurrency(deal.value || 0)}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </div>
            ))}
            
            {/* Botão para adicionar novo estágio */}
            {activePipelineId && (
              <div className="flex-shrink-0 w-48 flex items-start pt-3">
                <Button 
                  variant="outline" 
                  className="h-12 w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-border"
                  onClick={() => setIsAddStageModalOpen(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Estágio
                </Button>
              </div>
            )}
          </div>
          
          {/* Indicador de modo de arrasto */}
          {isDragging && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
              <ArrowRightIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Arraste para mover o negócio</span>
            </div>
          )}
        </div>
      </DragDropContext>
    </TooltipProvider>
  );
}