'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  AlertCircle,
  PlusCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Add', href: '/master', icon: PlusCircle },
  { name: 'Missing', href: '/missing', icon: AlertCircle },
  { name: 'History', href: '/history', icon: History },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm px-4">
      {/* Background with Cut-out Notch */}
      <div className="absolute inset-x-4 top-1 bottom-0 bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/80" />
      
      {/* The Central Action Notch (Visual only) */}
      <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-[72px] h-[36px] bg-white/70 backdrop-blur-3xl border-t border-l border-r border-white/80 rounded-t-full" />

      <div className="relative flex items-center justify-between px-8 py-3 h-[72px]">
        {navigation.map((item, idx) => {
          const isActive = pathname === item.href;
          const isAdd = item.name === 'Add';
          
          if (isAdd) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-8 flex flex-col items-center justify-center z-10"
              >
                <div className="w-[60px] h-[60px] bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-100 border-4 border-white active:scale-90 transition-all duration-500">
                  <item.icon className="h-7 w-7" strokeWidth={2.5} />
                </div>
                {isActive && (
                  <div className="absolute -bottom-10 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center group py-2 transition-all duration-500",
                isActive ? "text-indigo-600 scale-125" : "text-slate-300 hover:text-slate-400"
              )}
            >
              <item.icon className={cn("h-6 w-6 transition-all duration-500", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
              
              {isActive && (
                <div className="absolute -bottom-3 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-in zoom-in duration-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
