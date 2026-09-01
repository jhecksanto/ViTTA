import React from "react";
import {
  Home,
  Calendar,
  Stethoscope,
  FileText,
  Menu,
  Activity,
  DollarSign,
  Bell,
  ShieldCheck,
  Landmark,
  LayoutDashboard,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData?: any;
  user?: any;
  unreadNotifsCount?: number;
  onOpenSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  userData,
  user,
  unreadNotifsCount = 0,
  onOpenSidebar,
}) => {
  const isAdminMaster =
    userData?.role === "admin" ||
    userData?.role === "master" ||
    user?.email?.includes("admin");
  const isProfessional = userData?.role === "professional" || isAdminMaster;

  // Define tailored bottom items based on role
  const getNavItems = () => {
    if (isAdminMaster) {
      return [
        { id: "home", label: "Início", icon: Home },
        { id: "admin-dashboard", label: "Admin BI", icon: ShieldCheck },
        { id: "admin-appointments", label: "Consultas", icon: Calendar },
        { id: "admin-financial", label: "Financeiro", icon: Landmark },
        {
          id: "menu",
          label: "Menu",
          icon: Menu,
          isAction: true,
          action: onOpenSidebar,
        },
      ];
    }

    if (isProfessional) {
      return [
        { id: "home", label: "Início", icon: Home },
        { id: "professional-dashboard", label: "Clínico", icon: Activity },
        { id: "professional-finance", label: "Repasses", icon: DollarSign },
        {
          id: "notifications",
          label: "Avisos",
          icon: Bell,
          badge: unreadNotifsCount,
        },
        {
          id: "menu",
          label: "Menu",
          icon: Menu,
          isAction: true,
          action: onOpenSidebar,
        },
      ];
    }

    // Default Patient items
    return [
      { id: "home", label: "Início", icon: Home },
      { id: "appointments", label: "Consultas", icon: Calendar },
      { id: "professionals", label: "Médicos", icon: Stethoscope },
      { id: "exams", label: "Exames", icon: FileText },
      {
        id: "menu",
        label: "Mais",
        icon: Menu,
        isAction: true,
        action: onOpenSidebar,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navegação inferior mobile e PWA"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-vitta-surface/95 backdrop-blur-xl border-t border-vitta-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all duration-200"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isAction && activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => {
                if (item.isAction && item.action) {
                  item.action();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? "text-vitta-accent font-black"
                  : "text-vitta-text-muted hover:text-vitta-text-primary font-semibold"
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? "bg-vitta-accent/10 text-vitta-accent"
                      : "text-vitta-text-secondary"
                  }`}
                >
                  <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
                </div>

                {/* Notification / Alert Badge */}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-vitta-surface animate-pulse">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[10px] tracking-tight truncate max-w-full mt-0.5 ${
                  isActive
                    ? "font-black text-vitta-accent"
                    : "font-medium text-vitta-text-secondary"
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-vitta-accent rounded-full mt-0.5 shadow-sm shadow-vitta-accent/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
