'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerProfile {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
}

interface AuthContextType {
  customer: CustomerProfile | null;
  login: (data: CustomerProfile) => void;
  logout: () => void;
  updateCustomer: (data: Partial<CustomerProfile>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('saborespeto_customer');
      if (saved) {
        setCustomer(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load customer profile from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const login = (data: CustomerProfile) => {
    setCustomer(data);
    localStorage.setItem('saborespeto_customer', JSON.stringify(data));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('saborespeto_customer');
  };

  const updateCustomer = (data: Partial<CustomerProfile>) => {
    setCustomer((prev) => {
      const updated = prev ? { ...prev, ...data } : (data as CustomerProfile);
      localStorage.setItem('saborespeto_customer', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        login,
        logout,
        updateCustomer,
        isAuthenticated: !!customer?.phone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
