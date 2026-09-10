export type ServiceCategory = 'cabelo' | 'barba' | 'combo' | 'estetica';

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number; // in BRL
  category: ServiceCategory;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatarUrl: string;
  phone?: string;
  bio: string;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}
