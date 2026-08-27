export interface ProductComplement {
  id?: string;
  name: string;
  price?: number; // 0 for free/cortesia, or extra value
}

export interface StoreSettings {
  id: string;
  name: string;
  subName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  announcement?: string | null;
  isOpen: boolean;
  adminUser?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminPin: string;
  
  // Entregador Padrão
  defaultCourierName?: string | null;
  defaultCourierPhone?: string | null;
  defaultCourierVehicle?: string | null;
  defaultCourierPlate?: string | null;

  phone: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
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
  meatPoints?: string | null; // JSON array: ["Ao Ponto", "Bem Passado"]
  complements?: string | null; // JSON array: [{"name": "Farofa", "price": 0}, {"name": "Vinagrete", "price": 0}]
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
  selectedComplements?: string[]; // Array de nomes dos complementos escolhidos
  farofa?: boolean;
  vinagrete?: boolean;
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
  complements?: string | null; // JSON string or comma-separated names
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
  
  // Courier Info
  courierName?: string | null;
  courierPhone?: string | null;
  courierVehicle?: string | null;
  courierPlate?: string | null;
  courierLat?: number | null;
  courierLng?: number | null;
  targetLat?: number | null;
  targetLng?: number | null;
  
  whatsappSent: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderItemData[];
}
