import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10">
                <AlertCircle size={48} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Ops! Algo deu errado.
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Não se preocupe, estamos cuidando disso. Tente recarregar a página para continuar.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-left overflow-hidden">
                <p className="text-xs font-mono text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Detalhes do Erro</p>
                <p className="text-sm font-mono text-rose-500 dark:text-rose-400 break-words">
                  {error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
            >
              <RefreshCw size={20} />
              Recarregar Página
            </button>
            
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
