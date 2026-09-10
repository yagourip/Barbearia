import React from 'react';
import { Scissors, Database, Clock, ShieldCheck, AlertCircle, LogOut, ExternalLink, Calendar } from 'lucide-react';
import { SupabaseConfig } from '../types.ts';

interface NavbarProps {
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  todayCount: number;
  isAdmAuthenticated: boolean;
  onLogoutAdm: () => void;
  showClientView: boolean;
  setShowClientView: (show: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  supabaseConfig,
  onOpenSupabaseModal,
  todayCount,
  isAdmAuthenticated,
  onLogoutAdm,
  showClientView,
  setShowClientView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-amber-500/20 text-zinc-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setShowClientView(false)}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 flex-shrink-0">
              <Scissors className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-wider font-bold text-xl text-amber-400 uppercase">
                  Navalha & Arte
                </span>
                <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-mono border border-amber-400/20">
                  ADM
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Painel do Barbeiro Administrador
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* If logged in as ADM */}
            {isAdmAuthenticated && (
              <>
                {/* Switch between ADM Console and Client Simulation View */}
                <button
                  id="toggle-client-view-btn"
                  type="button"
                  onClick={() => setShowClientView(!showClientView)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    showClientView
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                  title={showClientView ? 'Voltar para o Painel ADM' : 'Ver como o cliente enxerga o agendamento'}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {showClientView ? 'Voltar ao Painel ADM' : 'Ver Tela do Cliente'}
                  </span>
                </button>

                {/* Today's Client Count Badge */}
                <div 
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                  title="Clientes confirmados para hoje"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hoje:</span>
                  <strong className="font-mono text-amber-400 font-bold">{todayCount}</strong>
                </div>
              </>
            )}

            {/* Supabase connection status button */}
            <button
              id="open-supabase-modal-btn"
              type="button"
              onClick={onOpenSupabaseModal}
              title="Configuração do Banco de Dados Supabase"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                supabaseConfig.isConfigured
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/70 hover:border-emerald-500/50'
                  : 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-950/60 hover:border-amber-500/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {supabaseConfig.isConfigured ? 'Supabase Conectado' : 'Configurar Supabase'}
              </span>
              <span className="lg:hidden">Supabase</span>
              {supabaseConfig.isConfigured ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Logout ADM button if authenticated */}
            {isAdmAuthenticated && (
              <button
                id="navbar-logout-adm-btn"
                type="button"
                onClick={onLogoutAdm}
                title="Bloquear sessão do Barbeiro ADM"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-900/40 text-zinc-400 text-xs font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
