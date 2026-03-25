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
  // { name: 'Add Master', href: '/master', icon: PlusCircle }, // Temporarily hidden
  { name: 'History', href: '/history', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 bg-white border-r border-slate-200">
      <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-8 mb-10">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100 mr-3">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Ace Labels</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management Portal v2</p>
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
