export default function ProductionHistory() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 leading-tight">Production History</h1>
        <p className="text-slate-500 font-medium">Archived production records and performance analysis.</p>
      </div>

      <div className="p-10 rounded-[3rem] bg-amber-50/50 border border-amber-100/50 flex flex-col items-center justify-center min-h-[400px] text-center shadow-inner group transition-all duration-500 hover:bg-amber-100/30">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-amber-300 animate-[spin_10s_linear_infinite] flex items-center justify-center mb-6">
           <div className="w-12 h-12 rounded-full bg-amber-100 group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h3 className="text-2xl font-black text-amber-900 leading-tight">Production Archives</h3>
        <p className="max-w-md text-amber-700/80 mt-4 text-lg font-medium leading-relaxed">
          Historical production data is currently being indexed for fast search and retrieval.
        </p>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div>
                <div className="w-32 h-3 bg-slate-200 rounded-full mb-2" />
                <div className="w-20 h-2 bg-slate-100 rounded-full" />
              </div>
            </div>
            <div className="w-16 h-4 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
