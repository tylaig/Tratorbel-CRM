import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { 
  insertDealSchema, 
  insertPipelineStageSchema, 
  insertSettingsSchema,
  insertClientMachineSchema,
  insertLossReasonSchema,
  insertQuoteItemSchema,
  insertLeadActivitySchema,
  insertMachineBrandSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Pipeline Stages routes
  apiRouter.get("/pipeline-stages", async (req: Request, res: Response) => {
    try {
      const stages = await storage.getPipelineStages();
      res.json(stages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });
  
  apiRouter.post("/pipeline-stages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPipelineStageSchema.parse(req.body);
      const stage = await storage.createPipelineStage(validatedData);
      res.status(201).json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create pipeline stage" });
      }
    }
  });
  
  apiRouter.put("/pipeline-stages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertPipelineStageSchema.partial().parse(req.body);
      const updatedStage = await storage.updatePipelineStage(id, validatedData);
      
      if (!updatedStage) {
        return res.status(404).json({ message: "Pipeline stage not found" });
      }
      
      res.json(updatedStage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update pipeline stage" });
      }
    }
  });
  
  apiRouter.delete("/pipeline-stages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deletePipelineStage(id);
      if (!success) {
        return res.status(404).json({ message: "Pipeline stage not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pipeline stage" });
    }
  });
  
  // Deals routes
  apiRouter.get("/deals", async (req: Request, res: Response) => {
    try {
      const stageId = req.query.stageId ? parseInt(req.query.stageId as string) : undefined;
      let deals;
      
      if (stageId && !isNaN(stageId)) {
        deals = await storage.getDealsByStage(stageId);
      } else {
        deals = await storage.getDeals();
      }
      
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });
  
  apiRouter.post("/deals", async (req: Request, res: Response) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create deal" });
      }
    }
  });
  
  apiRouter.put("/deals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertDealSchema.partial().parse(req.body);
      
      // Buscar o deal atual para verificar se houve alteração no nome
      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Sincronização bidirecional com Chatwoot
      if (validatedData.name && 
          validatedData.name !== existingDeal.name && 
          existingDeal.chatwootContactId) {
        
        try {
          // Obter configurações do Chatwoot
          const settings = await storage.getSettings();
          
          if (settings?.chatwootApiKey && settings?.chatwootUrl && settings?.accountId) {
            // Atualizar o nome do contato no Chatwoot
            await axios.put(
              `${settings.chatwootUrl}/api/v1/accounts/${settings.accountId}/contacts/${existingDeal.chatwootContactId}`,
              {
                name: validatedData.name,
                // Se tivermos outros campos que queremos sincronizar, podemos adicionar aqui
                email: validatedData.email || existingDeal.email,
                phone_number: validatedData.phone || existingDeal.phone
              },
              {
                headers: {
                  'api_access_token': settings.chatwootApiKey
                }
              }
            );
            
            console.log(`Contato Chatwoot ID ${existingDeal.chatwootContactId} sincronizado com nome: ${validatedData.name}`);
          }
        } catch (chatwootError) {
          console.error("Erro ao sincronizar com Chatwoot:", chatwootError);
          // Continuamos com a atualização local mesmo se a sincronização falhar
        }
      }
      
      const updatedDeal = await storage.updateDeal(id, validatedData);
      
      if (!updatedDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(updatedDeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update deal" });
      }
    }
  });
  
  apiRouter.delete("/deals/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteDeal(id);
      if (!success) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });
  
  // Rota para obter negócios por status de venda (won, lost)
  apiRouter.get("/deals/sale-status/:status", async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      if (status !== "won" && status !== "lost") {
        return res.status(400).json({ message: "Invalid status. Use 'won' or 'lost'" });
      }
      
      const deals = await storage.getDealsBySaleStatus(status);
      res.json(deals);
    } catch (error) {
      console.error(`Error getting ${req.params.status} deals:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter todos os negócios de um mesmo cliente (por chatwootContactId)
  apiRouter.get("/deals/contact/:contactId", async (req: Request, res: Response) => {
    try {
      const contactId = req.params.contactId;
      if (!contactId) {
        return res.status(400).json({ message: "Contact ID is required" });
      }
      
      const deals = await storage.getDealsByContactId(contactId);
      res.json(deals);
    } catch (error) {
      console.error("Error getting deals by contact ID:", error);
      res.status(500).json({ message: "Failed to fetch deals for this contact" });
    }
  });
  
  // Rotas de motivos de perda
  apiRouter.get("/loss-reasons", async (req: Request, res: Response) => {
    try {
      const reasons = await storage.getLossReasons();
      res.json(reasons);
    } catch (error) {
      console.error("Error getting loss reasons:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/loss-reasons", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLossReasonSchema.parse(req.body);
      const reason = await storage.createLossReason(validatedData);
      res.status(201).json(reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating loss reason:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  // Lead Activities routes
  apiRouter.get("/lead-activities/:dealId", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const activities = await storage.getLeadActivities(dealId);
      res.json(activities);
    } catch (error) {
      console.error("Error getting lead activities:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/lead-activities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadActivitySchema.parse(req.body);
      const activity = await storage.createLeadActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating lead activity:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/lead-activities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteLeadActivity(id);
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead activity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.put("/loss-reasons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertLossReasonSchema.partial().parse(req.body);
      const updatedReason = await storage.updateLossReason(id, validatedData);
      
      if (!updatedReason) {
        return res.status(404).json({ message: "Loss reason not found" });
      }
      
      res.json(updatedReason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating loss reason:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/loss-reasons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteLossReason(id);
      if (!success) {
        return res.status(404).json({ message: "Loss reason not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting loss reason:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Settings routes
  apiRouter.get("/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  apiRouter.post("/settings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  
  // Chatwoot API integration routes
  apiRouter.get("/chatwoot/contacts", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      
      if (!settings || !settings.chatwootApiKey || !settings.chatwootUrl || !settings.accountId) {
        return res.status(400).json({ message: "Chatwoot API not configured" });
      }
      
      const response = await axios.get(
        `${settings.chatwootUrl}/api/v1/accounts/${settings.accountId}/contacts`,
        {
          headers: {
            'api_access_token': settings.chatwootApiKey
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          message: "Failed to fetch Chatwoot contacts",
          error: error.response?.data || error.message
        });
      } else {
        res.status(500).json({ message: "Failed to fetch Chatwoot contacts" });
      }
    }
  });
  // Endpoint para atualizar um contato no Chatwoot
  apiRouter.put("/chatwoot/contact/:id", async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Nome inválido" });
      }
      
      const settings = await storage.getSettings();
      
      if (!settings || !settings.chatwootApiKey || !settings.chatwootUrl || !settings.accountId) {
        return res.status(400).json({ message: "Chatwoot API não configurada" });
      }
      
      const response = await axios.put(
        `${settings.chatwootUrl}/api/v1/accounts/${settings.accountId}/contacts/${contactId}`,
        { name },
        {
          headers: {
            'api_access_token': settings.chatwootApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao atualizar contato no Chatwoot:", error.response?.data);
        res.status(error.response?.status || 500).json({
          message: "Falha ao atualizar contato no Chatwoot",
          error: error.response?.data || error.message
        });
      } else {
        console.error("Erro ao atualizar contato no Chatwoot:", error);
        res.status(500).json({ message: "Falha ao atualizar contato no Chatwoot" });
      }
    }
  });
  
  apiRouter.post("/chatwoot/sync", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      
      if (!settings || !settings.chatwootApiKey || !settings.chatwootUrl || !settings.accountId) {
        return res.status(400).json({ message: "Chatwoot API not configured" });
      }
      
      // Get contacts from Chatwoot
      const response = await axios.get(
        `${settings.chatwootUrl}/api/v1/accounts/${settings.accountId}/contacts`,
        {
          headers: {
            'api_access_token': settings.chatwootApiKey
          }
        }
      );
      
      const contacts = response.data.payload || [];
      const existingDeals = await storage.getDeals();
      const existingChatwootIds = new Set(existingDeals.map(deal => deal.chatwootContactId));
      
      // Get first stage for new deals
      const stages = await storage.getPipelineStages();
      const firstStage = stages.length > 0 ? stages[0] : null;
      
      if (!firstStage) {
        return res.status(500).json({ message: "No pipeline stages configured" });
      }
      
      // Create deals for new contacts
      const newDeals = [];
      for (const contact of contacts) {
        if (!existingChatwootIds.has(contact.id.toString())) {
          try {
            // Obter informações da conversa associada ao contato
            const conversationsResponse = await axios.get(
              `${settings.chatwootUrl}/api/v1/accounts/${settings.accountId}/contacts/${contact.id}/conversations`,
              {
                headers: {
                  'api_access_token': settings.chatwootApiKey
                }
              }
            );
            
            let chatwootAgentId = null;
            let chatwootAgentName = null;
            let chatwootConversationId = null;
            
            if (conversationsResponse.data && 
                conversationsResponse.data.payload && 
                conversationsResponse.data.payload.length > 0) {
              const conversation = conversationsResponse.data.payload[0];
              chatwootConversationId = conversation.id?.toString();
              
              // Obter detalhes do agente se houver algum atribuído
              if (conversation.meta?.assignee) {
                chatwootAgentId = conversation.meta.assignee.id?.toString();
                chatwootAgentName = conversation.meta.assignee.name || 'Agente desconhecido';
              }
            }
            
            const newDeal = await storage.createDeal({
              name: contact.name || `Deal para ${contact.email || 'Cliente desconhecido'}`,
              companyName: contact.company_name || '',
              contactName: contact.name || '',
              contactId: '',
              chatwootContactId: contact.id.toString(),
              stageId: firstStage.id,
              value: 0,
              status: 'in_progress',
              // Incluir informações do agente do Chatwoot
              chatwootAgentId: chatwootAgentId,
              chatwootAgentName: chatwootAgentName,
              chatwootConversationId: chatwootConversationId,
              // Incluir dados de contato do Chatwoot
              email: contact.email || '',
              phone: contact.phone_number || ''
            });
            
            newDeals.push(newDeal);
          } catch (conversationError) {
            console.error(`Erro ao obter conversas para o contato ${contact.id}:`, conversationError);
            // Criar o deal mesmo sem as informações da conversa
            const newDeal = await storage.createDeal({
              name: contact.name || `Deal para ${contact.email || 'Cliente desconhecido'}`,
              companyName: contact.company_name || '',
              contactName: contact.name || '',
              contactId: '',
              chatwootContactId: contact.id.toString(),
              stageId: firstStage.id,
              value: 0,
              status: 'in_progress',
              email: contact.email || '',
              phone: contact.phone_number || ''
            });
            newDeals.push(newDeal);
          }
        }
      }
      
      // Update last sync time
      await storage.updateSettings({
        ...settings,
        lastSyncAt: new Date()
      });
      
      res.json({
        success: true,
        synced: newDeals.length,
        newDeals
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          message: "Failed to sync with Chatwoot",
          error: error.response?.data || error.message
        });
      } else {
        res.status(500).json({ message: "Failed to sync with Chatwoot" });
      }
    }
  });
  
  // Rotas para deals por status de venda (won/lost)
  apiRouter.get("/deals/sale-status/:status", async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      if (!status || !["won", "lost", "negotiation"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const deals = await storage.getDealsBySaleStatus(status);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals by status" });
    }
  });
  
  // Rotas para máquinas do cliente
  apiRouter.get("/client-machines/:dealId", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const machines = await storage.getClientMachines(dealId);
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client machines" });
    }
  });
  
  apiRouter.post("/client-machines", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientMachineSchema.parse(req.body);
      const machine = await storage.createClientMachine(validatedData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create client machine" });
      }
    }
  });
  
  apiRouter.put("/client-machines/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertClientMachineSchema.partial().parse(req.body);
      const updatedMachine = await storage.updateClientMachine(id, validatedData);
      
      if (!updatedMachine) {
        return res.status(404).json({ message: "Client machine not found" });
      }
      
      res.json(updatedMachine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update client machine" });
      }
    }
  });
  
  apiRouter.delete("/client-machines/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteClientMachine(id);
      if (!success) {
        return res.status(404).json({ message: "Client machine not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client machine" });
    }
  });
  
  // Rotas para motivos de perda
  apiRouter.get("/loss-reasons", async (req: Request, res: Response) => {
    try {
      const reasons = await storage.getLossReasons();
      res.json(reasons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loss reasons" });
    }
  });
  
  apiRouter.post("/loss-reasons", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLossReasonSchema.parse(req.body);
      const reason = await storage.createLossReason(validatedData);
      res.status(201).json(reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create loss reason" });
      }
    }
  });
  
  apiRouter.put("/loss-reasons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertLossReasonSchema.partial().parse(req.body);
      const updatedReason = await storage.updateLossReason(id, validatedData);
      
      if (!updatedReason) {
        return res.status(404).json({ message: "Loss reason not found" });
      }
      
      res.json(updatedReason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update loss reason" });
      }
    }
  });
  
  apiRouter.delete("/loss-reasons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteLossReason(id);
      if (!success) {
        return res.status(404).json({ message: "Loss reason not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete loss reason" });
    }
  });
  
  // Rotas para itens de cotação
  apiRouter.get("/quote-items/:dealId", async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const items = await storage.getQuoteItems(dealId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quote items" });
    }
  });
  
  apiRouter.post("/quote-items", async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuoteItemSchema.parse(req.body);
      const item = await storage.createQuoteItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create quote item" });
      }
    }
  });
  
  apiRouter.put("/quote-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertQuoteItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateQuoteItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Quote item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update quote item" });
      }
    }
  });
  
  apiRouter.delete("/quote-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteQuoteItem(id);
      if (!success) {
        return res.status(404).json({ message: "Quote item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quote item" });
    }
  });
  
  // Machine Brands Routes
  apiRouter.get("/machine-brands", async (req: Request, res: Response) => {
    try {
      const brands = await storage.getMachineBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch machine brands" });
    }
  });
  
  apiRouter.get("/machine-brands/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const brand = await storage.getMachineBrand(id);
      if (!brand) {
        return res.status(404).json({ message: "Machine brand not found" });
      }
      
      res.json(brand);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch machine brand" });
    }
  });
  
  apiRouter.post("/machine-brands", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMachineBrandSchema.parse(req.body);
      const brand = await storage.createMachineBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create machine brand" });
      }
    }
  });
  
  apiRouter.put("/machine-brands/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertMachineBrandSchema.partial().parse(req.body);
      const updatedBrand = await storage.updateMachineBrand(id, validatedData);
      
      if (!updatedBrand) {
        return res.status(404).json({ message: "Machine brand not found" });
      }
      
      res.json(updatedBrand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update machine brand" });
      }
    }
  });
  
  apiRouter.delete("/machine-brands/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteMachineBrand(id);
      if (!success) {
        return res.status(404).json({ message: "Machine brand not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete machine brand" });
    }
  });

  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
