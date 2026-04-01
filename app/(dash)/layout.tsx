'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const auth = document.cookie.split('; ').find(row => row.startsWith('auth='));
    if (!auth || auth.split('=')[1] !== 'true') {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return null; // Prevent flash of protected content
  return (
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white flex flex-col">
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen print:block">
        <MobileHeader />
        <main className="flex-1 lg:pl-[300px] pb-40 lg:pb-32 px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 bg-slate-50/10 print:p-0 print:m-0 print:bg-white print:block">
          <div className="max-w-[1920px] mx-auto w-full print:max-w-none print:m-0 print:block">
            {children}
          </div>
        </main>
      </div>

      {/* Desktop Footer - Hidden on Mobile */}
      <footer className="print:hidden hidden lg:block fixed bottom-0 left-[300px] right-0 py-2 text-center z-40 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by</span>
            <span className="text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 tracking-wider">BOTIVATE</span>
          </div>
      </footer>

      <div className="print:hidden lg:hidden flex flex-col items-center">
        <MobileNav />
        {/* Mobile Footer Patti - Floating and Slim */}
        <div className="fixed bottom-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-pulse" />
        <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 z-50 px-5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-100/50 shadow-sm flex items-center justify-center gap-2">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Powered by</span>
           <span className="text-[10px] font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 tracking-[0.3em] animate-pulse">
             BOTIVATE
           </span>
        </div>
      </div>

      <Toaster position="top-center" expand={true} richColors className="print:hidden" />
    </div>
  );
}
