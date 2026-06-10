export default function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4 sm:p-6">
      <p className="text-cream/50 text-xs uppercase tracking-widest mb-2 leading-tight">{label}</p>
      <p className="heading text-2xl sm:text-3xl break-words">{value ?? '—'}</p>
      {sub && <p className="text-cream/60 text-xs sm:text-sm mt-1">{sub}</p>}
    </div>
  );
}
