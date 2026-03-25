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
  // { name: 'Add', href: '/master', icon: PlusCircle }, // Temporarily hidden
  { name: 'History', href: '/history', icon: History },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
      <div className="flex items-center justify-around px-2 py-3 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 px-4 rounded-xl transition-all duration-200",
                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "scale-110" : "scale-100")} />
              {isActive && (
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
