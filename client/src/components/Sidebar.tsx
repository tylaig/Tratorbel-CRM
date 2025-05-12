import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  PieChartIcon,
  UsersIcon,
  BuildingIcon,
  HandshakeIcon,
  Filter,
  SettingsIcon,
  RefreshCwIcon,
  Map,
  CheckCircleIcon,
  XCircleIcon,
  HistoryIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  return (
    <aside 
      className={cn(
        "w-64 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isOpen ? "fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0" : "-translate-x-full lg:translate-x-0 lg:block hidden"
      )}
    >
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Visão Geral</h2>
          <nav className="space-y-1">
            <Link href="/">
              <a className={cn(
                "sidebar-link",
                location === "/" ? "active" : ""
              )}>
                <PieChartIcon className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/pipeline">
              <a className={cn(
                "sidebar-link",
                location === "/pipeline" ? "active" : ""
              )}>
                <Filter className="w-5 h-5 mr-2" />
                <span>Funil de Vendas</span>
              </a>
            </Link>
            <Link href="/sales">
              <a className={cn(
                "sidebar-link",
                location === "/sales" ? "active" : ""
              )}>
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                <span>Vendas Concluídas</span>
              </a>
            </Link>
            <Link href="/losses">
              <a className={cn(
                "sidebar-link",
                location === "/losses" ? "active" : ""
              )}>
                <XCircleIcon className="w-5 h-5 mr-2 text-red-600" />
                <span>Oportunidades Perdidas</span>
              </a>
            </Link>
            <Link href="/historical">
              <a className={cn(
                "sidebar-link",
                location === "/historical" ? "active" : ""
              )}>
                <HistoryIcon className="w-5 h-5 mr-2 text-blue-600" />
                <span>Histórico</span>
              </a>
            </Link>
            <Link href="/activities">
              <a className={cn(
                "sidebar-link",
                location === "/activities" ? "active" : ""
              )}>
                <RefreshCwIcon className="w-5 h-5 mr-2" />
                <span>Atividades</span>
              </a>
            </Link>
          </nav>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Gerenciamento</h2>
          <nav className="space-y-1">
            <Link href="/contacts">
              <a className={cn(
                "sidebar-link",
                location === "/contacts" ? "active" : ""
              )}>
                <UsersIcon className="w-5 h-5 mr-2" />
                <span>Contatos</span>
              </a>
            </Link>
            <Link href="/companies">
              <a className={cn(
                "sidebar-link",
                location === "/companies" ? "active" : ""
              )}>
                <BuildingIcon className="w-5 h-5 mr-2" />
                <span>Empresas</span>
              </a>
            </Link>
            <Link href="/deals">
              <a className={cn(
                "sidebar-link",
                location === "/deals" ? "active" : ""
              )}>
                <HandshakeIcon className="w-5 h-5 mr-2" />
                <span>Negócios</span>
              </a>
            </Link>
          </nav>
        </div>
        
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Configurações</h2>
          <nav className="space-y-1">
            <Link href="/settings">
              <a className={cn(
                "sidebar-link",
                location === "/settings" ? "active" : ""
              )}>
                <SettingsIcon className="w-5 h-5 mr-2" />
                <span>Geral</span>
              </a>
            </Link>
            <Link href="/pipeline-config">
              <a className={cn(
                "sidebar-link",
                location === "/pipeline-config" ? "active" : ""
              )}>
                <Map className="w-5 h-5 mr-2" />
                <span>Etapas do Funil</span>
              </a>
            </Link>
            <Link href="/chatwoot-integration">
              <a className={cn(
                "sidebar-link",
                location === "/chatwoot-integration" ? "active" : ""
              )}>
                <RefreshCwIcon className="w-5 h-5 mr-2" />
                <span>Integração Chatwoot</span>
              </a>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
