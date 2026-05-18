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
  ChevronDown,
  FileText
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
  { 
    name: 'Invoice', 
    icon: FileText,
    children: [
      { name: 'Invoice', href: '/invoice/invoice' },
      { name: 'History', href: '/invoice/history' },
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
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100 p-0.5 shadow-sm">
            <img 
               src="/logo1.png" 
               alt="Logo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                   parent.innerHTML = '<span class="text-indigo-600 font-black text-lg">A</span>';
                 }
               }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Acemark</h1>
            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Labeling</p>
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
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center p-1.5">
                   <span className="text-white font-bold text-lg">A</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Main Menu</h2>
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

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
              >
                <Settings className="mr-3 h-5 w-5 text-slate-400" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-400" />
                Sign Out
              </button>
            </div>
            
            <div className="mt-8 p-4 rounded-md bg-slate-50 flex flex-col items-center">
               <p className="text-[10px] font-medium text-slate-400 tracking-[0.2em] uppercase mb-1">Developed by</p>
               <span className="text-xs font-semibold text-slate-500">
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
            "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors",
            isActive 
              ? "bg-indigo-50 text-indigo-700" 
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center">
            <item.icon className={cn(
              "mr-3 h-5 w-5",
              isActive ? "text-indigo-600" : "text-slate-400"
            )} />
            <span>{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="pl-6 space-y-1 py-1">
            {item.children?.map((child: any) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-6 py-2.5 text-sm transition-colors rounded-md",
                    isChildActive 
                      ? "text-indigo-600 font-semibold bg-indigo-50/50" 
                      : "text-slate-500 font-medium hover:text-slate-900"
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
        "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center">
        <item.icon className={cn(
          "mr-3 h-5 w-5",
          isActive ? "text-indigo-600" : "text-slate-400"
        )} />
        <span className={cn(isActive && "font-semibold")}>{item.name}</span>
      </div>
      <ChevronRight className={cn("h-4 w-4", isActive ? "text-indigo-400" : "text-slate-300")} />
    </Link>
  );
}
