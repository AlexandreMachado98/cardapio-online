import { prisma } from './prisma';

interface SendNotificationProps {
  orderId: string;
  eventType: 'ORDER_CREATED' | 'OUT_FOR_DELIVERY' | 'ORDER_CONFIRMED';
  customerPhone: string;
  messageText: string;
}

export async function sendWhatsAppNotification({ orderId, eventType, customerPhone, messageText }: SendNotificationProps) {
  try {
    // 1. Get Store Settings for WhatsApp Integration
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings?.waApiToken || !settings?.waPhoneNumberId) {
      console.log(`[WhatsApp API] Not configured. Skipping message for order ${orderId}`);
      return false;
    }

    // Check configuration flags
    if (eventType === 'ORDER_CREATED' && !settings.waNotifyCreated) return false;
    if (eventType === 'OUT_FOR_DELIVERY' && !settings.waNotifyDispatched) return false;

    // 2. Format phone to international (Meta API requires country code without '+')
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
      cleanPhone = '55' + cleanPhone;
    }

    // 3. Idempotency Check
    // Use an atomic operation or transaction if possible. Here we use an upsert/create that fails on unique constraint.
    const existingEvent = await prisma.notificationEvent.findUnique({
      where: {
        orderId_eventType: {
          orderId,
          eventType,
        }
      }
    });

    if (existingEvent) {
      console.log(`[WhatsApp API] Event ${eventType} for order ${orderId} already processed.`);
      return true; // Already processed
    }

    const event = await prisma.notificationEvent.create({
      data: {
        orderId,
        eventType,
        status: 'PENDING',
      }
    });

    // 4. Send Message via Meta WhatsApp Cloud API
    // https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
    const url = `https://graph.facebook.com/v19.0/${settings.waPhoneNumberId}/messages`;

    // Note: Meta Cloud API usually requires a Template Message for the first 24h interaction, 
    // but assuming standard setup for this exercise or if within a customer session.
    // We will send a standard free-form text message which requires an active 24h conversation window,
    // OR we would use a template. For this implementation, we use standard text.
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: messageText
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.waApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Erro ao enviar mensagem');
    }

    // 5. Update Status
    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerMessageId: data.messages?.[0]?.id,
      }
    });

    return true;

  } catch (error: any) {
    console.error(`[WhatsApp API] Error sending notification for order ${orderId}:`, error);
    
    // Log failure
    try {
      await prisma.notificationEvent.upsert({
        where: { orderId_eventType: { orderId, eventType } },
        update: {
          status: 'FAILED',
          errorLog: error.message || String(error),
        },
        create: {
          orderId,
          eventType,
          status: 'FAILED',
          errorLog: error.message || String(error),
        }
      });
    } catch (e) {}

    return false;
  }
}
