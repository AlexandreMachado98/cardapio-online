export interface StoreConfig {
  name: string;
  subName: string;
  logoUrl?: string; // Optional custom kitchen logo image URL
  tagline: string;
  phone: string;
  address: string;
}

export const defaultStoreConfig: StoreConfig = {
  name: 'Cardápio Online',
  subName: 'Espetinho & Brasa', // Nome do estabelecimento / usuário
  logoUrl: '', // Se vazio, exibe o brasão/ícone profissional com fogo da brasa
  tagline: 'Cardápio Digital & Delivery Rápido',
  phone: '11987654321',
  address: 'Av. Principal dos Espetos, 500 - Centro',
};
