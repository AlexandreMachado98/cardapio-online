const fs = require('fs');
let code = fs.readFileSync('src/components/cart/CheckoutModal.tsx', 'utf8');

const t = `      // Disparo automtico da confirmao no WhatsApp com o link de rastreio
      if (createdOrder.whatsappLink) {
        try {
          window.open(createdOrder.whatsappLink, '_blank');
        } catch (e) {
          console.error(e);
        }
      }`;

const t2 = `      // Disparo automático da confirmação no WhatsApp com o link de rastreio
      if (createdOrder.whatsappLink) {
        try {
          window.open(createdOrder.whatsappLink, '_blank');
        } catch (e) {
          console.error(e);
        }
      }`;

const t3 = "window.open(createdOrder.whatsappLink, '_blank');";

code = code.replace(t3, "// WhatsApp background notification has taken over this action");
fs.writeFileSync('src/components/cart/CheckoutModal.tsx', code);
