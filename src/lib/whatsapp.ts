export interface WhatsAppOrderData {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
    meatPoint?: string | null;
  }>;
  deliveryType: string;
  addressText?: string | null;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  courierName?: string | null;
  trackingUrl: string;
}

export function generateWhatsAppMessage(data: WhatsAppOrderData): string {
  const isDelivery = data.deliveryType === 'DELIVERY';
  
  let msg = `🔥 *SABOR & ESPETO - ATUALIZAÇÃO DO PEDIDO #${data.orderNumber}* 🔥\n\n`;
  msg += `Olá, *${data.customerName}*! Seu pedido acabou de sair para entrega! 🛵💨\n\n`;
  
  msg += `📋 *Resumo do Pedido:*\n`;
  data.items.forEach((item) => {
    msg += `▪️ ${item.quantity}x ${item.productName} ${item.meatPoint ? `(${item.meatPoint})` : ''}\n`;
  });

  msg += `\n💰 *Total:* R$ ${data.total.toFixed(2).replace('.', ',')}`;
  msg += `\n💳 *Pagamento:* ${data.paymentMethod}`;
  
  if (isDelivery && data.addressText) {
    msg += `\n📍 *Endereço:* ${data.addressText}`;
  }

  if (data.courierName) {
    msg += `\n👤 *Entregador:* ${data.courierName}`;
  }

  msg += `\n\n🗺️ *Acompanhe a rota em tempo real no mapa:*`;
  msg += `\n👉 ${data.trackingUrl}\n\n`;
  msg += `Agradecemos a preferência! Bom apetite! 🍢😋`;

  return msg;
}

export function createWhatsAppLink(phone: string, text: string): string {
  // Limpar telefone (apenas numeros)
  let cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
