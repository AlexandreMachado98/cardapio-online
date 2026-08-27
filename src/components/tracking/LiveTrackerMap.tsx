'use client';

import React, { useEffect, useRef, useState } from 'react';
import { OrderData } from '@/types';
import { Bike, MapPin, Store, Navigation, Phone, MessageCircle, Clock, ShieldCheck, Play, RefreshCw } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/whatsapp';

interface LiveTrackerMapProps {
  order: OrderData;
  onRefresh?: () => void;
}

export default function LiveTrackerMap({ order, onRefresh }: LiveTrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const courierMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Restaurant fixed coordinates (e.g. Center)
  const restaurantCoords: [number, number] = [-23.55052, -46.633308];

  // Customer Target coords
  const targetCoords: [number, number] = [
    order.targetLat || -23.561684,
    order.targetLng || -46.655981,
  ];

  // Current Courier Coordinates
  const [courierPos, setCourierPos] = useState<[number, number]>([
    order.courierLat || restaurantCoords[0],
    order.courierLng || restaurantCoords[1],
  ]);

  const [etaMinutes, setEtaMinutes] = useState<number>(12);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix icon issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView(courierPos, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        // 1. Restaurant Marker
        const restaurantIcon = L.divIcon({
          className: 'custom-rest-icon',
          html: `<div style="background-color: #ea580c; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 16px;">🔥</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        L.marker(restaurantCoords, { icon: restaurantIcon })
          .addTo(map)
          .bindPopup('<b>Cozinha / Restaurante</b><br>Origem do Pedido');

        // 2. Customer Destination Marker
        const targetIcon = L.divIcon({
          className: 'custom-target-icon',
          html: `<div style="background-color: #10b981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 16px;">📍</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        L.marker(targetCoords, { icon: targetIcon })
          .addTo(map)
          .bindPopup(`<b>Seu Endereço</b><br>${order.addressText || 'Destino'}`);

        // 3. Courier Motoboy Marker (Pulsing)
        const courierIcon = L.divIcon({
          className: 'custom-courier-icon',
          html: `<div style="background-color: #f97316; color: white; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 15px rgba(249,115,22,0.8); font-size: 20px;">🛵</div>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        });
        courierMarkerRef.current = L.marker(courierPos, { icon: courierIcon })
          .addTo(map)
          .bindPopup(`<b>${order.courierName || 'Entregador'}</b><br>A caminho!`);

        // 4. Polyline Route
        const latlngs: [number, number][] = [restaurantCoords, courierPos, targetCoords];
        polylineRef.current = L.polyline(latlngs, {
          color: '#ea580c',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }).addTo(map);

        map.fitBounds(L.latLngBounds([restaurantCoords, targetCoords]).pad(0.2));
        mapInstanceRef.current = map;
      }
    }

    initLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update courier marker & route when coordinates change
  useEffect(() => {
    if (courierMarkerRef.current && mapInstanceRef.current) {
      courierMarkerRef.current.setLatLng(courierPos);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([restaurantCoords, courierPos, targetCoords]);
      }
    }
  }, [courierPos]);

  // Polling location from API every 4s if order is out for delivery
  useEffect(() => {
    if (order.status !== 'OUT_FOR_DELIVERY' || isSimulating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${order.id}/location`);
        if (res.ok) {
          const data = await res.json();
          if (data.courierLat && data.courierLng) {
            setCourierPos([data.courierLat, data.courierLng]);
          }
        }
      } catch (err) {
        console.error('Polling location error', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order.id, order.status, isSimulating]);

  // Simulation mode: Smoothly interpolate motoboy movement from Restaurant -> Customer
  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    let step = 0;
    const totalSteps = 20;

    const simInterval = setInterval(() => {
      step += 1;
      setSimStep(step);

      const ratio = step / totalSteps;
      const currentLat = restaurantCoords[0] + (targetCoords[0] - restaurantCoords[0]) * ratio;
      const currentLng = restaurantCoords[1] + (targetCoords[1] - restaurantCoords[1]) * ratio;

      const newPos: [number, number] = [currentLat, currentLng];
      setCourierPos(newPos);

      // Recalculate ETA
      const remainingEta = Math.max(1, Math.round(12 * (1 - ratio)));
      setEtaMinutes(remainingEta);

      // Also persist to API
      fetch(`/api/pedidos/${order.id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: currentLat, lng: currentLng }),
      }).catch(() => {});

      if (step >= totalSteps) {
        clearInterval(simInterval);
        setIsSimulating(false);
      }
    }, 1500);
  };

  const motoboyWhatsApp = order.courierPhone
    ? createWhatsAppLink(order.courierPhone, `Olá ${order.courierName}, sou o cliente do Pedido #${order.orderNumber}!`)
    : '#';

  return (
    <div className="space-y-4">
      {/* Top Status & ETA Card */}
      <div className="bg-gradient-to-r from-orange-950/80 via-zinc-900 to-zinc-900 border border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center animate-bounce-short">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
                  Rastreamento em Tempo Real
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {order.courierName || 'Carlos Motoboy'} está a caminho!
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Destino: {order.addressText || 'Seu endereço'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Previsão de Chegada</div>
              <div className="text-base font-extrabold text-orange-400">
                ~ {etaMinutes} minutos
              </div>
            </div>
          </div>
        </div>

        {/* Courier Contact Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Entrega Segura & Monitorada por GPS</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={motoboyWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Entregador</span>
            </a>

            <button
              onClick={handleToggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSimulating
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
              title="Testar deslocamento do motoboy no mapa"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Simulando Rota...' : 'Simular Rota GPS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-xl p-2.5 text-xs text-zinc-200 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600 inline-block border border-white"></span>
            <span>Restaurante (Origem)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block border border-white"></span>
            <span>Motoboy ao vivo (GPS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white"></span>
            <span>Seu Endereço (Destino)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
