import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  QrCode,
  Key,
  Building2,
  Save,
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Info,
  DollarSign,
  HelpCircle,
  Eye
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import {
  PlatformPixConfig,
  DEFAULT_PLATFORM_PIX_CONFIG,
  savePlatformPixConfig,
  generatePixBrcode,
  formatPixKeyDisplay
} from '../../lib/pixUtils';
import { validatePixKey } from '../../lib/utils';

export const AdminPlatformPixConfig: React.FC = () => {
  const { addToast } = useToast();
  const [config, setConfig] = useState<PlatformPixConfig>(DEFAULT_PLATFORM_PIX_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPreviewKey, setCopiedPreviewKey] = useState(false);
  const [testAmount, setTestAmount] = useState<number>(50.0);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'system_configs', 'platform_pix'),
      (snap) => {
        if (snap.exists()) {
          setConfig({ ...DEFAULT_PLATFORM_PIX_CONFIG, ...snap.data() } as PlatformPixConfig);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Erro ao carregar chave PIX:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const validation = validatePixKey(config.key || '');

  const sampleBrcode = generatePixBrcode(
    config.key,
    config.beneficiaryName,
    config.city || 'Sao Paulo',
    testAmount > 0 ? testAmount : undefined,
    'TEST1234'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.key.trim()) {
      addToast('Informe uma chave PIX válida.', 'error');
      return;
    }

    const val = validatePixKey(config.key.trim());
    if (!val.valid) {
      addToast(val.message || 'Chave PIX inválida. Verifique os dígitos e o formato.', 'error');
      return;
    }

    if (!config.beneficiaryName.trim()) {
      addToast('Informe o nome do favorecido / razão social.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const configToSave = {
        ...config,
        key: config.key.trim(),
        keyType: val.type || config.keyType
      };
      await savePlatformPixConfig(configToSave);
      setConfig(configToSave);
      addToast('Chave PIX da Plataforma salva com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar chave PIX da plataforma:', err);
      addToast('Erro ao salvar chave PIX: ' + (err.message || 'Falha no servidor'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPreviewKey = () => {
    navigator.clipboard.writeText(config.key);
    setCopiedPreviewKey(true);
    addToast('Chave PIX copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedPreviewKey(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="text-vitta-accent animate-spin" />
        <span className="text-xs text-vitta-text-secondary font-bold">
          Carregando dados da Chave PIX institucional...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-vitta-accent/10 to-vitta-surface-2 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <QrCode size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-vitta-text-primary">
                Chave PIX Institucional de Recebimento da Plataforma
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Ativo
              </span>
            </div>
            <p className="text-xs text-vitta-text-secondary mt-0.5 max-w-2xl leading-relaxed">
              Esta chave PIX é utilizada para receber os pagamentos de faturas de taxas de intermediação efetuados pelos profissionais, além de cobranças e liquidações diretas no sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleCopyPreviewKey}
            className="px-4 py-2 bg-vitta-surface hover:bg-vitta-surface-2 text-vitta-text-primary border border-vitta-border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            {copiedPreviewKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedPreviewKey ? 'Chave Copiada' : 'Copiar Chave'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Configuração */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm space-y-5">
          <div className="border-b border-vitta-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={18} className="text-vitta-accent" />
              <h4 className="font-bold text-sm text-vitta-text-primary">
                Dados Bancários e Chave PIX
              </h4>
            </div>
            <span className="text-[11px] text-vitta-text-muted">
              Campos com * são obrigatórios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Chave */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-primary block">
                Tipo de Chave PIX *
              </label>
              <select
                value={config.keyType}
                onChange={(e) => setConfig({ ...config, keyType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20 cursor-pointer"
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone / Celular</option>
                <option value="evp">Chave Aleatória (EVP / UUID)</option>
              </select>
            </div>

            {/* Chave PIX */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-primary block">
                Chave PIX *
              </label>
              <input
                type="text"
                required
                value={config.key}
                onChange={(e) => setConfig({ ...config, key: e.target.value })}
                placeholder={
                  config.keyType === 'cnpj'
                    ? '00.000.000/0001-00'
                    : config.keyType === 'email'
                    ? 'financeiro@vittasaude.com.br'
                    : config.keyType === 'phone'
                    ? '(28) 99999-9999'
                    : 'Chave PIX'
                }
                className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-mono font-bold text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
              />
              {config.key && !validation.valid && (
                <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{validation.message || 'Formato de chave requer atenção'}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome do Favorecido / Razão Social */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-primary block">
                Razão Social / Nome do Favorecido *
              </label>
              <input
                type="text"
                required
                value={config.beneficiaryName}
                onChange={(e) => setConfig({ ...config, beneficiaryName: e.target.value })}
                placeholder="Ex: ViTTA Saúde & Benefícios LTDA"
                className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
              />
            </div>

            {/* Banco / Instituição Financeira */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-primary block">
                Instituição Financeira / Banco *
              </label>
              <input
                type="text"
                required
                value={config.bankName}
                onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                placeholder="Ex: Banco Cora SCD (403)"
                className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cidade da Conta (Padrão EMV BACEN) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-primary block">
                Cidade da Conta Bancária (Padrão EMV BACEN)
              </label>
              <input
                type="text"
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="Ex: São Paulo"
                className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-medium text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
              />
            </div>

            {/* Status Ativo */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl cursor-pointer hover:bg-vitta-surface-3 transition-colors">
                <input
                  type="checkbox"
                  checked={config.active}
                  onChange={(e) => setConfig({ ...config, active: e.target.checked })}
                  className="w-4 h-4 rounded text-vitta-accent accent-vitta-accent"
                />
                <span className="text-xs font-bold text-vitta-text-primary">
                  Habilitar chave PIX para recebimentos no sistema
                </span>
              </label>
            </div>
          </div>

          {/* Instruções de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-vitta-text-primary block">
              Instruções Adicionais Exibidas aos Usuários
            </label>
            <textarea
              rows={3}
              value={config.instructions || ''}
              onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
              placeholder="Instruções para exibição aos usuários durante o pagamento..."
              className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{isSaving ? 'Salvando...' : 'Salvar Configuração PIX'}</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vitta-border pb-3">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-vitta-accent" />
              <h4 className="font-bold text-sm text-vitta-text-primary">
                Visualização ao Usuário
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-vitta-surface-2 text-vitta-text-muted border border-vitta-border">
              Preview Real
            </span>
          </div>

          <p className="text-xs text-vitta-text-secondary leading-relaxed">
            É assim que os profissionais e usuários visualizam a chave PIX da plataforma ao clicar em <strong>"Pagar Fatura"</strong> no painel médico.
          </p>

          <div className="p-4 bg-gradient-to-br from-emerald-500/5 via-vitta-surface-2 to-vitta-surface border border-emerald-500/20 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-600" />
                <span className="text-xs font-black text-vitta-text-primary">
                  ViTTA Saúde - Pagamento PIX
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {config.keyType.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-vitta-text-muted">Favorecido:</span>
                <span className="font-bold text-vitta-text-primary truncate max-w-[200px]">
                  {config.beneficiaryName || 'ViTTA Saúde LTDA'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-vitta-text-muted">Instituição:</span>
                <span className="font-bold text-vitta-text-primary">
                  {config.bankName || 'Banco Cora SCD'}
                </span>
              </div>
            </div>

            {/* Chave com botão copiar */}
            <div className="p-2.5 bg-vitta-surface border border-vitta-border rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-vitta-text-primary truncate select-all">
                {formatPixKeyDisplay(config.key, config.keyType) || 'chave-pix@vitta.club'}
              </span>
              <button
                type="button"
                onClick={handleCopyPreviewKey}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copiar Chave"
              >
                {copiedPreviewKey ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>

            {/* QR Code de Amostra */}
            <div className="flex items-center gap-3 pt-2 border-t border-vitta-border/60">
              <div className="w-20 h-20 bg-white p-1.5 rounded-xl border border-vitta-border shrink-0 shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(sampleBrcode)}`}
                  alt="QR Code PIX Amostra"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-[11px] text-vitta-text-secondary space-y-1">
                <span className="font-bold text-vitta-text-primary block">
                  QR Code Dinâmico EMV
                </span>
                <p className="text-[10px] text-vitta-text-muted">
                  Gera automaticamente o código copia e cola com o valor exato da fatura a ser liquidada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
