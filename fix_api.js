const fs = require('fs');
let code = fs.readFileSync('src/app/api/pedidos/route.ts', 'utf8');

const importRegex = /import \{ generateOrderConfirmationWhatsAppMessage, createWhatsAppLink \} from '@\/lib\/whatsapp';/;
const newImports = "import { generateOrderConfirmationWhatsAppMessage } from '@/lib/whatsapp';\nimport { sendWhatsAppNotification } from '@/lib/notificationService';";
code = code.replace(importRegex, newImports);

const blockRegex = /const whatsappLink = createWhatsAppLink\(cleanPhone, waMsg\);\n\n    return NextResponse\.json\(\n      \{\n        \.\.\.order,\n        whatsappLink,\n        trackingUrl,\n      \},\n      \{ status: 201 \}\n    \);/;

const newBlock = `// Dispatch WhatsApp message in the background
    sendWhatsAppNotification({
      orderId: order.id,
      eventType: 'ORDER_CREATED',
      customerPhone: cleanPhone,
      messageText: waMsg,
    });

    return NextResponse.json(
      {
        ...order,
        trackingUrl,
      },
      { status: 201 }
    );`;

code = code.replace(blockRegex, newBlock);
fs.writeFileSync('src/app/api/pedidos/route.ts', code);
