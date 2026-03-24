'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  PlusCircle, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'All Products', href: '/orders', icon: Package },
  { name: 'Add Master', href: '/master', icon: PlusCircle },
  { name: 'History', href: '/history', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 bg-white border-r border-slate-200">
      <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-8 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mr-3">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Ace Labels</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management System</p>
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
                  "group flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-400" />}
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
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 leading-tight">
              A5 Label Printing System v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
