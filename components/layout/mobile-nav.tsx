'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  PlusCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Add', href: '/master', icon: PlusCircle },
  { name: 'History', href: '/history', icon: History },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-2xl border border-slate-100 shadow-2xl rounded-[2rem]">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative group flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110" : "text-slate-400 hover:text-slate-600 active:scale-95"
              )}
            >
              <item.icon className={cn("h-6 w-6 transition-all", isActive ? "scale-105" : "scale-100")} />
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.15em] transition-all absolute -bottom-5",
                isActive ? "opacity-100 translate-y-0 text-blue-600" : "opacity-0 translate-y-1 text-slate-400"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
