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
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 lg:hidden">
      <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
