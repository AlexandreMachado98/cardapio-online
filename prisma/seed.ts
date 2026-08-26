import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Sabor & Espeto...');

  // Limpar tabelas
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.deliveryZone.deleteMany({});

  // 1. Zonas de Entrega
  const zones = [
    { neighborhood: 'Centro', fee: 5.0, estimatedMinutes: 25 },
    { neighborhood: 'Jardim das Flores', fee: 6.5, estimatedMinutes: 30 },
    { neighborhood: 'Vila Nova', fee: 7.0, estimatedMinutes: 35 },
    { neighborhood: 'Bela Vista', fee: 8.0, estimatedMinutes: 40 },
    { neighborhood: 'Parque São Jorge', fee: 9.0, estimatedMinutes: 45 },
    { neighborhood: 'Outros / Sob Consulta', fee: 10.0, estimatedMinutes: 50 },
  ];

  for (const zone of zones) {
    await prisma.deliveryZone.create({ data: zone });
  }

  // 2. Categorias
  const catTradicionais = await prisma.category.create({
    data: {
      name: 'Espetinhos Tradicionais',
      slug: 'tradicionais',
      icon: 'Flame',
      sortOrder: 1,
    },
  });

  const catEspeciais = await prisma.category.create({
    data: {
      name: 'Espetos Especiais & Nobres',
      slug: 'especiais',
      icon: 'Crown',
      sortOrder: 2,
    },
  });

  const catQueijos = await prisma.category.create({
    data: {
      name: 'Queijos & Pães de Alho',
      slug: 'queijos-paes',
      icon: 'Sparkles',
      sortOrder: 3,
    },
  });

  const catAcompanhamentos = await prisma.category.create({
    data: {
      name: 'Porções & Acompanhamentos',
      slug: 'acompanhamentos',
      icon: 'UtensilsCrossed',
      sortOrder: 4,
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: 'Bebidas Geladas',
      slug: 'bebidas',
      icon: 'Beer',
      sortOrder: 5,
    },
  });

  const catCombos = await prisma.category.create({
    data: {
      name: 'Combos & Barcas',
      slug: 'combos',
      icon: 'Gift',
      sortOrder: 0,
    },
  });

  // 3. Produtos
  const products = [
    // Combos
    {
      name: 'Combo Espeto Master (5 Espetos + Mandioca + 2 Bebidas)',
      description: 'Escolha 5 espetinhos tradicionais, acompanha porção média de mandioca na manteiga de garrafa, farofa da casa, vinagrete e 2 refris lata.',
      price: 68.90,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      badge: 'Campeão de Vendas',
      categoryId: catCombos.id,
      meatPoints: JSON.stringify(['Ao Ponto', 'Bem Passado', 'Mal Passado']),
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Barca Raiz da Brasa (10 Espetos Variados + Guarnições)',
      description: 'Serve até 4 pessoas: 2 Picanha, 2 Alcatra, 2 Frango c/ Bacon, 2 Queijo Coalho c/ Melaço, 2 Pão de Alho, farta farofa crocante e vinagrete artesanal.',
      price: 119.00,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      badge: 'Super Oferta',
      categoryId: catCombos.id,
      meatPoints: JSON.stringify(['Ao Ponto', 'Bem Passado']),
      hasFarofa: true,
      hasVinagrete: true,
    },

    // Tradicionais
    {
      name: 'Espetinho de Alcatra Nobre',
      description: 'Cubos macios e suculentos de alcatra temperada com sal grosso marinho e chimichurri artesanal.',
      price: 12.50,
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
      badge: 'Mais Pedido',
      categoryId: catTradicionais.id,
      meatPoints: JSON.stringify(['Ao Ponto', 'Bem Passado', 'Mal Passado']),
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Frango com Bacon (Medalhão)',
      description: 'Cubos selecionados de peito de frango enrolados em fatias crocantes de bacon defumado.',
      price: 11.90,
      imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
      badge: 'Favorito',
      categoryId: catTradicionais.id,
      meatPoints: null,
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Linguiça Toscana Bragantina',
      description: 'Linguiça toscana de corte artesanal, suculenta, dourada na brasa com toque de ervas finas.',
      price: 10.50,
      imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catTradicionais.id,
      meatPoints: null,
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Coração de Frango',
      description: 'Coraçõezinhos marinados no vinho branco e ervas, grelhados no ponto perfeito, extremamente macios.',
      price: 12.00,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catTradicionais.id,
      meatPoints: null,
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Kafta Árabe com Hortelã',
      description: 'Carne moída nobre temperada com especiarias orientais, cebola roxa e hortelã fresca.',
      price: 11.90,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catTradicionais.id,
      meatPoints: JSON.stringify(['Ao Ponto', 'Bem Passado']),
      hasFarofa: true,
      hasVinagrete: true,
    },

    // Especiais
    {
      name: 'Espetinho de Picanha Grill com Alho Crocante',
      description: 'Corte nobre com capa de gordura dourada na brasa e finalizado com lâminas de alho frito crocante.',
      price: 16.90,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      badge: 'Especial Chef',
      categoryId: catEspeciais.id,
      meatPoints: JSON.stringify(['Ao Ponto', 'Bem Passado', 'Mal Passado']),
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Costela Bovina Desfiando',
      description: 'Costela assada lentamente no bafo por 6 horas e finalizada na brasa com molho barbecue artesanal.',
      price: 15.90,
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
      badge: 'Novidade',
      categoryId: catEspeciais.id,
      meatPoints: null,
      hasFarofa: true,
      hasVinagrete: true,
    },
    {
      name: 'Espetinho de Cupim Amanteigado',
      description: 'Cupim derretendo na boca, cozido em baixa temperatura e selado na brasa com manteiga de garrafa.',
      price: 16.50,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catEspeciais.id,
      meatPoints: null,
      hasFarofa: true,
      hasVinagrete: true,
    },

    // Queijos & Pães
    {
      name: 'Espeto de Queijo Coalho com Melaço de Cana',
      description: 'Queijo coalho tostado com casquinha dourada crocante e fio generoso de melaço ou orégano.',
      price: 11.50,
      imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
      badge: 'Queridinho',
      categoryId: catQueijos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Pão de Alho Especial Recheado com Catupiry',
      description: 'Baguete crocante recheada com pasta de alho da casa e queijo catupiry cremoso derretido.',
      price: 9.90,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      badge: 'Top 1',
      categoryId: catQueijos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Pão de Alho Doce com Doce de Leite & Queijo',
      description: 'Combinação irresistível de pão crocante, queijo leve e doce de leite cremoso na brasa.',
      price: 10.90,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      badge: 'Sobremesa',
      categoryId: catQueijos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },

    // Acompanhamentos
    {
      name: 'Porção de Mandioca Cozida na Manteiga de Garrafa (400g)',
      description: 'Mandioca super macia desmanchando, regada na manteiga de garrafa e cheiro verde fresco.',
      price: 18.90,
      imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catAcompanhamentos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Pote Extra de Farofa Crocante de Bacon (150g)',
      description: 'Nossa famosa farofa artesanal crocante feita com bacon em cubinhos e cebola tostada.',
      price: 6.00,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catAcompanhamentos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Pote Extra de Vinagrete Especial da Casa (150g)',
      description: 'Tomates maduros, cebola roxa picadinha, pimentão, cheiro verde e azeite extravirgem.',
      price: 6.00,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catAcompanhamentos.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },

    // Bebidas
    {
      name: 'Coca-Cola Original 350ml Lata',
      description: 'Lata trincando de gelada.',
      price: 6.50,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catBebidas.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Guaraná Antarctica 350ml Lata',
      description: 'Lata trincando de gelada.',
      price: 6.00,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catBebidas.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Cerveja Heineken Long Neck 330ml',
      description: 'Cerveja premium puro malte, super gelada.',
      price: 10.90,
      imageUrl: 'https://images.unsplash.com/photo-1608270119337-b952a21fc733?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catBebidas.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
    {
      name: 'Suco Natural de Laranja 500ml',
      description: 'Feito na hora com laranjas frescas selecionadas.',
      price: 8.50,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
      badge: null,
      categoryId: catBebidas.id,
      meatPoints: null,
      hasFarofa: false,
      hasVinagrete: false,
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  // 4. Criar um cliente de exemplo e um pedido demonstrativo
  const customer = await prisma.customer.create({
    data: {
      name: 'Alexandre Silva',
      phone: '11987654321',
      email: 'alexandre@email.com',
      addresses: {
        create: [
          {
            street: 'Av. Paulista',
            number: '1000',
            complement: 'Apto 42',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            cep: '01310-100',
            lat: -23.561684,
            lng: -46.655981,
            isDefault: true,
          }
        ]
      }
    }
  });

  const demoOrder = await prisma.order.create({
    data: {
      orderNumber: 1001,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryType: 'DELIVERY',
      addressText: 'Av. Paulista, 1000 - Apto 42, Bela Vista, São Paulo - SP',
      neighborhood: 'Bela Vista',
      deliveryFee: 8.00,
      subtotal: 44.90,
      total: 52.90,
      paymentMethod: 'PIX',
      status: 'OUT_FOR_DELIVERY',
      notes: 'Por favor, enviar farofa bem caprichada!',
      courierName: 'Carlos Motoboy',
      courierPhone: '11998877665',
      courierLat: -23.5570,
      courierLng: -46.6600,
      targetLat: -23.561684,
      targetLng: -46.655981,
      whatsappSent: true,
      items: {
        create: [
          {
            productName: 'Espetinho de Alcatra Nobre',
            quantity: 2,
            unitPrice: 12.50,
            totalPrice: 25.00,
            meatPoint: 'Ao Ponto',
            farofa: true,
            vinagrete: true,
          },
          {
            productName: 'Pão de Alho Especial Recheado com Catupiry',
            quantity: 1,
            unitPrice: 9.90,
            totalPrice: 9.90,
            farofa: false,
            vinagrete: false,
          },
          {
            productName: 'Cerveja Heineken Long Neck 330ml',
            quantity: 1,
            unitPrice: 10.00,
            totalPrice: 10.00,
          }
        ]
      }
    }
  });

  console.log(`✅ Seed concluído! Criado Pedido Demo #${demoOrder.orderNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
