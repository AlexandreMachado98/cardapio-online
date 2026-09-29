const fs = require('fs');
let code = fs.readFileSync('src/components/admin/QrCodeDisplayPreview.tsx', 'utf8');
code = code.replace(/import \{ Download, FileDown, Smartphone \} from 'lucide-react';/, "import { Download, FileDown, Smartphone, RefreshCw } from 'lucide-react';");
fs.writeFileSync('src/components/admin/QrCodeDisplayPreview.tsx', code);
