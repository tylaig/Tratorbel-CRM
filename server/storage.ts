import { 
  users, type User, type InsertUser,
  pipelineStages, type PipelineStage, type InsertPipelineStage,
  deals, type Deal, type InsertDeal,
  settings, type Settings, type InsertSettings,
  clientMachines, type ClientMachine, type InsertClientMachine,
  lossReasons, type LossReason, type InsertLossReason,
  quoteItems, type QuoteItem, type InsertQuoteItem,
  leadActivities, type LeadActivity, type InsertLeadActivity,
  machineBrands, type MachineBrand, type InsertMachineBrand,
  leads, type Lead, type InsertLead
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, like } from "drizzle-orm";

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leads (Contatos)
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByChatwootId(chatwootContactId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  searchLeads(query: string): Promise<Lead[]>;
  
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
  // Métodos para filtrar deals
  getDealsBySaleStatus(saleStatus: string): Promise<Deal[]>;
  getDealsByLeadId(leadId: number): Promise<Deal[]>;
  
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
      { name: "Fornecedor", order: 1, isDefault: false, isHidden: false },
      { name: "Retirada", order: 2, isDefault: false, isHidden: false },
      { name: "Separação", order: 3, isDefault: false, isHidden: false },
      { name: "Faturamento", order: 4, isDefault: false, isHidden: false },
      { name: "Transportes", order: 5, isDefault: false, isHidden: false },
      { name: "Concluído", order: 6, isDefault: false, isHidden: false },
      { name: "Contatos Chatwoot", order: 7, isDefault: true, isHidden: true }
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
  
  async getDealsByContactId(contactId: string): Promise<Deal[]> {
    return Array.from(this.dealsList.values())
      .filter(deal => deal.chatwootContactId === contactId)
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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Leads (Contatos)
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.updatedAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadByChatwootId(chatwootContactId: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.chatwootContactId, chatwootContactId));
    return lead || undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    try {
      console.log("DatabaseStorage.createLead - Inserindo lead:", JSON.stringify(insertLead));
      
      // Remover campo isCompany se existir (não está no esquema)
      if ('isCompany' in insertLead) {
        const typedLead = insertLead as any;
        delete typedLead.isCompany;
      }
      
      const [lead] = await db
        .insert(leads)
        .values(insertLead)
        .returning();
      
      console.log("DatabaseStorage.createLead - Lead inserido com sucesso:", JSON.stringify(lead));
      return lead;
    } catch (error) {
      console.error("DatabaseStorage.createLead - Erro ao inserir lead:", error);
      throw error;
    }
  }

  async updateLead(id: number, updateData: Partial<Lead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db
      .delete(leads)
      .where(eq(leads.id, id));
    return !!result;
  }

  async searchLeads(query: string): Promise<Lead[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(leads)
      .where(
        or(
          like(leads.name, searchTerm),
          like(leads.companyName || '', searchTerm),
          like(leads.email || '', searchTerm),
          like(leads.phone || '', searchTerm),
          like(leads.cnpj || '', searchTerm),
          like(leads.cpf || '', searchTerm)
        )
      )
      .orderBy(desc(leads.updatedAt));
  }

  // Pipeline Stages
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await db.select().from(pipelineStages).orderBy(asc(pipelineStages.order));
  }

  async getPipelineStage(id: number): Promise<PipelineStage | undefined> {
    const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id));
    return stage || undefined;
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const [stage] = await db
      .insert(pipelineStages)
      .values(insertStage)
      .returning();
    return stage;
  }

  async updatePipelineStage(id: number, updateData: Partial<PipelineStage>): Promise<PipelineStage | undefined> {
    const [stage] = await db
      .update(pipelineStages)
      .set(updateData)
      .where(eq(pipelineStages.id, id))
      .returning();
    return stage || undefined;
  }

  async deletePipelineStage(id: number): Promise<boolean> {
    const result = await db
      .delete(pipelineStages)
      .where(eq(pipelineStages.id, id));
    return !!result;
  }

  // Deals
  async getDeals(): Promise<(Deal & Partial<Lead>)[]> {
    // Fazer um join com a tabela leads para trazer os dados do lead junto com o deal
    return await db
      .select({
        ...deals,
        // Campos do Lead com prefixo para evitar conflitos
        companyName: leads.companyName,
        clientCategory: leads.clientCategory,
        clientType: leads.clientType,
        cnpj: leads.cnpj,
        corporateName: leads.corporateName,
        cpf: leads.cpf,
        stateRegistration: leads.stateRegistration,
        clientCode: leads.clientCode,
        email: leads.email,
        phone: leads.phone,
        address: leads.address,
        addressNumber: leads.addressNumber,
        addressComplement: leads.addressComplement,
        neighborhood: leads.neighborhood,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        chatwootContactId: leads.chatwootContactId,
        chatwootAgentId: leads.chatwootAgentId,
        chatwootAgentName: leads.chatwootAgentName,
      })
      .from(deals)
      .leftJoin(leads, eq(deals.leadId, leads.id))
      .orderBy(desc(deals.updatedAt));
  }

  async getDeal(id: number): Promise<(Deal & Partial<Lead>) | undefined> {
    const [deal] = await db
      .select({
        ...deals,
        // Campos do Lead com prefixo para evitar conflitos
        companyName: leads.companyName,
        clientCategory: leads.clientCategory,
        clientType: leads.clientType,
        cnpj: leads.cnpj,
        corporateName: leads.corporateName,
        cpf: leads.cpf,
        stateRegistration: leads.stateRegistration,
        clientCode: leads.clientCode,
        email: leads.email,
        phone: leads.phone,
        address: leads.address,
        addressNumber: leads.addressNumber,
        addressComplement: leads.addressComplement,
        neighborhood: leads.neighborhood,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        chatwootContactId: leads.chatwootContactId,
        chatwootAgentId: leads.chatwootAgentId,
        chatwootAgentName: leads.chatwootAgentName,
      })
      .from(deals)
      .leftJoin(leads, eq(deals.leadId, leads.id))
      .where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values(insertDeal)
      .returning();
    return deal;
  }

  async updateDeal(id: number, updateData: Partial<Deal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db
      .delete(deals)
      .where(eq(deals.id, id));
    return !!result;
  }

  async getDealsByStage(stageId: number): Promise<(Deal & Partial<Lead>)[]> {
    return await db
      .select({
        ...deals,
        // Campos do Lead com prefixo para evitar conflitos
        companyName: leads.companyName,
        clientCategory: leads.clientCategory,
        clientType: leads.clientType,
        cnpj: leads.cnpj,
        corporateName: leads.corporateName,
        cpf: leads.cpf,
        stateRegistration: leads.stateRegistration,
        clientCode: leads.clientCode,
        email: leads.email,
        phone: leads.phone,
        address: leads.address,
        addressNumber: leads.addressNumber,
        addressComplement: leads.addressComplement,
        neighborhood: leads.neighborhood,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        chatwootContactId: leads.chatwootContactId,
        chatwootAgentId: leads.chatwootAgentId,
        chatwootAgentName: leads.chatwootAgentName,
      })
      .from(deals)
      .leftJoin(leads, eq(deals.leadId, leads.id))
      .where(eq(deals.stageId, stageId))
      .orderBy(desc(deals.updatedAt));
  }

  async getDealsBySaleStatus(saleStatus: string): Promise<(Deal & Partial<Lead>)[]> {
    return await db
      .select({
        ...deals,
        // Campos do Lead com prefixo para evitar conflitos
        companyName: leads.companyName,
        clientCategory: leads.clientCategory,
        clientType: leads.clientType,
        cnpj: leads.cnpj,
        corporateName: leads.corporateName,
        cpf: leads.cpf,
        stateRegistration: leads.stateRegistration,
        clientCode: leads.clientCode,
        email: leads.email,
        phone: leads.phone,
        address: leads.address,
        addressNumber: leads.addressNumber,
        addressComplement: leads.addressComplement,
        neighborhood: leads.neighborhood,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        chatwootContactId: leads.chatwootContactId,
        chatwootAgentId: leads.chatwootAgentId,
        chatwootAgentName: leads.chatwootAgentName,
      })
      .from(deals)
      .leftJoin(leads, eq(deals.leadId, leads.id))
      .where(eq(deals.saleStatus, saleStatus))
      .orderBy(desc(deals.updatedAt));
  }

  async getDealsByLeadId(leadId: number): Promise<(Deal & Partial<Lead>)[]> {
    return await db
      .select({
        ...deals,
        // Campos do Lead com prefixo para evitar conflitos
        companyName: leads.companyName,
        clientCategory: leads.clientCategory,
        clientType: leads.clientType,
        cnpj: leads.cnpj,
        corporateName: leads.corporateName,
        cpf: leads.cpf,
        stateRegistration: leads.stateRegistration,
        clientCode: leads.clientCode,
        email: leads.email,
        phone: leads.phone,
        address: leads.address,
        addressNumber: leads.addressNumber,
        addressComplement: leads.addressComplement,
        neighborhood: leads.neighborhood,
        city: leads.city,
        state: leads.state,
        zipCode: leads.zipCode,
        chatwootContactId: leads.chatwootContactId,
        chatwootAgentId: leads.chatwootAgentId,
        chatwootAgentName: leads.chatwootAgentName,
      })
      .from(deals)
      .leftJoin(leads, eq(deals.leadId, leads.id))
      .where(eq(deals.leadId, leadId))
      .orderBy(desc(deals.updatedAt));
  }

  // Client Machines
  async getClientMachines(dealId: number): Promise<ClientMachine[]> {
    return await db
      .select()
      .from(clientMachines)
      .where(eq(clientMachines.dealId, dealId))
      .orderBy(desc(clientMachines.createdAt));
  }

  async createClientMachine(insertMachine: InsertClientMachine): Promise<ClientMachine> {
    const [machine] = await db
      .insert(clientMachines)
      .values(insertMachine)
      .returning();
    
    // Atualizar contador de máquinas no negócio
    const deal = await this.getDeal(insertMachine.dealId);
    if (deal) {
      const currentCount = deal.machineCount || 0;
      await this.updateDeal(deal.id, { machineCount: currentCount + 1 });
    }
    
    return machine;
  }

  async updateClientMachine(id: number, updateData: Partial<ClientMachine>): Promise<ClientMachine | undefined> {
    const [machine] = await db
      .update(clientMachines)
      .set(updateData)
      .where(eq(clientMachines.id, id))
      .returning();
    return machine || undefined;
  }

  async deleteClientMachine(id: number): Promise<boolean> {
    const [machine] = await db
      .select()
      .from(clientMachines)
      .where(eq(clientMachines.id, id));
    
    if (!machine) return false;
    
    const result = await db
      .delete(clientMachines)
      .where(eq(clientMachines.id, id));
    
    if (result) {
      const deal = await this.getDeal(machine.dealId);
      if (deal && deal.machineCount && deal.machineCount > 0) {
        await this.updateDeal(deal.id, { machineCount: deal.machineCount - 1 });
      }
    }
    
    return !!result;
  }

  // Loss Reasons
  async getLossReasons(): Promise<LossReason[]> {
    return await db
      .select()
      .from(lossReasons)
      .where(eq(lossReasons.active, true))
      .orderBy(asc(lossReasons.reason));
  }

  async createLossReason(insertReason: InsertLossReason): Promise<LossReason> {
    const [reason] = await db
      .insert(lossReasons)
      .values(insertReason)
      .returning();
    return reason;
  }

  async updateLossReason(id: number, updateData: Partial<LossReason>): Promise<LossReason | undefined> {
    const [reason] = await db
      .update(lossReasons)
      .set(updateData)
      .where(eq(lossReasons.id, id))
      .returning();
    return reason || undefined;
  }

  async deleteLossReason(id: number): Promise<boolean> {
    // Soft delete - apenas marcamos como inativo
    const [reason] = await db
      .update(lossReasons)
      .set({ active: false })
      .where(eq(lossReasons.id, id))
      .returning();
    return !!reason;
  }

  // Quote Items
  async getQuoteItems(dealId: number): Promise<QuoteItem[]> {
    return await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.dealId, dealId))
      .orderBy(asc(quoteItems.createdAt));
  }

  async createQuoteItem(insertItem: InsertQuoteItem): Promise<QuoteItem> {
    const [item] = await db
      .insert(quoteItems)
      .values(insertItem)
      .returning();
    
    // Atualizar valor da cotação no negócio
    const deal = await this.getDeal(insertItem.dealId);
    if (deal) {
      const total = (deal.quoteValue || 0) + (insertItem.unitPrice * insertItem.quantity);
      await this.updateDeal(deal.id, { quoteValue: total });
    }
    
    return item;
  }

  async updateQuoteItem(id: number, updateData: Partial<QuoteItem>): Promise<QuoteItem | undefined> {
    const oldItem = (await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.id, id)))[0];
    
    if (!oldItem) return undefined;
    
    // Calcular diferença no valor para atualizar o negócio
    let priceDifference = 0;
    if (updateData.unitPrice !== undefined || updateData.quantity !== undefined) {
      const oldValue = oldItem.unitPrice * oldItem.quantity;
      const newUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : oldItem.unitPrice;
      const newQuantity = updateData.quantity !== undefined ? updateData.quantity : oldItem.quantity;
      const newValue = newUnitPrice * newQuantity;
      priceDifference = newValue - oldValue;
    }
    
    const [item] = await db
      .update(quoteItems)
      .set(updateData)
      .where(eq(quoteItems.id, id))
      .returning();
    
    // Atualizar valor da cotação no negócio se houve mudança de preço
    if (priceDifference !== 0) {
      const deal = await this.getDeal(oldItem.dealId);
      if (deal) {
        const total = (deal.quoteValue || 0) + priceDifference;
        await this.updateDeal(deal.id, { quoteValue: total });
      }
    }
    
    return item || undefined;
  }

  async deleteQuoteItem(id: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.id, id));
    
    if (!item) return false;
    
    const result = await db
      .delete(quoteItems)
      .where(eq(quoteItems.id, id));
    
    if (result) {
      const deal = await this.getDeal(item.dealId);
      if (deal) {
        const valueToSubtract = item.unitPrice * item.quantity;
        const newTotal = Math.max(0, (deal.quoteValue || 0) - valueToSubtract);
        await this.updateDeal(deal.id, { quoteValue: newTotal });
      }
    }
    
    return !!result;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings);
    return setting || undefined;
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Verificar se já existe configuração
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      // Atualizar configuração existente
      const [updated] = await db
        .update(settings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      // Criar nova configuração
      const [created] = await db
        .insert(settings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }

  // Lead Activities
  async getLeadActivities(dealId: number): Promise<LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.dealId, dealId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async createLeadActivity(insertActivity: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db
      .insert(leadActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async deleteLeadActivity(id: number): Promise<boolean> {
    const result = await db
      .delete(leadActivities)
      .where(eq(leadActivities.id, id));
    return !!result;
  }

  // Machine Brands
  async getMachineBrands(): Promise<MachineBrand[]> {
    return await db
      .select()
      .from(machineBrands)
      .where(eq(machineBrands.active, true))
      .orderBy(asc(machineBrands.name));
  }

  async getMachineBrand(id: number): Promise<MachineBrand | undefined> {
    const [brand] = await db
      .select()
      .from(machineBrands)
      .where(eq(machineBrands.id, id));
    return brand || undefined;
  }

  async createMachineBrand(insertBrand: InsertMachineBrand): Promise<MachineBrand> {
    const [brand] = await db
      .insert(machineBrands)
      .values(insertBrand)
      .returning();
    return brand;
  }

  async updateMachineBrand(id: number, updateData: Partial<MachineBrand>): Promise<MachineBrand | undefined> {
    const [brand] = await db
      .update(machineBrands)
      .set(updateData)
      .where(eq(machineBrands.id, id))
      .returning();
    return brand || undefined;
  }

  async deleteMachineBrand(id: number): Promise<boolean> {
    // Soft delete - apenas marcamos como inativo
    const [brand] = await db
      .update(machineBrands)
      .set({ active: false })
      .where(eq(machineBrands.id, id))
      .returning();
    return !!brand;
  }
}

// Inicializar o storage usando o DatabaseStorage
export const storage = new DatabaseStorage();
