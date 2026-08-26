import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getStatusDetails(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Aguardando Confirmação',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeColor: 'bg-amber-500',
        step: 1,
        icon: 'Clock',
        description: 'Seu pedido foi recebido pelo restaurante e aguarda aceite da cozinha.',
      };
    case 'CONFIRMED':
      return {
        label: 'Pedido Confirmado',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        badgeColor: 'bg-blue-500',
        step: 2,
        icon: 'CheckCircle2',
        description: 'Pedido confirmado! Estamos organizando os espetos para a brasa.',
      };
    case 'PREPARING':
      return {
        label: 'Na Brasa / Em Preparo',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        badgeColor: 'bg-orange-500',
        step: 3,
        icon: 'Flame',
        description: 'Seus espetinhos estão assando no ponto perfeito na brasa quente!',
      };
    case 'READY':
      return {
        label: 'Pronto / Embalado',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        badgeColor: 'bg-purple-500',
        step: 4,
        icon: 'PackageCheck',
        description: 'Tudo pronto e embalado termicamente para manter o sabor e calor.',
      };
    case 'OUT_FOR_DELIVERY':
      return {
        label: 'Saiu para Entrega',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeColor: 'bg-emerald-500',
        step: 5,
        icon: 'Bike',
        description: 'O motoboy já está a caminho do seu endereço! Acompanhe no mapa.',
      };
    case 'DELIVERED':
      return {
        label: 'Entregue com Sucesso',
        color: 'bg-green-100 text-green-800 border-green-300',
        badgeColor: 'bg-green-600',
        step: 6,
        icon: 'PartyPopper',
        description: 'Pedido entregue! Bom apetite e volte sempre!',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800 border-red-300',
        badgeColor: 'bg-red-500',
        step: 0,
        icon: 'XCircle',
        description: 'Este pedido foi cancelado.',
      };
    default:
      return {
        label: 'Processando',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
        badgeColor: 'bg-slate-500',
        step: 1,
        icon: 'Clock',
        description: 'Processando seu pedido...',
      };
  }
}
