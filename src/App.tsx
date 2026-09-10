import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { BookingWizard } from './components/BookingWizard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { Appointment, Barber, Service, SupabaseConfig } from './types.ts';
import { 
  getActiveSupabaseConfig, 
  fetchServicesFromStorage, 
  fetchBarbersFromStorage, 
  fetchAppointmentsFromStorage, 
  createAppointmentInStorage, 
  updateAppointmentStatusInStorage, 
  updateAppointmentInStorage,
  deleteAppointmentInStorage 
} from './lib/supabase.ts';
import { INITIAL_APPOINTMENTS, INITIAL_BARBERS, INITIAL_SERVICES, getTodayFormatted } from './data/initialData.ts';
import { Scissors, MapPin, Phone, Clock, Database, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getActiveSupabaseConfig);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Core data states
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  }, []);

  // Load data from Supabase / local storage
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [srvList, brbList, aptList] = await Promise.all([
        fetchServicesFromStorage(),
        fetchBarbersFromStorage(),
        fetchAppointmentsFromStorage(),
      ]);

      if (srvList && srvList.length > 0) setServices(srvList);
      if (brbList && brbList.length > 0) setBarbers(brbList);
      if (aptList) setAppointments(aptList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler for new booking
  const handleBookAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>
  ): Promise<Appointment> => {
    const created = await createAppointmentInStorage(appointmentData);
    setAppointments((prev) => [created, ...prev]);
    showToast(`Agendamento confirmado para ${created.clientName}!`);
    return created;
  };

  // Handler for status update
  const handleUpdateStatus = async (
    id: string,
    status: Appointment['status']
  ): Promise<boolean> => {
    await updateAppointmentStatusInStorage(id, status);
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
    showToast(
      status === 'completed'
        ? 'Atendimento marcado como concluído!'
        : status === 'cancelled'
        ? 'Agendamento cancelado.'
        : 'Agendamento reativado.'
    );
    return true;
  };

  // Handler for full appointment edit
  const handleEditAppointment = async (
    id: string,
    updatedData: Partial<Appointment>
  ): Promise<boolean> => {
    await updateAppointmentInStorage(id, updatedData);
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, ...updatedData } : apt))
    );
    showToast(`Agendamento de ${updatedData.clientName || 'cliente'} atualizado com sucesso!`);
    return true;
  };

  // Handler for delete
  const handleDeleteAppointment = async (id: string): Promise<boolean> => {
    await deleteAppointmentInStorage(id);
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    showToast('Agendamento removido.');
    return true;
  };

  // Callback when Supabase credentials config changes
  const handleConfigUpdated = () => {
    const fresh = getActiveSupabaseConfig();
    setSupabaseConfig(fresh);
    loadData();
    showToast(
      fresh.isConfigured
        ? 'Configurações do Supabase salvas!'
        : 'Modo local ativado.'
    );
  };

  // Today appointment count for badge
  const todayCount = useMemo(() => {
    const today = getTodayFormatted();
    return appointments.filter((a) => a.date === today && a.status === 'confirmed').length;
  }, [appointments]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-sm font-medium shadow-2xl shadow-black animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        supabaseConfig={supabaseConfig}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        todayCount={todayCount}
      />

      {/* Main View Area */}
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-medium">Carregando serviços e agendamentos...</p>
          </div>
        ) : activeTab === 'booking' ? (
          <BookingWizard
            services={services}
            barbers={barbers}
            existingAppointments={appointments}
            onBookAppointment={handleBookAppointment}
            onGoToAdmin={() => setActiveTab('admin')}
            isSupabaseConnected={supabaseConfig.isConfigured}
          />
        ) : (
          <AdminDashboard
            appointments={appointments}
            services={services}
            barbers={barbers}
            onUpdateStatus={handleUpdateStatus}
            onEditAppointment={handleEditAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onAddManualAppointment={handleBookAppointment}
            onRefresh={loadData}
            isSupabaseConnected={supabaseConfig.isConfigured}
          />
        )}
      </main>

      {/* Supabase Configuration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onConfigUpdated={handleConfigUpdated}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-8 px-4 sm:px-6 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-bold text-zinc-300">
              Navalha & Arte Barbearia
            </span>
            <span className="text-zinc-600">|</span>
            <span>Tradição, Estilo e Precisão</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-zinc-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Av. Paulista, 1000 - Jardins, SP
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              (11) 98765-4321
            </span>
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className="flex items-center gap-1.5 text-amber-400/90 hover:text-amber-300 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConfig.isConfigured ? 'Supabase Conectado' : 'Conectar Supabase'}</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
