import React, { useState, useMemo } from 'react';
import { 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Star,
  Receipt
} from 'lucide-react';
import { Service, Barber, Appointment, ServiceCategory } from '../types.ts';
import { TIME_SLOTS } from '../data/initialData.ts';

interface BookingWizardProps {
  services: Service[];
  barbers: Barber[];
  existingAppointments: Appointment[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  onGoToAdmin: () => void;
  isSupabaseConnected: boolean;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  barbers,
  existingAppointments,
  onBookAppointment,
  onGoToAdmin,
  isSupabaseConnected,
}) => {
  // Step tracker: 1=service, 2=barber, 3=date&time, 4=client info, 5=confirmation
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Booking selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any'); // 'any' or barber id
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // If today is Sunday (0), suggest Monday
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Client form
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Status states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filtered services
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Selected Barber object
  const selectedBarber = useMemo(() => {
    if (selectedBarberId === 'any') return null;
    return barbers.find((b) => b.id === selectedBarberId) || null;
  }, [barbers, selectedBarberId]);

  // Generate next 14 available dates
  const availableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      // Skip Sundays (0)
      if (d.getDay() !== 0) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        dates.push({
          dateString: formatted,
          dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[d.getDay()],
          dayNumber: day,
          monthName: monthNames[d.getMonth()],
        });
      }
    }
    return dates;
  }, []);

  // Determine occupied time slots
  const occupiedSlots = useMemo(() => {
    const active = existingAppointments.filter(
      (apt) => apt.date === selectedDate && apt.status !== 'cancelled'
    );

    if (selectedBarberId === 'any') {
      // If any barber, a slot is only full if ALL barbers are booked at that time
      const slotCounts: Record<string, number> = {};
      active.forEach((apt) => {
        slotCounts[apt.time] = (slotCounts[apt.time] || 0) + 1;
      });
      const totalBarbers = barbers.length || 3;
      return Object.keys(slotCounts).filter((time) => slotCounts[time] >= totalBarbers);
    } else {
      // Specific barber
      return active
        .filter((apt) => apt.barberId === selectedBarberId)
        .map((apt) => apt.time);
    }
  }, [existingAppointments, selectedDate, selectedBarberId, barbers]);

  // Format currency
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Phone input mask for Brazil (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 6) {
      value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
    } else if (value.length > 2) {
      value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setClientPhone(value);
  };

  // Submit Handler
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Determine assigned barber
      let assignedBarberId = selectedBarberId;
      let assignedBarberName = 'Carlos "Navalha" Silva';

      if (selectedBarberId === 'any') {
        // Find a barber free at this time
        const bookedBarberIds = existingAppointments
          .filter((apt) => apt.date === selectedDate && apt.time === selectedTime && apt.status !== 'cancelled')
          .map((apt) => apt.barberId);
        
        const availableBarber = barbers.find((b) => !bookedBarberIds.includes(b.id)) || barbers[0];
        assignedBarberId = availableBarber?.id || 'barber-1';
        assignedBarberName = availableBarber?.name || 'Carlos "Navalha" Silva';
      } else {
        const found = barbers.find((b) => b.id === selectedBarberId);
        if (found) {
          assignedBarberName = found.name;
        }
      }

      const created = await onBookAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        barberId: assignedBarberId,
        barberName: assignedBarberName,
        date: selectedDate,
        time: selectedTime,
        status: 'confirmed',
        notes: notes.trim() || undefined,
      });

      setBookedAppointment(created);
      setStep(5); // Success step
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Ocorreu um erro ao salvar o agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for a new booking
  const handleStartNewBooking = () => {
    setSelectedService(null);
    setSelectedBarberId('any');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setNotes('');
    setBookedAppointment(null);
    setStep(1);
  };

  // WhatsApp formatted confirmation link
  const getWhatsAppConfirmationLink = () => {
    if (!bookedAppointment) return '#';
    const cleanPhone = '5511987654321'; // Barber shop phone
    const [year, month, day] = bookedAppointment.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const text = `Olá! Gostaria de confirmar meu agendamento na Navalha & Arte Barbearia:%0A%0A` +
      `👤 *Cliente:* ${encodeURIComponent(bookedAppointment.clientName)}%0A` +
      `✂️ *Serviço:* ${encodeURIComponent(bookedAppointment.serviceName)}%0A` +
      `💈 *Barbeiro:* ${encodeURIComponent(bookedAppointment.barberName)}%0A` +
      `📅 *Data:* ${formattedDate} às ${bookedAppointment.time}h%0A` +
      `💰 *Valor:* ${formatBRL(bookedAppointment.servicePrice)}%0A%0A` +
      `Obrigado!`;
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Step Indicator Header (Steps 1 to 4) */}
      {step <= 4 && (
        <div className="mb-8">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Agendamento Online
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100 mt-2">
              Reserve seu Horário
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Escolha seu serviço, barbeiro e horário preferido em poucos cliques.
            </p>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { num: 1, label: 'Serviço' },
              { num: 2, label: 'Barbeiro' },
              { num: 3, label: 'Data & Hora' },
              { num: 4, label: 'Seus Dados' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                disabled={step < s.num}
                onClick={() => setStep(s.num)}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  step === s.num
                    ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
                    : step > s.num
                    ? 'bg-zinc-900 border border-emerald-500/30 text-emerald-400 cursor-pointer'
                    : 'bg-zinc-900/40 border border-zinc-800 text-zinc-600 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    step === s.num
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                      : step > s.num
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= STEP 1: SERVIÇO ================= */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'Todos os Serviços' },
              { id: 'cabelo', label: 'Cabelo' },
              { id: 'barba', label: 'Barba' },
              { id: 'combo', label: 'Combos' },
              { id: 'estetica', label: 'Estética' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <div
                  key={service.id}
                  id={`service-card-${service.id}`}
                  onClick={() => setSelectedService(service)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500'
                      : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between pr-8">
                      <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {service.name}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{service.duration} minutos</span>
                    </div>
                    <span className="text-lg font-bold text-amber-400 font-mono">
                      {formatBRL(service.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <button
              id="step1-next-btn"
              type="button"
              disabled={!selectedService}
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedService
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>Avançar para Barbeiro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: BARBEIRO ================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Escolha o Profissional</h2>
              <p className="text-xs text-zinc-400">
                Selecione seu barbeiro de preferência ou deixe com o primeiro disponível.
              </p>
            </div>
            {selectedService && (
              <div className="text-right hidden sm:block">
                <span className="text-xs text-zinc-500">Serviço escolhido:</span>
                <p className="text-sm font-semibold text-amber-400">{selectedService.name}</p>
              </div>
            )}
          </div>

          {/* Option: Qualquer Barbeiro */}
          <div
            id="barber-card-any"
            onClick={() => setSelectedBarberId('any')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedBarberId === 'any'
                ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  Qualquer Barbeiro Disponível
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Mais Rápido
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Atendimento com o profissional que tiver o melhor horário livre para você.
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
              selectedBarberId === 'any'
                ? 'bg-amber-500 border-amber-500 text-zinc-950'
                : 'border-zinc-700'
            }`}>
              {selectedBarberId === 'any' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Specific Barbers List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const isSelected = selectedBarberId === barber.id;
              return (
                <div
                  key={barber.id}
                  id={`barber-card-${barber.id}`}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-zinc-100 ring-1 ring-amber-500'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="relative mb-3">
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/30 shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-zinc-900 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{barber.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-zinc-100">{barber.name}</h3>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{barber.specialty}</p>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {barber.bio}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              id="step2-next-btn"
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Escolher Horário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: DATA & HORÁRIO ================= */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Data e Horário</h2>
              <p className="text-xs text-zinc-400">
                Selecione o dia e o horário que melhor se adaptam à sua rotina.
              </p>
            </div>
            <div className="text-right text-xs text-zinc-400 hidden sm:block">
              <span>Profissional: </span>
              <span className="font-semibold text-amber-400">
                {selectedBarber ? selectedBarber.name : 'Qualquer Barbeiro'}
              </span>
            </div>
          </div>

          {/* Date Selector Carousel */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Selecione o Dia:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateString;
                return (
                  <button
                    key={item.dateString}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.dateString);
                      setSelectedTime(''); // Reset time on date change
                    }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-3 px-2 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-md shadow-amber-500/30 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`text-[11px] uppercase tracking-wider font-semibold ${
                      isSelected ? 'text-zinc-950' : 'text-zinc-500'
                    }`}>
                      {item.dayName}
                    </span>
                    <span className="text-xl font-mono font-extrabold my-0.5">
                      {item.dayNumber}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                      {item.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Horários Disponíveis ({selectedDate.split('-').reverse().join('/')}):
              </label>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></span> Livre
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-800"></span> Ocupado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {TIME_SLOTS.map((time) => {
                const isOccupied = occupiedSlots.includes(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    key={time}
                    id={`time-slot-${time.replace(':', '')}`}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-2 rounded-xl text-sm font-mono font-medium transition-all relative ${
                      isOccupied
                        ? 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed line-through opacity-50'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold border border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-800/80 cursor-pointer'
                    }`}
                  >
                    {time}
                    {isOccupied && (
                      <span className="block text-[9px] no-underline font-sans text-red-400/80 uppercase">
                        Ocupado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              id="step3-next-btn"
              type="button"
              disabled={!selectedTime}
              onClick={() => setStep(4)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedTime
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>Seus Dados</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SEUS DADOS & CONFIRMAÇÃO ================= */}
      {step === 4 && selectedService && (
        <div className="space-y-6">
          <div className="mb-2">
            <h2 className="text-xl font-bold text-zinc-100">Informações para Contato</h2>
            <p className="text-xs text-zinc-400">
              Informe seus dados para confirmação e envio do lembrete via WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form */}
            <form onSubmit={handleConfirmBooking} className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    id="client-name-input"
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  WhatsApp / Celular *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    id="client-phone-input"
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Enviaremos a confirmação e lembrete direto no seu WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <input
                  id="client-email-input"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Observações ou Preferências (Opcional)
                </label>
                <textarea
                  id="client-notes-input"
                  rows={2}
                  placeholder="Ex: Cabelo bem batido nas laterais, barba bem desenhada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Navigation and Submit buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  id="confirm-booking-submit-btn"
                  type="submit"
                  disabled={isSubmitting || !clientName.trim() || !clientPhone.trim()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    !isSubmitting && clientName.trim() && clientPhone.trim()
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/30 cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando no Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Summary Card */}
            <div className="lg:col-span-5">
              <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-200">
                    Resumo do Agendamento
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-zinc-500">Serviço:</span>
                    <p className="font-semibold text-zinc-100">{selectedService.name}</p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {selectedService.duration} minutos de duração estimada
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-500">Profissional:</span>
                    <p className="font-semibold text-amber-400">
                      {selectedBarber ? selectedBarber.name : 'Qualquer Barbeiro Disponível'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
                    <div>
                      <span className="text-xs text-zinc-500">Data:</span>
                      <p className="font-medium text-zinc-200">
                        {selectedDate.split('-').reverse().join('/')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Horário:</span>
                      <p className="font-mono font-bold text-amber-400">{selectedTime}h</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">Total a Pagar:</span>
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {formatBRL(selectedService.price)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 text-center">
                    Pagamento realizado no local (Dinheiro, Pix ou Cartão).
                  </p>
                </div>

                {/* Storage badge */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isSupabaseConnected ? 'Armazenamento em nuvem via Supabase' : 'Armazenamento seguro ativo'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= STEP 5: SUCESSO ================= */}
      {step === 5 && bookedAppointment && (
        <div className="max-w-xl mx-auto py-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50">
              Agendamento Confirmado!
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 mt-3">
              Tudo pronto, {bookedAppointment.clientName}!
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Seu horário foi reservado e registrado com sucesso.
            </p>
          </div>

          {/* Receipt card */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-sm text-amber-400 uppercase tracking-wider">
                  Navalha & Arte Barbearia
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                #{bookedAppointment.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-zinc-500">Serviço:</span>
                <p className="font-semibold text-zinc-100">{bookedAppointment.serviceName}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Barbeiro:</span>
                <p className="font-semibold text-zinc-100">{bookedAppointment.barberName}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Data e Hora:</span>
                <p className="font-semibold text-zinc-100">
                  {bookedAppointment.date.split('-').reverse().join('/')} às {bookedAppointment.time}h
                </p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Valor Estimado:</span>
                <p className="font-bold text-amber-400 font-mono">
                  {formatBRL(bookedAppointment.servicePrice)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Chegue com 5 a 10 minutos de antecedência. Avise caso precise reagendar ou cancelar.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              id="whatsapp-confirm-link"
              href={getWhatsAppConfirmationLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir WhatsApp da Barbearia</span>
            </a>

            <button
              id="new-booking-btn"
              type="button"
              onClick={handleStartNewBooking}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
            >
              Fazer Outro Agendamento
            </button>

            <button
              id="view-in-dashboard-btn"
              type="button"
              onClick={onGoToAdmin}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-700 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 font-semibold text-sm transition-all"
            >
              Ver na Agenda Geral
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
