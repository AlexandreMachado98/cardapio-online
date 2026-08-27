'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { StoreSettings } from '@/types';
import {
  ArrowLeft,
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  Flame,
  Power,
  Phone,
  MapPin,
  QrCode,
  Megaphone,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('Cardápio Online');
  const [subName, setSubName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSubName(data.subName || '');
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

  // Image Upload Handler (Convert picked file from gallery to Base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (compress if > 2MB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400; // Optimal for circular logo

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLogoUrl(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
          Personalize a logo circular com indicador de status (verde/vermelho), nome, dados de contato e avisos.
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
              Status de Funcionamento do Estabelecimento
            </h3>
            <p className="text-xs text-zinc-400">
              Alterne para definir se o restaurante está aberto (borda verde) ou fechado (borda vermelha).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2.5 transition-all shadow-md active:scale-95 ${
              isOpen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isOpen ? '🟢 ABERTO (Aceitando Pedidos)' : '🔴 FECHADO NO MOMENTO'}</span>
          </button>
        </div>

        {/* 📸 LOGO CIRCULAR COM BORDA VERDE / VERMELHA E UPLOAD DA GALERIA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Logo da Cozinha (Moldura Circular com Status)
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            {/* Circular Logo with Glowing Status Border */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? 'border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.45)]'
                    : 'border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.45)]'
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
                    <Flame className="w-12 h-12 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Status Badge Tag */}
              <div
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow text-white whitespace-nowrap ${
                  isOpen
                    ? 'bg-emerald-600 border-emerald-400'
                    : 'bg-red-600 border-red-400'
                }`}
              >
                {isOpen ? 'Aberto' : 'Fechado'}
              </div>
            </div>

            {/* Upload Buttons & Options */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-white">Foto da Galeria do Celular / Computador</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Escolha qualquer foto da sua galeria. A moldura circular e a borda colorida de status são aplicadas automaticamente.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Escolher Foto da Galeria</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="bg-zinc-800 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Logo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Identidade Visual & Nomes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
            Nomes do Cardápio
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
                placeholder="Cardápio Online"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome do Estabelecimento / Cozinha
              </label>
              <input
                type="text"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Nome do seu restaurante ou cozinha"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Banner de Aviso & Promoções no Topo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Aviso de Destaque / Promoção no Topo
          </h3>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Texto em Destaque exibido no topo do cardápio
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Digite um aviso especial ou promoção..."
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
                placeholder="(00) 00000-0000"
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
                placeholder="Telefone, e-mail, CPF/CNPJ ou chave aleatória"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Endereço Físico (para clientes que retirarem no balcão)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereço da sua cozinha/balcão"
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
