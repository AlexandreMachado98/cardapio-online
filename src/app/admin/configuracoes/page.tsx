'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreSettings } from '@/types';
import {
  ArrowLeft,
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Flame,
  Power,
  Phone,
  MapPin,
  QrCode,
  Megaphone,
} from 'lucide-react';

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('Cardápio Online');
  const [subName, setSubName] = useState('Espetinho & Brasa');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setName(data.name || 'Cardápio Online');
        setSubName(data.subName || 'Espetinho & Brasa');
        setLogoUrl(data.logoUrl || '');
        setBannerUrl(data.bannerUrl || '');
        setAnnouncement(data.announcement || '');
        setIsOpen(data.isOpen ?? true);
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setPixKey(data.pixKey || '');
        setMinOrderValue(String(data.minOrderValue || 0));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subName,
          logoUrl,
          bannerUrl,
          announcement,
          isOpen,
          phone,
          address,
          pixKey,
          minOrderValue: Number(minOrderValue) || 0,
        }),
      });

      if (res.ok) {
        setSuccess('Configurações salvas com sucesso! O cardápio dos clientes já foi atualizado.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel de Pedidos</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Store className="w-6 h-6 text-orange-500" />
          Perfil & Configurações da Cozinha
        </h1>
        <p className="text-xs text-zinc-400">
          Personalize o nome da sua cozinha, logo, aviso promocional no topo do cardápio e status de funcionamento.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status de Funcionamento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-orange-400" />
              Status do Estabelecimento
            </h3>
            <p className="text-xs text-zinc-400">
              Controle se o cardápio está aceitando pedidos agora ou se está fechado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              isOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600/80 text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isOpen ? 'Aberto (Recebendo Pedidos)' : 'Fechado no Momento'}</span>
          </button>
        </div>

        {/* Identidade Visual & Nomes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
            Identidade Visual do Cardápio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Prefixo do Título
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cardápio Online"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome do Estabelecimento / Usuário *
              </label>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Ex: Espetinho do Chefe"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Logo URL & Preview */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-medium text-zinc-300">
              URL da Logo da Cozinha (Link da imagem .png / .jpg)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Ex: https://i.imgur.com/sua-logo.png"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                ) : (
                  <Flame className="w-6 h-6 text-orange-400" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">
              Dica: Você pode hospedar sua logo em sites gratuitos como Imgur ou Postimages e colar o link direto aqui.
            </p>
          </div>
        </div>

        {/* Banner de Aviso & Promoções no Topo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Aviso de Destaque / Promoção do Dia no Topo
          </h3>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Texto em Destaque exibido para todos os clientes
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Ex: 🔥 Promoção de Quinta: Na compra de 5 espetinhos ganhe 1 refrigerante lata!"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Contato & PIX */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
            Contato & Chave PIX
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Telefone WhatsApp da Loja
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11987654321"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Chave PIX do Restaurante
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: 11987654321 ou seu@email.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Endereço Físico do Restaurante (para retiradas no balcão)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. Principal dos Espetos, 500 - Centro"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-950/50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Salvando Configurações...' : 'Salvar Alterações do Perfil'}</span>
        </button>
      </form>
    </div>
  );
}
