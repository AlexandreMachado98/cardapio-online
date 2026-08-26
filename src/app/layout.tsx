import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import CartDrawer from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'Sabor & Espeto | Cardápio Digital & Delivery de Espetinhos',
  description: 'Os melhores espetinhos artesanais na brasa, acompanhamentos e bebidas com entrega rápida e rastreamento em tempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased pb-20 md:pb-0">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <BottomNav />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
