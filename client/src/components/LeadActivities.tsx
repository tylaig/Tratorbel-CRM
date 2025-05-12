import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Mail, Phone, FileText, MessageCircle, Clock } from 'lucide-react';
import { formatTimeAgo } from '@/lib/formatters';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Deal, LeadActivity } from '@shared/schema';

interface LeadActivitiesProps {
  deal: Deal | null;
}

const activityTypes = [
  { value: 'email_sent', label: 'Email enviado', icon: Mail },
  { value: 'call_made', label: 'Ligação realizada', icon: Phone },
  { value: 'proposal_created', label: 'Proposta criada', icon: FileText },
  { value: 'meeting_scheduled', label: 'Reunião agendada', icon: Calendar },
  { value: 'note_added', label: 'Anotação', icon: MessageCircle },
];

export default function LeadActivities({ deal }: LeadActivitiesProps) {
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState('');
  const { toast } = useToast();

  // Reset form quando o deal mudar
  useEffect(() => {
    setDescription('');
    setActivityType('');
  }, [deal?.id]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/lead-activities', deal?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/lead-activities/${deal?.id}`);
      return response as LeadActivity[];
    },
    enabled: !!deal?.id,
  });

  const createActivityMutation = useMutation({
    mutationFn: (newActivity: { dealId: number; activityType: string; description: string; createdBy: string | null }) => 
      apiRequest('POST', '/api/lead-activities', newActivity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-activities', deal?.id] });
      setDescription('');
      setActivityType('');
      toast({
        title: 'Atividade registrada',
        description: 'A atividade foi registrada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a atividade.',
        variant: 'destructive',
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/lead-activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-activities', deal?.id] });
      toast({
        title: 'Atividade removida',
        description: 'A atividade foi removida com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a atividade.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal?.id || !activityType || !description.trim()) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    createActivityMutation.mutate({
      dealId: deal.id,
      activityType,
      description: description.trim(),
      createdBy: 'Usuário', // Idealmente seria o nome do usuário logado
    });
  };

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find(a => a.value === type);
    const Icon = activity?.icon || MessageCircle;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  const getActivityLabel = (type: string) => {
    return activityTypes.find(a => a.value === type)?.label || 'Atividade';
  };

  if (!deal) {
    return null;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de atividade" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <type.icon className="h-4 w-4 mr-2" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-2/3">
            <Textarea 
              placeholder="Descrição da atividade" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="h-10 min-h-[40px] resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={createActivityMutation.isPending || !activityType || !description.trim()}
          >
            {createActivityMutation.isPending ? 'Registrando...' : 'Registrar Atividade'}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Histórico de Atividades</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando atividades...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity: LeadActivity) => (
              <Card key={activity.id} className="border-l-4 border-l-primary">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-base flex items-center">
                      {getActivityIcon(activity.activityType)}
                      {getActivityLabel(activity.activityType)}
                    </CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(new Date(activity.createdAt))}
                    </div>
                  </div>
                  {activity.createdBy && (
                    <CardDescription className="text-xs">
                      Por: {activity.createdBy}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2">
                  <p className="text-sm">{activity.description}</p>
                </CardContent>
                <CardFooter className="p-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteActivityMutation.mutate(activity.id)}
                    disabled={deleteActivityMutation.isPending}
                    className="h-8 px-2 text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}