import React, { useState } from 'react';
import { 
  Database, 
  Check, 
  Copy, 
  Download,
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Globe, 
  Code2, 
  X,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { SupabaseConfig } from '../types.ts';
import { 
  SUPABASE_SQL_SCHEMA, 
  saveCustomSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState<string>(config.url || '');
  const [anonKey, setAnonKey] = useState<string>(config.anonKey || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'barbearia_supabase_schema_com_storage.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Preencha a URL e a Anon Key antes de testar.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, anonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    saveCustomSupabaseConfig(url, anonKey);
    onConfigUpdated();
    onClose();
  };

  const handleClear = () => {
    setUrl('');
    setAnonKey('');
    saveCustomSupabaseConfig('', '');
    setTestResult(null);
    onConfigUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                Conexão com o Supabase
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  config.isConfigured
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {config.isConfigured ? 'Conectado' : 'Modo Demonstração / Local'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure a persistência em tempo real e em nuvem dos agendamentos da barbearia.
              </p>
            </div>
          </div>

          <button
            id="close-supabase-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="overflow-y-auto pr-1 space-y-6 flex-grow scrollbar-thin">
          
          {/* Status info banner */}
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            config.isConfigured
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
          }`}>
            {config.isConfigured ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-zinc-100">
                {config.isConfigured
                  ? 'Banco de Dados Supabase Conectado!'
                  : 'Aplicativo pronto para conexão com Supabase'}
              </p>
              <p className="text-zinc-400 leading-relaxed">
                {config.isConfigured
                  ? 'Os agendamentos, barbeiros e serviços estão sendo sincronizados diretamente com as tabelas do seu Supabase.'
                  : 'O sistema inclui armazenamento local de fallback para você testar todos os fluxos imediatamente, e permite conectar seu projeto Supabase real com facilidade abaixo.'}
              </p>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-4 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Credenciais do Projeto Supabase
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Project URL
              </label>
              <input
                id="supabase-url-input"
                type="url"
                placeholder="https://sua-url-aqui.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Anon Public Key (API Key)
              </label>
              <input
                id="supabase-key-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/50 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                id="test-supabase-btn"
                type="button"
                disabled={isTesting}
                onClick={handleTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <div className="flex items-center gap-2">
                {config.isConfigured && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Desconectar
                  </button>
                )}
                <button
                  id="save-supabase-config-btn"
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Salvar Configuração
                </button>
              </div>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-3 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/60 text-xs text-zinc-400">
            <h3 className="font-bold text-zinc-200 flex items-center justify-between">
              <span>Como configurar no Supabase (em 3 passos):</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-normal"
              >
                Abrir Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>Crie um projeto grátis no painel do Supabase.</li>
              <li>Acesse o menu <strong>SQL Editor</strong> &gt; <strong>New Query</strong> e execute o script SQL abaixo para criar as tabelas (<code className="text-amber-400">services</code>, <code className="text-amber-400">barbers</code>, <code className="text-amber-400">appointments</code>).</li>
              <li>Vá em <strong>Project Settings</strong> &gt; <strong>API</strong>, copie o <strong>Project URL</strong> e o <strong>anon public key</strong> e salve acima!</li>
            </ol>
          </div>

          {/* SQL Schema Preview with Copy and Download Buttons */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  Script SQL Completo (Tabelas + Políticas de Armazenamento):
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="download-sql-schema-btn"
                  type="button"
                  onClick={handleDownloadSql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Baixar arquivo .sql para o computador"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Baixar .sql</span>
                </button>

                <button
                  id="copy-sql-schema-btn"
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>
            </div>

            {/* Storage Policies Activated Highlights */}
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                Storage Buckets Criados: <code className="text-zinc-200">barbearia-fotos</code> e <code className="text-zinc-200">avatars</code>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Políticas de Storage (SELECT, INSERT, UPDATE, DELETE) Ativadas
              </span>
              <span className="text-zinc-600">|</span>
              <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                RLS Ativado nas Tabelas
              </span>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-60 scrollbar-thin">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
