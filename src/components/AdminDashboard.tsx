import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Appointment, Barber, Service } from '../types.ts';
import { getTodayFormatted, TIME_SLOTS } from '../data/initialData.ts';

interface AdminDashboardProps {
  appointments: Appointment[];
  services: Service[];
  barbers: Barber[];
  onUpdateStatus: (id: string, status: Appointment['status']) => Promise<boolean>;
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
  onDeleteAppointment,
  onAddManualAppointment,
  onRefresh,
  isSupabaseConnected,
}) => {
  const todayDate = getTodayFormatted();

  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [barberFilter, setBarberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick manual appointment modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualClientName, setManualClientName] = useState<string>('');
  const [manualClientPhone, setManualClientPhone] = useState<string>('');
  const [manualServiceId, setManualServiceId] = useState<string>(services[0]?.id || '');
  const [manualBarberId, setManualBarberId] = useState<string>(barbers[0]?.id || '');
  const [manualDate, setManualDate] = useState<string>(todayDate);
  const [manualTime, setManualTime] = useState<string>('10:00');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

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

  const todayRevenue = useMemo(() => {
    return todayAppointments.reduce((acc, curr) => acc + curr.servicePrice, 0);
  }, [todayAppointments]);

  const totalCompleted = useMemo(() => {
    return appointments.filter((apt) => apt.status === 'completed').length;
  }, [appointments]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // WhatsApp reminder message
  const handleOpenWhatsAppReminder = (apt: Appointment) => {
    const rawPhone = apt.clientPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    const [y, m, d] = apt.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    
    const message = `Olá, ${apt.clientName}! Passando para lembrar do seu agendamento na *Navalha & Arte Barbearia*:%0A%0A` +
      `✂️ *Serviço:* ${apt.serviceName}%0A` +
      `💈 *Barbeiro:* ${apt.barberName}%0A` +
      `📅 *Data e Horário:* ${formattedDate} às ${apt.time}h%0A%0A` +
      `Qualquer imprevisto, nos avise por aqui. Te esperamos!`;

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
      setManualNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
              Painel de Gestão & Agenda
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isSupabaseConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              {isSupabaseConnected ? 'Sincronizado via Supabase' : 'Modo Local'}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Acompanhe o fluxo de clientes, controle de horários e faturamento da barbearia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-agenda-btn"
            type="button"
            onClick={onRefresh}
            title="Atualizar dados"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            id="open-manual-booking-btn"
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Hoje ({todayDate.split('-').reverse().join('/')})
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-zinc-400">clientes agendados</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Faturamento Previsto Hoje
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {formatBRL(todayRevenue)}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Atendimentos Concluídos
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
            <span className="text-xs text-zinc-400">agendamentos</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3">
        
        {/* Date Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mr-1">
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === tab.id
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selectors and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Barber filter */}
          <div>
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Barbeiros</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Status</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Mostrando <strong>{filteredAppointments.length}</strong> agendamento(s)
          </span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não há agendamentos para o filtro selecionado. Use o botão "Novo Agendamento" para adicionar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAppointments.map((apt) => {
              const isToday = apt.date === todayDate;
              const formattedDate = apt.date.split('-').reverse().join('/');

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
                      ? 'bg-zinc-900 border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'bg-zinc-900/80 border-zinc-800'
                  }`}
                >
                  {/* Left: Time and client info */}
                  <div className="flex items-start gap-3.5">
                    {/* Time Pill */}
                    <div className="flex-shrink-0 text-center py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 min-w-[70px]">
                      <span className="block font-mono text-base font-bold text-amber-400">
                        {apt.time}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-zinc-100 text-sm">{apt.clientName}</h3>
                        
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
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1.5">
                        <span className="text-zinc-200 font-medium">
                          ✂️ {apt.serviceName}
                        </span>
                        <span>💈 {apt.barberName}</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {formatBRL(apt.servicePrice)}
                        </span>
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {apt.serviceDuration} min
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-zinc-500 italic mt-1">
                          Obs: {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                    {/* WhatsApp button */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppReminder(apt)}
                      title="Enviar Lembrete por WhatsApp"
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition-all cursor-pointer"
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
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-400 text-xs font-medium transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {apt.status !== 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        title="Reativar Agendamento"
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all"
                      >
                        Reativar
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir agendamento de ${apt.clientName}?`)) {
                          onDeleteAppointment(apt.id);
                        }
                      }}
                      title="Excluir Agendamento"
                      className="p-1.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all"
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

      {/* ================= MANUAL BOOKING MODAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Novo Agendamento Manual
              </h2>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Serviço</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
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
                  placeholder="Ex: Agendado presencialmente na recepção"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20"
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
