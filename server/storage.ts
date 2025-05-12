import { 
  users, type User, type InsertUser,
  pipelineStages, type PipelineStage, type InsertPipelineStage,
  deals, type Deal, type InsertDeal,
  settings, type Settings, type InsertSettings,
  clientMachines, type ClientMachine, type InsertClientMachine,
  lossReasons, type LossReason, type InsertLossReason,
  quoteItems, type QuoteItem, type InsertQuoteItem,
  leadActivities, type LeadActivity, type InsertLeadActivity,
  machineBrands, type MachineBrand, type InsertMachineBrand
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
  
  // Machine Brands (Marcas de máquinas)
  getMachineBrands(): Promise<MachineBrand[]>;
  getMachineBrand(id: number): Promise<MachineBrand | undefined>;
  createMachineBrand(brand: InsertMachineBrand): Promise<MachineBrand>;
  updateMachineBrand(id: number, brand: Partial<MachineBrand>): Promise<MachineBrand | undefined>;
  deleteMachineBrand(id: number): Promise<boolean>;
  
  // Quote Items (Itens da cotação)
  getQuoteItems(dealId: number): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<QuoteItem>): Promise<QuoteItem | undefined>;
  deleteQuoteItem(id: number): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Lead Activities
  getLeadActivities(dealId: number): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  deleteLeadActivity(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private stages: Map<number, PipelineStage> = new Map();
  private dealsList: Map<number, Deal> = new Map();
  private clientMachinesList: Map<number, ClientMachine> = new Map();
  private lossReasonsList: Map<number, LossReason> = new Map();
  private quoteItemsList: Map<number, QuoteItem> = new Map();
  private leadActivitiesList: Map<number, LeadActivity> = new Map();
  private machineBrandsList: Map<number, MachineBrand> = new Map();
  private appSettings: Settings | undefined;
  
  userCurrentId: number = 0;
  stageCurrentId: number = 0;
  dealCurrentId: number = 0;
  clientMachineCurrentId: number = 0;
  lossReasonCurrentId: number = 0;
  quoteItemCurrentId: number = 0;
  leadActivityCurrentId: number = 0;
  machineBrandCurrentId: number = 0;
  settingsCurrentId: number = 0;

  constructor() {
    // Os Maps já estão inicializados acima, não precisamos inicializar novamente
    
    // Ajustar IDs para começar em 1 e não em 0
    this.userCurrentId = 1;
    this.stageCurrentId = 1;
    this.dealCurrentId = 1;
    this.clientMachineCurrentId = 1;
    this.lossReasonCurrentId = 1;
    this.quoteItemCurrentId = 1;
    this.settingsCurrentId = 1;
    this.machineBrandCurrentId = 1;
    
    // Initialize with default pipeline stages
    this.initDefaultStages();
    
    // Initialize with default loss reasons
    this.initDefaultLossReasons();
    
    // Initialize with default machine brands
    this.initDefaultMachineBrands();
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
  
  private initDefaultLossReasons() {
    const defaultReasons = [
      { reason: "Preço alto", active: true },
      { reason: "Concorrência", active: true },
      { reason: "Prazo de entrega", active: true },
      { reason: "Indisponibilidade de peças", active: true },
      { reason: "Cliente desistiu", active: true },
      { reason: "Outro", active: true }
    ];
    
    defaultReasons.forEach(reason => {
      this.createLossReason(reason);
    });
  }
  
  private initDefaultMachineBrands() {
    const defaultBrands = [
      { name: "John Deere", description: "Fabricante global de equipamentos agrícolas", active: true },
      { name: "Massey Ferguson", description: "Marca de tratores e equipamentos agrícolas", active: true },
      { name: "New Holland", description: "Fabricante de máquinas agrícolas e de construção", active: true },
      { name: "Case IH", description: "Especializada em equipamentos agrícolas de alta potência", active: true },
      { name: "Valtra", description: "Fabricante finlandesa de tratores e implementos", active: true },
      { name: "Jacto", description: "Fabricante brasileira de pulverizadores e equipamentos", active: true }
    ];
    
    defaultBrands.forEach(brand => {
      this.createMachineBrand(brand);
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
  
  async getDealsBySaleStatus(saleStatus: string): Promise<Deal[]> {
    return Array.from(this.dealsList.values())
      .filter(deal => deal.saleStatus === saleStatus)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  // Client Machines methods
  async getClientMachines(dealId: number): Promise<ClientMachine[]> {
    return Array.from(this.clientMachinesList.values())
      .filter(machine => machine.dealId === dealId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createClientMachine(machine: InsertClientMachine): Promise<ClientMachine> {
    const id = this.clientMachineCurrentId++;
    const newMachine: ClientMachine = {
      ...machine,
      id,
      createdAt: new Date()
    };
    this.clientMachinesList.set(id, newMachine);
    
    // Atualizar contador de máquinas no negócio
    const deal = this.dealsList.get(machine.dealId);
    if (deal) {
      const currentCount = deal.machineCount || 0;
      this.updateDeal(deal.id, { machineCount: currentCount + 1 });
    }
    
    return newMachine;
  }
  
  async updateClientMachine(id: number, machine: Partial<ClientMachine>): Promise<ClientMachine | undefined> {
    const existingMachine = this.clientMachinesList.get(id);
    if (!existingMachine) {
      return undefined;
    }
    
    const updatedMachine = {
      ...existingMachine,
      ...machine
    };
    
    this.clientMachinesList.set(id, updatedMachine);
    return updatedMachine;
  }
  
  async deleteClientMachine(id: number): Promise<boolean> {
    const machine = this.clientMachinesList.get(id);
    if (!machine) {
      return false;
    }
    
    const result = this.clientMachinesList.delete(id);
    
    // Atualizar contador de máquinas no negócio
    if (result) {
      const deal = this.dealsList.get(machine.dealId);
      if (deal && deal.machineCount && deal.machineCount > 0) {
        this.updateDeal(deal.id, { machineCount: deal.machineCount - 1 });
      }
    }
    
    return result;
  }
  
  // Loss Reasons methods
  async getLossReasons(): Promise<LossReason[]> {
    return Array.from(this.lossReasonsList.values())
      .filter(reason => reason.active)
      .sort((a, b) => a.reason.localeCompare(b.reason));
  }
  
  async createLossReason(reason: InsertLossReason): Promise<LossReason> {
    const id = this.lossReasonCurrentId++;
    const newReason: LossReason = {
      ...reason,
      id,
      createdAt: new Date()
    };
    this.lossReasonsList.set(id, newReason);
    return newReason;
  }
  
  async updateLossReason(id: number, reason: Partial<LossReason>): Promise<LossReason | undefined> {
    const existingReason = this.lossReasonsList.get(id);
    if (!existingReason) {
      return undefined;
    }
    
    const updatedReason = {
      ...existingReason,
      ...reason
    };
    
    this.lossReasonsList.set(id, updatedReason);
    return updatedReason;
  }
  
  async deleteLossReason(id: number): Promise<boolean> {
    // Soft delete - apenas marcamos como inativo
    const existingReason = this.lossReasonsList.get(id);
    if (!existingReason) {
      return false;
    }
    
    existingReason.active = false;
    this.lossReasonsList.set(id, existingReason);
    return true;
  }
  
  // Quote Items methods
  async getQuoteItems(dealId: number): Promise<QuoteItem[]> {
    return Array.from(this.quoteItemsList.values())
      .filter(item => item.dealId === dealId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const id = this.quoteItemCurrentId++;
    const newItem: QuoteItem = {
      ...item,
      id,
      createdAt: new Date()
    };
    this.quoteItemsList.set(id, newItem);
    
    // Atualizar valor da cotação no negócio
    const deal = this.dealsList.get(item.dealId);
    if (deal) {
      const total = (deal.quoteValue || 0) + (item.unitPrice * item.quantity);
      this.updateDeal(deal.id, { quoteValue: total });
    }
    
    return newItem;
  }
  
  async updateQuoteItem(id: number, item: Partial<QuoteItem>): Promise<QuoteItem | undefined> {
    const existingItem = this.quoteItemsList.get(id);
    if (!existingItem) {
      return undefined;
    }
    
    // Calcular diferença no valor para atualizar o negócio
    let priceDifference = 0;
    if (item.unitPrice !== undefined || item.quantity !== undefined) {
      const oldValue = existingItem.unitPrice * existingItem.quantity;
      const newUnitPrice = item.unitPrice !== undefined ? item.unitPrice : existingItem.unitPrice;
      const newQuantity = item.quantity !== undefined ? item.quantity : existingItem.quantity;
      const newValue = newUnitPrice * newQuantity;
      priceDifference = newValue - oldValue;
    }
    
    const updatedItem = {
      ...existingItem,
      ...item
    };
    
    this.quoteItemsList.set(id, updatedItem);
    
    // Atualizar valor da cotação no negócio se houve mudança de preço
    if (priceDifference !== 0) {
      const deal = this.dealsList.get(existingItem.dealId);
      if (deal) {
        const total = (deal.quoteValue || 0) + priceDifference;
        this.updateDeal(deal.id, { quoteValue: total });
      }
    }
    
    return updatedItem;
  }
  
  async deleteQuoteItem(id: number): Promise<boolean> {
    const item = this.quoteItemsList.get(id);
    if (!item) {
      return false;
    }
    
    const result = this.quoteItemsList.delete(id);
    
    // Atualizar valor da cotação no negócio
    if (result) {
      const deal = this.dealsList.get(item.dealId);
      if (deal) {
        const valueToSubtract = item.unitPrice * item.quantity;
        const newTotal = Math.max(0, (deal.quoteValue || 0) - valueToSubtract);
        this.updateDeal(deal.id, { quoteValue: newTotal });
      }
    }
    
    return result;
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

  // Lead Activities methods
  async getLeadActivities(dealId: number): Promise<LeadActivity[]> {
    return Array.from(this.leadActivitiesList.values())
      .filter(activity => activity.dealId === dealId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const id = this.leadActivityCurrentId++;
    const now = new Date();
    const newActivity: LeadActivity = {
      ...activity,
      id,
      createdAt: now
    };
    this.leadActivitiesList.set(id, newActivity);
    return newActivity;
  }

  async deleteLeadActivity(id: number): Promise<boolean> {
    return this.leadActivitiesList.delete(id);
  }

  // Machine Brands (Marcas de máquinas)
  async getMachineBrands(): Promise<MachineBrand[]> {
    return Array.from(this.machineBrandsList.values());
  }

  async getMachineBrand(id: number): Promise<MachineBrand | undefined> {
    return this.machineBrandsList.get(id);
  }

  async createMachineBrand(brand: InsertMachineBrand): Promise<MachineBrand> {
    const id = ++this.machineBrandCurrentId;
    const createdAt = new Date();
    
    const newBrand: MachineBrand = {
      id,
      createdAt,
      name: brand.name,
      description: brand.description || null,
      active: brand.active === undefined ? true : brand.active,
    };
    
    this.machineBrandsList.set(id, newBrand);
    return newBrand;
  }

  async updateMachineBrand(id: number, brand: Partial<MachineBrand>): Promise<MachineBrand | undefined> {
    const existingBrand = this.machineBrandsList.get(id);
    
    if (!existingBrand) return undefined;
    
    const updatedBrand = { ...existingBrand, ...brand };
    this.machineBrandsList.set(id, updatedBrand);
    
    return updatedBrand;
  }

  async deleteMachineBrand(id: number): Promise<boolean> {
    return this.machineBrandsList.delete(id);
  }
}

export const storage = new MemStorage();
