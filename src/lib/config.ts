export interface StoreConfig {
  name: string;
  subName: string;
  logoUrl?: string;
  tagline: string;
  phone: string;
  address: string;
}

export const defaultStoreConfig: StoreConfig = {
  name: 'Cardápio Online',
  subName: '',
  logoUrl: '',
  tagline: 'Cardápio Digital & Delivery',
  phone: '',
  address: '',
};
