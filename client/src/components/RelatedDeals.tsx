import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ChevronsUpDown, ExternalLink, Plus } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Deal {
  id: number;
  name: string;
  value: number | null;
  status: string | null;
  stageId: number;
  createdAt: string | Date;
  companyName: string | null;
  contactName: string | null;
  chatwootContactId: string | null;
  saleStatus: string | null;
  quoteValue: number | null;
}

interface RelatedDealsProps {
  contactId: string;
  currentDealId: number;
  onOpenDeal: (dealId: number) => void;
  onCreateNewDeal: () => void;
}

export default function RelatedDeals({ contactId, currentDealId, onOpenDeal, onCreateNewDeal }: RelatedDealsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: relatedDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals/contact", contactId],
    enabled: !!contactId,
  });

  // Filtrar para não mostrar o negócio atual na lista
  const filteredDeals = relatedDeals?.filter(deal => deal.id !== currentDealId) || [];

  const getStatusBadge = (saleStatus: string | null) => {
    if (!saleStatus) return null;
    
    switch (saleStatus) {
      case "won":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Ganho</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Perdido</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em negociação</Badge>;
    }
  };

  if (!contactId) return null;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div>Oportunidades deste cliente</div>
          <Button size="sm" variant="outline" onClick={onCreateNewDeal} className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Novo negócio
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-2 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="py-2 text-center text-sm text-muted-foreground">
            {relatedDeals?.length > 0 
              ? "Não há outros negócios para este cliente" 
              : "Este é o primeiro negócio deste cliente"}
          </div>
        ) : (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {filteredDeals.length} {filteredDeals.length === 1 ? "outro negócio" : "outros negócios"}
              </h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal: Deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell>
                        {format(new Date(deal.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{formatCurrency(deal.quoteValue || deal.value || 0)}</TableCell>
                      <TableCell>{getStatusBadge(deal.saleStatus)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onOpenDeal(deal.id)}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Abrir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-2" />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}