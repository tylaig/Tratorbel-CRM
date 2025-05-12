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
  insertQuoteItemSchema
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
          const newDeal = await storage.createDeal({
            name: contact.name || `Deal for ${contact.email || 'Unknown'}`,
            companyName: contact.company_name || '',
            contactName: contact.name || '',
            contactId: '',
            chatwootContactId: contact.id.toString(),
            stageId: firstStage.id,
            value: 0,
            status: 'in_progress'
          });
          newDeals.push(newDeal);
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

  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
