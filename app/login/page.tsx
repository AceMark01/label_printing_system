'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = document.cookie.split('; ').find(row => row.startsWith('auth='));
    if (auth && auth.split('=')[1] === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (username === 'admin' && password === '123456') {
      document.cookie = "auth=true; path=/; max-age=86400";
      toast.success('Logged in');
      router.push('/dashboard');
    } else {
      toast.error('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm border border-slate-200 shadow-md bg-white rounded-xl overflow-hidden">
        <CardHeader className="pt-8 pb-4 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg mb-4 p-2 overflow-hidden transition-transform hover:scale-105">
            <img 
               src="/logo1.png" 
               alt="AceMark Logo" 
               className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Acemark Labeling</CardTitle>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Control Panel Access</p>
        </CardHeader>

        <CardContent className="px-8 pb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <Input 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 text-sm border-slate-200 focus:border-indigo-500 rounded-lg bg-slate-50/50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-sm border-slate-200 focus:border-indigo-500 rounded-lg bg-slate-50/50"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg transition-all mt-2 shadow-lg shadow-indigo-100 uppercase text-xs tracking-widest"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-slate-50/80 border-t border-slate-100 py-3 flex flex-col items-center gap-0.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Ace Labels v2.0
            </p>
            <p className="text-[8px] font-bold text-slate-400/60 uppercase tracking-tighter">
                Secure Terminal
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
