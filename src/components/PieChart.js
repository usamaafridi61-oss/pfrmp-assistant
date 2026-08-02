export default function PieChart({ percent, size = 120 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const angle = (clamped / 100) * 360;
  return (
    <div className="pie-wrap">
      <div
        className="pie"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(#10b981 ${angle}deg, #e5e7eb 0deg)`,
        }}
      />
      <strong>{Math.round(clamped)}%</strong>
    </div>
  );
}
