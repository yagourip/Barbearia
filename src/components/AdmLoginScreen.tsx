import React, { useState } from 'react';
import { ShieldCheck, Scissors, KeyRound, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { Barber } from '../types.ts';

interface AdmLoginScreenProps {
  barbers: Barber[];
  onLoginSuccess: (selectedBarberId: string) => void;
}

export const AdmLoginScreen: React.FC<AdmLoginScreenProps> = ({
  barbers,
  onLoginSuccess,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || 'all');
  const [pin, setPin] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Accept standard PIN 1234 or empty/quick access
    if (pin.trim() === '' || pin.trim() === '1234' || pin.trim() === 'admin') {
      if (rememberMe) {
        localStorage.setItem('navalha_adm_auth', 'true');
        localStorage.setItem('navalha_active_admin_barber', selectedBarberId);
      }
      onLoginSuccess(selectedBarberId);
    } else {
      setErrorMsg('PIN incorreto. (Dica: o PIN padrão é 1234 ou deixe em branco para entrar direto)');
    }
  };

  const handleQuickAccess = (barberId: string) => {
    setSelectedBarberId(barberId);
    if (rememberMe) {
      localStorage.setItem('navalha_adm_auth', 'true');
      localStorage.setItem('navalha_active_admin_barber', barberId);
    }
    onLoginSuccess(barberId);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
        
        {/* Header with Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
          </div>

          <span className="inline-block text-[11px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Acesso Restrito
          </span>

          <h1 className="text-2xl font-serif font-bold text-zinc-100">
            Painel do Barbeiro ADM
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Identifique-se para gerenciar sua cadeira, visualizar clientes agendados e os serviços solicitados.
          </p>
        </div>

        {/* Barber selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Selecione seu Perfil de Barbeiro:
          </label>
          
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setSelectedBarberId('all')}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedBarberId === 'all'
                  ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-100">
                  👑 Gerência Geral (Todos os Barbeiros)
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Visualizar agenda completa e todas as cadeiras
                </div>
              </div>
            </button>

            {barbers.map((b) => {
              const isSelected = selectedBarberId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBarberId(b.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <img
                    src={b.avatarUrl}
                    alt={b.name}
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      💈 {b.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {b.specialty}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                PIN de Segurança (Opcional):
              </label>
              <span className="text-[10px] text-zinc-500">
                Padrão: 1234
              </span>
            </div>
            <input
              id="adm-pin-input"
              type="password"
              placeholder="Digite o PIN ou entre direto"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-center tracking-widest"
            />
            {errorMsg && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember-adm-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="remember-adm-checkbox" className="text-xs text-zinc-400 cursor-pointer select-none">
              Manter acesso ADM conectado neste navegador
            </label>
          </div>

          <button
            id="enter-adm-btn"
            type="submit"
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Entrar no Painel do Barbeiro ADM</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Quick Help Footer */}
        <div className="pt-2 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500">
            Você terá acesso à lista em tempo real de quem agendou e o que cada cliente solicitou.
          </p>
        </div>

      </div>
    </div>
  );
};
