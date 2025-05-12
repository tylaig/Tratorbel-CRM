
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ListIcon,
  MenuIcon,
  LayoutIcon,
  PlusIcon,
  KeyIcon,
  RefreshCwIcon,
  BarChart3Icon,
  GanttChartIcon,
  CheckCircle2Icon,
  XCircleIcon
} from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
  viewMode: "kanban" | "list";
  toggleViewMode: (mode: "kanban" | "list") => void;
  onOpenApiConfig: () => void;
  onAddDeal: () => void;
  onSync: () => void;
  syncLoading: boolean;
  hasApiConfig?: boolean; // Indica se a API já foi configurada
}

export default function Header({
  toggleSidebar,
  viewMode,
  toggleViewMode,
  onOpenApiConfig,
  onAddDeal,
  onSync,
  syncLoading,
  hasApiConfig = false
}: HeaderProps) {
  const [location] = useLocation();
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CRM TratorBel
            </h1>
            <span className="ml-3 text-[10px] font-medium py-1 px-2 bg-primary/10 text-primary rounded-full">
              Beta
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasApiConfig && (
              <Button 
                variant="ghost"
                size="sm"
                className="relative group"
                onClick={onSync}
                disabled={syncLoading}
              >
                <RefreshCwIcon className={`h-4 w-4 ${syncLoading ? 'animate-spin text-primary' : 'text-gray-600 group-hover:text-primary transition-colors'}`} />
                <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Sincronizar</span>
              </Button>
            )}
            
            {!hasApiConfig && (
              <Button 
                variant="ghost"
                size="sm"
                className="group"
                onClick={onOpenApiConfig}
              >
                <KeyIcon className="h-4 w-4 text-gray-600 group-hover:text-primary transition-colors" />
                <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Configurar API</span>
              </Button>
            )}
            
            <Button 
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white shadow-sm ml-2"
              onClick={onAddDeal}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span className="font-medium">Novo Negócio</span>
            </Button>
          </div>
        </div>
      
        <div className="border-t border-gray-200">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-2">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <GanttChartIcon className="h-4 w-4" />
                  <span>Pipeline</span>
                </Button>
              </Link>
              
              <Link href="/historical">
                <Button 
                  variant={location === "/historical" ? "default" : "ghost"} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart3Icon className="h-4 w-4" />
                  <span>Histórico</span>
                </Button>
              </Link>
              
              <div className="flex items-center pl-4 border-l">
                <Link href="/sales">
                  <Button 
                    variant={location === "/sales" ? "default" : "ghost"} 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2Icon className="h-4 w-4" />
                    <span>Vendas</span>
                  </Button>
                </Link>
                
                <Link href="/losses">
                  <Button 
                    variant={location === "/losses" ? "default" : "ghost"} 
                    size="sm"
                    className="flex items-center gap-2 ml-1"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Perdas</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            {location === "/" && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant={viewMode === "kanban" ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => toggleViewMode("kanban")}
                  className="h-9 w-9 rounded"
                >
                  <LayoutIcon className="h-5 w-5" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => toggleViewMode("list")}
                  className="h-9 w-9 rounded"
                >
                  <ListIcon className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
