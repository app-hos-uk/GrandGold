/**
 * Click & Collect store data - Redis-backed for persistence.
 */
import Redis from 'ioredis';
import type { Country } from '@grandgold/types';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const STORES_KEY = 'click_collect:stores';

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  distance?: string;
  available?: boolean;
}

const DEFAULT_STORES: Record<Country, StoreLocation[]> = {
  IN: [
    { id: '1', name: 'GrandGold Mumbai - Bandra', address: 'Linking Road, Bandra West, Mumbai 400050', phone: '+91 22 1234 5678', hours: '10:00 AM - 9:00 PM', lat: 19.0596, lng: 72.8295, available: true },
    { id: '2', name: 'GrandGold Mumbai - Andheri', address: 'Infiniti Mall, Andheri West, Mumbai 400053', phone: '+91 22 1234 5679', hours: '10:00 AM - 10:00 PM', lat: 19.1334, lng: 72.8467, available: true },
    { id: '3', name: 'GrandGold Pune', address: 'Phoenix Marketcity, Viman Nagar, Pune 411014', phone: '+91 20 1234 5678', hours: '10:00 AM - 9:30 PM', lat: 18.5679, lng: 73.9143, available: true },
  ],
  AE: [
    { id: '1', name: 'GrandGold Dubai - Gold Souk', address: 'Deira Gold Souk, Dubai', phone: '+971 4 123 4567', hours: '10:00 AM - 10:00 PM', lat: 25.2653, lng: 55.2925, available: true },
    { id: '2', name: 'GrandGold Dubai Mall', address: 'The Dubai Mall, Downtown Dubai', phone: '+971 4 123 4568', hours: '10:00 AM - 12:00 AM', lat: 25.1972, lng: 55.2744, available: true },
  ],
  UK: [
    { id: '1', name: 'GrandGold London - Mayfair', address: '123 Bond Street, Mayfair, London W1S', phone: '+44 20 1234 5678', hours: '10:00 AM - 7:00 PM', lat: 51.5128, lng: -0.1478, available: true },
    { id: '2', name: 'GrandGold London - Knightsbridge', address: 'Harrods, Knightsbridge, London SW1X', phone: '+44 20 1234 5679', hours: '10:00 AM - 9:00 PM', lat: 51.5014, lng: -0.1635, available: true },
  ],
};

export async function getStores(country: Country): Promise<StoreLocation[]> {
  const key = `${STORES_KEY}:${country}`;
  const raw = await redis.get(key);
  if (raw) {
    return JSON.parse(raw) as StoreLocation[];
  }
  const stores = DEFAULT_STORES[country] ?? DEFAULT_STORES.IN;
  await redis.set(key, JSON.stringify(stores), 'EX', 86400 * 365);
  return stores;
}

export async function setStores(country: Country, stores: StoreLocation[]): Promise<void> {
  const key = `${STORES_KEY}:${country}`;
  await redis.set(key, JSON.stringify(stores), 'EX', 86400 * 365);
}
