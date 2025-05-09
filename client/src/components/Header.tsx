import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ListIcon,
  MenuIcon,
  LayoutIcon,
  PlusIcon,
  KeyIcon,
  RefreshCwIcon,
} from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
  viewMode: "kanban" | "list";
  toggleViewMode: (mode: "kanban" | "list") => void;
  onOpenApiConfig: () => void;
  onAddDeal: () => void;
  onSync: () => void;
  syncLoading: boolean;
}

export default function Header({
  toggleSidebar,
  viewMode,
  toggleViewMode,
  onOpenApiConfig,
  onAddDeal,
  onSync,
  syncLoading
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-primary">CRM TratorBel</h1>
            <span className="ml-2 text-xs py-1 px-2 bg-gray-100 rounded-full text-gray-600">Beta</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onSync}
            disabled={syncLoading}
          >
            <RefreshCwIcon className={`h-4 w-4 text-gray-600 ${syncLoading ? 'animate-spin' : ''}`} />
            <span className="text-gray-700">Sincronizar</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onOpenApiConfig}
          >
            <KeyIcon className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">Configurar API</span>
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={onAddDeal}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Negócio</span>
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <div className="px-4 py-3 text-primary font-medium text-xl">
              CRM TratorBel
            </div>
          </div>
          
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
        </div>
      </div>
    </header>
  );
}
