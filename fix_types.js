const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace(/type OrderStatus = 'PENDING' \| 'CONFIRMED' \| 'PREPARING' \| 'READY' \| 'OUT_FOR_DELIVERY' \| 'DELIVERED' \| 'CANCELLED';/, "type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'IN_SERVICE' | 'CLOSED';");
fs.writeFileSync('src/types/index.ts', code);
