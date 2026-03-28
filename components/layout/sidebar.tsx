'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  PlusCircle, 
  Settings,
  ChevronRight,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'All Products', href: '/orders', icon: Package },
  { name: 'Add Master', href: '/master', icon: PlusCircle },
  { name: 'Missing Data', href: '/missing', icon: AlertTriangle },
  { name: 'History', href: '/history', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push('/login');
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 lg:z-50 bg-white border-r border-slate-200">
      <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-8 mb-10">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-lg mr-4 p-1.5 overflow-hidden">
            <img 
               src="/logo1.png" 
               alt="AceMark Logo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 // Fallback if image missing
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                   parent.innerHTML = '<span class="text-indigo-600 font-black text-xl">A</span>';
                 }
               }}
            />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-slate-900 leading-tight">Acemark Labeling</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Print Management</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:pl-5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full animate-in fade-in slide-in-from-left-2" />
                )}
                <div className="flex items-center">
                  <item.icon className={cn(
                    "mr-3 h-4.5 w-4.5 transition-all duration-300 group-hover:scale-110",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className={cn("transition-all duration-300", isActive && "font-black tracking-tight")}>
                    {item.name}
                  </span>
                </div>
                {isActive ? (
                  <ChevronRight className="h-3.5 w-3.5 text-indigo-400 animate-in fade-in slide-in-from-right-2" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-6 border-t border-slate-100">
          <Link
            href="/settings"
            className="group flex items-center px-4 py-3 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 hover:pl-5"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:rotate-45 transition-all duration-500" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-all duration-300 hover:pl-5 mb-2"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-600 group-hover:-translate-x-1 transition-all duration-300" />
            Sign Out
          </button>
          
          <div className="mt-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden group/card shadow-inner">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover/card:scale-150 transition-transform duration-700" />
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">System</p>
            <p className="text-xs font-black text-slate-600 leading-tight">
              A5 Labeling v2.0
            </p>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/50">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                 Cloud Sync Active
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
