import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@/utils/storage';
import { ApiServiceFactory } from '@/services/apiService';

// ---- Types ----

export interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

interface CurrencyRates {
  base: string;
  rates: Record<string, number>;
}

interface AppContextValue {
  location: UserLocation | null;
  locationAsked: boolean;
  locationLoaded: boolean;
  setLocation: (loc: UserLocation | null) => void;
  markLocationAsked: () => void;
  currencyRates: CurrencyRates | null;
  convertPrice: (amount: number, fromCurrency: string, toCurrency: string) => number;
  refreshRates: () => Promise<void>;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LOCATION_KEY = 'app:user_location';
const LOCATION_ASKED_KEY = 'app:location_asked';
const LANGUAGE_KEY = 'app:language';

// ---- Provider ----

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [locationAsked, setLocationAsked] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates | null>(null);
  const ratesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore persisted location + language on mount
  useEffect(() => {
    (async () => {
      const [storedLoc, storedAsked, storedLang] = await Promise.all([
        storage.getItem(LOCATION_KEY),
        storage.getItem(LOCATION_ASKED_KEY),
        storage.getItem(LANGUAGE_KEY),
      ]);
      if (storedLoc) {
        try { setLocationState(JSON.parse(storedLoc)); } catch {}
      }
      if (storedAsked === 'true') setLocationAsked(true);
      if (storedLang) i18n.changeLanguage(storedLang);
      setLocationLoaded(true);
    })();
  }, []);

  const setLocation = useCallback(async (loc: UserLocation | null) => {
    setLocationState(loc);
    if (loc) {
      await storage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } else {
      await storage.deleteItem(LOCATION_KEY);
    }
  }, []);

  const markLocationAsked = useCallback(async () => {
    setLocationAsked(true);
    await storage.setItem(LOCATION_ASKED_KEY, 'true');
  }, []);

  const fetchRates = useCallback(async () => {
    try {
      const result = await ApiServiceFactory.getDiscoveryRepository().getCurrencyRates();
      setCurrencyRates(result);
    } catch {
      // Non-fatal — display prices in original currency if fetch fails
    }
  }, []);

  // Fetch rates on mount, refresh every 24h
  useEffect(() => {
    fetchRates();
    ratesTimerRef.current = setTimeout(fetchRates, 86_400_000);
    return () => { if (ratesTimerRef.current) clearTimeout(ratesTimerRef.current); };
  }, [fetchRates]);

  const convertPrice = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency || !currencyRates) return amount;
      const rates = currencyRates.rates;
      const fromRate = rates[fromCurrency.toUpperCase()];
      const toRate = rates[toCurrency.toUpperCase()];
      if (!fromRate || !toRate) return amount;
      return Math.round((amount / fromRate) * toRate * 100) / 100;
    },
    [currencyRates],
  );

  const setLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      storage.setItem(LANGUAGE_KEY, lang);
    },
    [i18n],
  );

  return (
    <AppContext.Provider
      value={{
        location,
        locationAsked,
        locationLoaded,
        setLocation,
        markLocationAsked,
        currencyRates,
        convertPrice,
        refreshRates: fetchRates,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
