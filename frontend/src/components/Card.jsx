export default function Card({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-[#162235] text-slate-100 p-4 shadow-lg shadow-black/10 ${className}`}
    >
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
