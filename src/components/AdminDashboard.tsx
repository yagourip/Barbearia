import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  MessageCircle, 
  RefreshCw, 
  TrendingUp, 
  Phone,
  AlertCircle,
  Pencil,
  ShieldCheck,
  Check,
  Scissors,
  Mail,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { Appointment, Barber, Service } from '../types.ts';
import { getTodayFormatted, TIME_SLOTS } from '../data/initialData.ts';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
  onUpdateStatus: (id: string, status: Appointment['status']) => Promise<boolean>;
  onEditAppointment: (id: string, updatedData: Partial<Appointment>) => Promise<boolean>;
  onDeleteAppointment: (id: string) => Promise<boolean>;
  onAddManualAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  onRefresh: () => void;
  isSupabaseConnected: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  appointments,
  services,
  barbers,
  onUpdateStatus,
  onEditAppointment,
  onDeleteAppointment,
  onAddManualAppointment,
  onRefresh,
  isSupabaseConnected,
}) => {
  const todayDate = getTodayFormatted();

  // Active Admin Barber state (stored in localStorage)
  const [activeAdminBarberId, setActiveAdminBarberId] = useState<string>(() => {
    return localStorage.getItem('navalha_active_admin_barber') || barbers[0]?.id || 'all';
  });

  // Keep in sync with storage
  useEffect(() => {
    localStorage.setItem('navalha_active_admin_barber', activeAdminBarberId);
  }, [activeAdminBarberId]);

  const activeAdminBarber = useMemo(() => {
    if (activeAdminBarberId === 'all') return null;
    return barbers.find((b) => b.id === activeAdminBarberId) || barbers[0] || null;
  }, [activeAdminBarberId, barbers]);

  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [barberFilter, setBarberFilter] = useState<string>(() => {
    return activeAdminBarberId !== 'all' ? activeAdminBarberId : 'all';
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick manual appointment modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualClientName, setManualClientName] = useState<string>('');
  const [manualClientPhone, setManualClientPhone] = useState<string>('');
  const [manualClientEmail, setManualClientEmail] = useState<string>('');
  const [manualServiceId, setManualServiceId] = useState<string>(services[0]?.id || '');
  const [manualBarberId, setManualBarberId] = useState<string>(
    activeAdminBarber?.id || barbers[0]?.id || ''
  );
  const [manualDate, setManualDate] = useState<string>(todayDate);
  const [manualTime, setManualTime] = useState<string>('10:00');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Edit appointment modal state
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editClientEmail, setEditClientEmail] = useState<string>('');
  const [editServiceId, setEditServiceId] = useState<string>('');
  const [editBarberId, setEditBarberId] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editStatus, setEditStatus] = useState<Appointment['status']>('confirmed');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Open Edit Modal
  const handleOpenEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setEditClientName(apt.clientName);
    setEditClientPhone(apt.clientPhone);
    setEditClientEmail(apt.clientEmail || '');
    setEditServiceId(apt.serviceId);
    setEditBarberId(apt.barberId);
    setEditDate(apt.date);
    setEditTime(apt.time);
    setEditStatus(apt.status);
    setEditNotes(apt.notes || '');
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    if (!editClientName.trim() || !editClientPhone.trim() || !editDate || !editTime) return;

    setIsSavingEdit(true);
    try {
      const selectedService = services.find((s) => s.id === editServiceId) || {
        id: editingAppointment.serviceId,
        name: editingAppointment.serviceName,
        price: editingAppointment.servicePrice,
        duration: editingAppointment.serviceDuration,
      };
      const selectedBarber = barbers.find((b) => b.id === editBarberId) || {
        id: editingAppointment.barberId,
        name: editingAppointment.barberName,
      };

      await onEditAppointment(editingAppointment.id, {
        clientName: editClientName.trim(),
        clientPhone: editClientPhone.trim(),
        clientEmail: editClientEmail.trim() || undefined,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        date: editDate,
        time: editTime,
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });

      setEditingAppointment(null);
    } catch (err) {
      console.error('Failed to save edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Switch active admin barber
  const handleSelectAdminBarber = (barberId: string) => {
    setActiveAdminBarberId(barberId);
    if (barberId !== 'all') {
      setBarberFilter(barberId);
    } else {
      setBarberFilter('all');
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (dateFilter === 'today') {
        if (apt.date !== todayDate) return false;
      } else if (dateFilter === 'tomorrow') {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (apt.date !== tomorrow) return false;
      } else if (dateFilter === 'week') {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 7);
        const aptDate = new Date(apt.date + 'T00:00:00');
        if (aptDate < now || aptDate > future) return false;
      }

      // Barber filter
      if (barberFilter !== 'all' && apt.barberId !== barberFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = apt.clientName.toLowerCase().includes(q);
        const matchPhone = apt.clientPhone.includes(q);
        const matchService = apt.serviceName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchService) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, barberFilter, statusFilter, searchQuery, todayDate]);

  // Key Metrics
  const todayAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.date === todayDate && apt.status !== 'cancelled');
  }, [appointments, todayDate]);

  // My chair metrics (if a specific admin barber is selected)
  const myTodayAppointments = useMemo(() => {
    if (!activeAdminBarber) return todayAppointments;
    return todayAppointments.filter((apt) => apt.barberId === activeAdminBarber.id);
  }, [todayAppointments, activeAdminBarber]);

  const myTodayRevenue = useMemo(() => {
    return myTodayAppointments.reduce((acc, curr) => acc + curr.servicePrice, 0);
  }, [myTodayAppointments]);

  const todayRevenue = useMemo(() => {
    return todayAppointments.reduce((acc, curr) => acc + curr.servicePrice, 0);
  }, [todayAppointments]);

  const totalCompleted = useMemo(() => {
    if (activeAdminBarber) {
      return appointments.filter(
        (apt) => apt.barberId === activeAdminBarber.id && apt.status === 'completed'
      ).length;
    }
    return appointments.filter((apt) => apt.status === 'completed').length;
  }, [appointments, activeAdminBarber]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // WhatsApp reminder message
  const handleOpenWhatsAppReminder = (apt: Appointment) => {
    const rawPhone = apt.clientPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    const [y, m, d] = apt.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    
    const message = `Olá, ${apt.clientName}! Passando para confirmar seu agendamento na *Navalha & Arte Barbearia*:%0A%0A` +
      `✂️ *Serviço:* ${apt.serviceName}%0A` +
      `💈 *Barbeiro:* ${apt.barberName}%0A` +
      `📅 *Data e Horário:* ${formattedDate} às ${apt.time}h%0A` +
      `💵 *Valor:* ${formatBRL(apt.servicePrice)}%0A%0A` +
      `Se precisar ajustar horário ou tiver qualquer dúvida, nos avise por aqui. Te esperamos!`;

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Manual appointment submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName.trim() || !manualClientPhone.trim()) return;

    setIsSubmittingManual(true);
    try {
      const srv = services.find((s) => s.id === manualServiceId) || services[0];
      const brb = barbers.find((b) => b.id === manualBarberId) || barbers[0];

      await onAddManualAppointment({
        clientName: manualClientName.trim(),
        clientPhone: manualClientPhone.trim(),
        clientEmail: manualClientEmail.trim() || undefined,
        serviceId: srv.id,
        serviceName: srv.name,
        servicePrice: srv.price,
        serviceDuration: srv.duration,
        barberId: brb.id,
        barberName: brb.name,
        date: manualDate,
        time: manualTime,
        status: 'confirmed',
        notes: manualNotes.trim() || undefined,
      });

      setShowManualModal(false);
      setManualClientName('');
      setManualClientPhone('');
      setManualClientEmail('');
      setManualNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* ================= BARBER ADMIN IDENTITY BANNER ================= */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Barber Admin Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  activeAdminBarber?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                }
                alt={activeAdminBarber?.name || 'Administrador Geral'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md shadow-amber-500/20"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 p-1 rounded-lg shadow font-bold" title="Perfil Administrador Ativo">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Scissors className="w-3 h-3" /> Barbeiro Administrador
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  isSupabaseConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {isSupabaseConnected ? 'Sincronizado com Supabase' : 'Modo Local'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 mt-1">
                {activeAdminBarber ? activeAdminBarber.name : 'Gestão Geral da Barbearia'}
              </h1>
              <p className="text-xs text-zinc-400">
                {activeAdminBarber
                  ? `Especialista: ${activeAdminBarber.specialty} • Gestão de clientes e edição de horários ativa`
                  : 'Visão unificada de todos os barbeiros, clientes e faturamento da casa'}
              </p>
            </div>
          </div>

          {/* Quick Barber Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-2xl">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Sou:
              </span>
              <select
                id="select-admin-barber"
                value={activeAdminBarberId}
                onChange={(e) => handleSelectAdminBarber(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-zinc-900 text-zinc-200">
                  👑 Gerência Geral (Todos os Barbeiros)
                </option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-200">
                    💈 {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="refresh-agenda-btn"
              type="button"
              onClick={onRefresh}
              title="Atualizar dados do Supabase"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>

            <button
              id="open-manual-booking-btn"
              type="button"
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Agendamento</span>
            </button>
          </div>

        </div>
      </div>

      {/* ================= METRIC CARDS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {activeAdminBarber ? 'Meus Clientes Hoje' : `Hoje (${todayDate.split('-').reverse().join('/')})`}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {activeAdminBarber ? myTodayAppointments.length : todayAppointments.length}
            </span>
            <span className="text-xs text-zinc-400">
              {activeAdminBarber ? 'na minha cadeira' : 'clientes agendados'}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {activeAdminBarber ? 'Meu Faturamento Hoje' : 'Faturamento Previsto Hoje'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {formatBRL(activeAdminBarber ? myTodayRevenue : todayRevenue)}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {activeAdminBarber ? 'Meus Concluídos' : 'Atendimentos Concluídos'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {totalCompleted}
            </span>
            <span className="text-xs text-zinc-400">no histórico</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Geral
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {appointments.length}
            </span>
            <span className="text-xs text-zinc-400">agendamentos salvos</span>
          </div>
        </div>

      </div>

      {/* ================= FILTER AND SEARCH BAR ================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3">
        
        {/* Date Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Período:
            </span>
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'tomorrow', label: 'Amanhã' },
              { id: 'week', label: 'Próximos 7 Dias' },
              { id: 'all', label: 'Todos os Agendamentos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick toggle for "My Chair" */}
          {activeAdminBarber && (
            <button
              type="button"
              onClick={() =>
                setBarberFilter(barberFilter === activeAdminBarber.id ? 'all' : activeAdminBarber.id)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                barberFilter === activeAdminBarber.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>{barberFilter === activeAdminBarber.id ? 'Filtrando: Minha Cadeira' : 'Ver Só Minha Cadeira'}</span>
            </button>
          )}
        </div>

        {/* Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-appointments-input"
              type="text"
              placeholder="Buscar por cliente, telefone ou serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Barber Dropdown Filter */}
          <div>
            <select
              id="filter-barber-select"
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Barbeiro: Todos os Barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  Barbeiro: {b.name} {b.id === activeAdminBarberId ? '(Você)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Status: Todos</option>
              <option value="confirmed">Status: Confirmados</option>
              <option value="completed">Status: Concluídos</option>
              <option value="cancelled">Status: Cancelados</option>
            </select>
          </div>

        </div>

      </div>

      {/* ================= APPOINTMENTS LIST ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Lista de Clientes Agendados ({filteredAppointments.length})</span>
          </h2>
          <span className="text-xs text-zinc-400">
            Dica: Clique em <strong className="text-amber-400 font-semibold">Editar</strong> para alterar nome, telefone, horário ou barbeiro
          </span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não há agendamentos para o filtro selecionado. Use o botão "Novo Agendamento" para adicionar ou mude o filtro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAppointments.map((apt) => {
              const isToday = apt.date === todayDate;
              const formattedDate = apt.date.split('-').reverse().join('/');
              const isMyClient = activeAdminBarber && apt.barberId === activeAdminBarber.id;

              return (
                <div
                  key={apt.id}
                  id={`appointment-card-${apt.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                    apt.status === 'completed'
                      ? 'bg-zinc-900/40 border-zinc-800/60 opacity-80'
                      : apt.status === 'cancelled'
                      ? 'bg-red-950/10 border-red-900/20 opacity-60'
                      : isToday
                      ? 'bg-zinc-900 border-amber-500/40 shadow-md shadow-amber-500/5'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  {/* Left: Time and client info */}
                  <div className="flex items-start gap-3.5">
                    
                    {/* Time & Date Pill */}
                    <div className="flex-shrink-0 text-center py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 min-w-[75px]">
                      <span className="block font-mono text-base font-bold text-amber-400">
                        {apt.time}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Client & Service Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          {apt.clientName}
                        </h3>

                        {/* Phone with WhatsApp clickable */}
                        <a
                          href={`https://wa.me/${apt.clientPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-800/30"
                          title="Conversar no WhatsApp"
                        >
                          <Phone className="w-3 h-3" />
                          {apt.clientPhone}
                        </a>

                        {apt.clientEmail && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            {apt.clientEmail}
                          </span>
                        )}
                        
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                            apt.status === 'confirmed'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : apt.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {apt.status === 'confirmed'
                            ? 'Confirmado'
                            : apt.status === 'completed'
                            ? 'Concluído'
                            : 'Cancelado'}
                        </span>

                        {isToday && (
                          <span className="text-[10px] bg-amber-400 text-zinc-950 font-bold px-1.5 py-0.2 rounded">
                            Hoje
                          </span>
                        )}

                        {isMyClient && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded">
                            Minha Cadeira
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="text-zinc-200 font-medium">
                          ✂️ {apt.serviceName}
                        </span>
                        <span className="text-zinc-300">
                          💈 {apt.barberName}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">
                          {formatBRL(apt.servicePrice)}
                        </span>
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {apt.serviceDuration} min
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-zinc-400 italic bg-zinc-950/40 px-2.5 py-1 rounded-lg border border-zinc-800/50 w-fit">
                          Obs: {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                    
                    {/* EDIT BUTTON (Full editing of client, phone, date, time, service, barber) */}
                    <button
                      id={`edit-apt-btn-${apt.id}`}
                      type="button"
                      onClick={() => handleOpenEdit(apt)}
                      title="Editar dados, nome, telefone ou horário deste agendamento"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {/* WhatsApp reminder button */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppReminder(apt)}
                      title="Enviar Lembrete / Confirmação por WhatsApp"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Status toggles */}
                    {apt.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(apt.id, 'completed')}
                        title="Marcar como Concluído"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {apt.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        title="Cancelar Agendamento"
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-400 text-xs font-medium transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {apt.status !== 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        title="Reativar Agendamento"
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        Reativar
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir permanentemente o agendamento de ${apt.clientName}?`)) {
                          onDeleteAppointment(apt.id);
                        }
                      }}
                      title="Excluir Agendamento"
                      className="p-1.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= EDIT APPOINTMENT MODAL ================= */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto my-auto scrollbar-thin">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                    Editar Dados do Agendamento
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Altere nome, telefone, data, horário ou profissional responsável.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingAppointment(null)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Nome do Cliente *
                </label>
                <input
                  id="edit-client-name"
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Client Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Telefone / WhatsApp *
                  </label>
                  <input
                    id="edit-client-phone"
                    type="tel"
                    required
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-sky-400" /> E-mail (Opcional)
                  </label>
                  <input
                    id="edit-client-email"
                    type="email"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Service and Barber selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" /> Serviço
                  </label>
                  <select
                    id="edit-service-select"
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatBRL(s.price)}) - {s.duration}min
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Barbeiro Responsável
                  </label>
                  <select
                    id="edit-barber-select"
                    value={editBarberId}
                    onChange={(e) => setEditBarberId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data do Atendimento *
                  </label>
                  <input
                    id="edit-date-input"
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Horário *
                  </label>
                  <select
                    id="edit-time-select"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Status do Agendamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'confirmed', label: 'Confirmado', color: 'text-amber-400 border-amber-500/30' },
                    { id: 'completed', label: 'Concluído', color: 'text-emerald-400 border-emerald-500/30' },
                    { id: 'cancelled', label: 'Cancelado', color: 'text-red-400 border-red-500/30' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setEditStatus(st.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        editStatus === st.id
                          ? `bg-zinc-800 ${st.color} ring-1 ring-amber-500/50`
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações / Preferências do Cliente
                </label>
                <textarea
                  id="edit-notes-input"
                  rows={2}
                  placeholder="Ex: Cliente tem preferência por fade na tesoura, avisou que pode chegar 5 min atrasado..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="save-edit-appointment-btn"
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MANUAL BOOKING MODAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Novo Agendamento Manual (Presencial / Balcão)
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={manualClientPhone}
                    onChange={(e) => setManualClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={manualClientEmail}
                    onChange={(e) => setManualClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Serviço</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatBRL(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Barbeiro</label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Horário</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Agendado presencialmente no balcão"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmittingManual ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
