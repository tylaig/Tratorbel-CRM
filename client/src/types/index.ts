// Chatwoot API Types
export interface ChatwootContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  created_at: string;
  custom_attributes?: Record<string, any>;
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Local App Types
export interface DealStatus {
  value: string;
  label: string;
  color: string;
}

export interface DealWithContact {
  id: number;
  name: string;
  companyName?: string;
  contactName?: string;
  stageId: number;
  stageName?: string;
  value: number;
  status: string;
  statusLabel?: string;
  updatedAt: Date;
  createdAt: Date;
  contactInfo?: ChatwootContact;
}

export interface StageWithStats {
  id: number;
  name: string;
  order: number;
  dealCount: number;
  totalValue: number;
}

export interface ApiConfig {
  chatwootApiKey: string;
  chatwootUrl: string;
  accountId: string;
}
