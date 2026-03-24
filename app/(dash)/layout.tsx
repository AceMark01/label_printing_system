'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col min-h-screen print:block">
        <main className="flex-1 lg:pl-72 pb-24 lg:pb-12 px-4 sm:px-8 lg:px-14 pt-4 sm:pt-8 bg-slate-50/10 print:p-0 print:m-0 print:bg-white print:block">
          <div className="max-w-[1920px] mx-auto w-full print:max-w-none print:m-0 print:block">
            {children}
          </div>
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
      <Toaster position="top-center" expand={true} richColors className="print:hidden" />
    </div>
  );
}
