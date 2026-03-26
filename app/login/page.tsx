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
        <CardHeader className="pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg mb-6 p-2 overflow-hidden">
            <img 
               src="/logo1.png" 
               alt="AceMark Logo" 
               className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Acemark Labeling</CardTitle>
          <p className="text-slate-500 text-sm mt-1">Please enter your credentials</p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Username</label>
              <Input 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-slate-200 focus:border-indigo-500 rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-slate-200 focus:border-indigo-500 rounded-lg"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Log In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex flex-col items-center gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ace Labels v2.0
            </p>
            <p className="text-[9px] font-medium text-slate-400/80 uppercase tracking-tighter">
                Powered by Botivate
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
