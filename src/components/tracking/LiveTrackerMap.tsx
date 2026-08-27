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
  Crosshair,
  Layers,
} from 'lucide-react';
import { createWhatsAppLink } from '@/lib/whatsapp';

declare global {
  interface Window {
    google: any;
  }
}

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
  const restaurantMarkerRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Google Maps specific refs
  const googleMapRef = useRef<any>(null);
  const googleCourierMarkerRef = useRef<any>(null);
  const googlePolylineRef = useRef<any>(null);

  // Dynamic Restaurant origin point from settings
  const [restaurantCoords, setRestaurantCoords] = useState<[number, number] | null>(null);
  const [storeAddress, setStoreAddress] = useState<string>('Cozinha / Restaurante');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');

  // Customer destination point
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);

  // Real Courier Coordinates from Database
  const [courierPos, setCourierPos] = useState<[number, number] | null>(null);

  const [hasRealGps, setHasRealGps] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [etaMinutes, setEtaMinutes] = useState<number>(10);
  const [mapReady, setMapReady] = useState(false);
  const [mapEngine, setMapEngine] = useState<'GOOGLE' | 'OSM'>('OSM');

  // 1. Load Real Store & Target Location
  useEffect(() => {
    let isCancelled = false;

    async function initLocations() {
      try {
        const configRes = await fetch('/api/config');
        let rLat = -23.5505;
        let rLng = -46.6333;
        let storeAddr = 'Cozinha';
        let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.lat && cfg.lng) {
            rLat = Number(cfg.lat);
            rLng = Number(cfg.lng);
            storeAddr = cfg.address || 'Cozinha';
          }
          if (cfg.googleMapsApiKey) {
            apiKey = cfg.googleMapsApiKey;
          }
        }

        if (isCancelled) return;
        setRestaurantCoords([rLat, rLng]);
        setStoreAddress(storeAddr);
        setGoogleMapsApiKey(apiKey);
        if (apiKey && apiKey.trim().length > 10) {
          setMapEngine('GOOGLE');
        }

        // Determine Target (Customer) Coordinates
        let tLat = order.targetLat;
        let tLng = order.targetLng;

        const isDefaultSP = tLat && tLng && Math.abs(tLat - (-23.561684)) < 0.001 && Math.abs(tLng - (-46.655981)) < 0.001;
        if ((!tLat || !tLng || isDefaultSP) && order.addressText && order.addressText !== 'Retirada no Balcão') {
          try {
            const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(order.addressText)}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.lat && geoData.lng) {
                tLat = geoData.lat;
                tLng = geoData.lng;
              }
            }
          } catch (e) {}
        }

        if (!tLat || !tLng || isDefaultSP) {
          tLat = rLat + 0.008;
          tLng = rLng + 0.008;
        }

        if (isCancelled) return;
        setTargetCoords([tLat, tLng]);

        // Courier position
        let cLat = order.courierLat;
        let cLng = order.courierLng;
        const isCourierDefaultSP = cLat && cLng && Math.abs(cLat - (-23.5505)) < 0.001 && Math.abs(cLng - (-46.6333)) < 0.001;

        if (!cLat || !cLng || isCourierDefaultSP) {
          cLat = rLat;
          cLng = rLng;
        } else {
          setHasRealGps(true);
        }

        if (isCancelled) return;
        setCourierPos([cLat, cLng]);

        const dist = calculateDistanceKm(cLat, cLng, tLat, tLng);
        setDistanceKm(Number(dist.toFixed(1)));
        setEtaMinutes(Math.max(2, Math.round((dist / 30) * 60) + 2));

        setMapReady(true);
      } catch (err) {
        console.error('Erro ao preparar localização:', err);
      }
    }

    initLocations();

    return () => {
      isCancelled = true;
    };
  }, [order.id, order.addressText, order.targetLat, order.targetLng, order.courierLat, order.courierLng]);

  // 2. Initialize Google Maps or Leaflet Map
  useEffect(() => {
    if (!mapReady || !restaurantCoords || !targetCoords || !courierPos || !mapContainerRef.current) return;

    if (mapEngine === 'GOOGLE' && googleMapsApiKey) {
      // --- RENDER GOOGLE MAPS ---
      const scriptId = 'google-maps-sdk';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      const initGoogle = () => {
        if (!window.google || !mapContainerRef.current) return;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: courierPos[0], lng: courierPos[1] },
          zoom: 14,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        });

        // 1. Restaurant Marker
        new window.google.maps.Marker({
          position: { lat: restaurantCoords[0], lng: restaurantCoords[1] },
          map,
          title: `Cozinha: ${storeAddress}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
          },
        });

        // 2. Customer Destination Marker
        new window.google.maps.Marker({
          position: { lat: targetCoords[0], lng: targetCoords[1] },
          map,
          title: `Destino: ${order.addressText || 'Cliente'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          },
        });

        // 3. Courier Motoboy Marker
        const courierMarker = new window.google.maps.Marker({
          position: { lat: courierPos[0], lng: courierPos[1] },
          map,
          title: order.courierName || 'Entregador',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/motorcycling.png',
          },
        });
        googleCourierMarkerRef.current = courierMarker;

        // 4. Route Polyline
        const polyline = new window.google.maps.Polyline({
          path: [
            { lat: restaurantCoords[0], lng: restaurantCoords[1] },
            { lat: courierPos[0], lng: courierPos[1] },
            { lat: targetCoords[0], lng: targetCoords[1] },
          ],
          geodesic: true,
          strokeColor: '#ea580c',
          strokeOpacity: 0.85,
          strokeWeight: 4,
        });
        polyline.setMap(map);
        googlePolylineRef.current = polyline;

        // Fit Bounds
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: restaurantCoords[0], lng: restaurantCoords[1] });
        bounds.extend({ lat: targetCoords[0], lng: targetCoords[1] });
        bounds.extend({ lat: courierPos[0], lng: courierPos[1] });
        map.fitBounds(bounds);

        googleMapRef.current = map;
      };

      if (!window.google) {
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
          script.async = true;
          script.defer = true;
          script.onload = initGoogle;
          document.head.appendChild(script);
        } else {
          script.onload = initGoogle;
        }
      } else {
        initGoogle();
      }
    } else {
      // --- RENDER LEAFLET / OPENSTREETMAP ---
      async function initLeaflet() {
        if (!mapContainerRef.current || !restaurantCoords || !targetCoords || !courierPos) return;

        const L = (await import('leaflet')).default;

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

          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          // 1. Restaurant Marker
          const restaurantIcon = L.divIcon({
            className: 'custom-rest-icon',
            html: `<div style="background-color: #ea580c; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 18px;">🔥</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          restaurantMarkerRef.current = L.marker(restaurantCoords, { icon: restaurantIcon })
            .addTo(map)
            .bindPopup(`<b>Cozinha</b><br>${storeAddress}`);

          // 2. Customer Destination Marker
          const targetIcon = L.divIcon({
            className: 'custom-target-icon',
            html: `<div style="background-color: #10b981; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 18px;">📍</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          targetMarkerRef.current = L.marker(targetCoords, { icon: targetIcon })
            .addTo(map)
            .bindPopup(`<b>Seu Endereço</b><br>${order.addressText || 'Destino'}`);

          // 3. Courier Marker
          const courierIcon = L.divIcon({
            className: 'custom-courier-icon',
            html: `<div style="background-color: #f97316; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 20px rgba(249,115,22,0.9); font-size: 22px;">🛵</div>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });
          courierMarkerRef.current = L.marker(courierPos, { icon: courierIcon })
            .addTo(map)
            .bindPopup(`<b>${order.courierName || 'Entregador'}</b><br>Deslocamento por GPS ao vivo!`);

          // 4. Route Polyline
          const latlngs: [number, number][] = [restaurantCoords, courierPos, targetCoords];
          polylineRef.current = L.polyline(latlngs, {
            color: '#ea580c',
            weight: 4,
            opacity: 0.85,
            dashArray: '6, 8',
          }).addTo(map);

          const bounds = L.latLngBounds([restaurantCoords, targetCoords, courierPos]);
          map.fitBounds(bounds.pad(0.25));
          mapInstanceRef.current = map;
        }
      }

      initLeaflet();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapReady, mapEngine, googleMapsApiKey, restaurantCoords, targetCoords]);

  // 3. Real-Time GPS Polling from Motoboy
  useEffect(() => {
    if (!mapReady || order.status !== 'OUT_FOR_DELIVERY') return;

    const pollRealGps = async () => {
      try {
        const res = await fetch(`/api/pedidos/${order.id}/location`);
        if (res.ok) {
          const data = await res.json();
          if (data.courierLat && data.courierLng) {
            const newPos: [number, number] = [Number(data.courierLat), Number(data.courierLng)];
            setCourierPos(newPos);
            setHasRealGps(true);

            if (targetCoords) {
              const dist = calculateDistanceKm(newPos[0], newPos[1], targetCoords[0], targetCoords[1]);
              setDistanceKm(Number(dist.toFixed(1)));
              setEtaMinutes(Math.max(2, Math.round((dist / 30) * 60) + 2));
            }

            // Update Google Maps Marker
            if (googleCourierMarkerRef.current && window.google) {
              googleCourierMarkerRef.current.setPosition({ lat: newPos[0], lng: newPos[1] });
              if (googlePolylineRef.current && restaurantCoords && targetCoords) {
                googlePolylineRef.current.setPath([
                  { lat: restaurantCoords[0], lng: restaurantCoords[1] },
                  { lat: newPos[0], lng: newPos[1] },
                  { lat: targetCoords[0], lng: targetCoords[1] },
                ]);
              }
            }

            // Update Leaflet Marker
            if (courierMarkerRef.current) {
              courierMarkerRef.current.setLatLng(newPos);
            }
            if (polylineRef.current && restaurantCoords && targetCoords) {
              polylineRef.current.setLatLngs([restaurantCoords, newPos, targetCoords]);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar GPS do motoboy', err);
      }
    };

    pollRealGps();
    const interval = setInterval(pollRealGps, 3000);
    return () => clearInterval(interval);
  }, [mapReady, order.id, order.status, targetCoords, restaurantCoords]);

  // 4. Center on User GPS
  const handleCenterOnUserGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não disponível no navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (googleMapRef.current && window.google) {
          googleMapRef.current.setCenter({ lat: userLat, lng: userLng });
          googleMapRef.current.setZoom(16);
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 16);
          if (targetMarkerRef.current) {
            targetMarkerRef.current.setLatLng([userLat, userLng]);
          }
        }

        setTargetCoords([userLat, userLng]);
        if (courierPos) {
          const dist = calculateDistanceKm(courierPos[0], courierPos[1], userLat, userLng);
          setDistanceKm(Number(dist.toFixed(1)));
          setEtaMinutes(Math.max(2, Math.round((dist / 30) * 60) + 2));
        }
      },
      (err) => {
        alert(`Erro ao obter sua localização: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

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
                <span className="text-amber-400">Aguardando início da transmissão do motoboy...</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCenterOnUserGPS}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              title="Ajustar mapa para a minha localização atual no GPS"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Meu GPS</span>
            </button>

            <a
              href={motoboyWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Entregador</span>
            </a>
          </div>
        </div>
      </div>

      {/* Map Box */}
      <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
        {!mapReady ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-zinc-950">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400">Carregando mapa e satélite...</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Floating Legend */}
        {mapReady && (
          <div className="absolute bottom-4 left-4 z-[400] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-3 text-xs text-zinc-200 space-y-1.5 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-600 inline-block border-2 border-white"></span>
              <span className="font-semibold">Cozinha (Origem)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block border-2 border-white animate-pulse"></span>
              <span className="font-bold text-orange-400">Motoboy em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block border-2 border-white"></span>
              <span className="font-semibold">Seu Endereço</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
