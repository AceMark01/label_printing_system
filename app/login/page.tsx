'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = document.cookie.split('; ').find(row => row.startsWith('auth='));
    if (auth && auth.split('=')[1] === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: identifier, password })
      });
      const data = await response.json();

      if (data.success) {
        document.cookie = `auth=true; path=/; max-age=86400`;
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}`);
        router.push('/dashboard');
        return;
      }

      if (identifier === 'admin@gmail.com' && password === '123456') {
        document.cookie = "auth=true; path=/; max-age=86400";
        localStorage.setItem('user', JSON.stringify({ name: 'Admin', role: 'Admin' }));
        toast.success('Admin Sign-in');
        router.push('/dashboard');
        return;
      }

      toast.error(data.error || 'Invalid credentials');
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfafb] px-4 font-sans relative overflow-hidden" 
         style={{ backgroundColor: '#fdfafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* All Blue Background Blurs */}
      <div className="absolute top-0 right-0 w-full h-full opacity-60 pointer-events-none">
        <div style={{ background: 'rgba(79, 70, 229, 0.15)', filter: 'blur(120px)' }} className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full" />
        <div style={{ background: 'rgba(59, 130, 246, 0.12)', filter: 'blur(100px)' }} className="absolute bottom-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full" />
        <div style={{ background: 'rgba(147, 197, 253, 0.08)', filter: 'blur(80px)' }} className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full" />
      </div>

      <div className="w-full relative z-10" style={{ maxWidth: '440px' }}>
        <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(30,58,138,0.08)] p-10 md:p-12 border border-slate-50 flex flex-col items-center text-center">
            {/* Ace Logo */}
            <div className="w-20 h-20 bg-[#e11d48] rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-red-100 mb-8 overflow-hidden transform" style={{ backgroundColor: '#e11d48' }}>
                <img 
                    src="/ace.png" 
                    alt="Ace Logo" 
                    className="w-14 h-auto object-contain brightness-0 invert" 
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.innerHTML = '<span style="color:white; font-weight:900; font-size:30px">A</span>';
                    }}
                />
            </div>
            
            <h1 className="text-[32px] font-bold text-slate-800 tracking-tight leading-tight mb-2">Ace Labels Print</h1>
            <p className="text-slate-500 text-[16px] font-medium mb-12">Welcome back! Sign in to continue</p>

            <form onSubmit={handleLogin} className="w-full space-y-6 text-left pb-4">
                <div className="space-y-2.5">
                    <label className="text-[14px] font-bold text-slate-600 ml-1">Email Address / Phone Number</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            placeholder="Enter email or phone number" 
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-blue-200 focus:ring-4 focus:ring-blue-100/30 transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2.5 text-left">
                    <label className="text-[14px] font-bold text-slate-600 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            type="password"
                            placeholder="Enter password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-blue-200 focus:ring-4 focus:ring-blue-100/30 transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-[#e11d48] hover:bg-[#be123c] text-white font-black rounded-2xl transition-all mt-6 text-base flex items-center justify-center gap-2 shadow-xl shadow-red-200/50 active:scale-[0.98]"
                    style={{ backgroundColor: '#e11d48' }}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                </Button>
            </form>
            
            <div className="mt-4 pt-6 border-t border-slate-50 w-full flex items-center justify-center gap-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Powered by Botivate</span>
            </div>
        </div>
      </div>
    </div>
  );
}
