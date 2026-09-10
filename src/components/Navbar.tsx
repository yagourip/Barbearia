import React from 'react';
import { Scissors, Calendar, LayoutDashboard, Database, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { SupabaseConfig } from '../types.ts';

interface NavbarProps {
  activeTab: 'booking' | 'admin';
  setActiveTab: (tab: 'booking' | 'admin') => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  todayCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  supabaseConfig,
  onOpenSupabaseModal,
  todayCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-amber-500/20 text-zinc-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('booking')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20">
              <Scissors className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-wider font-bold text-xl text-amber-400 uppercase">
                  Navalha & Arte
                </span>
                <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-mono border border-amber-400/20">
                  Est. 2018
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                Seg a Sáb: 09:00 às 20:00
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <nav className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                id="tab-booking-btn"
                type="button"
                onClick={() => setActiveTab('booking')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'booking'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Horário</span>
              </button>

              <button
                id="tab-admin-btn"
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel da Barbearia</span>
                {todayCount > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'admin'
                      ? 'bg-zinc-950 text-amber-400'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {todayCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Supabase connection status button */}
            <button
              id="open-supabase-modal-btn"
              type="button"
              onClick={onOpenSupabaseModal}
              title="Configuração do Banco de Dados Supabase"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                supabaseConfig.isConfigured
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/70 hover:border-emerald-500/50'
                  : 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-950/60 hover:border-amber-500/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {supabaseConfig.isConfigured ? 'Supabase Conectado' : 'Configurar Supabase'}
              </span>
              <span className="md:hidden">Supabase</span>
              {supabaseConfig.isConfigured ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
