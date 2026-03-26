'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
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
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col min-h-screen print:block">
        <main className="flex-1 lg:pl-[300px] pb-24 lg:pb-16 px-4 sm:px-10 lg:px-12 pt-6 sm:pt-10 bg-slate-50/10 print:p-0 print:m-0 print:bg-white print:block">
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
