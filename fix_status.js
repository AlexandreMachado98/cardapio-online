const fs = require('fs');
let code = fs.readFileSync('src/app/api/pedidos/[id]/status/route.ts', 'utf8');

const importRegex = /import \{ generateWhatsAppMessage, createWhatsAppLink \} from '@\/lib\/whatsapp';/;
const newImports = "import { generateWhatsAppMessage, createWhatsAppLink } from '@/lib/whatsapp';\nimport { sendWhatsAppNotification } from '@/lib/notificationService';";
code = code.replace(importRegex, newImports);

const blockRegex = /const whatsappLink = createWhatsAppLink\(updatedOrder\.customerPhone, whatsappMessage\);\n\n    return NextResponse\.json\(\{/;

const newBlock = `const whatsappLink = createWhatsAppLink(updatedOrder.customerPhone, whatsappMessage);

    if (updatedOrder.status === 'OUT_FOR_DELIVERY') {
      sendWhatsAppNotification({
        orderId: updatedOrder.id,
        eventType: 'OUT_FOR_DELIVERY',
        customerPhone: updatedOrder.customerPhone,
        messageText: whatsappMessage,
      });
    }

    return NextResponse.json({`;

code = code.replace(blockRegex, newBlock);
fs.writeFileSync('src/app/api/pedidos/[id]/status/route.ts', code);
