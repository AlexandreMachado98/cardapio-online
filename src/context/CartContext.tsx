'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, DeliveryZone } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Delivery Fee calculation
  deliveryType: 'DELIVERY' | 'PICKUP';
  setDeliveryType: (type: 'DELIVERY' | 'PICKUP') => void;
  selectedZone: DeliveryZone | null;
  setSelectedZone: (zone: DeliveryZone | null) => void;
  deliveryZones: DeliveryZone[];
  loadDeliveryZones: () => Promise<void>;
  
  // Totals
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  // Carregar dados salvos no localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('saborespeto_cart');
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedZone = localStorage.getItem('saborespeto_zone');
      if (savedZone) setSelectedZone(JSON.parse(savedZone));
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    loadDeliveryZones();
  }, []);

  const loadDeliveryZones = async () => {
    try {
      const res = await fetch('/api/frete');
      if (res.ok) {
        const data = await res.json();
        setDeliveryZones(data);
        if (!selectedZone && data.length > 0) {
          setSelectedZone(data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar zonas de frete', err);
    }
  };

  // Salvar no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('saborespeto_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    if (selectedZone) {
      localStorage.setItem('saborespeto_zone', JSON.stringify(selectedZone));
    }
  }, [selectedZone]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // Verifica se existe exatamente o mesmo item com as mesmas opções
      const index = prev.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.meatPoint === newItem.meatPoint &&
          i.farofa === newItem.farofa &&
          i.vinagrete === newItem.vinagrete &&
          (i.notes || '') === (newItem.notes || '')
      );

      if (index > -1) {
        const updated = [...prev];
        updated[index].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.cartItemId === cartItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'DELIVERY' && selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        deliveryType,
        setDeliveryType,
        selectedZone,
        setSelectedZone,
        deliveryZones,
        loadDeliveryZones,
        subtotal,
        deliveryFee,
        total,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
