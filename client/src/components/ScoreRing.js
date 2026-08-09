'use client';

export default function ScoreRing({ score = 0, label, size = 96 }) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(225,179,104,0.15)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#e1b368" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
        />
        <text
          x="50%" y="50%"
          dominantBaseline="middle" textAnchor="middle"
          className="rotate-[90deg] origin-center"
          fill="#ffebcb"
          style={{ fontSize: size * 0.22, fontFamily: 'Georgia, serif', transformOrigin: 'center', transform: 'rotate(90deg)', transformBox: 'fill-box' }}
        >
          {s}
        </text>
      </svg>
      {label && <p className="text-cream/60 text-xs uppercase tracking-widest text-center">{label}</p>}
    </div>
  );
}
