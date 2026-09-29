const fs = require('fs');
let code = fs.readFileSync('src/app/pedido/[id]/page.tsx', 'utf8');

const target1 = '<h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">';

const replacement1 = \<h3 className={"font-extrabold text-sm flex items-center gap-2 " + (order.status === 'CLOSED' || order.status === 'DELIVERED' ? 'text-green-400' : 'text-zinc-100')}>\;

code = code.replace(target1, replacement1);

const target2 = '<span>Resumo do Pedido</span>';

const replacement2 = \<span>{order.status === 'CLOSED' || order.status === 'DELIVERED' ? 'Recibo Digital (Histórico)' : 'Resumo do Pedido'}</span>\;

code = code.replace(target2, replacement2);

const target3 = '{/* Totals */}\n          <div className="pt-4 border-t border-zinc-800 space-y-1.5">';

const replacement3 = \{/* Totals */}
          <div className="pt-4 border-t border-zinc-800 space-y-1.5">
            {(order.status === 'CLOSED' || order.status === 'DELIVERED') && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-3 flex flex-col items-center justify-center text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span className="font-bold text-green-400 text-xs uppercase">Recibo Faturado</span>
                <span className="text-[10px] text-green-500/70">Este pedido já foi finalizado. Os valores e itens acima refletem o momento da compra.</span>
              </div>
            )}\;

code = code.replace(target3, replacement3);

fs.writeFileSync('src/app/pedido/[id]/page.tsx', code);
