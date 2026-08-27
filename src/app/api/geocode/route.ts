import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Endereço não informado' }, { status: 400 });
    }

    const cleanAddress = address.trim();

    // 1. First Attempt: Nominatim OpenStreetMap with full structured address
    const nominatimQueries = [
      cleanAddress,
      cleanAddress.replace(/(apto|apartamento|bloco|casa|fundos|sobrado|lote|qd|quadra)[\s\w\d,-]*/gi, '').trim(),
    ];

    for (const q of nominatimQueries) {
      if (!q) continue;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q + ', Brasil'
        )}&limit=1&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CardapioDeliveryApp/2.0 (brazilian-delivery-geocoding)',
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
            });
          }
        }
      } catch (e) {
        // continue to next provider
      }
    }

    // 2. Second Attempt: Photon Komoot OpenStreetMap Geocoder (high street-level accuracy)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanAddress)}&limit=1&lang=pt`;
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
          });
        }
      }
    } catch (e) {
      // continue
    }

    return NextResponse.json(
      { error: 'Endereço não localizado com precisão. Tente adicionar a Cidade e Estado.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro na rota de geocodificação:', error);
    return NextResponse.json({ error: 'Erro ao geolocalizar endereço' }, { status: 500 });
  }
}
