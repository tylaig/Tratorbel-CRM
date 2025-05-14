#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Configuração do Neon para WebSockets com o módulo 'ws'
neonConfig.webSocketConstructor = ws;

async function createTables() {
  console.log('Iniciando criação das tabelas no banco de dados PostgreSQL...');
  
  // Configurando a conexão com o banco de dados
  const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.afnyxpbnzzbpysevaxas:28PZjRPynXJGfvGw@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL não está definida!');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Criar as tabelas manualmente com SQL
    console.log('Criando tabelas...');
    
    // Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);
    console.log('✓ Tabela users criada com sucesso.');
    
    // Pipelines
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        has_fixed_stages BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela pipelines criada com sucesso.');
    
    // Estágios do pipeline
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        pipeline_id INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_hidden BOOLEAN DEFAULT FALSE,
        is_system BOOLEAN DEFAULT FALSE,
        stage_type TEXT DEFAULT 'normal',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela pipeline_stages criada com sucesso.');
    
    // Leads/Contatos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company_name TEXT,
        chatwoot_contact_id TEXT,
        client_category TEXT DEFAULT 'final_consumer',
        client_type TEXT DEFAULT 'person',
        cnpj TEXT,
        corporate_name TEXT,
        cpf TEXT,
        state_registration TEXT,
        client_code TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        address_number TEXT,
        address_complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        chatwoot_agent_id TEXT,
        chatwoot_agent_name TEXT,
        notes TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela leads criada com sucesso.');
    
    // Deals (Negócios)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        lead_id INTEGER NOT NULL,
        stage_id INTEGER NOT NULL,
        pipeline_id INTEGER NOT NULL,
        "order" INTEGER DEFAULT 0,
        value DOUBLE PRECISION DEFAULT 0,
        quote_value DOUBLE PRECISION DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        sale_status TEXT DEFAULT 'negotiation',
        sale_performance TEXT,
        lost_reason TEXT,
        lost_notes TEXT,
        notes TEXT,
        chatwoot_conversation_id TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id),
        FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela deals criada com sucesso.');
    
    // Itens de Cotação
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quote_items (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        unit_price DOUBLE PRECISION DEFAULT 0 NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela quote_items criada com sucesso.');
    
    // Histórico de Estágios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stage_history (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        stage_id INTEGER NOT NULL,
        entered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        left_at TIMESTAMP,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id)
      );
    `);
    console.log('✓ Tabela stage_history criada com sucesso.');
    
    // Motivos de desempenho de venda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_performance_reasons (
        id SERIAL PRIMARY KEY,
        reason TEXT NOT NULL,
        value TEXT NOT NULL UNIQUE,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela sale_performance_reasons criada com sucesso.');
    
    // Configurações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        chatwoot_api_key TEXT,
        chatwoot_url TEXT,
        account_id TEXT,
        last_sync_at TIMESTAMP,
        active_pipeline_id INTEGER
      );
    `);
    console.log('✓ Tabela settings criada com sucesso.');
    
    // Máquinas do cliente
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_machines (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela client_machines criada com sucesso.');
    
    // Motivos de perda de negócio
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loss_reasons (
        id SERIAL PRIMARY KEY,
        reason TEXT NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela loss_reasons criada com sucesso.');
    
    // Atividades do Lead
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_activities (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by TEXT,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela lead_activities criada com sucesso.');
    
    // Marcas de máquinas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machine_brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabela machine_brands criada com sucesso.');
    
    // Modelos de máquinas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machine_models (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        brand_id INTEGER NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (brand_id) REFERENCES machine_brands(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela machine_models criada com sucesso.');
    
    // Inserir dados iniciais nos pipelines
    await pool.query(`
      INSERT INTO pipelines (name, description, is_default, has_fixed_stages, is_active)
      VALUES 
        ('Comercial', 'Funil para área comercial com estágios fixos de vendas realizadas e vendas perdidas', TRUE, TRUE, TRUE),
        ('Compras e Logística', 'Funil para área de compras e logística sem estágios fixos', FALSE, FALSE, TRUE)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Dados iniciais de pipelines inseridos com sucesso.');
    
    // Inserir estágios padrão
    await pool.query(`
      INSERT INTO pipeline_stages (name, "order", pipeline_id, is_default, is_hidden, is_system, stage_type)
      VALUES 
        ('Fornecedor', 1, 1, false, false, false, 'normal'),
        ('Retirada', 2, 1, false, false, false, 'normal'),
        ('Separação', 3, 1, false, false, false, 'normal'),
        ('Faturamento', 4, 1, false, false, false, 'normal'),
        ('Transportes', 5, 1, false, false, false, 'normal'),
        ('Concluído', 6, 1, false, false, false, 'completed'),
        ('Contatos Chatwoot', 7, 1, true, true, true, 'normal')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Estágios padrão inseridos com sucesso.');
    
    // Inserir motivos de perda padrão
    await pool.query(`
      INSERT INTO loss_reasons (reason, active)
      VALUES 
        ('Preço alto', true),
        ('Concorrência', true),
        ('Cliente desistiu', true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Motivos de perda padrão inseridos com sucesso.');
    
    // Inserir marcas de máquinas padrão
    await pool.query(`
      INSERT INTO machine_brands (name, description, active)
      VALUES 
        ('JCB', 'JCB Construction Equipment', true),
        ('Caterpillar', 'Caterpillar Inc.', true),
        ('John Deere', 'John Deere Construction & Forestry', true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Marcas de máquinas padrão inseridas com sucesso.');
    
    // Inserir motivos de desempenho de venda padrão
    await pool.query(`
      INSERT INTO sale_performance_reasons (reason, value, description, active, is_system)
      VALUES 
        ('Abaixo da cotação', 'below_quote', 'Venda fechada abaixo do valor cotado inicialmente', true, true),
        ('Conforme cotação', 'according_to_quote', 'Venda fechada conforme o valor cotado inicialmente', true, true),
        ('Acima da cotação', 'above_quote', 'Venda fechada acima do valor cotado inicialmente', true, true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Motivos de desempenho de venda padrão inseridos com sucesso.');
    
    console.log('✅ Todas as tabelas foram criadas com sucesso e os dados iniciais foram inseridos!');
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    process.exit(1);
  } finally {
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executar a criação das tabelas
createTables();