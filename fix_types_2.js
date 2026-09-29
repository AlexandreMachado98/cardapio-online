const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace(/deliveryType: 'DELIVERY' \| 'PICKUP';/, "deliveryType: 'DELIVERY' | 'PICKUP' | 'TABLE';");
fs.writeFileSync('src/types/index.ts', code);
