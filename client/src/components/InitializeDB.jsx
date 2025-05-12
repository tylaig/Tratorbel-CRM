import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InitializeDB() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      // Verificar se já existem estágios cadastrados
      const stagesResponse = await fetch('/api/pipeline-stages');
      const stages = await stagesResponse.json();
      
      if (stages && stages.length > 0) {
        toast({
          title: "Banco de dados já inicializado",
          description: "Os dados iniciais já existem no sistema.",
        });
        setIsInitialized(true);
        setIsInitializing(false);
        return;
      }

      // Criar estágios do pipeline
      const defaultStages = [
        { name: "Fornecedor", order: 1, isDefault: false, isHidden: false },
        { name: "Retirada", order: 2, isDefault: false, isHidden: false },
        { name: "Separação", order: 3, isDefault: false, isHidden: false },
        { name: "Faturamento", order: 4, isDefault: false, isHidden: false },
        { name: "Transportes", order: 5, isDefault: false, isHidden: false },
        { name: "Concluído", order: 6, isDefault: false, isHidden: false },
        { name: "Contatos Chatwoot", order: 7, isDefault: true, isHidden: true }
      ];

      for (const stage of defaultStages) {
        await fetch('/api/pipeline-stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stage)
        });
      }

      // Criar motivos de perda padrão
      const defaultReasons = [
        { reason: "Preço alto", active: true },
        { reason: "Concorrência", active: true },
        { reason: "Prazo de entrega", active: true },
        { reason: "Indisponibilidade de peças", active: true },
        { reason: "Cliente desistiu", active: true },
        { reason: "Outro", active: true }
      ];

      for (const reason of defaultReasons) {
        await fetch('/api/loss-reasons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reason)
        });
      }

      // Criar marcas de máquinas padrão
      const defaultBrands = [
        { name: "John Deere", description: "Fabricante global de equipamentos agrícolas", active: true },
        { name: "Massey Ferguson", description: "Marca de tratores e equipamentos agrícolas", active: true },
        { name: "New Holland", description: "Fabricante de máquinas agrícolas e de construção", active: true },
        { name: "Case IH", description: "Especializada em equipamentos agrícolas de alta potência", active: true },
        { name: "Valtra", description: "Fabricante finlandesa de tratores e implementos", active: true },
        { name: "Jacto", description: "Fabricante brasileira de pulverizadores e equipamentos", active: true }
      ];

      for (const brand of defaultBrands) {
        await fetch('/api/machine-brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brand)
        });
      }

      toast({
        title: "Banco de dados inicializado",
        description: "Os dados iniciais foram adicionados com sucesso.",
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro ao inicializar o banco de dados:', error);
      toast({
        variant: "destructive",
        title: "Erro ao inicializar o banco de dados",
        description: error.message || "Ocorreu um erro ao inicializar o banco de dados.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Verificar se o banco já está inicializado
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const stagesResponse = await fetch('/api/pipeline-stages');
        if (stagesResponse.ok) {
          const stages = await stagesResponse.json();
          if (stages && stages.length > 0) {
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar inicialização do banco:', error);
      }
    };

    checkInitialization();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Inicialização do Banco de Dados</h2>
      <p className="text-gray-600 mb-6 text-center">
        {isInitialized 
          ? "O banco de dados já está inicializado com dados padrão." 
          : "O banco de dados PostgreSQL está conectado, mas ainda precisa ser inicializado com dados padrão."}
      </p>
      <Button
        onClick={initializeDatabase}
        disabled={isInitializing || isInitialized}
        className="bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        {isInitializing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inicializando...
          </>
        ) : isInitialized ? (
          "Banco Inicializado"
        ) : (
          "Inicializar Banco de Dados"
        )}
      </Button>
      {isInitialized && (
        <p className="mt-4 text-sm text-green-600">
          ✓ Estágios do Pipeline<br />
          ✓ Motivos de Perda<br />
          ✓ Marcas de Máquinas
        </p>
      )}
    </div>
  );
}