const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const regex = /\} else if \(isOut\) \{\s*cardBorderClass = 'border-2 border-purple-500\/80 shadow-\[0_0_20px_rgba\(168,85,247,0\.2\)\] bg-gradient-to-b from-purple-950\/30 via-zinc-900 to-zinc-900';\s*topBadgeBg = 'bg-purple-500\/20 text-purple-400 border border-purple-500\/40 font-bold';\s*statusLabel = '[^']+';\s*\} else if \(isDelivered\) \{/;

const replacement = \} else if (isOut) {
                    cardBorderClass = 'border-2 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.2)] bg-gradient-to-b from-purple-950/30 via-zinc-900 to-zinc-900';
                    topBadgeBg = 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold';
                    statusLabel = '?? EM ROTA DE ENTREGA';
                  } else if (isInService) {
                    cardBorderClass = 'border-2 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-gradient-to-b from-indigo-950/30 via-zinc-900 to-zinc-900';
                    topBadgeBg = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 font-bold';
                    statusLabel = '??? CONSUMINDO NA MESA';
                  } else if (isDelivered) {\;

code = code.replace(regex, replacement);

const buttonsBlockRegex = /\{\\s*isReady && \\(\\s*<button[\\s\\S]*?<Bike className=\"w-5 h-5\" \\/>[\\s\\S]*?<\\/button>\\s*\\)\\s*\\}\\s*\{\\s*isOut && \\([\\s\\S]*?<\\/Link>\\s*<\\/div>\\s*\\)\\s*\\}/;

const newButtonsBlock = \{isReady && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, order.deliveryType === 'TABLE' ? 'IN_SERVICE' : 'OUT_FOR_DELIVERY')}
                              disabled={isUpdating}
                              className={"w-full bg-gradient-to-r hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl " + (order.deliveryType === 'TABLE' ? 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-indigo-950/60' : 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950/60')}
                            >
                              {order.deliveryType === 'TABLE' ? (
                                <> <Users className="w-5 h-5" /> <span>SERVIDO NA MESA</span> </>
                              ) : (
                                <> <Bike className="w-5 h-5" /> <span>DESPACHAR C/ MOTOBOY</span> </>
                              )}
                            </button>
                          )}

                          {isOut && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                disabled={isUpdating}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Concluir Entrega</span>
                              </button>
                              <Link
                                href={\/entregador/\\}
                                target="_blank"
                                className="bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-purple-500/30 transition-all text-center"
                              >
                                <Bike className="w-4 h-4 text-purple-400" />
                                <span>Painel Motoboy</span>
                              </Link>
                            </div>
                          )}

                          {isInService && (
                            <button
                                onClick={() => handleUpdateStatus(order.id, 'CLOSED')}
                                disabled={isUpdating}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all"
                              >
                                <CheckCheck className="w-5 h-5 text-zinc-950" />
                                <span>FECHAR CONTA DA MESA</span>
                              </button>
                          )}\;

code = code.replace(buttonsBlockRegex, newButtonsBlock);

fs.writeFileSync('src/app/admin/page.tsx', code);
