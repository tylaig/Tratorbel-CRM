export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d atrás`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} meses atrás`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} anos atrás`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  
  // Remove o código do país (+55) e qualquer prefixo de contato (+123456)
  const cleanPhone = phone.replace(/^\+\d+\s*/, '');
  
  // Se já estiver formatado no padrão brasileiro (00) 00000-0000, retornar como está
  if (/^\(\d{2}\)\s*\d{5}-\d{4}$/.test(cleanPhone)) {
    return cleanPhone;
  }
  
  // Limpa outros caracteres não numéricos
  const numbers = cleanPhone.replace(/\D/g, '');
  
  // Formata como (XX) XXXXX-XXXX se tiver 11 dígitos
  // ou como (XX) XXXX-XXXX se tiver 10 dígitos
  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
  }
  
  // Se não tiver o formato esperado, retorna como está
  return cleanPhone;
}
