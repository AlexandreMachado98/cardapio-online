'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Flame,
  Loader2,
  LogOut,
  ShoppingBag,
  LayoutGrid,
  Truck,
  Settings,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const auth = localStorage.getItem('saborespeto_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('saborespeto_admin_auth', 'true');
      } else {
        setError('Senha de acesso incorreta. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('saborespeto_admin_auth');
  };

  if (isChecking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Painel da Cozinha</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Acesso exclusivo para administração e despacho
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite a senha de 6 dígitos"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-center tracking-widest text-base font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition-all text-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <Link
            href="/"
            className="inline-block text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Voltar ao Cardápio do Cliente
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: 'Fila de Pedidos', icon: ClipboardList },
    { href: '/admin/produtos', label: 'Produtos & Promoções', icon: ShoppingBag },
    { href: '/admin/categorias', label: 'Categorias', icon: LayoutGrid },
    { href: '/admin/taxas', label: 'Taxas de Frete', icon: Truck },
    { href: '/admin/configuracoes', label: 'Perfil da Cozinha', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Dedicated Admin Sub-Header */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700 transition-colors"
              title="Abrir visão do cliente em nova aba"
            >
              <span>Ver Cardápio</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-red-400 bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700 transition-colors"
              title="Sair e Bloquear Painel"
            >
              <LogOut className="w-3 h-3" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>
      </div>

      <div className="py-2">{children}</div>
    </div>
  );
}
