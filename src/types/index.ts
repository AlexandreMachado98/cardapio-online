export interface StoreSettings {
  id: string;
  name: string;
  subName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  announcement?: string | null;
  isOpen: boolean;
  phone: string;
  address: string;
  pixKey?: string | null;
  minOrderValue: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  active: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null; // Preço original riscado para promoções
  imageUrl: string;
  badge?: string | null; // e.g. "50% OFF", "Promoção", "Mais Pedido"
  available: boolean;
  categoryId: string;
  category?: Category;
  meatPoints?: string | null;
  hasFarofa: boolean;
  hasVinagrete: boolean;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  meatPoint?: string;
  farofa: boolean;
  vinagrete: boolean;
  notes?: string;
}

export interface DeliveryZone {
  id: string;
  neighborhood: string;
  fee: number;
  estimatedMinutes: number;
  active: boolean;
}

export interface OrderItemData {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  meatPoint?: string | null;
  farofa: boolean;
  vinagrete: boolean;
  notes?: string | null;
}

export interface OrderData {
  id: string;
  orderNumber: number;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryType: 'DELIVERY' | 'PICKUP';
  addressText?: string | null;
  neighborhood?: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'PIX' | 'CARD' | 'CASH';
  changeFor?: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  notes?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierLat?: number | null;
  courierLng?: number | null;
  targetLat?: number | null;
  targetLng?: number | null;
  whatsappSent: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderItemData[];
}
