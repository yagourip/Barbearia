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
  X,
  PackageCheck,
  Tag,
  Layers,
  LayoutList,
  CalendarDays,
  LogOut,
  ExternalLink,
  Info
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
  onLogoutAdm?: () => void;
  onOpenClientView?: () => void;
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
  onLogoutAdm,
  onOpenClientView,
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
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Mode: 'list' (detailed cards) or 'timeline' (daily hour-by-hour agenda)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

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
  const [manualTime, setManualTime] = useState<string>('10:30');
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

      // Service filter ("O que agendou")
      if (serviceFilter !== 'all' && apt.serviceId !== serviceFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }

      // Search query (name, phone, service name, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = apt.clientName.toLowerCase().includes(q);
        const matchPhone = apt.clientPhone.includes(q);
        const matchService = apt.serviceName.toLowerCase().includes(q);
        const matchNotes = apt.notes?.toLowerCase().includes(q) || false;
        if (!matchName && !matchPhone && !matchService && !matchNotes) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, barberFilter, serviceFilter, statusFilter, searchQuery, todayDate]);

  // Breakdown of "O que estão agendando" (Services demanded in current filtered view)
  const servicesDemandStats = useMemo(() => {
    const map: Record<string, { serviceName: string; count: number; totalRevenue: number; serviceId: string }> = {};

    filteredAppointments.forEach((apt) => {
      if (apt.status === 'cancelled') return;
      if (!map[apt.serviceId]) {
        map[apt.serviceId] = {
          serviceId: apt.serviceId,
          serviceName: apt.serviceName,
          count: 0,
          totalRevenue: 0,
        };
      }
      map[apt.serviceId].count += 1;
      map[apt.serviceId].totalRevenue += apt.servicePrice;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredAppointments]);

  // Metrics
  const todayAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.date === todayDate && apt.status !== 'cancelled');
  }, [appointments, todayDate]);

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

  // WhatsApp reminder message with explicit service booked
  const handleOpenWhatsAppReminder = (apt: Appointment) => {
    const rawPhone = apt.clientPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    const [y, m, d] = apt.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    
    const message = `Olá, ${apt.clientName}! Passando para confirmar seu agendamento na *Navalha & Arte Barbearia*:%0A%0A` +
      `✂️ *Serviço Agendado:* ${apt.serviceName}%0A` +
      `💈 *Barbeiro Responsável:* ${apt.barberName}%0A` +
      `📅 *Data e Horário:* ${formattedDate} às ${apt.time}h%0A` +
      `⏱️ *Duração Estimada:* ${apt.serviceDuration} min%0A` +
      `💵 *Valor:* ${formatBRL(apt.servicePrice)}%0A%0A` +
      (apt.notes ? `📝 *Observação:* ${apt.notes}%0A%0A` : '') +
      `Se precisar ajustar ou tiver qualquer dúvida, nos avise por aqui. Te esperamos!`;

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Open manual appointment modal with a preselected time if desired
  const handleOpenManualForTime = (timeSlot?: string) => {
    if (timeSlot) setManualTime(timeSlot);
    setShowManualModal(true);
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
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-7">
      
      {/* ================= BARBER ADMIN TOP BANNER & IDENTITY ================= */}
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
                  <Scissors className="w-3 h-3" /> Modo Barbeiro ADM
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
                  ? `Cadeira ativa • Especialidade: ${activeAdminBarber.specialty}`
                  : 'Visão consolidada de todas as cadeiras, clientes e serviços solicitados'}
              </p>
            </div>
          </div>

          {/* Quick Barber Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-2xl">
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
              onClick={() => handleOpenManualForTime()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Agendamento</span>
            </button>

            {onLogoutAdm && (
              <button
                id="logout-adm-btn"
                type="button"
                onClick={onLogoutAdm}
                title="Bloquear painel e exigir identificação do ADM"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-red-950/50 hover:text-red-300 hover:border-red-900/40 text-zinc-400 text-xs font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear ADM</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ================= METRIC CARDS ================= */}
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
              Total Agendamentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {appointments.length}
            </span>
            <span className="text-xs text-zinc-400">no sistema</span>
          </div>
        </div>

      </div>

      {/* ================= HERO: "O QUE OS CLIENTES ESTÃO AGENDANDO" (DEMAND SUMMARY) ================= */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/70 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg shadow-amber-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow">
              <PackageCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>O Que Estão Agendando</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredAppointments.length} agendamento(s)
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Resumo dos serviços mais solicitados pelos clientes no filtro selecionado:
              </p>
            </div>
          </div>

          {/* Service quick filter toggle */}
          {serviceFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setServiceFilter('all')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtro de serviço
            </button>
          )}
        </div>

        {/* Demand tags / pills */}
        {servicesDemandStats.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            Nenhum serviço confirmado ou pendente para os filtros ativos.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {servicesDemandStats.map((item) => {
              const isSelected = serviceFilter === item.serviceId;
              return (
                <button
                  key={item.serviceId}
                  type="button"
                  onClick={() => setServiceFilter(isSelected ? 'all' : item.serviceId)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500 text-zinc-100 shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-950'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{item.serviceName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Total: <strong className="text-amber-400">{formatBRL(item.totalRevenue)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950">
                      {item.count} {item.count === 1 ? 'cliente' : 'clientes'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= FILTER AND SEARCH BAR ================= */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-4">
        
        {/* Date Tabs & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          
          {/* Period selector */}
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
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right controls: "Minha Cadeira" toggle and View Mode (Cards vs Timeline) */}
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* View Mode Toggle: Detailed Cards vs Timeline Agenda */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Visualização Detalhada em Cartões"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cartões</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                title="Visualização em Grade de Horários do Dia"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grade de Horários</span>
              </button>
            </div>
          </div>

        </div>

        {/* Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-appointments-input"
              type="text"
              placeholder="Buscar cliente, telefone, serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Service Filter ("O que agendou") */}
          <div>
            <select
              id="filter-service-select"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">✂️ O Que Agendou: Todos os Serviços</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatBRL(s.price)})
                </option>
              ))}
            </select>
          </div>

          {/* Barber Dropdown Filter */}
          <div>
            <select
              id="filter-barber-select"
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">💈 Barbeiro: Todos os Barbeiros</option>
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
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">📌 Status: Todos os Status</option>
              <option value="confirmed">Confirmados (Agendados)</option>
              <option value="completed">Concluídos (Atendidos)</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

        </div>

      </div>

      {/* ================= APPOINTMENTS DISPLAY ================= */}
      <div className="space-y-4">
        
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <span>Clientes Agendados & Serviços Solicitados ({filteredAppointments.length})</span>
          </h2>
          <span className="text-xs text-zinc-400">
            Dica: Clique em <strong className="text-amber-400">Editar</strong> para alterar horário, serviço, barbeiro ou cliente
          </span>
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-200">Nenhum agendamento encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Não há agendamentos para os filtros aplicados. Clique no botão abaixo para adicionar um agendamento manual ou altere os filtros acima.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenManualForTime()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar Agendamento Agora</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          
          /* ================= VIEW MODE: DETAILED CARDS ================= */
          <div className="grid grid-cols-1 gap-4">
            {filteredAppointments.map((apt) => {
              const isToday = apt.date === todayDate;
              const formattedDate = apt.date.split('-').reverse().join('/');
              const isMyClient = activeAdminBarber && apt.barberId === activeAdminBarber.id;
              const barberObj = barbers.find((b) => b.id === apt.barberId);

              return (
                <div
                  key={apt.id}
                  id={`appointment-card-${apt.id}`}
                  className={`rounded-3xl border transition-all p-5 sm:p-6 space-y-4 ${
                    apt.status === 'completed'
                      ? 'bg-zinc-900/40 border-zinc-800/60 opacity-85'
                      : apt.status === 'cancelled'
                      ? 'bg-red-950/10 border-red-900/20 opacity-65'
                      : isToday
                      ? 'bg-zinc-900/95 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  
                  {/* Top Bar: Time, Date, Status, Chair & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    
                    {/* Time badge and date */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="font-mono text-base font-bold text-amber-400">
                          {apt.time}h
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Today Badge */}
                      {isToday && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950">
                          Hoje
                        </span>
                      )}

                      {/* My chair badge */}
                      {isMyClient && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Sua Cadeira
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                          apt.status === 'confirmed'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : apt.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {apt.status === 'confirmed'
                          ? 'Confirmado'
                          : apt.status === 'completed'
                          ? 'Concluído'
                          : 'Cancelado'}
                      </span>
                    </div>

                    {/* Quick action buttons on top-right */}
                    <div className="flex items-center gap-2 flex-wrap">
                      
                      {/* EDIT BUTTON */}
                      <button
                        id={`edit-apt-btn-${apt.id}`}
                        type="button"
                        onClick={() => handleOpenEdit(apt)}
                        title="Editar cliente, telefone, serviço ou horário"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* WhatsApp with auto message */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppReminder(apt)}
                        title="Abrir WhatsApp com lembrete do serviço"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Status toggle */}
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
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-400 text-xs font-medium transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Core 2-Column Info: Client Info & WHAT IS BOOKED */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Left Column (5 cols): Client Identity & Contacts */}
                    <div className="lg:col-span-5 space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                          Cliente
                        </span>
                        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-400" />
                          {apt.clientName}
                        </h3>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <a
                            href={`https://wa.me/${apt.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-emerald-400 hover:underline font-semibold"
                          >
                            {apt.clientPhone}
                          </a>
                        </div>

                        {apt.clientEmail && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Mail className="w-3.5 h-3.5 text-sky-400" />
                            <span>{apt.clientEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* Responsible Barber */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2.5">
                        <img
                          src={barberObj?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={apt.barberName}
                          className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
                        />
                        <div className="text-xs">
                          <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Barbeiro Designado:</span>
                          <span className="font-bold text-zinc-200">{apt.barberName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7 cols): EXPLICIT "O QUE O CLIENTE AGENDOU" BOX */}
                    <div className="lg:col-span-7 bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
                      
                      {/* Box Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                          <PackageCheck className="w-4 h-4 text-amber-400" />
                          O Que o Cliente Agendou:
                        </span>
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
                            {formatBRL(apt.servicePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Service Title and details */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                            <Scissors className="w-4 h-4 text-amber-400" />
                            {apt.serviceName}
                          </h4>
                          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {apt.serviceDuration} minutos de atendimento
                          </span>
                        </div>
                      </div>

                      {/* Notes / Special client preferences */}
                      {apt.notes ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400">
                            <Info className="w-3 h-3" /> Preferências / Observações do Cliente:
                          </span>
                          <p className="italic">"{apt.notes}"</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">
                          Sem observações adicionais informadas pelo cliente.
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        ) : (

          /* ================= VIEW MODE: TIMELINE / DAILY HOUR-BY-HOUR AGENDA ================= */
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  Grade de Horários do Dia ({dateFilter === 'today' ? `Hoje - ${todayDate.split('-').reverse().join('/')}` : 'Data Selecionada'})
                </h3>
                <p className="text-xs text-zinc-400">
                  Veja quem está em cada horário e qual serviço será executado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenManualForTime()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Encaixar Cliente</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {TIME_SLOTS.map((slot) => {
                // Find appointments in this time slot
                const aptsInSlot = filteredAppointments.filter((a) => a.time === slot);

                if (aptsInSlot.length > 0) {
                  return (
                    <div
                      key={slot}
                      className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      {/* Left: Time and client */}
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-base font-bold text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl min-w-[70px] text-center">
                          {slot}h
                        </span>

                        <div className="space-y-1">
                          {aptsInSlot.map((apt) => (
                            <div key={apt.id} className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-zinc-100 text-sm">
                                  {apt.clientName}
                                </span>
                                <span className="text-xs text-zinc-400">({apt.clientPhone})</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                                  💈 {apt.barberName}
                                </span>
                              </div>

                              <div className="text-xs text-zinc-300 flex items-center gap-2 flex-wrap">
                                <span className="text-amber-400 font-bold">
                                  ✂️ {apt.serviceName}
                                </span>
                                <span>•</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {formatBRL(apt.servicePrice)}
                                </span>
                                <span>•</span>
                                <span className="text-zinc-400">{apt.serviceDuration} min</span>
                                {apt.notes && (
                                  <span className="text-zinc-400 italic">({apt.notes})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(aptsInSlot[0])}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppReminder(aptsInSlot[0])}
                          className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 text-xs font-bold cursor-pointer"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={slot}
                    className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex items-center justify-between gap-3 text-xs text-zinc-500 hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-xl min-w-[70px] text-center">
                        {slot}h
                      </span>
                      <span>Horário Disponível</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenManualForTime(slot)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agendar neste horário
                    </button>
                  </div>
                );
              })}
            </div>
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
                    Altere nome, telefone, serviço solicitado, data ou horário.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingAppointment(null)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
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
                    <Scissors className="w-3.5 h-3.5 text-amber-400" /> Serviço Solicitado
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
                  Status do Atendimento
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
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                  placeholder="Ex: Cliente tem preferência por corte na tesoura, acabamento navalhado..."
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
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

      {/* ================= MANUAL BOOKING MODAL (BALCÃO / ENCAIXE) ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Novo Agendamento Manual (Balcão / Presencial)
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
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
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Observações do Cliente</label>
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
