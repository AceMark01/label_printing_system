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
                  "group flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 font-bold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn(
                    "mr-3 h-4.5 w-4.5 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-4 border-t border-slate-100">
          <Link
            href="/settings"
            className="group flex items-center px-4 py-3 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-all mb-2"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-600" />
            Sign Out
          </button>
          
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 leading-tight">
              A5 Label Printing System v2.0
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-tight">
              Powered by Botivate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
