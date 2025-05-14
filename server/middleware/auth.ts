import { Request, Response, NextFunction } from 'express';

// API key padrão que será usada para autenticação
const DEFAULT_API_KEY = "d775QkMPBm6EdCeJp22Q4lZPM7C2vLjYAxDw";

/**
 * Middleware para verificar se a requisição contém uma API key válida
 * A API key pode ser enviada no header 'x-api-key' ou como query parameter 'apikey'
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Verificar no header HTTP
  const apiKeyHeader = req.headers['x-api-key'] as string;
  
  // Verificar nos query parameters
  const apiKeyQuery = req.query.apikey as string;
  
  // Verificar no body da requisição
  const apiKeyBody = req.body?.apiKey as string;
  
  // Usar qualquer um dos métodos de autenticação
  const apiKey = apiKeyHeader || apiKeyQuery || apiKeyBody;
  
  // Se não houver API key, retornar erro 401 (Unauthorized)
  if (!apiKey) {
    return res.status(401).json({
      message: "API key não fornecida. Por favor, forneça uma chave de API válida no header 'x-api-key', no query parameter 'apikey' ou no corpo da requisição como 'apiKey'."
    });
  }
  
  // Verificar se a API key é válida
  if (apiKey !== DEFAULT_API_KEY) {
    return res.status(403).json({
      message: "API key inválida. Por favor, forneça uma chave de API válida."
    });
  }
  
  // Se a API key for válida, prosseguir com a requisição
  next();
};