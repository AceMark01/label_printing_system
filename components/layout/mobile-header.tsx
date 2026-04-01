'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Package, 
  History, 
  PlusCircle, 
  Settings,
  AlertTriangle,
  LogOut,
  Factory,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Products', href: '/orders', icon: Package },
  { name: 'Add Master', href: '/master', icon: PlusCircle },
  { name: 'Missing Data', href: '/missing', icon: AlertTriangle },
  { name: 'History', href: '/history', icon: History },
  { 
    name: 'Production', 
    icon: Factory,
    children: [
      { name: 'All Production', href: '/production/all-products' },
      { name: 'History', href: '/production/history' },
    ]
  },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push('/login');
    setIsOpen(false);
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 p-2">
            <img 
               src="/logo1.png" 
               alt="Logo" 
               className="w-full h-full object-contain brightness-0 invert"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                   parent.innerHTML = '<span class="text-white font-black text-lg">A</span>';
                 }
               }}
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">Acemark</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Labeling</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Fullscreen Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in fade-in zoom-in duration-300 print:hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 p-2">
                   <span className="text-white font-black text-lg">A</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">Main Menu</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-3">
              {navigation.map((item) => (
                <MobileMenuItem 
                    key={item.name} 
                    item={item} 
                    pathname={pathname} 
                    onClose={() => setIsOpen(false)} 
                />
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-4 text-base font-bold text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
              >
                <Settings className="mr-4 h-6 w-6 text-slate-400" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-base font-bold text-red-600 rounded-2xl hover:bg-red-50 transition-all active:scale-95 mt-2"
              >
                <LogOut className="mr-4 h-6 w-6 text-red-400" />
                Sign Out
              </button>
            </div>
            
            <div className="mt-12 p-6 rounded-[2.5rem] bg-slate-50 flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-2">Developed by</p>
               <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                 BOTIVATE
               </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileMenuItem({ item, pathname, onClose }: { item: any; pathname: string; onClose: () => void }) {
  const hasChildren = !!item.children;
  const isActive = item.href ? pathname === item.href : item.children?.some((child: any) => pathname === child.href);
  const [isOpen, setIsOpen] = useState(isActive);

  if (hasChildren) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-5 py-4 text-base font-bold rounded-2xl transition-all",
            isActive 
              ? "bg-indigo-50 text-indigo-700 shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center">
            <item.icon className={cn(
              "mr-4 h-5.5 w-5.5",
              isActive ? "text-indigo-600" : "text-slate-400"
            )} />
            <span>{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        {isOpen && (
          <div className="pl-6 space-y-2 py-2">
            {item.children?.map((child: any) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-10 py-3 text-sm font-black transition-all rounded-xl",
                    isChildActive 
                      ? "text-indigo-600 bg-indigo-50/50" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={onClose}
      className={cn(
        "flex items-center justify-between px-5 py-4 text-base font-bold rounded-2xl transition-all active:scale-95",
        isActive 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center">
        <item.icon className={cn(
          "mr-4 h-5.5 w-5.5",
          isActive ? "text-white" : "text-slate-400"
        )} />
        <span>{item.name}</span>
      </div>
      <ChevronRight className={cn("h-5 w-5", isActive ? "text-indigo-200" : "text-slate-300")} />
    </Link>
  );
}
