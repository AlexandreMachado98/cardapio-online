'use client';

import React, { useEffect, useRef, useState } from 'react';
import { OrderData } from '@/types';
import {
  Bike,
  MapPin,
  Store,
  Navigation,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Signal,
  CheckCircle2,
} from 'lucide-react';
import { createWhatsAppLink } from '@/lib/whatsapp';

interface LiveTrackerMapProps {
  order: OrderData;
  onRefresh?: () => void;
}

// Distance in kilometers using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LiveTrackerMap({ order, onRefresh }: LiveTrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const courierMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Restaurant origin point
  const restaurantCoords: [number, number] = [-23.55052, -46.633308];

  // Customer destination point
  const targetCoords: [number, number] = [
    order.targetLat || -23.561684,
    order.targetLng || -46.655981,
  ];

  // Real Courier Coordinates from Database
  const [courierPos, setCourierPos] = useState<[number, number]>([
    order.courierLat || restaurantCoords[0],
    order.courierLng || restaurantCoords[1],
  ]);

  const [hasRealGps, setHasRealGps] = useState(Boolean(order.courierLat && order.courierLng));
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [etaMinutes, setEtaMinutes] = useState<number>(10);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate real distance and realistic ETA
  const updateDistanceAndEta = (cLat: number, cLng: number) => {
    const dist = calculateDistanceKm(cLat, cLng, targetCoords[0], targetCoords[1]);
    setDistanceKm(Number(dist.toFixed(1)));
    // Estimate: average speed 30km/h in city + 2 mins buffer
    const calculatedMinutes = Math.max(2, Math.round((dist / 30) * 60) + 2);
    setEtaMinutes(calculatedMinutes);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix default icons
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

        // 1. Restaurant Marker (Origem)
        const restaurantIcon = L.divIcon({
          className: 'custom-rest-icon',
          html: `<div style="background-color: #ea580c; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px;">🔥</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker(restaurantCoords, { icon: restaurantIcon })
          .addTo(map)
          .bindPopup('<b>Cozinha / Restaurante</b><br>Origem do Pedido');

        // 2. Customer Destination Marker (Destino)
        const targetIcon = L.divIcon({
          className: 'custom-target-icon',
          html: `<div style="background-color: #10b981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px;">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker(targetCoords, { icon: targetIcon })
          .addTo(map)
          .bindPopup(`<b>Seu Endereço</b><br>${order.addressText || 'Destino'}`);

        // 3. Real Courier Motoboy Marker (Ao Vivo)
        const courierIcon = L.divIcon({
          className: 'custom-courier-icon',
          html: `<div style="background-color: #f97316; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 20px rgba(249,115,22,0.9); font-size: 22px;">🛵</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        courierMarkerRef.current = L.marker(courierPos, { icon: courierIcon })
          .addTo(map)
          .bindPopup(`<b>${order.courierName || 'Entregador'}</b><br>Deslocamento por GPS ao vivo!`);

        // 4. Polyline Route
        const latlngs: [number, number][] = [restaurantCoords, courierPos, targetCoords];
        polylineRef.current = L.polyline(latlngs, {
          color: '#ea580c',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(map);

        map.fitBounds(L.latLngBounds([restaurantCoords, targetCoords]).pad(0.2));
        mapInstanceRef.current = map;

        updateDistanceAndEta(courierPos[0], courierPos[1]);
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

  // REAL GPS POLLING: Fetch Motoboy Smartphone GPS every 3 seconds
  useEffect(() => {
    if (order.status !== 'OUT_FOR_DELIVERY') return;

    const pollRealGps = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch(`/api/pedidos/${order.id}/location`);
        if (res.ok) {
          const data = await res.json();
          if (data.courierLat && data.courierLng) {
            const newPos: [number, number] = [Number(data.courierLat), Number(data.courierLng)];
            setCourierPos(newPos);
            setHasRealGps(true);
            setLastSync(new Date());
            updateDistanceAndEta(newPos[0], newPos[1]);

            // Update marker on Leaflet map
            if (courierMarkerRef.current) {
              courierMarkerRef.current.setLatLng(newPos);
            }
            if (polylineRef.current) {
              polylineRef.current.setLatLngs([restaurantCoords, newPos, targetCoords]);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar GPS real do motoboy', err);
      } finally {
        setIsSyncing(false);
      }
    };

    pollRealGps();
    const interval = setInterval(pollRealGps, 3000);
    return () => clearInterval(interval);
  }, [order.id, order.status]);

  const motoboyWhatsApp = order.courierPhone
    ? createWhatsAppLink(order.courierPhone, `Olá ${order.courierName || 'Entregador'}, sou o cliente do Pedido #${order.orderNumber}!`)
    : '#';

  return (
    <div className="space-y-4">
      {/* Real-time Status Card */}
      <div className="bg-gradient-to-r from-orange-950/80 via-zinc-900 to-zinc-900 border border-orange-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center animate-bounce-short flex-shrink-0">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
                  Rastreamento GPS em Tempo Real
                </span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {order.courierName || 'Carlos Motoboy'} está a caminho!
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {order.courierVehicle ? `${order.courierVehicle} • ` : ''}Destino: {order.addressText || 'Seu endereço'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-2xl">
            <Clock className="w-6 h-6 text-orange-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Tempo Estimado</div>
              <div className="text-lg font-black text-orange-400">
                ~ {etaMinutes} minutos
              </div>
              {distanceKm > 0 && (
                <div className="text-[10px] text-zinc-500">Distância: ~ {distanceKm} km</div>
              )}
            </div>
          </div>
        </div>

        {/* Live GPS Telemetry Bar */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Signal className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>
              {hasRealGps ? (
                <strong className="text-emerald-400">Sinal GPS Conectado ao Celular do Motoboy</strong>
              ) : (
                <span className="text-amber-400">Aguardando início da rota do motoboy...</span>
              )}
            </span>
            <span className="text-zinc-600">• Atualizado há segundos</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={motoboyWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp do Entregador</span>
            </a>
          </div>
        </div>
      </div>

      {/* Leaflet Real-time Map Box */}
      <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-3 text-xs text-zinc-200 space-y-1.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-600 inline-block border-2 border-white"></span>
            <span className="font-semibold">Cozinha / Origem</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block border-2 border-white animate-pulse"></span>
            <span className="font-bold text-orange-400">Motoboy em tempo real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block border-2 border-white"></span>
            <span className="font-semibold">Seu Endereço de Entrega</span>
          </div>
        </div>
      </div>
    </div>
  );
}
