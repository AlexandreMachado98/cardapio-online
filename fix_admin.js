const fs = require('fs');

const path = 'src/app/admin/configuracoes/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const importTarget = "import { QRCodeSVG } from 'qrcode.react';";
const replacementImport = "import { QRCodeSVG } from 'qrcode.react';\nimport QrCodeDisplayPreview from '@/components/admin/QrCodeDisplayPreview';";
if (content.includes(importTarget) && !content.includes('QrCodeDisplayPreview')) {
  content = content.replace(importTarget, replacementImport);
}

const startString = '{/* QR CODE DO CARDPIO */}';
const altStartString = '{/* QR CODE DO CARD';
let startIndex = content.indexOf(startString);
if (startIndex === -1) {
  startIndex = content.indexOf(altStartString);
}

const endString = '{/* LOGO DA COZINHA */}';
const endIndex = content.indexOf(endString);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* QR CODE DO CARDAPIO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Display de Mesa e QR Code Profissional
            </h3>
            
            <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.origin);
                      alert('Link copiado para a area de transferencia!');
                    }
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Copiar Link do App
                </button>
          </div>
          <p className="text-xs text-zinc-400">
            Personalize e baixe a arte do Display de Mesa ou Balcao para seus clientes escanearem o cardapio.
          </p>
          
          <div className="mt-4">
            {typeof window !== 'undefined' && (
              <QrCodeDisplayPreview 
                url={window.location.origin} 
                storeName={name || 'Cardapio Online'} 
                storeLogo={logoUrl}
              />
            )}
          </div>
        </div>

        `;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully replaced QR code block.');
} else {
  console.log('Could not find start or end index.');
}
