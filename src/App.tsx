import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Tag, 
  Settings, 
  Bell, 
  Search, 
  ChevronRight, 
  Heart, 
  Moon, 
  Footprints, 
  Droplets,
  Star,
  Clock,
  MapPin,
  Menu,
  X,
  FileText,
  Download,
  Filter,
  Plus,
  ShieldCheck,
  UserCog,
  CreditCard,
  Wallet,
  Ticket,
  Stethoscope,
  Radio,
  MessageSquare,
  User,
  HelpCircle,
  LayoutGrid,
  Sun,
  Trash2,
  Edit,
  Store,
  ChevronDown,
  Lock,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_APPOINTMENTS, MOCK_STATS, MOCK_OFFERS, MOCK_PROFESSIONALS, MOCK_EXAMS, MOCK_PARTNERS, MOCK_CATEGORIES } from './constants';

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard = ({ stat }: any) => {
  const Icon = {
    Footprints,
    Moon,
    Heart,
    Droplets
  }[stat.icon] as any;

  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  }[stat.color as keyof typeof colors];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colors}`}>
          <Icon size={22} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          stat.change > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          {stat.change > 0 ? '+' : ''}{stat.change}%
        </span>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
          <span className="text-slate-400 dark:text-slate-500 text-xs">{stat.unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

const AdminView = () => {
  const [subTab, setSubTab] = useState<'overview' | 'users' | 'config'>('overview');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 dark:text-white">Painel Administrativo</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão centralizada do ecossistema ViTTA</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            subTab === 'overview' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={18} />
          Visão Geral
        </button>
        <button 
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            subTab === 'users' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users size={18} />
          Usuários
        </button>
        <button 
          onClick={() => setSubTab('config')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            subTab === 'config' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <UserCog size={18} />
          Configurações
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === 'overview' && (
            <div className="space-y-10">
              {/* Welcome Section */}
              <section>
                <h2 className="text-2xl font-bold mb-2 dark:text-white">Olá, Administrador! 👋</h2>
                <p className="text-slate-500 dark:text-slate-400">Aqui está o resumo do sistema hoje.</p>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_STATS.map((stat, idx) => (
                  <StatCard key={idx} stat={stat} />
                ))}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Appointments Section */}
                <section className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold dark:text-white">Próximas Consultas</h2>
                    <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Ver todas</button>
                  </div>
                  <div className="space-y-4">
                    {MOCK_APPOINTMENTS.map((apt) => (
                      <motion.div 
                        key={apt.id}
                        whileHover={{ x: 4 }}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4"
                      >
                        <img src={apt.imageUrl} alt={apt.professionalName} className="w-14 h-14 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{apt.professionalName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{apt.specialty}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium text-sm mb-1">
                            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                            {new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs justify-end">
                            <Clock size={14} />
                            {apt.time}
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      </motion.div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2">
                      <Calendar size={18} />
                      Agendar nova consulta
                    </button>
                  </div>
                </section>

                {/* Quick Professionals Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold dark:text-white">Profissionais</h2>
                    <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Explorar</button>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {MOCK_PROFESSIONALS.map((prof, idx) => (
                      <div key={prof.id} className={`p-4 flex items-center gap-3 ${idx !== MOCK_PROFESSIONALS.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                        <img src={prof.imageUrl} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate dark:text-white">{prof.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{prof.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold">{prof.rating}</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
                      <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                        Ver todos profissionais
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Offers Section */}
              <section className="space-y-6 pb-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">Benefícios Exclusivos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ofertas de parceiros selecionados para você.</p>
                  </div>
                  <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Ver todos</button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 lg:-mx-10 lg:px-10">
                  {MOCK_OFFERS.map((offer) => (
                    <motion.div 
                      key={offer.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="relative h-40">
                        <img src={offer.imageUrl} alt={offer.partnerName} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {offer.category}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {offer.discount}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-1 dark:text-white">{offer.partnerName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{offer.description}</p>
                        <button className="w-full py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white">
                          Resgatar Benefício
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          )}
          {subTab === 'users' && <UsersView />}
          {subTab === 'config' && <UserConfigView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ExamsView = () => (
  <div className="space-y-8">
    <section>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">Meus Exames</h1>
      <p className="text-slate-500 dark:text-slate-400">Acompanhe seus resultados e histórico de exames.</p>
    </section>

    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">Todos</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Prontos</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Pendentes</button>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <Filter size={16} />
        Filtrar
      </button>
    </div>

    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exame</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {MOCK_EXAMS.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <span className="font-bold text-sm dark:text-white">{exam.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(exam.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {exam.location}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    exam.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    exam.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {exam.status === 'ready' ? 'Pronto' :
                     exam.status === 'pending' ? 'Pendente' : 'Agendado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {exam.status === 'ready' ? (
                    <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-sm flex items-center gap-1 ml-auto transition-colors">
                      <Download size={16} />
                      Baixar
                    </button>
                  ) : (
                    <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm transition-colors">
                      Detalhes
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ProfessionalsView = () => (
  <div className="space-y-8">
    <section>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">Nossos Profissionais</h1>
      <p className="text-slate-500 dark:text-slate-400">Encontre os melhores especialistas para cuidar de você.</p>
    </section>

    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou especialidade..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
        />
      </div>
      <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium whitespace-nowrap">Todos</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Psicologia</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Nutrição</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Cardiologia</button>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {MOCK_PROFESSIONALS.map((prof) => (
        <motion.div 
          key={prof.id}
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-4">
            <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-2xl object-cover" />
            <div>
              <h3 className="font-bold text-lg dark:text-white">{prof.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{prof.specialty}</p>
              <div className="flex items-center gap-1 text-amber-500 mt-1">
                <Star size={14} fill="currentColor" />
                <span className="text-xs font-bold">{prof.rating} ({prof.reviews} avaliações)</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Disponibilidade</p>
            <div className="flex gap-2">
              {prof.availability.map((day) => (
                <span key={day} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold">
                  {day}
                </span>
              ))}
            </div>
          </div>
          <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
            Agendar Consulta
          </button>
        </motion.div>
      ))}
    </div>
  </div>
);

const OffersView = () => (
  <div className="space-y-8">
    <section>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">Benefícios e Ofertas</h1>
      <p className="text-slate-500 dark:text-slate-400">Aproveite descontos exclusivos em nossa rede de parceiros.</p>
    </section>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {MOCK_OFFERS.map((offer) => (
        <motion.div 
          key={offer.id}
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="relative h-48">
            <img src={offer.imageUrl} alt={offer.partnerName} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
              {offer.category}
            </div>
            <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
              {offer.discount}
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="font-bold text-xl mb-2 dark:text-white">{offer.partnerName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">{offer.description}</p>
            <button className="w-full py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors">
              Resgatar Cupom
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const SettingsView = ({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void }) => (
  <div className="max-w-2xl space-y-8">
    <section>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">Configurações</h1>
      <p className="text-slate-500 dark:text-slate-400">Gerencie sua conta e preferências.</p>
    </section>

    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg font-bold border-b border-slate-50 dark:border-slate-800 pb-4 dark:text-white">Perfil</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src="https://picsum.photos/seed/user/200/200" alt="Profile" className="w-24 h-24 rounded-2xl object-cover" />
            <button className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nome</label>
                <input type="text" defaultValue="João Silva" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">E-mail</label>
                <input type="email" defaultValue="joao.silva@email.com" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm dark:text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg font-bold border-b border-slate-50 dark:border-slate-800 pb-4 dark:text-white">Preferências</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm dark:text-white">Notificações por E-mail</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receba lembretes de consultas e novas ofertas.</p>
            </div>
            <div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm dark:text-white">Modo Escuro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ajuste a interface para ambientes com pouca luz.</p>
            </div>
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <motion.div 
                animate={{ x: isDarkMode ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <button className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
        Sair da Conta
      </button>
    </div>
  </div>
);

const PartnershipsView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'establishments' | 'categories'>('establishments');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerenciar Convênios</h1>
          <p className="text-slate-500 dark:text-slate-400">Cadastre e gerencie estabelecimentos conveniados</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
          <Plus size={20} />
          Novo Estabelecimento
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveSubTab('establishments')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'establishments' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Store size={18} />
          Estabelecimentos ({MOCK_PARTNERS.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'categories' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={18} />
          Categorias ({MOCK_CATEGORIES.length})
        </button>
      </div>

      {activeSubTab === 'establishments' ? (
        <>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar estabelecimento..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
            <div className="relative w-full md:w-64">
              <select className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white">
                <option>Todas as Categorias</option>
                {MOCK_CATEGORIES.slice(0, 4).map(cat => (
                  <option key={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PARTNERS.map((partner) => (
              <motion.div 
                key={partner.id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <img src={partner.imageUrl} alt={partner.name} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Ativo
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{partner.name}</h3>
                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg mt-1">
                      {partner.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-bold">Desconto:</span> {partner.discount}
                    </p>
                    {partner.phone && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-bold">Telefone:</span> {partner.phone}
                      </p>
                    )}
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-bold">Endereço:</span> {partner.address}
                    </p>
                    {partner.description && (
                      <p className="text-slate-500 dark:text-slate-400 italic text-xs">
                        {partner.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Edit size={16} />
                      Editar
                    </button>
                    <button className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MOCK_CATEGORIES.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{category.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{category.count} estabelecimentos</p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg">
                {category.slug}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const SupportView = () => {
  const faqs = [
    { question: "O ViTTA cobra alguma taxa dos usuários?", answer: "Não, o ViTTA é um benefício gratuito para afiliados de empresas parceiras." },
    { question: "Como cancelo um agendamento?", answer: "Você pode cancelar seus agendamentos diretamente na aba 'Agendamentos' com até 24h de antecedência." },
    { question: "Onde vejo meus descontos?", answer: "Todos os descontos disponíveis estão na aba 'Convênios' e 'Ofertas'." },
    { question: "Como atualizar meus dados?", answer: "Acesse a aba 'Perfil' para editar suas informações pessoais e de contato." }
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00b894] via-[#00cec9] to-[#0984e3] rounded-[2.5rem] p-10 md:p-20 text-center text-white shadow-2xl shadow-emerald-500/20">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
            <HelpCircle size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Central de Suporte ViTTA</h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto">
              Aproveite ao máximo todas as vantagens de ser um afiliado ViTTA
            </p>
          </div>
          <button className="flex items-center gap-3 px-10 py-5 bg-white text-[#00b894] rounded-2xl font-bold shadow-xl hover:bg-emerald-50 transition-all transform hover:scale-105 active:scale-95 group">
            <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
            Iniciar Chat de Suporte
          </button>
        </div>
        
        {/* Decorative elements to match the "blobs" in the image */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl"></div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: Heart, 
            title: "Saúde Integrada", 
            desc: "Acesso a profissionais qualificados em diversas especialidades", 
            color: "bg-gradient-to-br from-emerald-400 to-teal-500",
            shadow: "shadow-emerald-200 dark:shadow-emerald-900/20"
          },
          { 
            icon: Tag, 
            title: "Descontos Exclusivos", 
            desc: "Cupons e ofertas especiais dos nossos parceiros", 
            color: "bg-gradient-to-br from-purple-400 to-indigo-500",
            shadow: "shadow-purple-200 dark:shadow-purple-900/20"
          },
          { 
            icon: Wallet, 
            title: "Carteira Digital", 
            desc: "Gerencie seus créditos e pagamentos com facilidade", 
            color: "bg-gradient-to-br from-orange-400 to-rose-500",
            shadow: "shadow-orange-200 dark:shadow-orange-900/20"
          }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -8 }}
            className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-5"
          >
            <div className={`w-16 h-16 ${item.color} rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg ${item.shadow}`}>
              <item.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8 pt-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white px-4">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <summary className="flex items-center justify-between p-7 cursor-pointer list-none">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{faq.question}</span>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-open:bg-blue-50 dark:group-open:bg-blue-500/10 transition-colors">
                  <ChevronDown size={20} className="text-slate-400 group-open:text-blue-500 group-open:rotate-180 transition-all" />
                </div>
              </summary>
              <div className="px-7 pb-7 text-slate-600 dark:text-slate-400 text-base leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-6">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Developer Footer */}
      <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 text-center space-y-2 border border-slate-800">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
          <Code size={18} className="text-blue-400" />
          <span>Sistema PowerControl - Versão 1.0</span>
        </div>
        <p className="text-slate-500 text-[10px]">
          © 2026 ViTTA. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

const UsersView = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold dark:text-white">Gestão de Usuários</h2>
      <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
        <Plus size={18} />
        Novo Usuário
      </button>
    </div>
    
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plano</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { name: 'João Silva', email: 'joao@email.com', status: 'Ativo', plan: 'Premium', img: 'https://picsum.photos/seed/u1/100/100' },
            { name: 'Maria Santos', email: 'maria@email.com', status: 'Ativo', plan: 'Básico', img: 'https://picsum.photos/seed/u2/100/100' },
            { name: 'Pedro Costa', email: 'pedro@email.com', status: 'Inativo', plan: 'Premium', img: 'https://picsum.photos/seed/u3/100/100' },
          ].map((user, i) => (
            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={user.img} className="w-10 h-10 rounded-full object-cover" alt="" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  user.status === 'Ativo' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{user.plan}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={16} /></button>
                  <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const UserConfigView = () => {
  return (
    <div className="space-y-10">
      {/* Hero Section - Following Support Model */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl shadow-blue-500/20">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <UserCog size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Configurações de Usuário</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Gerencie permissões, acessos e preferências do sistema
          </p>
          <button className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95">
            <ShieldCheck size={20} />
            Verificar Permissões
          </button>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </div>

      {/* Config Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Access Levels */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Níveis de Acesso</h3>
          </div>
          <div className="space-y-4">
            {[
              { role: 'Administrador', desc: 'Acesso total ao sistema e configurações' },
              { role: 'Moderador', desc: 'Gerenciamento de usuários e conteúdos' },
              { role: 'Usuário Padrão', desc: 'Acesso às funcionalidades básicas' }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm dark:text-white">{item.role}</span>
                  <button className="text-xs font-bold text-blue-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Configurar</button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Preferences */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Preferências Globais</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Auto-aprovação</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Novos usuários são aprovados automaticamente</p>
              </div>
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Logs de Auditoria</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Registrar todas as ações administrativas</p>
              </div>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Manutenção</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ativar modo de manutenção do sistema</p>
              </div>
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Segurança</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold dark:text-white mb-1">Autenticação em Duas Etapas (2FA)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Obrigatório para administradores</p>
              <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold">Gerenciar</button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold dark:text-white mb-1">Política de Senhas</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 8 caracteres, letras e números</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl">
              <Bell size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Notificações</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium dark:text-slate-300">Alertas de novos usuários</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium dark:text-slate-300">Relatórios semanais</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold dark:text-white">{title}</h1>
    <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
        <LayoutGrid size={48} />
      </div>
      <div>
        <h3 className="text-xl font-bold dark:text-white">Página em Desenvolvimento</h3>
        <p className="text-slate-500 dark:text-slate-400">Estamos trabalhando para trazer o melhor conteúdo de {title} para você.</p>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminView />;
      case 'professionals': return <ProfessionalsView />;
      case 'appointments': return <PlaceholderView title="Agendamentos" />;
      case 'plans': return <PartnershipsView />;
      case 'wallets': return <PlaceholderView title="Carteiras" />;
      case 'voucher': return <PlaceholderView title="Compra Voucher" />;
      case 'pharmacies': return <PlaceholderView title="Farmácias de Plantão" />;
      case 'radio': return <PlaceholderView title="Rádio ViTTA" />;
      case 'chat': return <PlaceholderView title="Chat Suporte" />;
      case 'profile': return <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      case 'support': return <SupportView />;
      case 'exams': return <ExamsView />;
      case 'offers': return <OffersView />;
      default: return <AdminView />;
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ViTTA</h2>
                <p className="text-xs font-medium text-slate-400">Admin</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navegação</p>
              <nav className="space-y-1">
                <SidebarItem 
                  icon={LayoutGrid} 
                  label="Painel Admin" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')} 
                />
                <SidebarItem 
                  icon={Users} 
                  label="Profissionais" 
                  active={activeTab === 'professionals'} 
                  onClick={() => setActiveTab('professionals')} 
                />
                <SidebarItem 
                  icon={Clock} 
                  label="Agendamentos" 
                  active={activeTab === 'appointments'} 
                  onClick={() => setActiveTab('appointments')} 
                />
                <SidebarItem 
                  icon={ShieldCheck} 
                  label="Convênios" 
                  active={activeTab === 'plans'} 
                  onClick={() => setActiveTab('plans')} 
                />
                <SidebarItem 
                  icon={Wallet} 
                  label="Carteiras" 
                  active={activeTab === 'wallets'} 
                  onClick={() => setActiveTab('wallets')} 
                />
                <SidebarItem 
                  icon={CreditCard} 
                  label="Compra Voucher" 
                  active={activeTab === 'voucher'} 
                  onClick={() => setActiveTab('voucher')} 
                />
                <SidebarItem 
                  icon={Stethoscope} 
                  label="Farmácias de Plantão" 
                  active={activeTab === 'pharmacies'} 
                  onClick={() => setActiveTab('pharmacies')} 
                />
                <SidebarItem 
                  icon={Radio} 
                  label="Rádio ViTTA" 
                  active={activeTab === 'radio'} 
                  onClick={() => setActiveTab('radio')} 
                />
                <SidebarItem 
                  icon={MessageSquare} 
                  label="Chat Suporte" 
                  active={activeTab === 'chat'} 
                  onClick={() => setActiveTab('chat')} 
                />
                <SidebarItem 
                  icon={User} 
                  label="Perfil" 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
                />
                <SidebarItem 
                  icon={HelpCircle} 
                  label="Suporte" 
                  active={activeTab === 'support'} 
                  onClick={() => setActiveTab('support')} 
                />
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                J
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Jheck Santo Guimarães</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">networktotal@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg dark:text-white"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar exames, médicos..." 
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold dark:text-white">João Silva</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Membro Premium</p>
              </div>
              <img 
                src="https://picsum.photos/seed/user/100/100" 
                alt="Profile" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
