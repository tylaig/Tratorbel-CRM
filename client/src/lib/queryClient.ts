import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  console.log(`API Request: ${method} ${url}`, data);
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Log da resposta
    console.log(`API Response status: ${res.status} ${res.statusText}`);
    
    try {
      await throwIfResNotOk(res);
      
      // Para métodos que podem não retornar JSON (como DELETE)
      if (method === "DELETE" || res.headers.get("content-length") === "0") {
        return { success: true };
      }
      
      // Tentar retornar o resultado como JSON
      try {
        const responseData = await res.json();
        console.log(`API Response data:`, responseData);
        return responseData;
      } catch (e) {
        console.log(`Não foi possível converter resposta para JSON`, e);
        // Se não conseguir converter para JSON, retorna um objeto com success
        return { success: true };
      }
    } catch (error) {
      console.error(`API Error:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`API Request Error (fetch failed):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Se o queryKey for um array com múltiplos valores, use os valores adicionais como query params
    let url = queryKey[0] as string;
    
    // Se houver parâmetros adicionais (como pipelineId), adicioná-los como query params
    if (queryKey.length > 1 && queryKey[1] !== undefined && queryKey[1] !== null) {
      const queryParams = new URLSearchParams();
      
      // Se o segundo item for um número, assumimos que é pipelineId para compatibilidade
      if (typeof queryKey[1] === 'number') {
        queryParams.append('pipelineId', queryKey[1].toString());
      } 
      // Se for um objeto, iterar sobre as propriedades e adicionar como query params
      else if (typeof queryKey[1] === 'object' && queryKey[1] !== null) {
        Object.entries(queryKey[1]).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      // Se houver params, adicionar à URL
      const paramsStr = queryParams.toString();
      if (paramsStr) {
        url += url.includes('?') ? `&${paramsStr}` : `?${paramsStr}`;
      }
    }
    
    console.log(`Fetching URL with params: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // Revalidar quando a janela ganhar foco
      staleTime: 10000,            // Dados serão considerados obsoletos após 10 segundos
      retry: false,
      refetchOnMount: true,        // Revalidar quando o componente for montado
    },
    mutations: {
      retry: false,
    },
  },
});