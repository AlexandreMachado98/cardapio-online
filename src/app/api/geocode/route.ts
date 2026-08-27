import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Endereço não informado' }, { status: 400 });
    }

    const cleanAddress = address.trim();

    // Queries to attempt in order of specificity
    const attempts = [
      cleanAddress,
      // Remove apartment/complement notes if any
      cleanAddress.replace(/(apto|apartamento|bloco|casa|fundos|sobrado|lote|qd|quadra)[\s\w\d,-]*/gi, '').trim(),
    ];

    for (const query of attempts) {
      if (!query) continue;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Brasil'
      )}&limit=1&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CardapioOnlineDelivery/1.0 (delivery-app-geocoding)',
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
    }

    return NextResponse.json(
      { error: 'Endereço não localizado com precisão no mapa' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro na rota de geocodificação:', error);
    return NextResponse.json({ error: 'Erro ao geolocalizar endereço' }, { status: 500 });
  }
}
