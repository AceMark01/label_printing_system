'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Mail, Phone, Shield, User, Loader2, Search, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  const isAdmin = currentUser?.role === 'Admin';

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    gmail: '',
    number: '',
    password: '',
    role: 'Staff'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Network error while fetching users');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`User ${newUser.name} added successfully`);
        setNewUser({ name: '', gmail: '', number: '', password: '', role: 'Staff' });
        setShowAddForm(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to add user');
      }
    } catch (err) {
      toast.error('Error adding user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.gmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-3xl shadow-sm border border-indigo-100 flex flex-col items-center min-w-[120px]">
             <span className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Users</span>
             <span className="text-3xl font-black text-indigo-600 leading-none">{users.length}</span>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={cn(
                "rounded-3xl h-[68px] px-8 flex items-center gap-3 transition-all duration-500 font-black uppercase text-xs tracking-widest leading-none shadow-xl",
                showAddForm ? "bg-amber-50 text-amber-600 border border-amber-100 shadow-amber-100 hover:bg-amber-100" : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"
              )}
            >
              {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showAddForm ? 'Cancel' : 'Add New User'}
            </Button>
          )}
        </div>

        <div className="flex-1 max-w-md bg-white border border-slate-200 p-1 rounded-[2rem] flex items-center shadow-sm">
           <div className="pl-6 pr-3 text-slate-300">
             <Search className="w-5 h-5" />
           </div>
           <input 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Find users by name, email..."
             className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 h-14"
           />
           {searchQuery && (
             <Button variant="ghost" onClick={() => setSearchQuery('')} className="mr-2 h-10 w-10 p-0 rounded-full text-slate-400">
                <X className="w-4 h-4" />
             </Button>
           )}
        </div>
      </div>

      {/* Add User Form - Animated Dropdown */}
      {showAddForm && (
        <Card className="border-indigo-100 shadow-2xl shadow-indigo-100/50 rounded-[2.5rem] bg-indigo-50/20 overflow-hidden animate-in zoom-in slide-in-from-top-4 duration-500">
          <CardHeader className="pt-10 pb-4 px-10">
             <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                 <Plus className="w-6 h-6" />
               </div>
               New Team Member
             </CardTitle>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 ml-14 leading-none">Complete the details to grant access</p>
          </CardHeader>
          <CardContent className="px-10 pb-10 mt-6">
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    placeholder="Aditya Pratap" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold text-slate-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Gmail)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    type="email"
                    placeholder="example@gmail.com" 
                    value={newUser.gmail}
                    onChange={(e) => setNewUser({...newUser, gmail: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold text-slate-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                   <Input 
                    placeholder="+91 XXXXX XXXXX" 
                    value={newUser.number}
                    onChange={(e) => setNewUser({...newUser, number: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold text-slate-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                   <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                   <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="h-14 pl-12 rounded-2xl border-slate-200 focus:border-indigo-500 font-bold text-slate-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Role:</span>
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                    <button 
                       type="button"
                       onClick={() => setNewUser({...newUser, role: 'Admin'})}
                       className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", newUser.role === 'Admin' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400")}
                    >Admin</button>
                    <button 
                       type="button"
                       onClick={() => setNewUser({...newUser, role: 'Staff'})}
                       className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", newUser.role === 'Staff' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400")}
                    >Staff</button>
                  </div>
                </div>
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-200/50 flex items-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Register Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User Management View: List on Desktop, Cards on Mobile */}
      <div className="w-full relative z-10">
        {loading && users.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[240px] rounded-[2.5rem] bg-indigo-50/50 border-2 border-indigo-50/50" />
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Added When</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <User className="w-6 h-6" />
                          </div>
                          <span className="text-[15px] font-black text-slate-800 tracking-tight">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          user.role === 'Admin' ? "bg-amber-100 text-amber-600 border border-amber-200/50 shadow-sm" : "bg-emerald-100 text-emerald-600 border border-emerald-200/50 shadow-sm"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                            <Mail className="w-3 h-3 text-slate-300" />
                            {user.gmail}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                            <Phone className="w-3 h-3 text-slate-300" />
                            {user.number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-bold text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-10 w-10 p-0 rounded-xl text-slate-200 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>

            {/* Mobile/Tablet Card View (Stays exactly as before) */}
            <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User className="w-7 h-7" />
                          </div>
                          <div>
                             <h3 className="text-lg font-black text-slate-900 tracking-tight">{user.name}</h3>
                             <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                user.role === 'Admin' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                             )}>{user.role}</span>
                          </div>
                       </div>
                       <Button variant="ghost" onClick={() => handleDeleteUser(user.id)} className="h-10 w-10 p-0 text-slate-200 hover:text-rose-500">
                          <Trash2 className="w-5 h-5" />
                       </Button>
                    </div>
                    <div className="space-y-3">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600 overflow-hidden text-ellipsis">{user.gmail}</span>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{user.number}</span>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-6">
             <div className="w-24 h-24 rounded-[3rem] bg-indigo-50 flex items-center justify-center text-indigo-200">
                <User className="w-12 h-12" />
             </div>
             <p className="text-xl font-black text-slate-300 tracking-tight">No team members found</p>
             <Button variant="ghost" onClick={() => setShowAddForm(true)} className="text-indigo-600 hover:text-indigo-700 font-black uppercase text-[10px] tracking-widest">Register the first user</Button>
          </div>
        )}
      </div>
    </div>
  );
}
