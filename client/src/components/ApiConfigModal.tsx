import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Settings } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, KeyIcon } from "lucide-react";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSettings?: Settings;
}

export default function ApiConfigModal({ isOpen, onClose, existingSettings }: ApiConfigModalProps) {
  const [apiKey, setApiKey] = useState(existingSettings?.chatwootApiKey || "");
  const [chatwootUrl, setChatwootUrl] = useState(existingSettings?.chatwootUrl || "");
  const [accountId, setAccountId] = useState(existingSettings?.accountId || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
  const { toast } = useToast();
  
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        chatwootApiKey: apiKey,
        chatwootUrl: chatwootUrl,
        accountId: accountId,
      };
      return await apiRequest('POST', '/api/settings', payload);
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "Suas configurações da API Chatwoot foram salvas com sucesso.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
      // Trigger sync automatically
      syncMutation.mutate();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas configurações. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Save settings error:", error);
    }
  });
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/chatwoot/sync', {});
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: `Os contatos foram sincronizados com seu CRM.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      // Importante: fechar a modal apenas após a conclusão da sincronização
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Chatwoot. Verifique suas configurações.",
        variant: "destructive",
      });
      console.error("Sync error:", error);
    }
  });
  
  const handleSave = () => {
    if (!apiKey || !chatwootUrl || !accountId) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos são obrigatórios para configurar a integração.",
        variant: "destructive",
      });
      return;
    }
    
    saveSettingsMutation.mutate();
  };
  
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-primary" />
            Configurar Integração Chatwoot
          </DialogTitle>
          <DialogDescription>
            Insira sua chave de API do Chatwoot para sincronizar contatos e negócios automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">Chave de API</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Digite sua chave de API"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={toggleShowApiKey}
              >
                {showApiKey ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="chatwoot-url">URL do Chatwoot</Label>
            <Input
              id="chatwoot-url"
              type="text"
              value={chatwootUrl}
              onChange={(e) => setChatwootUrl(e.target.value)}
              placeholder="https://sua-instancia.chatwoot.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="account-id">ID da Conta</Label>
            <Input
              id="account-id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending || syncMutation.isPending}
          >
            {saveSettingsMutation.isPending ? "Salvando..." : "Salvar e Sincronizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
