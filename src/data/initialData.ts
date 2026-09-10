import { Barber, Service, Appointment } from '../types.ts';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Tradicional / Fade',
    description: 'Corte com tesoura ou máquina, degrade personalizado e acabamento com navalhete.',
    duration: 35,
    price: 45.0,
    category: 'cabelo',
  },
  {
    id: 'srv-2',
    name: 'Barba Terapia com Toalha Quente',
    description: 'Alinhamento completo, vapor de ozônio, toalha quente aromatizada e pós-barba calmante.',
    duration: 30,
    price: 35.0,
    category: 'barba',
  },
  {
    id: 'srv-3',
    name: 'Combo Completo (Corte + Barba)',
    description: 'A experiência completa: corte refinado + barboterapia premium com toalha quente.',
    duration: 60,
    price: 70.0,
    category: 'combo',
  },
  {
    id: 'srv-4',
    name: 'Pezinho e Contorno',
    description: 'Alinhamento rápido do contorno do cabelo e costeletas com lâmina descartável.',
    duration: 15,
    price: 20.0,
    category: 'cabelo',
  },
  {
    id: 'srv-5',
    name: 'Pigmentação de Barba',
    description: 'Preenchimento harmônico de falhas e realce dos contornos com pigmento especial.',
    duration: 30,
    price: 40.0,
    category: 'barba',
  },
  {
    id: 'srv-6',
    name: 'Hidratação Capilar Profunda',
    description: 'Lavagem com massagem craniana revigorante e máscara nutritiva de queratina.',
    duration: 25,
    price: 35.0,
    category: 'estetica',
  },
  {
    id: 'srv-7',
    name: 'Design de Sobrancelha Masculina',
    description: 'Limpeza e alinhamento discreto dos fios com pinça e navalhete.',
    duration: 15,
    price: 18.0,
    category: 'estetica',
  },
];

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'barber-1',
    name: 'Carlos "Navalha" Silva',
    specialty: 'Cortes Clássicos, Degradê & Tesoura',
    rating: 4.9,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    phone: '(11) 98765-4321',
    bio: 'Mais de 10 anos de experiência transformando visuais com técnicas precisas de navalha e visagismo.',
  },
  {
    id: 'barber-2',
    name: 'Marcos Rocha',
    specialty: 'Barboterapia & Toalha Quente',
    rating: 5.0,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    phone: '(11) 98765-4322',
    bio: 'Especialista em cuidados faciais masculinos, tratamentos de barba e alinhamentos de alta definição.',
  },
  {
    id: 'barber-3',
    name: 'Gabriel "FreeStyle" Santos',
    specialty: 'Tendências Urbanas, Desenhos & Fade',
    rating: 4.8,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    phone: '(11) 98765-4323',
    bio: 'Jovem talento focado em novidades internacionais, cortes modernos e freestyle artístico.',
  },
];

// Helper to get today's date formatted as YYYY-MM-DD
export const getTodayFormatted = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-sample-1',
    clientName: 'Rodrigo Medeiros',
    clientPhone: '(11) 99123-4567',
    clientEmail: 'rodrigo@email.com',
    serviceId: 'srv-3',
    serviceName: 'Combo Completo (Corte + Barba)',
    servicePrice: 70.0,
    serviceDuration: 60,
    barberId: 'barber-1',
    barberName: 'Carlos "Navalha" Silva',
    date: getTodayFormatted(),
    time: '10:00',
    status: 'confirmed',
    notes: 'Cliente prefere corte baixo nas laterais.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-sample-2',
    clientName: 'Lucas Ferreira',
    clientPhone: '(11) 98234-5678',
    serviceId: 'srv-1',
    serviceName: 'Corte Tradicional / Fade',
    servicePrice: 45.0,
    serviceDuration: 35,
    barberId: 'barber-2',
    barberName: 'Marcos Rocha',
    date: getTodayFormatted(),
    time: '14:30',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-sample-3',
    clientName: 'Felipe Santana',
    clientPhone: '(11) 97345-6789',
    serviceId: 'srv-2',
    serviceName: 'Barba Terapia com Toalha Quente',
    servicePrice: 35.0,
    serviceDuration: 30,
    barberId: 'barber-1',
    barberName: 'Carlos "Navalha" Silva',
    date: getTodayFormatted(),
    time: '16:00',
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
];

export const TIME_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '13:00',
  '13:45',
  '14:30',
  '15:15',
  '16:00',
  '16:45',
  '17:30',
  '18:15',
  '19:00',
];
