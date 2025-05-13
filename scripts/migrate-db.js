import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// Configurar o WebSocket para o Neon
neonConfig.webSocketConstructor = ws;

// Verifica se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está definida. Por favor, configure as variáveis de ambiente corretamente.');
  process.exit(1);
}

async function executeMigration() {
  console.log('Iniciando migração do banco de dados...');
  
  // Cria uma conexão com o banco de dados
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Obtém o caminho atual do arquivo
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Lê o arquivo SQL
    const sqlFilePath = path.join(__dirname, '../database-migrations.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Divide o conteúdo SQL em comandos individuais
    const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim() !== '');
    
    // Executa cada comando
    for (const [index, cmd] of sqlCommands.entries()) {
      try {
        const trimmedCmd = cmd.trim();
        if (trimmedCmd.length > 0) {
          // Adiciona o ponto e vírgula de volta, que foi removido pelo split
          await pool.query(`${trimmedCmd};`);
          console.log(`✓ Comando ${index + 1}/${sqlCommands.length} executado com sucesso`);
        }
      } catch (err) {
        console.error(`✗ Erro ao executar comando ${index + 1}/${sqlCommands.length}:`, err.message);
        // Continue com o próximo comando mesmo se este falhar
      }
    }
    
    console.log('Migração do banco de dados concluída com sucesso!');
  } catch (err) {
    console.error('Erro durante a migração:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeMigration().catch(err => {
  console.error('Erro não tratado durante a migração:', err);
  process.exit(1);
});