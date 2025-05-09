import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useChatwootApi() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  
  // Get Chatwoot contacts
  const { data: contactsData, isLoading: isContactsLoading } = useQuery<{ payload: any[] }>({
    queryKey: ['/api/chatwoot/contacts'],
    enabled: false,  // Don't fetch on mount
  });
  
  // Sync with Chatwoot
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      return await apiRequest('POST', '/api/chatwoot/sync', {});
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: `${data.data.synced} contatos foram sincronizados com sucesso.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatwoot/contacts'] });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Chatwoot. Verifique suas configurações.",
        variant: "destructive",
      });
      console.error("Sync error:", error);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });
  
  const syncContacts = () => {
    syncMutation.mutate();
  };
  
  return {
    contacts: contactsData?.payload || [],
    isContactsLoading,
    isSyncing,
    syncContacts,
    syncError: syncMutation.error,
  };
}
