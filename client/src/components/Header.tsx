
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ListIcon,
  MenuIcon,
  LayoutIcon,
  PlusIcon,
  KeyIcon,
  BarChart3Icon,
  GanttChartIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Settings as SettingsIcon,
  UserIcon,
  UsersIcon,
  MapIcon,
  FilterIcon
} from "lucide-react";
import SettingsModal from "./SettingsModal";
import PipelineSelector from "./PipelineSelector";
import { toast } from "@/hooks/use-toast";
import tbcLogo from "../assets/tbc-logo.png";

interface HeaderProps {
  toggleSidebar: () => void;
  viewMode: "kanban" | "list" | "contacts" | "heatmap" | "results";
  toggleViewMode: (mode: "kanban" | "list" | "contacts" | "heatmap" | "results") => void;
  onOpenApiConfig: () => void;
  onAddDeal?: () => void; // Adicionado novamente para ser usado no Header
  hasApiConfig?: boolean; // Indica se a API já foi configurada
  activePipelineId?: number | null;
  onPipelineChange?: (pipelineId: number) => void;
  pipelineStages?: any[]; // Adicionado para verificar se existem estágios
}

export default function Header({
  toggleSidebar,
  viewMode,
  toggleViewMode,
  onOpenApiConfig,
  onAddDeal,
  hasApiConfig = false,
  activePipelineId,
  onPipelineChange,
  pipelineStages = []
}: HeaderProps) {
  const [location] = useLocation();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  return (
    <header className="bg-[hsl(var(--header-background))] text-[hsl(var(--header-foreground))] border-b border-[hsl(var(--header-border))]">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={tbcLogo} alt="Grupo TBC Logo" className="h-10" />
            <span className="text-[10px] font-medium py-1 px-2 bg-primary/20 text-primary rounded-full">
              Beta
            </span>
            {/* Pipeline Selector */}
            {hasApiConfig && onPipelineChange && (
              <div className="ml-4 flex items-center">
                <PipelineSelector 
                  onPipelineChange={onPipelineChange}
                  activePipelineId={activePipelineId}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botões para Novo Negócio e Adicionar Estágio (movidos do KanbanBoard) */}
            {hasApiConfig && viewMode === "kanban" && (
              <div className="flex items-center gap-2 mr-4">
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
                    }
                  }}
                  disabled={!activePipelineId}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="font-medium">Novo Negócio</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 hover:bg-yellow-400 hover:text-blue-950 border-yellow-400 text-yellow-400"
                  onClick={() => {
                    // Ação para adicionar estágio - essa funcionalidade permanece no KanbanBoard
                    // mas o botão foi movido para o Header
                    if (!activePipelineId) {
                      toast({
                        title: "Selecione um pipeline",
                        description: "É necessário selecionar um pipeline para adicionar estágios.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Essa ação deve chamar a função no KanbanBoard
                    const kanbanBoardElement = document.getElementById('add-stage-button');
                    if (kanbanBoardElement) {
                      kanbanBoardElement.click();
                    }
                  }}
                  disabled={!activePipelineId}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Adicionar Estágio</span>
                </Button>
              </div>
            )}
            
            {hasApiConfig && (
              <>
                {/* Botão para telas maiores com texto */}
                <Button 
                  variant="ghost"
                  size="sm"
                  className="relative group text-white hover:text-primary hover:bg-white/10 hidden sm:flex"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <SettingsIcon className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                  <span className="ml-2 text-sm font-medium">Configurações</span>
                </Button>
                
                {/* Botão para telas menores apenas com ícone */}
                <Button 
                  variant="ghost"
                  size="icon"
                  className="relative group text-white hover:text-primary hover:bg-white/10 sm:hidden h-9 w-9"
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Configurações"
                >
                  <SettingsIcon className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                </Button>
              </>
            )}
            
            {!hasApiConfig && (
              <>
                {/* Botão para telas maiores com texto */}
                <Button 
                  variant="ghost"
                  size="sm"
                  className="group text-white hover:text-primary hover:bg-white/10 hidden sm:flex"
                  onClick={onOpenApiConfig}
                >
                  <KeyIcon className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                  <span className="ml-2 text-sm font-medium">Configurar API</span>
                </Button>
                
                {/* Botão para telas menores apenas com ícone */}
                <Button 
                  variant="ghost"
                  size="icon"
                  className="group text-white hover:text-primary hover:bg-white/10 sm:hidden h-9 w-9"
                  onClick={onOpenApiConfig}
                  title="Configurar API"
                >
                  <KeyIcon className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                </Button>
              </>
            )}
          </div>
        </div>
      
        <div className="border-t border-[hsl(var(--header-border))]">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-2">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"} 
                  size="sm"
                  className={location === "/" 
                    ? "flex items-center gap-2 bg-primary text-black hover:bg-primary/90 hover:text-black" 
                    : "flex items-center gap-2 text-white hover:text-primary hover:bg-white/10"}
                >
                  <GanttChartIcon className="h-4 w-4" />
                  <span>Funis de Vendas</span>
                </Button>
              </Link>
              
              <Link href="/historical">
                <Button 
                  variant={location === "/historical" ? "default" : "ghost"} 
                  size="sm"
                  className={location === "/historical" 
                    ? "flex items-center gap-2 bg-primary text-black hover:bg-primary/90 hover:text-black" 
                    : "flex items-center gap-2 text-white hover:text-primary hover:bg-white/10"}
                >
                  <BarChart3Icon className="h-4 w-4" />
                  <span>Histórico</span>
                </Button>
              </Link>
              
              <div className="flex items-center pl-4 border-l border-[hsl(var(--header-border))]">
                <Link href="/sales">
                  <Button 
                    variant={location === "/sales" ? "default" : "ghost"} 
                    size="sm"
                    className={location === "/sales" 
                    ? "flex items-center gap-2 bg-primary text-black hover:bg-primary/90 hover:text-black" 
                    : "flex items-center gap-2 text-white hover:text-primary hover:bg-white/10"}
                  >
                    <CheckCircle2Icon className="h-4 w-4" />
                    <span>Vendas</span>
                  </Button>
                </Link>
                
                <Link href="/losses">
                  <Button 
                    variant={location === "/losses" ? "default" : "ghost"} 
                    size="sm"
                    className={location === "/losses" 
                    ? "flex items-center gap-2 bg-primary text-black hover:bg-primary/90 hover:text-black ml-1" 
                    : "flex items-center gap-2 text-white hover:text-primary hover:bg-white/10 ml-1"}
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Perdas</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            {location === "/" && (
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <Button 
                    variant={viewMode === "kanban" ? "default" : "ghost"} 
                    size="icon"
                    onClick={() => toggleViewMode("kanban")}
                    className={viewMode === "kanban" 
                      ? "h-9 w-9 rounded bg-primary text-black hover:bg-primary/90 hover:text-black" 
                      : "h-9 w-9 rounded text-white hover:text-primary hover:bg-white/10"}
                    title="Visão Kanban"
                  >
                    <LayoutIcon className="h-5 w-5" />
                  </Button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Visão Kanban
                  </div>
                </div>
                
                <div className="relative group">
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"} 
                    size="icon"
                    onClick={() => toggleViewMode("list")}
                    className={viewMode === "list" 
                      ? "h-9 w-9 rounded bg-primary text-black hover:bg-primary/90 hover:text-black" 
                      : "h-9 w-9 rounded text-white hover:text-primary hover:bg-white/10"}
                  >
                    <ListIcon className="h-5 w-5" />
                  </Button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Visão Lista
                  </div>
                </div>
                

                
                {hasApiConfig && (
                  <div className="relative group">
                    <Button 
                      variant={viewMode === "contacts" ? "default" : "ghost"} 
                      size="icon"
                      onClick={() => toggleViewMode("contacts")}
                      className={viewMode === "contacts" 
                      ? "h-9 w-9 rounded bg-primary text-black hover:bg-primary/90 hover:text-black" 
                      : "h-9 w-9 rounded text-white hover:text-primary hover:bg-white/10"}
                    >
                      <UsersIcon className="h-5 w-5" />
                    </Button>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Contatos Chatwoot
                    </div>
                  </div>
                )}
                
                <div className="relative group">
                  <Button 
                    variant={viewMode === "heatmap" ? "default" : "ghost"} 
                    size="icon"
                    onClick={() => toggleViewMode("heatmap")}
                    className={viewMode === "heatmap" 
                      ? "h-9 w-9 rounded bg-primary text-black hover:bg-primary/90 hover:text-black" 
                      : "h-9 w-9 rounded text-white hover:text-primary hover:bg-white/10"}
                  >
                    <MapIcon className="h-5 w-5" />
                  </Button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Mapa de Calor
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Configurações */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </header>
  );
}
