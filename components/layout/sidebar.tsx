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
  ChevronDown,
  AlertTriangle,
  LogOut,
  Factory,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
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
        <div className="flex items-center flex-shrink-0 px-8 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 overflow-hidden bg-slate-50 border border-slate-100 p-1 shadow-sm">
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
            <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Acemark Labeling</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Print Management</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <SidebarItem key={item.name} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="px-4 mt-auto pt-6 border-t border-slate-100">
          <Link
            href="/settings"
            className="group flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors mb-2"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-600 transition-colors" />
            Sign Out
          </button>
          

        </div>
      </div>
    </div>
  );
}

function SidebarItem({ item, pathname }: { item: any; pathname: string }) {
  const hasChildren = !!item.children;
  const isActive = item.href ? pathname === item.href : item.children?.some((child: any) => pathname === child.href);
  const [isOpen, setIsOpen] = useState(isActive);

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "group w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isActive 
              ? "bg-indigo-50 text-indigo-700" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <div className="flex items-center">
            <item.icon className={cn(
              "mr-3 h-4.5 w-4.5 transition-colors",
              isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span className={cn(isActive && "font-semibold")}>
              {item.name}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {isOpen && (
          <div className="pl-11 space-y-1 mt-1">
            {item.children?.map((child: any) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    "block py-1.5 text-sm transition-colors",
                    isChildActive 
                      ? "text-indigo-600 font-semibold" 
                      : "text-slate-500 hover:text-slate-900 font-medium"
                  )}
                >
                  <div className="flex items-center">
                     {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2" />}
                     {child.name}
                  </div>
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
      className={cn(
        "group relative flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className="flex items-center">
        <item.icon className={cn(
          "mr-3 h-4.5 w-4.5 transition-colors",
          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
        )} />
        <span className={cn(isActive && "font-semibold")}>
          {item.name}
        </span>
      </div>
    </Link>
  );
}
