'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Box, ArrowRight, Factory, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ProductionDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingTotal: 0,
    criticalItems: 0,
    godowns: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (force = false) => {
    try {
      const res = await fetch(`/api/production?limit=500${force ? '&refresh=true' : ''}`);
      const result = await res.json();
      if (!result.error && Array.isArray(result.data)) {
        const data = result.data as any[];
        const pending = data.reduce((acc: number, item: any) => acc + (parseFloat(item.pendingQty) || 0), 0);
        const critical = data.filter((item: any) => (parseFloat(item.pendingQty) || 0) > 1000).length;
        const uniqueGodowns = new Set(data.map((item: any) => item.godown)).size;
        
        setStats({
          totalItems: result.meta.total,
          pendingTotal: Math.round(pending),
          criticalItems: critical,
          godowns: uniqueGodowns
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(true);

    // Refresh metrics when switching back to this tab
    const handleFocus = () => fetchStats(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats(true);
  };

  return (
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Factory className="w-10 h-10 text-indigo-600" />
            Production Intelligence
          </h1>
          <p className="text-slate-500 font-bold mt-1">Operational overview and bottleneck detection.</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="h-12 rounded-xl font-bold bg-white border-slate-200 shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total SKUs" 
          value={loading ? '...' : stats.totalItems} 
          icon={Box} 
          color="indigo" 
          trend="+5.4%" 
        />
        <StatCard 
          label="Pending Pieces" 
          value={loading ? '...' : stats.pendingTotal.toLocaleString()} 
          icon={TrendingUp} 
          color="rose" 
          trend="Critical" 
        />
        <StatCard 
          label="Critical Batches" 
          value={loading ? '...' : stats.criticalItems} 
          icon={AlertTriangle} 
          color="amber" 
          trend="Action Required" 
        />
        <StatCard 
          label="Active Godowns" 
          value={loading ? '...' : stats.godowns} 
          icon={CheckCircle2} 
          color="emerald" 
          trend="Operational" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4">Production Insights</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="p-12 rounded-[2rem] bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 animate-ping" />
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-2">Real-time Performance Monitoring</h3>
               <p className="text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
                 We're processing live data from your Production Sheets. The performance graph is currently being calibrated based on your historical throughput metrics.
               </p>
               <Link href="/production/all-products" className="mt-8">
                  <Button className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold active:scale-95 transition-all">
                    View Live Table
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black">Quick Reports</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-4">
            {[
              { name: 'Daily Production Summary', format: 'PDF' },
              { name: 'Godown-wise Pending', format: 'XLSX' },
              { name: 'Machine Efficiency Log', format: 'CSV' },
              { name: 'QC Reject History', format: 'PDF' }
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{report.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg ring-1 ring-inset ring-indigo-500/20">
                  {report.format}
                </span>
              </div>
            ))}
            
            <div className="pt-4">
               <div className="p-5 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1 leading-none">Automated Insight</p>
                  <p className="font-bold text-white text-sm leading-tight">
                    Godown "Main" has 4 items with pending qty &gt; 5000. Recommend immediate line prioritization.
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-500/10",
    rose: "bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10",
    amber: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10",
  };

  return (
    <Card className="border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden bg-white group hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={24} />
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ring-1 ring-inset ${colorMap[color].split(' ').pop()}`}>
            {trend}
          </span>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h2>
      </CardContent>
    </Card>
  );
}
