import { defaultStoreConfig } from './config';

export interface WhatsAppOrderData {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
    meatPoint?: string | null;
    complements?: string | null;
  }>;
  deliveryType: string;
  addressText?: string | null;
  deliveryFee: number;
  subtotal?: number;
  total: number;
  paymentMethod: string;
  changeFor?: number | null;
  courierName?: string | null;
  trackingUrl: string;
  storeName?: string;
  notes?: string | null;
}

// Mensagem de Confirmação Imediata após a conclusão do pedido
export function generateOrderConfirmationWhatsAppMessage(data: WhatsAppOrderData): string {
  const isDelivery = data.deliveryType === 'DELIVERY';
  const brandName = data.storeName || defaultStoreConfig.name;

  let msg = `🍢 *${brandName.toUpperCase()} - PEDIDO CONFIRMADO!* 🍢\n\n`;
  msg += `Olá, *${data.customerName}*! Seu pedido *#${data.orderNumber}* foi recebido com sucesso na cozinha e já está sendo preparado!\n\n`;

  msg += `📋 *ITENS DO PEDIDO:*\n`;
  data.items.forEach((item) => {
    let compsText = '';
    if (item.complements) {
      try {
        const parsed = JSON.parse(item.complements);
        if (Array.isArray(parsed) && parsed.length > 0) {
          compsText = ` (+ ${parsed.join(', ')})`;
        }
      } catch (e) {}
    }
    const meat = item.meatPoint ? ` [${item.meatPoint}]` : '';
    msg += `▪️ *${item.quantity}x* ${item.productName}${meat}${compsText} - R$ ${item.totalPrice.toFixed(2).replace('.', ',')}\n`;
  });

  msg += `\n💰 *Total:* R$ ${data.total.toFixed(2).replace('.', ',')}`;
  msg += `\n💳 *Pagamento:* ${data.paymentMethod}`;
  if (data.changeFor) {
    msg += ` (Troco para R$ ${data.changeFor.toFixed(2).replace('.', ',')})`;
  }

  if (isDelivery && data.addressText) {
    msg += `\n📍 *Entrega em:* ${data.addressText}`;
  } else {
    msg += `\n📍 *Tipo:* Retirada no Balcão`;
  }

  if (data.notes) {
    msg += `\n📝 *Obs:* ${data.notes}`;
  }

  msg += `\n\n📱 *ACOMPANHE O STATUS E RASTREIO AO VIVO:*`;
  msg += `\n👉 ${data.trackingUrl}\n\n`;
  msg += `Qualquer dúvida estamos à disposição! Bom apetite! 😋🔥`;

  return msg;
}

// Mensagem quando o pedido sai para entrega
export function generateWhatsAppMessage(data: WhatsAppOrderData): string {
  const isDelivery = data.deliveryType === 'DELIVERY';
  const brandName = data.storeName || defaultStoreConfig.name;

  let msg = `🛵💨 *${brandName.toUpperCase()} - SAIU PARA ENTREGA!* 🛵💨\n\n`;
  msg += `Olá, *${data.customerName}*! Seu pedido *#${data.orderNumber}* acabou de sair da cozinha a caminho do seu endereço!\n\n`;

  msg += `📋 *Resumo do Pedido:*\n`;
  data.items.forEach((item) => {
    msg += `▪️ ${item.quantity}x ${item.productName} ${item.meatPoint ? `(${item.meatPoint})` : ''}\n`;
  });

  msg += `\n💰 *Total a Pagar:* R$ ${data.total.toFixed(2).replace('.', ',')} (${data.paymentMethod})`;

  if (isDelivery && data.addressText) {
    msg += `\n📍 *Endereço:* ${data.addressText}`;
  }

  if (data.courierName) {
    msg += `\n👤 *Entregador:* ${data.courierName}`;
  }

  msg += `\n\n🗺️ *Acompanhe o entregador ao vivo pelo mapa:*`;
  msg += `\n👉 ${data.trackingUrl}\n\n`;
  msg += `Agradecemos a preferência! 🍢🔥`;

  return msg;
}

export function createWhatsAppLink(phone: string, text: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
