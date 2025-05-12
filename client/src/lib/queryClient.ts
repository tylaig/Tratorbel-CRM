import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Para métodos que podem não retornar JSON (como DELETE)
  if (method === "DELETE" || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  // Tentar retornar o resultado como JSON
  try {
    return await res.json();
  } catch (e) {
    // Se não conseguir converter para JSON, retorna um objeto com success
    return { success: true };
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
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
