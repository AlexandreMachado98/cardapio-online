'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreSettings } from '@/types';
import {
  Store,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  DollarSign,
  Share2,
  AlertCircle,
  Megaphone,
  User,
  Mail,
  Lock,
  KeyRound,
  Upload,
  Image as ImageIcon,
  Trash2,
  Navigation,
  Crosshair,
  Search,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Form State
  const [name, setName] = useState('Cardápio Online');
  const [subName, setSubName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [pixKey, setPixKey] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<any>(null);
  const miniMapMarkerRef = useRef<any>(null);

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
        setLat(data.lat !== null && data.lat !== undefined ? String(data.lat) : '');
        setLng(data.lng !== null && data.lng !== undefined ? String(data.lng) : '');
        setGoogleMapsApiKey(data.googleMapsApiKey || '');
        setPixKey(data.pixKey || '');
        setMinOrderValue(String(data.minOrderValue || 0));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações', err);
    } finally {
      setLoading(false);
    }
  };

  // Mini Map Initializer & Updater
  useEffect(() => {
    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng)) || !miniMapContainerRef.current) return;

    let isMounted = true;
    const numLat = Number(lat);
    const numLng = Number(lng);

    async function updateMiniMap() {
      const L = (await import('leaflet')).default;

      if (!miniMapInstanceRef.current && miniMapContainerRef.current) {
        const map = L.map(miniMapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView([numLat, numLng], 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const icon = L.divIcon({
          className: 'kitchen-mini-icon',
          html: `<div style="background-color: #ea580c; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px;">🔥</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([numLat, numLng], { icon, draggable: true }).addTo(map);
        marker.on('dragend', (event: any) => {
          const newPos = event.target.getLatLng();
          setLat(String(newPos.lat.toFixed(6)));
          setLng(String(newPos.lng.toFixed(6)));
        });

        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          setLat(String(e.latlng.lat.toFixed(6)));
          setLng(String(e.latlng.lng.toFixed(6)));
        });

        miniMapMarkerRef.current = marker;
        miniMapInstanceRef.current = map;
      } else if (miniMapInstanceRef.current && miniMapMarkerRef.current) {
        miniMapInstanceRef.current.setView([numLat, numLng], 15);
        miniMapMarkerRef.current.setLatLng([numLat, numLng]);
      }
    }

    updateMiniMap();
  }, [lat, lng]);

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setLogoUrl(compressedDataUrl);
        } else {
          setLogoUrl(base64);
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  // 📍 GPS Capture from device
  const handleCaptureCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada neste navegador.');
      return;
    }

    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(String(position.coords.latitude.toFixed(6)));
        setLng(String(position.coords.longitude.toFixed(6)));
        setGeocoding(false);
        setSuccess('📍 Coordenadas da Cozinha capturadas com sucesso via GPS do dispositivo!');
        setTimeout(() => setSuccess(''), 4000);
      },
      (err) => {
        setGeocoding(false);
        alert(`Não foi possível obter a localização: ${err.message}. Digite o endereço ou CEP e clique em 'Localizar Endereço'.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 🔍 Geocode Address using server-side endpoint
  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      alert('Por favor, digite o endereço ou CEP da sua cozinha primeiro.');
      return;
    }

    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`);

      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          setLat(String(data.lat.toFixed(6)));
          setLng(String(data.lng.toFixed(6)));
          setSuccess(`📍 Endereço localizado no mapa com sucesso! (${data.displayName || 'Coordenadas atualizadas'})`);
          setTimeout(() => setSuccess(''), 5000);
        } else {
          alert('Endereço não localizado com precisão. Digite o CEP ou use o botão "Capturar meu GPS".');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Endereço não encontrado no mapa. Digite o CEP ou use o botão "Capturar meu GPS".');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao consultar endereço. Use o botão "Capturar meu GPS".');
    } finally {
      setGeocoding(false);
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
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
          googleMapsApiKey: googleMapsApiKey.trim(),
          pixKey,
          minOrderValue: Number(minOrderValue) || 0,
        }),
      });

      if (res.ok) {
        setSuccess('Configurações e localização da cozinha salvas com sucesso! O mapa foi atualizado.');
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
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-orange-500" />
            <span>Perfil da Cozinha & Configurações Gerais</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Personalize a identidade visual, localização exata no mapa por GPS, chave PIX e funcionamento.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status de Funcionamento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                Status da Loja (Aberto / Fechado)
              </h3>
              <p className="text-xs text-zinc-400">
                Quando a loja estiver fechada, os clientes não poderão finalizar novos pedidos no cardápio.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                isOpen ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isOpen ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* LOGO DA COZINHA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Logo Oficial do Restaurante / Cozinha
            </h3>
            <span className="text-[11px] bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full font-bold">
              Cabeçalho do Cardápio
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500/50 bg-zinc-950 flex items-center justify-center shadow-lg">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-zinc-600" />
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Carregar Foto do Logotipo</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Envie a logo da sua marca diretamente do seu dispositivo. Ela aparecerá no topo do cardápio para todos os clientes.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-950/40 transition-all active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Foto da Galeria / Arquivos</span>
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

        {/* 📍 ENDEREÇO FÍSICO & LOCALIZAÇÃO EXATA NO MAPA POR GPS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço Físico & Localização Exata da Cozinha no Mapa
            </h3>
            <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-bold">
              Origem das Entregas
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Endereço Completo ou CEP (Rua, Número, Bairro, Cidade - UF)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 120, Centro, SuaCidade - UF ou CEP 01310-100"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />

              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={geocoding}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                title="Localizar endereço automaticamente no mapa"
              >
                <Search className="w-3.5 h-3.5 text-orange-400" />
                <span>{geocoding ? 'Localizando...' : 'Localizar Endereço'}</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureCurrentGPS}
                disabled={geocoding}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                title="Capturar a localização física atual do dispositivo"
              >
                <Crosshair className="w-4 h-4" />
                <span>📍 Capturar meu GPS</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Dica: Você pode digitar o seu <strong>CEP</strong> ou o <strong>Endereço Completo</strong> e clicar em "Localizar Endereço", ou simplesmente clicar em <strong>"📍 Capturar meu GPS"</strong> enquanto estiver no seu estabelecimento.
            </p>
          </div>

          {/* Coordenadas Geográficas Salvas & Editáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs">
            <div>
              <label className="text-zinc-400 font-medium block">
                Latitude da Cozinha (GPS):
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Ex: -19.916681"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-orange-400 font-mono font-bold mt-1 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-medium block">
                Longitude da Cozinha (GPS):
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Ex: -43.934493"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-orange-400 font-mono font-bold mt-1 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Mini Mapa Interativo da Cozinha */}
          {lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Visualização do Pin da Cozinha no Mapa:</span>
                <span className="text-[10px] text-zinc-500">(Clique ou arraste o pin para ajustar a posição exata)</span>
              </div>
              <div
                ref={miniMapContainerRef}
                className="w-full h-48 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner"
              />
            </div>
          )}
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
              placeholder="Ex: Entregas hoje até às 23:30! Espetinho em dobro na compra de combos."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Telefone & Pagamentos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
            WhatsApp Oficial & Chave PIX
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Telefone WhatsApp Oficial da Loja
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
        </div>

        {/* 🗺️ INTEGRAÇÃO COM GOOGLE MAPS PLATFORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Integração com Google Maps API (Opcional)
            </h3>
            <span className="text-[11px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
              Google Maps Oficial
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Chave de API do Google Maps (Google Maps JavaScript API)
            </label>
            <input
              type="password"
              value={googleMapsApiKey}
              onChange={(e) => setGoogleMapsApiKey(e.target.value)}
              placeholder="Ex: AIzaSyD..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Cole sua chave da API do Google Maps para exibir o mapa oficial do Google no rastreamento ao vivo do cliente. Se deixar em branco, o sistema continuará usando o mapa padrão OpenStreetMap automaticamente!
            </p>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-950/50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Salvando Configurações...' : 'Salvar Alterações do Perfil & Localização'}</span>
        </button>
      </form>
    </div>
  );
}
