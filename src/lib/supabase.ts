import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, Barber, Service, SupabaseConfig } from '../types.ts';
import { INITIAL_APPOINTMENTS, INITIAL_BARBERS, INITIAL_SERVICES } from '../data/initialData.ts';

const LOCAL_STORAGE_KEY_CONFIG = 'barber_supabase_config';
const LOCAL_STORAGE_KEY_APPOINTMENTS = 'barber_local_appointments';
const LOCAL_STORAGE_KEY_SERVICES = 'barber_local_services';
const LOCAL_STORAGE_KEY_BARBERS = 'barber_local_barbers';

// Retrieve active credentials from environment or localStorage
export const getActiveSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey && !envUrl.includes('your-project')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
    };
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          isConfigured: true,
        };
      }
    }
  } catch (err) {
    console.error('Error reading Supabase config from storage:', err);
  }

  return {
    url: envUrl || '',
    anonKey: envKey || '',
    isConfigured: false,
  };
};

let cachedClient: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getActiveSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && currentClientUrl === config.url && currentClientKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
      },
    });
    currentClientUrl = config.url;
    currentClientKey = config.anonKey;
    return cachedClient;
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
    return null;
  }
};

export const saveCustomSupabaseConfig = (url: string, anonKey: string): boolean => {
  try {
    const trimmedUrl = url.trim().replace(/\/$/, '');
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CONFIG);
      cachedClient = null;
      return false;
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEY_CONFIG,
      JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey })
    );
    cachedClient = null;
    return true;
  } catch (err) {
    console.error('Failed to save config:', err);
    return false;
  }
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const trimmedUrl = url.trim().replace(/\/$/, '');
    const trimmedKey = anonKey.trim();
    if (!trimmedUrl || !trimmedKey) {
      return { success: false, message: 'URL e Anon Key são obrigatórios.' };
    }

    const testClient = createClient(trimmedUrl, trimmedKey);
    // Ping appointments or services table
    const { error } = await testClient.from('appointments').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it's still connected to Supabase!
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          message: 'Conectado ao projeto Supabase com sucesso! (As tabelas precisam ser criadas usando o script SQL abaixo).',
        };
      }
      return { success: false, message: `Erro de conexão: ${error.message}` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha ao testar conexão: ${err?.message || 'Erro de rede'}` };
  }
};

// Local storage fallback helpers
const getLocalAppointments = (): Appointment[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_APPOINTMENTS;
};

const saveLocalAppointments = (appointments: Appointment[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error(e);
  }
};

export const fetchServicesFromStorage = async (): Promise<Service[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('services')
        .select('*')
        .order('price', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          duration: Number(item.duration) || 30,
          price: Number(item.price) || 0,
          category: item.category || 'cabelo',
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchServices failed, using local seed:', err);
    }
  }

  // Fallback to local
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return INITIAL_SERVICES;
};

export const fetchBarbersFromStorage = async (): Promise<Barber[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('barbers')
        .select('*')
        .order('rating', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          specialty: item.specialty,
          rating: Number(item.rating) || 5.0,
          avatarUrl: item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          phone: item.phone,
          bio: item.bio || '',
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchBarbers failed, using local seed:', err);
    }
  }

  // Fallback to local
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_BARBERS);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return INITIAL_BARBERS;
};

export const fetchAppointmentsFromStorage = async (): Promise<Appointment[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('appointments')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (!error && data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          clientName: item.client_name,
          clientPhone: item.client_phone,
          clientEmail: item.client_email,
          serviceId: item.service_id,
          serviceName: item.service_name,
          servicePrice: Number(item.service_price) || 0,
          serviceDuration: Number(item.service_duration) || 30,
          barberId: item.barber_id,
          barberName: item.barber_name,
          date: item.date,
          time: item.time,
          status: item.status || 'confirmed',
          notes: item.notes,
          createdAt: item.created_at || new Date().toISOString(),
        }));
        // Update local cache as mirror
        saveLocalAppointments(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchAppointments failed, using local cache:', err);
    }
  }

  return getLocalAppointments();
};

export const createAppointmentInStorage = async (
  appointment: Omit<Appointment, 'id' | 'createdAt'>
): Promise<Appointment> => {
  const newId = 'apt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const fullAppointment: Appointment = {
    ...appointment,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  let supabaseSuccess = false;

  if (client) {
    try {
      const { error } = await client.from('appointments').insert({
        id: fullAppointment.id,
        client_name: fullAppointment.clientName,
        client_phone: fullAppointment.clientPhone,
        client_email: fullAppointment.clientEmail || null,
        service_id: fullAppointment.serviceId,
        service_name: fullAppointment.serviceName,
        service_price: fullAppointment.servicePrice,
        service_duration: fullAppointment.serviceDuration,
        barber_id: fullAppointment.barberId,
        barber_name: fullAppointment.barberName,
        date: fullAppointment.date,
        time: fullAppointment.time,
        status: fullAppointment.status,
        notes: fullAppointment.notes || null,
        created_at: fullAppointment.createdAt,
      });

      if (!error) {
        supabaseSuccess = true;
      } else {
        console.error('Supabase insert error:', error);
      }
    } catch (err) {
      console.error('Supabase createAppointment error:', err);
    }
  }

  // Always persist to local cache as mirror/fallback
  const current = getLocalAppointments();
  const updated = [fullAppointment, ...current];
  saveLocalAppointments(updated);

  return fullAppointment;
};

export const updateAppointmentStatusInStorage = async (
  id: string,
  status: Appointment['status']
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Supabase update status error:', error);
      }
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  }

  // Update local cache
  const list = getLocalAppointments();
  const updated = list.map((apt) => (apt.id === id ? { ...apt, status } : apt));
  saveLocalAppointments(updated);
  return true;
};

export const updateAppointmentInStorage = async (
  id: string,
  updatedData: Partial<Appointment>
): Promise<Appointment | null> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const payload: Record<string, any> = {};
      if (updatedData.clientName !== undefined) payload.client_name = updatedData.clientName;
      if (updatedData.clientPhone !== undefined) payload.client_phone = updatedData.clientPhone;
      if (updatedData.clientEmail !== undefined) payload.client_email = updatedData.clientEmail || null;
      if (updatedData.serviceId !== undefined) payload.service_id = updatedData.serviceId;
      if (updatedData.serviceName !== undefined) payload.service_name = updatedData.serviceName;
      if (updatedData.servicePrice !== undefined) payload.service_price = updatedData.servicePrice;
      if (updatedData.serviceDuration !== undefined) payload.service_duration = updatedData.serviceDuration;
      if (updatedData.barberId !== undefined) payload.barber_id = updatedData.barberId;
      if (updatedData.barberName !== undefined) payload.barber_name = updatedData.barberName;
      if (updatedData.date !== undefined) payload.date = updatedData.date;
      if (updatedData.time !== undefined) payload.time = updatedData.time;
      if (updatedData.status !== undefined) payload.status = updatedData.status;
      if (updatedData.notes !== undefined) payload.notes = updatedData.notes || null;

      const { error } = await client
        .from('appointments')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Supabase update appointment error:', error);
      }
    } catch (err) {
      console.error('Failed to update appointment in Supabase:', err);
    }
  }

  // Update local cache
  const list = getLocalAppointments();
  let updatedAppointment: Appointment | null = null;
  const updatedList = list.map((apt) => {
    if (apt.id === id) {
      updatedAppointment = {
        ...apt,
        ...updatedData,
      };
      return updatedAppointment;
    }
    return apt;
  });

  saveLocalAppointments(updatedList);
  return updatedAppointment;
};

export const deleteAppointmentInStorage = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('appointments').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
      }
    } catch (err) {
      console.error('Failed to delete in Supabase:', err);
    }
  }

  // Update local cache
  const list = getLocalAppointments();
  const filtered = list.filter((apt) => apt.id !== id);
  saveLocalAppointments(filtered);
  return true;
};

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCRIPT COMPLETO COM POLÍTICAS DE ARMAZENAMENTO ATIVADAS (SUPABASE)
-- Execute no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. EXTENSÕES ÚTEIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ==============================================================================

-- 2.1 Tabela de Serviços
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'cabelo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Tabela de Barbeiros
CREATE TABLE IF NOT EXISTS public.barbers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  rating NUMERIC(3,1) DEFAULT 5.0,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Tabela de Agendamentos (Appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10,2) NOT NULL,
  service_duration INTEGER NOT NULL,
  barber_id TEXT REFERENCES public.barbers(id) ON DELETE SET NULL,
  barber_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) NAS TABELAS
-- ==============================================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. POLÍTICAS DE ACESSO (RLS) NAS TABELAS
-- ==============================================================================

-- 4.1 Serviços: Leitura pública para todos os clientes
DROP POLICY IF EXISTS "Servicos leitura publica" ON public.services;
CREATE POLICY "Servicos leitura publica"
  ON public.services FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

DROP POLICY IF EXISTS "Servicos gerenciamento autenticado" ON public.services;
CREATE POLICY "Servicos gerenciamento autenticado"
  ON public.services FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4.2 Barbeiros: Leitura pública para exibição no catálogo
DROP POLICY IF EXISTS "Barbeiros leitura publica" ON public.barbers;
CREATE POLICY "Barbeiros leitura publica"
  ON public.barbers FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

DROP POLICY IF EXISTS "Barbeiros gerenciamento autenticado" ON public.barbers;
CREATE POLICY "Barbeiros gerenciamento autenticado"
  ON public.barbers FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4.3 Agendamentos: Qualquer cliente ou barbeiro pode consultar a agenda
DROP POLICY IF EXISTS "Agendamentos leitura publica" ON public.appointments;
CREATE POLICY "Agendamentos leitura publica"
  ON public.appointments FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- 4.4 Agendamentos: Qualquer cliente pode criar seu agendamento (INSERT)
DROP POLICY IF EXISTS "Agendamentos insercao publica" ON public.appointments;
CREATE POLICY "Agendamentos insercao publica"
  ON public.appointments FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- 4.5 Agendamentos: Atualização de status (concluir, cancelar, remarcar)
DROP POLICY IF EXISTS "Agendamentos atualizacao publica" ON public.appointments;
CREATE POLICY "Agendamentos atualizacao publica"
  ON public.appointments FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4.6 Agendamentos: Exclusão permitida
DROP POLICY IF EXISTS "Agendamentos remocao publica" ON public.appointments;
CREATE POLICY "Agendamentos remocao publica"
  ON public.appointments FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- Conceder permissões explícitas nas tabelas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.services TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.barbers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.appointments TO anon, authenticated, service_role;

-- ==============================================================================
-- 5. POLÍTICAS DE ARMAZENAMENTO (SUPABASE STORAGE BUCKETS & POLICIES)
-- ==============================================================================

-- 5.1 Criar ou atualizar os Buckets de Armazenamento para Fotos e Avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('barbearia-fotos', 'barbearia-fotos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/jpg']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/jpg'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/jpg'];

-- 5.2 POLÍTICA DE ARMAZENAMENTO: Visualização pública de arquivos (SELECT)
DROP POLICY IF EXISTS "Armazenamento visualizacao publica" ON storage.objects;
CREATE POLICY "Armazenamento visualizacao publica"
  ON storage.objects FOR SELECT
  TO public, anon, authenticated
  USING (bucket_id IN ('barbearia-fotos', 'avatars'));

-- 5.3 POLÍTICA DE ARMAZENAMENTO: Upload de arquivos e fotos (INSERT)
DROP POLICY IF EXISTS "Armazenamento upload liberado" ON storage.objects;
CREATE POLICY "Armazenamento upload liberado"
  ON storage.objects FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (bucket_id IN ('barbearia-fotos', 'avatars'));

-- 5.4 POLÍTICA DE ARMAZENAMENTO: Atualização e substituição de arquivos (UPDATE)
DROP POLICY IF EXISTS "Armazenamento atualizacao liberada" ON storage.objects;
CREATE POLICY "Armazenamento atualizacao liberada"
  ON storage.objects FOR UPDATE
  TO public, anon, authenticated
  USING (bucket_id IN ('barbearia-fotos', 'avatars'))
  WITH CHECK (bucket_id IN ('barbearia-fotos', 'avatars'));

-- 5.5 POLÍTICA DE ARMAZENAMENTO: Exclusão de arquivos no storage (DELETE)
DROP POLICY IF EXISTS "Armazenamento exclusao liberada" ON storage.objects;
CREATE POLICY "Armazenamento exclusao liberada"
  ON storage.objects FOR DELETE
  TO public, anon, authenticated
  USING (bucket_id IN ('barbearia-fotos', 'avatars'));

-- ==============================================================================
-- 6. CARGA DE DADOS INICIAIS (SERVIÇOS E BARBEIROS)
-- ==============================================================================

INSERT INTO public.services (id, name, description, duration, price, category) VALUES
  ('srv-1', 'Corte Tradicional / Fade', 'Corte com tesoura ou máquina, degradê personalizado e acabamento com navalhete.', 35, 45.00, 'cabelo'),
  ('srv-2', 'Barba Terapia com Toalha Quente', 'Alinhamento completo, vapor de ozônio, toalha quente aromatizada e pós-barba calmante.', 30, 35.00, 'barba'),
  ('srv-3', 'Combo Completo (Corte + Barba)', 'A experiência completa: corte refinado + barboterapia premium com toalha quente.', 60, 70.00, 'combo'),
  ('srv-4', 'Pezinho e Contorno', 'Alinhamento rápido do contorno do cabelo e costeletas com lâmina descartável.', 15, 20.00, 'cabelo'),
  ('srv-5', 'Pigmentação de Barba', 'Preenchimento harmônico de falhas e realce dos contornos com pigmento especial.', 30, 40.00, 'barba'),
  ('srv-6', 'Hidratação Capilar Profunda', 'Lavagem com massagem craniana revigorante e máscara nutritiva de queratina.', 25, 35.00, 'estetica'),
  ('srv-7', 'Design de Sobrancelha Masculina', 'Limpeza e alinhamento discreto dos fios com pinça e navalhete.', 15, 18.00, 'estetica')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.barbers (id, name, specialty, rating, avatar_url, phone, bio) VALUES
  ('barber-1', 'Carlos "Navalha" Silva', 'Cortes Clássicos, Degradê & Tesoura', 4.9, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', '(11) 98765-4321', 'Mais de 10 anos de experiência transformando visuais com técnicas precisas de navalha e visagismo.'),
  ('barber-2', 'Marcos Rocha', 'Barboterapia & Toalha Quente', 5.0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', '(11) 98765-4322', 'Especialista em cuidados faciais masculinos, tratamentos de barba e alinhamentos de alta definição.'),
  ('barber-3', 'Gabriel "FreeStyle" Santos', 'Tendências Urbanas, Desenhos & Fade', 4.8, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', '(11) 98765-4323', 'Jovem talento focado em novidades internacionais, cortes modernos e freestyle artístico.')
ON CONFLICT (id) DO NOTHING;
`;
