import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Endereço não informado' }, { status: 400 });
    }

    let cleanAddress = address.trim();

    // 0. Check if there is a CEP (8 digits) inside the address
    const cepMatch = cleanAddress.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) {
      const cepClean = cepMatch[0].replace(/\D/g, '');
      try {
        const viacepRes = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        if (viacepRes.ok) {
          const cepData = await viacepRes.json();
          if (!cepData.erro && cepData.localidade) {
            cleanAddress = `${cepData.logradouro || ''} ${cleanAddress.replace(cepMatch[0], '')}, ${cepData.bairro || ''}, ${cepData.localidade} - ${cepData.uf}`.trim();
          }
        }
      } catch (e) {}
    }

    // 1. Check if store has a Google Maps API Key configured
    try {
      const storeSettings = await prisma.storeSettings.findUnique({
        where: { id: 'default' },
        select: { googleMapsApiKey: true },
      });

      const googleKey = storeSettings?.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleKey && googleKey.trim().length > 10) {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          cleanAddress + ', Brasil'
        )}&key=${googleKey.trim()}&language=pt-BR`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
            const loc = gData.results[0].geometry.location;
            return NextResponse.json({
              lat: loc.lat,
              lng: loc.lng,
              displayName: gData.results[0].formatted_address,
              provider: 'Google Maps',
            });
          }
        }
      }
    } catch (e) {}

    // 2. Generate Search Queries for OpenStreetMap (progressive specificity)
    const queries = [
      cleanAddress,
      // Remove complement keywords (apto, bloco, casa, fundos, etc.)
      cleanAddress.replace(/(apto|apartamento|bloco|casa|fundos|sobrado|lote|qd|quadra|sl|sala)[\s\w\d,-]*/gi, '').trim(),
    ];

    // If address has commas or hyphens, extract subsets (e.g. "Rua X, Bairro, Cidade")
    const parts = cleanAddress.split(/[,-]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      queries.push(parts.join(', '));
      queries.push(`${parts[0]}, ${parts[parts.length - 1]}`);
    }

    // Try Nominatim
    for (const q of queries) {
      if (!q || q.length < 3) continue;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q + ', Brasil'
        )}&limit=1&addressdetails=1&countrycodes=br`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CardapioDeliveryApp/2.0 (delivery-geocoding)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return NextResponse.json({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              displayName: data[0].display_name,
              provider: 'OpenStreetMap',
            });
          }
        }
      } catch (e) {}
    }

    // 3. Try Photon Komoot Geocoder
    for (const q of queries) {
      if (!q || q.length < 3) continue;
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q + ' Brasil')}&limit=1&lang=pt`;
        const photonRes = await fetch(photonUrl);
        if (photonRes.ok) {
          const photonData = await photonRes.json();
          if (photonData.features && photonData.features.length > 0) {
            const coords = photonData.features[0].geometry.coordinates; // [lng, lat]
            const props = photonData.features[0].properties;
            return NextResponse.json({
              lat: coords[1],
              lng: coords[0],
              displayName: `${props.name || ''}, ${props.city || props.state || 'Brasil'}`,
              provider: 'Photon Komoot',
            });
          }
        }
      } catch (e) {}
    }

    return NextResponse.json(
      {
        error:
          'Não conseguimos localizar este endereço no mapa automaticamente. Clique no botão verde "📍 Capturar meu GPS" para preencher a sua localização exata!',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro na rota de geocodificação:', error);
    return NextResponse.json({ error: 'Erro ao geolocalizar endereço' }, { status: 500 });
  }
}
