export default function ComparisonPairBlock({
  left,
  right,
  delta,
}: {
  left: { value: string; label: string };
  right: { value: string; label: string };
  delta?: string;
}) {
  return (
    <div className="blk-comparison">
      <div className="blk-comparison__card">
        <p className="blk-comparison__value">{left.value}</p>
        <p className="blk-comparison__label">{left.label}</p>
      </div>

      <div className="blk-comparison__divider">
        {delta ? (
          <span className="blk-comparison__delta">{delta}</span>
        ) : (
          <span className="blk-comparison__vs">vs</span>
        )}
      </div>

      <div className="blk-comparison__card">
        <p className="blk-comparison__value">{right.value}</p>
        <p className="blk-comparison__label">{right.label}</p>
      </div>
    </div>
  );
}
