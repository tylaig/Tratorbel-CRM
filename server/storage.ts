import { 
  users, type User, type InsertUser,
  pipelineStages, type PipelineStage, type InsertPipelineStage,
  deals, type Deal, type InsertDeal,
  settings, type Settings, type InsertSettings,
  clientMachines, type ClientMachine, type InsertClientMachine,
  lossReasons, type LossReason, type InsertLossReason,
  quoteItems, type QuoteItem, type InsertQuoteItem
} from "@shared/schema";

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pipeline Stages
  getPipelineStages(): Promise<PipelineStage[]>;
  getPipelineStage(id: number): Promise<PipelineStage | undefined>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  updatePipelineStage(id: number, stage: Partial<PipelineStage>): Promise<PipelineStage | undefined>;
  deletePipelineStage(id: number): Promise<boolean>;
  
  // Deals
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  getDealsByStage(stageId: number): Promise<Deal[]>;
  // Novos métodos para filtrar por status de venda
  getDealsBySaleStatus(saleStatus: string): Promise<Deal[]>;
  
  // Client Machines (Máquinas do cliente)
  getClientMachines(dealId: number): Promise<ClientMachine[]>;
  createClientMachine(machine: InsertClientMachine): Promise<ClientMachine>;
  updateClientMachine(id: number, machine: Partial<ClientMachine>): Promise<ClientMachine | undefined>;
  deleteClientMachine(id: number): Promise<boolean>;
  
  // Loss Reasons (Motivos de perda)
  getLossReasons(): Promise<LossReason[]>;
  createLossReason(reason: InsertLossReason): Promise<LossReason>;
  updateLossReason(id: number, reason: Partial<LossReason>): Promise<LossReason | undefined>;
  deleteLossReason(id: number): Promise<boolean>;
  
  // Quote Items (Itens da cotação)
  getQuoteItems(dealId: number): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<QuoteItem>): Promise<QuoteItem | undefined>;
  deleteQuoteItem(id: number): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stages: Map<number, PipelineStage>;
  private dealsList: Map<number, Deal>;
  private clientMachinesList: Map<number, ClientMachine>;
  private lossReasonsList: Map<number, LossReason>;
  private quoteItemsList: Map<number, QuoteItem>;
  private appSettings: Settings | undefined;
  
  userCurrentId: number;
  stageCurrentId: number;
  dealCurrentId: number;
  clientMachineCurrentId: number;
  lossReasonCurrentId: number;
  quoteItemCurrentId: number;
  settingsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.stages = new Map();
    this.dealsList = new Map();
    
    this.userCurrentId = 1;
    this.stageCurrentId = 1;
    this.dealCurrentId = 1;
    this.settingsCurrentId = 1;
    
    // Initialize with default pipeline stages
    this.initDefaultStages();
  }
  
  private initDefaultStages() {
    const defaultStages = [
      { name: "Fornecedor", order: 1 },
      { name: "Retirada", order: 2 },
      { name: "Separação", order: 3 },
      { name: "Faturamento", order: 4 },
      { name: "Transportes", order: 5 },
      { name: "Concluído", order: 6 }
    ];
    
    defaultStages.forEach(stage => {
      this.createPipelineStage(stage);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Pipeline Stage methods
  async getPipelineStages(): Promise<PipelineStage[]> {
    return Array.from(this.stages.values())
      .sort((a, b) => a.order - b.order);
  }
  
  async getPipelineStage(id: number): Promise<PipelineStage | undefined> {
    return this.stages.get(id);
  }
  
  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const id = this.stageCurrentId++;
    const now = new Date();
    const stage: PipelineStage = { 
      ...insertStage, 
      id, 
      createdAt: now 
    };
    this.stages.set(id, stage);
    return stage;
  }
  
  async updatePipelineStage(id: number, updatedStage: Partial<PipelineStage>): Promise<PipelineStage | undefined> {
    const stage = this.stages.get(id);
    if (!stage) return undefined;
    
    const updated = { ...stage, ...updatedStage };
    this.stages.set(id, updated);
    return updated;
  }
  
  async deletePipelineStage(id: number): Promise<boolean> {
    return this.stages.delete(id);
  }
  
  // Deal methods
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.dealsList.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.dealsList.get(id);
  }
  
  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.dealCurrentId++;
    const now = new Date();
    const deal: Deal = { 
      ...insertDeal, 
      id, 
      updatedAt: now, 
      createdAt: now 
    };
    this.dealsList.set(id, deal);
    return deal;
  }
  
  async updateDeal(id: number, updatedDeal: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.dealsList.get(id);
    if (!deal) return undefined;
    
    const now = new Date();
    const updated = { 
      ...deal, 
      ...updatedDeal,
      quoteItems: updatedDeal.quoteItems || deal.quoteItems || [],
      updatedAt: now
    };
    this.dealsList.set(id, updated);
    return updated;
  }
  
  async deleteDeal(id: number): Promise<boolean> {
    return this.dealsList.delete(id);
  }
  
  async getDealsByStage(stageId: number): Promise<Deal[]> {
    return Array.from(this.dealsList.values())
      .filter(deal => deal.stageId === stageId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.appSettings;
  }
  
  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const now = new Date();
    if (!this.appSettings) {
      const id = this.settingsCurrentId++;
      this.appSettings = {
        ...insertSettings,
        id,
        lastSyncAt: now,
      };
    } else {
      this.appSettings = {
        ...this.appSettings,
        ...insertSettings,
        lastSyncAt: now,
      };
    }
    return this.appSettings;
  }
}

export const storage = new MemStorage();
