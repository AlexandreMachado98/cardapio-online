'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category, ProductComplement } from '@/types';
import { formatBRL } from '@/lib/utils';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  X,
  Search,
  CheckCircle2,
  Flame,
  Percent,
  PlusCircle,
} from 'lucide-react';

export default function AdminProdutosPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [badge, setBadge] = useState('');
  const [available, setAvailable] = useState(true);
  const [categoryId, setCategoryId] = useState('');

  // Meat points
  const [hasMeatPoints, setHasMeatPoints] = useState(true);
  const [meatPointsText, setMeatPointsText] = useState('Ao Ponto, Bem Passado, Mal Passado');

  // Dynamic Complements State
  const [complementsList, setComplementsList] = useState<ProductComplement[]>([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('0');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/produtos?all=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar produtos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80');
    setBadge('');
    setAvailable(true);
    setCategoryId(categories[0]?.id || '');
    setHasMeatPoints(true);
    setMeatPointsText('Ao Ponto, Bem Passado, Mal Passado');
    // Default initial complements
    setComplementsList([
      { name: 'Farofa Crocante da Casa', price: 0 },
      { name: 'Vinagrete Especial com Azeite', price: 0 },
    ]);
    setNewCompName('');
    setNewCompPrice('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(String(prod.price));
    setOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
    setImageUrl(prod.imageUrl);
    setBadge(prod.badge || '');
    setAvailable(prod.available);
    setCategoryId(prod.categoryId);

    if (prod.meatPoints) {
      try {
        const points = JSON.parse(prod.meatPoints);
        setHasMeatPoints(true);
        setMeatPointsText(Array.isArray(points) ? points.join(', ') : '');
      } catch (e) {
        setHasMeatPoints(false);
        setMeatPointsText('');
      }
    } else {
      setHasMeatPoints(false);
      setMeatPointsText('');
    }

    // Load complements
    if (prod.complements) {
      try {
        const parsed = JSON.parse(prod.complements);
        if (Array.isArray(parsed)) {
          setComplementsList(parsed);
        } else {
          setComplementsList([]);
        }
      } catch (e) {
        setComplementsList([]);
      }
    } else {
      // Fallback from legacy boolean flags
      const initialComps: ProductComplement[] = [];
      if (prod.hasFarofa) initialComps.push({ name: 'Farofa Crocante da Casa', price: 0 });
      if (prod.hasVinagrete) initialComps.push({ name: 'Vinagrete Especial com Azeite', price: 0 });
      setComplementsList(initialComps);
    }

    setNewCompName('');
    setNewCompPrice('0');
    setIsModalOpen(true);
  };

  const handleAddComplement = () => {
    if (!newCompName.trim()) return;
    setComplementsList((prev) => [
      ...prev,
      {
        name: newCompName.trim(),
        price: Number(newCompPrice) || 0,
      },
    ]);
    setNewCompName('');
    setNewCompPrice('0');
  };

  const handleQuickAddComplement = (compName: string, compPrice = 0) => {
    if (complementsList.some((c) => c.name.toLowerCase() === compName.toLowerCase())) return;
    setComplementsList((prev) => [...prev, { name: compName, price: compPrice }]);
  };

  const handleRemoveComplement = (indexToRemove: number) => {
    setComplementsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      const res = await fetch(`/api/produtos/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !prod.available }),
      });
      if (res.ok) {
        fetchProductsAndCategories();
      }
    } catch (err) {
      console.error('Erro ao alternar disponibilidade', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto do cardápio?')) return;
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccess('Produto excluído com sucesso!');
        fetchProductsAndCategories();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao excluir produto', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    setSaving(true);
    try {
      let meatPointsJson: string | null = null;
      if (hasMeatPoints && meatPointsText.trim()) {
        const parsed = meatPointsText.split(',').map((p) => p.trim()).filter(Boolean);
        meatPointsJson = JSON.stringify(parsed);
      }

      const hasFarofa = complementsList.some((c) => c.name.toLowerCase().includes('farofa'));
      const hasVinagrete = complementsList.some((c) => c.name.toLowerCase().includes('vinagrete'));

      const payload = {
        name,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        imageUrl,
        badge: badge.trim() || null,
        available,
        categoryId,
        meatPoints: meatPointsJson,
        complements: JSON.stringify(complementsList),
        hasFarofa,
        hasVinagrete,
      };

      if (editingProduct) {
        await fetch(`/api/produtos/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Produto atualizado com sucesso!');
      } else {
        await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Novo produto adicionado ao cardápio!');
      }

      setIsModalOpen(false);
      fetchProductsAndCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar produto', err);
    } finally {
      setSaving(false);
    }
  };

  const allProducts: (Product & { categoryName?: string })[] = [];
  categories.forEach((cat) => {
    cat.products?.forEach((p) => {
      allProducts.push({ ...p, categoryName: cat.name });
    });
  });

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel da Cozinha</span>
        </Link>

        <button
          onClick={handleOpenCreate}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto / Espeto</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <ShoppingBag className="w-6 h-6 text-orange-500" />
          Gerenciamento de Produtos, Promoções & Complementos
        </h1>
        <p className="text-xs text-zinc-400">
          Cadastre novos espetinhos, configure complementos e adicionais (farofa, vinagrete, molhos), crie descontos e oculte itens esgotados.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({allProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.name} ({cat.products?.length || 0})
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            let complementsCount = 0;
            if (prod.complements) {
              try {
                complementsCount = JSON.parse(prod.complements).length;
              } catch (e) {}
            }

            return (
              <div
                key={prod.id}
                className={`bg-zinc-900 border rounded-3xl p-4.5 flex flex-col justify-between space-y-3 transition-all ${
                  prod.available
                    ? 'border-zinc-800 hover:border-zinc-700'
                    : 'border-zinc-800/40 opacity-60 bg-zinc-950/50'
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-zinc-950 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {prod.badge && (
                        <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-full">
                          {prod.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 truncate">
                        {prod.categoryName}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white truncate">{prod.name}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">{prod.description}</p>

                    {complementsCount > 0 && (
                      <p className="text-[10px] text-orange-400 font-medium">
                        ✓ {complementsCount} complemento(s) configurado(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Discounts */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-orange-400">
                        {formatBRL(prod.price)}
                      </span>
                      {prod.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through">
                          {formatBRL(prod.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        prod.available ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {prod.available ? '● Disponível para compra' : '○ Esgotado / Oculto'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleAvailability(prod)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        prod.available
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                          : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      }`}
                      title={prod.available ? 'Ocultar / Marcar Esgotado' : 'Tornar Disponível'}
                    >
                      {prod.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-all"
                      title="Editar Produto e Complementos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-all"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do produto ou espeto"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição dos ingredientes, corte da carne, peso..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Preços & Promoções */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Preço Original (Riscado para Promoção)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Selo / Badge Promocional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Selo / Destaque Promocional
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: 30% OFF, Oferta, Destaque"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    URL da Foto do Produto
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Ponto da Carne */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMeatPoints}
                    onChange={(e) => setHasMeatPoints(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className="text-xs font-bold text-zinc-200">
                    Permitir escolha do Ponto da Carne
                  </span>
                </label>

                {hasMeatPoints && (
                  <input
                    type="text"
                    value={meatPointsText}
                    onChange={(e) => setMeatPointsText(e.target.value)}
                    placeholder="Ao Ponto, Bem Passado, Mal Passado"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              {/* COMPLEMENTOS & ACOMPANHAMENTOS CUSTOMIZÁVEIS */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                      Complementos & Acompanhamentos
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Adicione ou remova opções (farofa, vinagrete, molhos, mandioca...)
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                    {complementsList.length} item(s)
                  </span>
                </div>

                {/* Quick Add Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAddComplement('Farofa Crocante da Casa', 0)}
                    className="text-[11px] bg-zinc-800 hover:bg-orange-600/30 text-zinc-300 hover:text-orange-400 border border-zinc-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Farofa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddComplement('Vinagrete Especial com Azeite', 0)}
                    className="text-[11px] bg-zinc-800 hover:bg-orange-600/30 text-zinc-300 hover:text-orange-400 border border-zinc-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Vinagrete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddComplement('Molho de Alho Cremoso', 0)}
                    className="text-[11px] bg-zinc-800 hover:bg-orange-600/30 text-zinc-300 hover:text-orange-400 border border-zinc-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Molho de Alho
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddComplement('Mandioca na Manteiga', 0)}
                    className="text-[11px] bg-zinc-800 hover:bg-orange-600/30 text-zinc-300 hover:text-orange-400 border border-zinc-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Mandioca
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddComplement('Chimichurri Artesanal', 0)}
                    className="text-[11px] bg-zinc-800 hover:bg-orange-600/30 text-zinc-300 hover:text-orange-400 border border-zinc-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Chimichurri
                  </button>
                </div>

                {/* List of active complements with delete button */}
                {complementsList.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {complementsList.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{comp.name}</span>
                          <span className="text-[10px] text-zinc-500">
                            {comp.price && comp.price > 0 ? `+ ${formatBRL(comp.price)}` : '(Grátis / Cortesia)'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveComplement(idx)}
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remover este complemento do produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-500">
                    Nenhum complemento ativo para este produto (o cliente não verá opções extras).
                  </div>
                )}

                {/* Form to add custom complement */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="Nome do complemento (Ex: Pimenta da Casa)"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="number"
                    step="0.50"
                    value={newCompPrice}
                    onChange={(e) => setNewCompPrice(e.target.value)}
                    placeholder="0.00"
                    title="Preço extra (deixe 0 para gratuito)"
                    className="w-20 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddComplement}
                    className="bg-zinc-800 hover:bg-orange-600 text-zinc-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando Produto...' : 'Salvar Produto no Cardápio'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
