const fs = require('fs');
let c = fs.readFileSync('src/components/admin/QrCodeDisplayPreview.tsx', 'utf8');
c = c.replace(/\\`scale/g, '`scale');
c = c.replace(/\\}/g, '}');
c = c.replace(/\\$/g, '$');
c = c.replace(/\\`/g, '`');
fs.writeFileSync('src/components/admin/QrCodeDisplayPreview.tsx', c);
