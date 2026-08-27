'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  Loader2,
  LogOut,
  ShoppingBag,
  LayoutGrid,
  Truck,
  Settings,
  ExternalLink,
  ClipboardList,
  User,
  Eye,
  EyeOff,
  Power,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { StoreSettings } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Store Settings & Status State
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchStoreSettings();
    }
  }, [isAuthenticated]);

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data);
        setIsOpen(data.isOpen ?? true);
      }
    } catch (e) {
      console.error('Erro ao buscar configurações', e);
    }
  };

  const handleToggleStoreStatus = async () => {
    try {
      setTogglingStatus(true);
      const newStatus = !isOpen;
      setIsOpen(newStatus);
      await fetch('/api/config/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus }),
      });
    } catch (e) {
      console.error('Erro ao mudar status', e);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('saborespeto_admin_auth', 'true');
        fetchStoreSettings();
      } else {
        const data = await res.json();
        setError(data.error || 'Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
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

  // TELA DE LOGIN DO ADMIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
              <Lock className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Acesso Administrativo
            </h2>
            <p className="text-xs text-zinc-400">
              Painel de Gestão da Cozinha & Pedidos
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Usuário / E-mail
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800/80">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
            >
              ← Voltar ao Cardápio do Cliente
            </Link>
          </div>
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

  const storeName = storeSettings?.name || 'Cardápio Online';
  const subName = storeSettings?.subName || '';
  const logoUrl = storeSettings?.logoUrl;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      {/* 🌟 CABEÇALHO PRINCIPAL DO ADMIN (LOGO CIRCULAR + NOME + PERFIL ADMIN + STATUS) */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo Circular & Informações da Cozinha */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? 'border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                }`}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo da Cozinha"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Status Beacon */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                  isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base tracking-tight text-white uppercase">
                  {storeName} {subName ? `- ${subName}` : ''}
                </span>
                <span className="text-[10px] uppercase font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.2 rounded-full">
                  Painel da Cozinha
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Gestão de Pedidos, Cardápio & Delivery
              </p>
            </div>
          </div>

          {/* Lado Direito: Status Aberto/Fechado + Perfil do Admin + Sair */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Status Aberto / Fechado em 1 Clique */}
            <button
              onClick={handleToggleStoreStatus}
              disabled={togglingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 border ${
                isOpen
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/40'
                  : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/40'
              }`}
              title="Clique para alternar o status aberto/fechado da loja"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOpen ? 'bg-emerald-400 animate-ping' : 'bg-red-500'
                }`}
              />
              <span className="hidden sm:inline">{isOpen ? 'Loja Aberta' : 'Loja Fechada'}</span>
              <Power className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Perfil do Administrador */}
            <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/80 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-zinc-200 text-[11px] leading-tight">Admin Principal</div>
                <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                </div>
              </div>
            </div>

            {/* Ver Cardápio */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/60 transition-colors"
              title="Ver Cardápio como Cliente"
            >
              <span className="hidden sm:inline">Cardápio</span>
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            </Link>

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-red-400 bg-zinc-800/60 hover:bg-zinc-800 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-700/60 transition-colors"
              title="Sair do Painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* 📑 SUB-BARRA DE ABAS DE NAVEGAÇÃO DO ADMIN */}
        <div className="bg-zinc-950/80 border-t border-zinc-800/80 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Conteúdo da Página */}
      <main className="py-2">{children}</main>
    </div>
  );
}
