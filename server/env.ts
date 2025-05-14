import * as fs from 'fs';
import * as path from 'path';

// Função para carregar variáveis do arquivo .env
function loadEnv() {
  try {
    // Caminho para o arquivo .env na raiz do projeto
    const envPath = path.resolve(process.cwd(), '.env');
    
    // Verificar se o arquivo existe
    if (fs.existsSync(envPath)) {
      console.log('Carregando variáveis de ambiente do arquivo .env...');
      
      // Ler o conteúdo do arquivo
      const envContent = fs.readFileSync(envPath, 'utf-8');
      
      // Dividir o conteúdo em linhas e processar cada linha
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        // Ignorar linhas em branco ou comentários
        if (!line || line.startsWith('#')) continue;
        
        // Tentar extrair chave e valor
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?(.*?)["']?\s*$/);
        if (match) {
          const key = match[1];
          const value = match[2];
          
          // Definir a variável de ambiente se ainda não estiver definida
          if (!process.env[key]) {
            process.env[key] = value;
            console.log(`Definida variável de ambiente: ${key}`);
          }
        }
      }
      
      console.log('Variáveis de ambiente carregadas com sucesso.');
    } else {
      console.warn('Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.');
    }
  } catch (error) {
    console.error('Erro ao carregar variáveis de ambiente:', error);
  }
}

// Carregar as variáveis de ambiente
loadEnv();

// Exportar variáveis importantes
export const DATABASE_URL = "postgresql://postgres.afnyxpbnzzbpysevaxas:28PZjRPynXJGfvGw@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";