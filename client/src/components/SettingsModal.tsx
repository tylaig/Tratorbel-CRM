import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Settings, 
  MessageSquare,
  Layers,
  XCircle,
  Car,
  BuildingIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Settings as SettingsType, PipelineStage, LossReason, MachineBrand } from "@shared/schema";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("chatwoot");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para carregar configurações
  const { data: settings } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  // Consulta para carregar estágios do pipeline
  const { data: pipelineStages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['/api/pipeline-stages'],
  });

  // Consulta para carregar motivos de perdas
  const { data: lossReasons = [] } = useQuery<LossReason[]>({
    queryKey: ['/api/loss-reasons'],
  });

  // Consulta para carregar marcas de máquinas
  const { data: machineBrands = [] } = useQuery<MachineBrand[]>({
    queryKey: ['/api/machine-brands'],
    enabled: activeTab === "machine-brands",
  });

  // Campos para a configuração do Chatwoot
  const [chatwootUrl, setChatwootUrl] = useState(settings?.chatwootUrl || "");
  const [chatwootApiKey, setChatwootApiKey] = useState(settings?.chatwootApiKey || "");
  const [accountId, setAccountId] = useState(settings?.accountId || "");

  // Estados para edição de estágios
  const [newStageName, setNewStageName] = useState("");
  const [editingStage, setEditingStage] = useState<{ id: number, name: string } | null>(null);

  // Estados para edição de motivos de perda
  const [newLossReason, setNewLossReason] = useState("");
  const [editingLossReason, setEditingLossReason] = useState<{ id: number, reason: string } | null>(null);

  // Estados para edição de marcas de máquinas
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDescription, setNewBrandDescription] = useState("");
  const [editingBrand, setEditingBrand] = useState<{ id: number, name: string, description: string | null } | null>(null);

  // Mutation para salvar configurações
  const saveChatwootMutation = useMutation({
    mutationFn: async (data: { chatwootApiKey: string, chatwootUrl: string, accountId: string }) => {
      return await apiRequest('POST', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do Chatwoot foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: `Ocorreu um erro ao salvar as configurações: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para criar estágio
  const createStageMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest('POST', '/api/pipeline-stages', {
        name: data.name,
        order: pipelineStages.length + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
      setNewStageName("");
      toast({
        title: "Estágio criado",
        description: "O estágio foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar",
        description: `Ocorreu um erro ao criar o estágio: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar estágio
  const updateStageMutation = useMutation({
    mutationFn: async (data: { id: number, name: string }) => {
      return await apiRequest('PUT', `/api/pipeline-stages/${data.id}`, {
        name: data.name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
      setEditingStage(null);
      toast({
        title: "Estágio atualizado",
        description: "O estágio foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: `Ocorreu um erro ao atualizar o estágio: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir estágio
  const deleteStageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/pipeline-stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline-stages'] });
      toast({
        title: "Estágio excluído",
        description: "O estágio foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: `Ocorreu um erro ao excluir o estágio: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para criar motivo de perda
  const createLossReasonMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      return await apiRequest('POST', '/api/loss-reasons', {
        reason: data.reason,
        active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loss-reasons'] });
      setNewLossReason("");
      toast({
        title: "Motivo criado",
        description: "O motivo de perda foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar",
        description: `Ocorreu um erro ao criar o motivo de perda: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar motivo de perda
  const updateLossReasonMutation = useMutation({
    mutationFn: async (data: { id: number, reason: string }) => {
      return await apiRequest('PUT', `/api/loss-reasons/${data.id}`, {
        reason: data.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loss-reasons'] });
      setEditingLossReason(null);
      toast({
        title: "Motivo atualizado",
        description: "O motivo de perda foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: `Ocorreu um erro ao atualizar o motivo: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir motivo de perda
  const deleteLossReasonMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/loss-reasons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loss-reasons'] });
      toast({
        title: "Motivo excluído",
        description: "O motivo de perda foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: `Ocorreu um erro ao excluir o motivo: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para criar marca
  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string, description: string }) => {
      return await apiRequest('POST', '/api/machine-brands', {
        name: data.name,
        description: data.description,
        active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machine-brands'] });
      setNewBrandName("");
      setNewBrandDescription("");
      toast({
        title: "Marca criada",
        description: "A marca foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar",
        description: `Ocorreu um erro ao criar a marca: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar marca
  const updateBrandMutation = useMutation({
    mutationFn: async (data: { id: number, name: string, description: string }) => {
      return await apiRequest('PUT', `/api/machine-brands/${data.id}`, {
        name: data.name,
        description: data.description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machine-brands'] });
      setEditingBrand(null);
      toast({
        title: "Marca atualizada",
        description: "A marca foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: `Ocorreu um erro ao atualizar a marca: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir marca
  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/machine-brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machine-brands'] });
      toast({
        title: "Marca excluída",
        description: "A marca foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: `Ocorreu um erro ao excluir a marca: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Função para salvar configurações do Chatwoot
  const saveChatwootSettings = () => {
    saveChatwootMutation.mutate({
      chatwootApiKey,
      chatwootUrl,
      accountId
    });
  };

  // Função para criar estágio
  const createStage = () => {
    if (!newStageName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do estágio é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    createStageMutation.mutate({ name: newStageName });
  };

  // Função para atualizar estágio
  const updateStage = () => {
    if (!editingStage) return;
    if (!editingStage.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do estágio é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    updateStageMutation.mutate({
      id: editingStage.id,
      name: editingStage.name
    });
  };

  // Função para criar motivo de perda
  const createLossReason = () => {
    if (!newLossReason.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O motivo de perda é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    createLossReasonMutation.mutate({ reason: newLossReason });
  };

  // Função para atualizar motivo de perda
  const updateLossReason = () => {
    if (!editingLossReason) return;
    if (!editingLossReason.reason.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O motivo de perda é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    updateLossReasonMutation.mutate({
      id: editingLossReason.id,
      reason: editingLossReason.reason
    });
  };

  // Função para criar marca
  const createBrand = () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da marca é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    createBrandMutation.mutate({ 
      name: newBrandName,
      description: newBrandDescription 
    });
  };

  // Função para atualizar marca
  const updateBrand = () => {
    if (!editingBrand) return;
    if (!editingBrand.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da marca é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    updateBrandMutation.mutate({
      id: editingBrand.id,
      name: editingBrand.name,
      description: editingBrand.description || ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Gerencie as configurações e recursos do CRM
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chatwoot" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="chatwoot" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chatwoot
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="loss-reasons" className="flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Motivos de Perda
            </TabsTrigger>
            <TabsTrigger value="machine-brands" className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Marcas
            </TabsTrigger>
          </TabsList>

          {/* Aba Chatwoot */}
          <TabsContent value="chatwoot">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integração com Chatwoot</CardTitle>
                <CardDescription>
                  Configure a integração com o Chatwoot para sincronizar contatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chatwoot-url">URL do Chatwoot</Label>
                  <Input
                    id="chatwoot-url"
                    placeholder="https://app.chatwoot.com"
                    value={chatwootUrl}
                    onChange={(e) => setChatwootUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: https://app.chatwoot.com ou seu domínio personalizado
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Chave de API</Label>
                  <Input
                    id="api-key"
                    placeholder="Sua chave de API do Chatwoot"
                    value={chatwootApiKey}
                    onChange={(e) => setChatwootApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode gerar uma chave de API nas configurações do seu perfil no Chatwoot
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-id">ID da Conta</Label>
                  <Input
                    id="account-id"
                    placeholder="ID da sua conta no Chatwoot"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    O ID da conta pode ser encontrado na URL ao navegar no Chatwoot (Ex: /app/accounts/1)
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={saveChatwootSettings} 
                  disabled={saveChatwootMutation.isPending}
                >
                  {saveChatwootMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Aba Pipeline */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estágios do Pipeline</CardTitle>
                <CardDescription>
                  Gerencie os estágios do seu funil de vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  <Input
                    placeholder="Nome do novo estágio"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                  />
                  <Button 
                    onClick={createStage} 
                    disabled={createStageMutation.isPending}
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {pipelineStages.map((stage) => (
                    <div 
                      key={stage.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      {editingStage?.id === stage.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingStage.name}
                            onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" onClick={updateStage}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingStage(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{stage.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingStage({ id: stage.id, name: stage.name })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Tem certeza que deseja excluir este estágio?")) {
                                  deleteStageMutation.mutate(stage.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Motivos de Perda */}
          <TabsContent value="loss-reasons">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Motivos de Perda</CardTitle>
                <CardDescription>
                  Gerencie os motivos de perda de negócios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  <Input
                    placeholder="Novo motivo de perda"
                    value={newLossReason}
                    onChange={(e) => setNewLossReason(e.target.value)}
                  />
                  <Button 
                    onClick={createLossReason} 
                    disabled={createLossReasonMutation.isPending}
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {lossReasons.map((reason) => (
                    <div 
                      key={reason.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      {editingLossReason?.id === reason.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingLossReason.reason}
                            onChange={(e) => setEditingLossReason({ ...editingLossReason, reason: e.target.value })}
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" onClick={updateLossReason}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingLossReason(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{reason.reason}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingLossReason({ id: reason.id, reason: reason.reason })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Tem certeza que deseja excluir este motivo?")) {
                                  deleteLossReasonMutation.mutate(reason.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Marcas de Máquinas */}
          <TabsContent value="machine-brands">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marcas de Máquinas</CardTitle>
                <CardDescription>
                  Gerencie as marcas de máquinas disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <Input
                    placeholder="Nome da marca"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newBrandDescription}
                    onChange={(e) => setNewBrandDescription(e.target.value)}
                  />
                  <Button 
                    onClick={createBrand} 
                    disabled={createBrandMutation.isPending}
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Adicionar Nova Marca
                  </Button>
                </div>

                <div className="space-y-2">
                  {machineBrands.map((brand) => (
                    <div 
                      key={brand.id}
                      className="flex flex-col p-3 border rounded-md"
                    >
                      {editingBrand?.id === brand.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingBrand.name}
                            onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                            autoFocus
                          />
                          <Input
                            value={editingBrand.description || ''}
                            onChange={(e) => setEditingBrand({ ...editingBrand, description: e.target.value })}
                            placeholder="Descrição (opcional)"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={updateBrand}>
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingBrand(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{brand.name}</span>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingBrand({ 
                                  id: brand.id, 
                                  name: brand.name,
                                  description: brand.description
                                })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir esta marca?")) {
                                    deleteBrandMutation.mutate(brand.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          {brand.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {brand.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}