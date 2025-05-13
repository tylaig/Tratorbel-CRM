import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ClientMachine, MachineBrand, MachineModel } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  Trash2, 
  Check, 
  Edit, 
  X, 
  Plus,
  Search,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ClientMachinesProps {
  dealId: number | null;
  isExisting: boolean;
}

export default function ClientMachines({ dealId, isExisting }: ClientMachinesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para máquinas locais (para adicionar/editar antes de salvar)
  const [localMachines, setLocalMachines] = useState<(ClientMachine & { isNew?: boolean })[]>([]);
  
  // Estado para formulário de nova máquina
  const [newMachine, setNewMachine] = useState({
    name: "",
    brand: "",
    model: "",
    year: ""
  });
  
  // Estado para diálogos
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDescription, setNewBrandDescription] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandForModel, setSelectedBrandForModel] = useState<number | null>(null);
  
  // Estado para formulário de edição
  const [editingMachine, setEditingMachine] = useState<{
    id: number;
    name: string;
    brand: string;
    model: string;
    year: string | null;
  } | null>(null);
  
  // Consultar marcas de máquinas
  const { data: machineBrands = [] } = useQuery<MachineBrand[]>({
    queryKey: ['/api/machine-brands'],
  });
  
  // Consultar modelos de máquinas com base na marca selecionada
  const { data: machineModels = [] } = useQuery<MachineModel[]>({
    queryKey: ['/api/machine-models', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const response = await fetch(`/api/machine-models?brandId=${selectedBrandId}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar modelos');
      }
      return response.json();
    },
    enabled: !!selectedBrandId,
  });
  
  // Consultar máquinas do cliente (se o dealId for válido)
  const { data: clientMachines = [], isLoading: isMachinesLoading } = useQuery<ClientMachine[]>({
    queryKey: ['/api/client-machines', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      try {
        const response = await fetch(`/api/client-machines/${dealId}`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar máquinas: ${response.status}`);
        }
        const result = await response.json();
        console.log("Máquinas carregadas (raw):", result);
        if (Array.isArray(result)) {
          return result;
        } else {
          console.error("Resultado não é um array:", result);
          return [];
        }
      } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
        return [];
      }
    },
    enabled: !!dealId && isExisting,
  });
  
  // Efeito para sincronizar as máquinas do servidor com o estado local
  useEffect(() => {
    console.log("clientMachines recebido:", clientMachines);
    if (isExisting && Array.isArray(clientMachines)) {
      setLocalMachines(clientMachines);
    }
  }, [clientMachines, isExisting]);
  
  // Mutation para criar marca
  const createBrandMutation = useMutation({
    mutationFn: async (brand: { name: string, description?: string }) => {
      const response = await fetch('/api/machine-brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brand),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao adicionar marca: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/machine-brands'] });
      
      toast({
        title: "Marca adicionada",
        description: "Nova marca adicionada com sucesso.",
      });
      
      // Limpar e fechar diálogo
      setNewBrandName("");
      setNewBrandDescription("");
      setShowAddBrandDialog(false);
      
      // Se estamos adicionando marca para um modelo, seleciona-la automaticamente
      if (showAddModelDialog) {
        setSelectedBrandForModel(data.id);
      } else {
        // Selecionar a marca recém-criada no formulário principal
        setNewMachine({...newMachine, brand: data.name});
        setSelectedBrandId(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar marca",
        description: `Ocorreu um erro: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para criar modelo
  const createModelMutation = useMutation({
    mutationFn: async (model: { name: string, brandId: number }) => {
      const response = await fetch('/api/machine-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(model),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao adicionar modelo: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/machine-models', selectedBrandId] });
      
      toast({
        title: "Modelo adicionado",
        description: "Novo modelo adicionado com sucesso.",
      });
      
      // Limpar e fechar diálogo
      setNewModelName("");
      setShowAddModelDialog(false);
      
      // Selecionar o modelo recém-criado
      setNewMachine({...newMachine, model: data.name});
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar modelo",
        description: `Ocorreu um erro: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para criar uma máquina
  const createMachineMutation = useMutation({
    mutationFn: async (machine: { dealId: number, name: string, brand: string, model: string, year: string }) => {
      try {
        const response = await fetch('/api/client-machines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(machine),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao adicionar máquina: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao adicionar máquina:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar consultas de máquinas e também de deals para atualizar contagens
      queryClient.invalidateQueries({ queryKey: ['/api/client-machines', dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      toast({
        title: "Máquina adicionada",
        description: "A máquina foi adicionada com sucesso.",
      });
      
      // Limpar formulário
      setNewMachine({
        name: "",
        brand: "",
        model: "",
        year: ""
      });
      setSelectedBrandId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar",
        description: `Ocorreu um erro ao adicionar a máquina: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar uma máquina
  const updateMachineMutation = useMutation({
    mutationFn: async (data: { id: number, machine: Partial<ClientMachine> }) => {
      try {
        const response = await fetch(`/api/client-machines/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.machine),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao atualizar máquina: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao atualizar máquina:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-machines', dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Máquina atualizada",
        description: "A máquina foi atualizada com sucesso.",
      });
      setEditingMachine(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: `Ocorreu um erro ao atualizar a máquina: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir uma máquina
  const deleteMachineMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await fetch(`/api/client-machines/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao excluir máquina: ${response.status}`);
        }
        
        return true;
      } catch (error) {
        console.error("Erro ao excluir máquina:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-machines', dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Máquina excluída",
        description: "A máquina foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: `Ocorreu um erro ao excluir a máquina: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Função para adicionar uma máquina localmente (para novos negócios)
  const addLocalMachine = () => {
    if (!newMachine.name || !newMachine.brand || !newMachine.model) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, marca e modelo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Se o negócio já existe, salvar diretamente no servidor
    if (isExisting && dealId) {
      createMachineMutation.mutate({
        dealId,
        ...newMachine
      });
      return;
    }
    
    // Para um novo negócio, apenas adicionar localmente
    setLocalMachines([
      ...localMachines,
      {
        id: -(localMachines.length + 1), // IDs negativos para máquinas locais
        dealId: -1, // Será atualizado depois
        name: newMachine.name,
        brand: newMachine.brand,
        model: newMachine.model,
        year: newMachine.year || null,
        createdAt: new Date(),
        isNew: true // Marcar como nova
      }
    ]);
    
    // Limpar formulário
    setNewMachine({
      name: "",
      brand: "",
      model: "",
      year: ""
    });
    
    toast({
      title: "Máquina adicionada",
      description: "A máquina foi adicionada à lista.",
    });
  };
  
  // Função para remover uma máquina localmente
  const removeLocalMachine = (id: number) => {
    // Se o negócio já existe e o ID é positivo, excluir do servidor
    if (isExisting && id > 0) {
      if (window.confirm("Tem certeza que deseja excluir esta máquina?")) {
        deleteMachineMutation.mutate(id);
      }
      return;
    }
    
    // Caso contrário, apenas remover do estado local
    setLocalMachines(localMachines.filter(m => m.id !== id));
    
    toast({
      title: "Máquina removida",
      description: "A máquina foi removida da lista.",
    });
  };
  
  // Função para atualizar uma máquina existente
  const updateMachine = () => {
    if (!editingMachine) return;
    
    if (!editingMachine.name || !editingMachine.brand || !editingMachine.model) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, marca e modelo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Se o negócio já existe e o ID é positivo, atualizar no servidor
    if (isExisting && editingMachine.id > 0) {
      updateMachineMutation.mutate({
        id: editingMachine.id,
        machine: {
          name: editingMachine.name,
          brand: editingMachine.brand,
          model: editingMachine.model,
          year: editingMachine.year
        }
      });
      return;
    }
    
    // Caso contrário, atualizar no estado local
    setLocalMachines(localMachines.map(m => 
      m.id === editingMachine.id 
        ? { 
            ...m, 
            name: editingMachine.name,
            brand: editingMachine.brand,
            model: editingMachine.model,
            year: editingMachine.year
          } 
        : m
    ));
    
    setEditingMachine(null);
    
    toast({
      title: "Máquina atualizada",
      description: "A máquina foi atualizada na lista.",
    });
  };
  
  // Getter para máquinas (local para novos negócios, servidor para existentes)
  const getMachines = () => {
    console.log("getMachines - localMachines:", localMachines);
    console.log("getMachines - clientMachines:", clientMachines);
    if (isExisting && Array.isArray(clientMachines) && clientMachines.length > 0 && localMachines.length === 0) {
      return clientMachines;
    }
    return localMachines;
  };
  
  // Getter para contar máquinas
  const getMachineCount = () => {
    const machines = getMachines();
    return machines.length;
  };
  
  // Função para iniciar a edição de uma máquina
  const startEditingMachine = (machine: ClientMachine) => {
    setEditingMachine({
      id: machine.id,
      name: machine.name,
      brand: machine.brand,
      model: machine.model,
      year: machine.year
    });
    
    // Encontrar o ID da marca para inicializar seleção de modelos
    const brand = machineBrands.find(b => b.name === machine.brand);
    setSelectedBrandId(brand?.id || null);
  };
  
  // Funções para lidar com a criação de novas marcas e modelos
  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da marca é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    createBrandMutation.mutate({
      name: newBrandName.trim(),
      description: newBrandDescription.trim() || undefined
    });
  };
  
  const handleAddModel = () => {
    if (!newModelName.trim() || !selectedBrandForModel) {
      toast({
        title: "Dados incompletos",
        description: "O nome do modelo e marca são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    createModelMutation.mutate({
      name: newModelName.trim(),
      brandId: selectedBrandForModel
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Máquinas do Cliente</h3>
        <p className="text-sm text-muted-foreground">
          Adicione as máquinas que o cliente possui ou está interessado
        </p>
      </div>
      
      {/* Diálogo para adicionar nova marca */}
      <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Marca</DialogTitle>
            <DialogDescription>
              Crie uma nova marca de maquinário para utilizar no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="brand-name">Nome da Marca</Label>
              <Input
                id="brand-name"
                placeholder="Ex: John Deere"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand-description">Descrição (opcional)</Label>
              <Input
                id="brand-description"
                placeholder="Descrição adicional"
                value={newBrandDescription}
                onChange={(e) => setNewBrandDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBrandDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddBrand} disabled={createBrandMutation.isPending}>
              {createBrandMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Marca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para adicionar novo modelo */}
      <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Modelo</DialogTitle>
            <DialogDescription>
              Crie um novo modelo para a marca selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-brand">Marca</Label>
              <Select 
                value={selectedBrandForModel?.toString()}
                onValueChange={(value) => setSelectedBrandForModel(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {machineBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-name">Nome do Modelo</Label>
              <Input
                id="model-name"
                placeholder="Ex: Trator 5000"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModelDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddModel} disabled={createModelMutation.isPending}>
              {createModelMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Formulário para adicionar nova máquina */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-md">Adicionar Nova Máquina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input 
                placeholder="Ex: Trator 4x4"
                value={newMachine.name}
                onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Marca</label>
              <div className="flex gap-1">
                <Select 
                  value={newMachine.brand}
                  onValueChange={(value) => {
                    setNewMachine({...newMachine, brand: value, model: ""});
                    // Encontrar o ID da marca selecionada para filtrar modelos
                    const brand = machineBrands.find(b => b.name === value);
                    setSelectedBrandId(brand?.id || null);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {machineBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setShowAddBrandDialog(true)}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Modelo</label>
              <div className="flex gap-1">
                {selectedBrandId ? (
                  <>
                    <Select 
                      value={newMachine.model}
                      onValueChange={(value) => setNewMachine({...newMachine, model: value})}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {machineModels.map((model) => (
                          <SelectItem key={model.id} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setSelectedBrandForModel(selectedBrandId);
                        setShowAddModelDialog(true);
                      }}
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Input 
                    placeholder="Selecione uma marca primeiro"
                    disabled
                    className="flex-1"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ano (opcional)</label>
              <Input 
                placeholder="Ex: 2020"
                value={newMachine.year}
                onChange={(e) => setNewMachine({...newMachine, year: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end py-2">
          <Button 
            onClick={addLocalMachine}
            size="sm"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Adicionar Máquina
          </Button>
        </CardFooter>
      </Card>
      
      {/* Lista de máquinas */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Máquinas Adicionadas ({getMachineCount()})</h4>
        
        {getMachineCount() > 0 ? (
          <div className="grid gap-2">
            {getMachines().map((machine) => (
              <Card key={machine.id} className="p-3">
                {editingMachine?.id === machine.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={editingMachine.name}
                        onChange={(e) => setEditingMachine({...editingMachine, name: e.target.value})}
                      />
                      <div className="flex gap-1">
                        <Select 
                          value={editingMachine.brand}
                          onValueChange={(value) => {
                            setEditingMachine({...editingMachine, brand: value, model: ""});
                            // Encontrar o ID da marca para filtrar modelos
                            const brand = machineBrands.find(b => b.name === value);
                            setSelectedBrandId(brand?.id || null);
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {machineBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.name}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowAddBrandDialog(true)}
                          className="h-10 w-10 flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex gap-1">
                        {selectedBrandId ? (
                          <>
                            <Select 
                              value={editingMachine.model}
                              onValueChange={(value) => setEditingMachine({...editingMachine, model: value})}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {machineModels.map((model) => (
                                  <SelectItem key={model.id} value={model.name}>
                                    {model.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => {
                                setSelectedBrandForModel(selectedBrandId);
                                setShowAddModelDialog(true);
                              }}
                              className="h-10 w-10 flex-shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Input
                            placeholder="Selecione uma marca"
                            value={editingMachine.model}
                            onChange={(e) => setEditingMachine({...editingMachine, model: e.target.value})}
                            className="flex-1"
                          />
                        )}
                      </div>
                      <Input
                        placeholder="Ano (opcional)"
                        value={editingMachine.year || ""}
                        onChange={(e) => setEditingMachine({...editingMachine, year: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={updateMachine}>
                        <Check className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingMachine(null);
                          setSelectedBrandId(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{machine.name}</h5>
                      <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-3">
                        <span><strong>Marca:</strong> {machine.brand}</span>
                        <span><strong>Modelo:</strong> {machine.model}</span>
                        {machine.year && <span><strong>Ano:</strong> {machine.year}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => startEditingMachine(machine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeLocalMachine(machine.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center text-muted-foreground">
            <p>Nenhuma máquina adicionada ainda.</p>
          </Card>
        )}
      </div>
    </div>
  );
}