'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, FileDown, Smartphone } from 'lucide-react';

interface QrDisplayProps {
  url: string;
  storeName: string;
  storeLogo?: string;
  primaryColor?: string;
  customTitle?: string;
  customSubtitle?: string;
}

type FormatOption = 'A6' | 'A5' | 'SQUARE';

export default function QrCodeDisplayPreview({
  url,
  storeName,
  storeLogo,
  primaryColor = '#ea580c',
  customTitle = 'ACESSE NOSSO CARDÁPIO',
  customSubtitle = 'Escaneie o QR Code e confira nosso cardápio pelo celular.',
}: QrDisplayProps) {
  const [format, setFormat] = useState<FormatOption>('A6');
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Dimensions setup
  const formats = {
    A6: { width: 413, height: 583, label: 'Modelo A6 (Mesa - Vertical)' }, // ~ 105x148mm @ 100dpi
    A5: { width: 583, height: 827, label: 'Modelo A5 (Balcão - Vertical)' }, // ~ 148x210mm @ 100dpi
    SQUARE: { width: 600, height: 600, label: 'Modelo Quadrado (Redes Sociais)' },
  };

  const currentDim = formats[format];

  // Function to handle export
  const handleExport = async (type: 'PNG' | 'PDF' | 'ORIGINAL') => {
    if (type === 'ORIGINAL') {
      // Export ONLY QR Code (legacy behavior fallback)
      const svg = document.getElementById('raw-qr-svg');
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        const pngFile = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QR_${storeName.replace(/\s+/g, '')}.png`;
        link.href = pngFile;
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      return;
    }

    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const element = printRef.current;
      
      // Temporarily remove scaling from preview wrapper for clean capture
      const originalTransform = element.style.transform;
      element.style.transform = 'none';

      const canvas = await html2canvas(element, {
        scale: 4, // High resolution for print
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      element.style.transform = originalTransform;

      if (type === 'PNG') {
        const link = document.createElement('a');
        link.download = `Display_${storeName.replace(/\s+/g, '')}_${format}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } else if (type === 'PDF') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        let pdfFormat = [105, 148]; // A6 default
        if (format === 'A5') pdfFormat = [148, 210];
        if (format === 'SQUARE') pdfFormat = [200, 200];

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: pdfFormat,
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfFormat[0], pdfFormat[1]);
        pdf.save(`Display_${storeName.replace(/\s+/g, '')}_${format}.pdf`);
      }
    } catch (e) {
      console.error('Erro ao exportar', e);
      alert('Erro ao gerar o arquivo de exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden raw QR Code for 'ORIGINAL' download */}
      <div className="hidden">
        <QRCodeSVG id="raw-qr-svg" value={url} size={500} level="H" includeMargin={true} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Configurations & Actions */}
        <div className="flex-1 space-y-4">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase">Formato do Material</h4>
            <div className="flex flex-col gap-2">
              {(Object.keys(formats) as FormatOption[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border ${
                    format === fmt
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {formats[fmt].label}
                  {format === fmt && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase">Baixar Arte</h4>
            
            <button
              onClick={() => handleExport('PDF')}
              disabled={isExporting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-5 h-5" />}
              <span>BAIXAR PDF PRONTO PARA IMPRESSÃO</span>
            </button>

            <button
              onClick={() => handleExport('PNG')}
              disabled={isExporting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Baixar Imagem (PNG) Alta Qualidade</span>
            </button>

            <button
              onClick={() => handleExport('ORIGINAL')}
              className="w-full text-zinc-500 hover:text-zinc-300 font-semibold py-2 text-xs flex items-center justify-center transition-colors underline"
            >
              Baixar somente o QR Code original
            </button>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="flex-[1.5] bg-zinc-950 rounded-3xl border border-zinc-800 flex items-center justify-center p-6 min-h-[500px] overflow-hidden relative">
          
          <div className="absolute top-4 left-4 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-[10px] font-bold text-zinc-400">
            PRÉ-VISUALIZAÇÃO AO VIVO
          </div>

          {/* Wrapper to scale down the print div to fit inside the preview pane without breaking its actual pixel dimensions */}
          <div 
            className="origin-top" 
            style={{ 
              transform: `scale(\${format === 'SQUARE' ? 0.6 : 0.7})`, 
              transition: 'transform 0.3s ease' 
            }}
          >
            {/* THIS IS THE EXPORTED ELEMENT */}
            <div
              ref={printRef}
              style={{
                width: currentDim.width,
                height: currentDim.height,
                backgroundColor: '#ffffff', // Explicit background for capture
              }}
              className="shadow-2xl overflow-hidden relative flex flex-col items-center justify-between"
            >
              {/* Header */}
              <div className="w-full pt-10 pb-4 px-8 flex flex-col items-center text-center space-y-4">
                {storeLogo ? (
                  <img src={storeLogo} alt="Logo" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-3xl font-black text-zinc-300">
                    {storeName.charAt(0)}
                  </div>
                )}
                
                <h1 className="font-black text-2xl tracking-tight text-zinc-900 uppercase" style={{ color: primaryColor }}>
                  {customTitle}
                </h1>
                
                <p className="text-zinc-600 text-sm max-w-[85%] font-medium leading-tight">
                  {customSubtitle}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="w-full flex-1 flex flex-col items-center justify-center px-10">
                <div 
                  className="bg-white p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-zinc-100 relative"
                >
                  <QRCodeSVG 
                    value={url} 
                    size={220} 
                    level="H" 
                    includeMargin={false} 
                    bgColor="#ffffff"
                    fgColor="#18181b"
                  />
                  
                  {/* Small absolute decorative elements on corners */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: primaryColor }} />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: primaryColor }} />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: primaryColor }} />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: primaryColor }} />
                </div>

                <div className="mt-8 flex items-center gap-3 bg-zinc-900 px-6 py-3 rounded-full text-white shadow-md">
                  <Smartphone className="w-5 h-5 text-orange-400" />
                  <span className="font-bold text-sm tracking-wide">APONTE A CÂMERA</span>
                </div>
              </div>

              {/* Footer */}
              <div className="w-full py-6 bg-zinc-50 border-t border-zinc-200 text-center flex flex-col items-center justify-center">
                <div className="font-black text-xs text-zinc-800 tracking-[0.2em] uppercase opacity-70">
                  Escaneie • Escolha • Peça
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 font-medium">
                  {storeName}
                </div>
              </div>

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
