import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Bell, Zap } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message: string) => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => remove(id), 5000);
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, remove }}>
      {children}
      {/* Premium Notification Container */}
      <div className="fixed top-10 right-10 z-[9999] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto flex items-start gap-4 p-6 rounded-[1.8rem] border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-10 fade-in duration-500 overflow-hidden relative group ${
              n.type === 'success' ? 'bg-white/90 border-emerald-100 text-slate-900 shadow-emerald-500/5' :
              n.type === 'error' ? 'bg-white/90 border-rose-100 text-slate-900 shadow-rose-500/5' :
              n.type === 'warning' ? 'bg-white/90 border-amber-100 text-slate-900 shadow-amber-500/5' :
              'bg-white/90 border-indigo-100 text-slate-900 shadow-indigo-500/5'
            }`}
          >
            {/* Decoration line */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              n.type === 'success' ? 'bg-emerald-500' :
              n.type === 'error' ? 'bg-rose-500' :
              n.type === 'warning' ? 'bg-amber-500' :
              'bg-indigo-500'
            }`}></div>

            <div className={`shrink-0 p-2.5 rounded-xl ${
               n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
               n.type === 'error' ? 'bg-rose-50 text-rose-600' :
               n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
               'bg-indigo-50 text-indigo-600'
            }`}>
              {n.type === 'success' && <CheckCircle2 size={20} />}
              {n.type === 'error' && <AlertCircle size={20} />}
              {n.type === 'warning' && <Bell size={20} />}
              {n.type === 'info' && <Info size={20} />}
            </div>
            
            <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                 {n.title}
                 {n.type === 'success' && <Zap size={10} className="text-emerald-500" />}
              </h4>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">{n.message}</p>
            </div>

            <button 
              onClick={() => remove(n.id)} 
              className="shrink-0 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within a NotificationProvider');
  return context;
};
