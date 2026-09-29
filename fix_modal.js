const fs = require('fs');
let code = fs.readFileSync('src/components/cart/CheckoutModal.tsx', 'utf8');

const mesaBlockRegex = /if \(serviceMode === 'MESA'\) \{[\s\S]*?\n  \}\n\n  return \(/;

const newMesaBlock = \if (serviceMode === 'MESA') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Pedir na Mesa
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              if (!name.trim()) { setError('Informe seu nome.'); return; }
              const cleanPhone = phone.replace(/\\\D/g, '');
              if (cleanPhone.length < 10) { setError('Informe um WhatsApp válido.'); return; }
              
              setLoading(true);
              try {
                login({ name, phone: cleanPhone });
                const res = await fetch('/api/pedidos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customerName: name,
                    customerPhone: cleanPhone,
                    deliveryType: 'TABLE',
                    tableNumber: (document.getElementById('tableNumber') as HTMLInputElement).value || '?',
                    subtotal,
                    total: subtotal,
                    paymentMethod: 'CASH',
                    notes,
                    items,
                  }),
                });
                
                if (!res.ok) throw new Error('Erro ao enviar pedido.');
                const createdOrder = await res.json();
                
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#ea580c', '#f59e0b', '#22c55e'] });
                clearCart();
                setIsCartOpen(false);
                onClose();
                router.push(\/pedido/\\);
              } catch (err: any) {
                setError(err.message || 'Ocorreu um erro.');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nº da Mesa *</label>
                  <input type="text" id="tableNumber" required placeholder="Ex: 04" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Seu Nome *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos chamar você?" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Seu WhatsApp *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Observações do Pedido</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma instrução para a cozinha?" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total a Pagar</span>
                <span className="font-bold text-orange-400">\</span>
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Check className="w-4 h-4" />Confirmar Pedido</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (\;

code = code.replace(mesaBlockRegex, newMesaBlock);
fs.writeFileSync('src/components/cart/CheckoutModal.tsx', code);
console.log('Replaced MESA block successfully');
