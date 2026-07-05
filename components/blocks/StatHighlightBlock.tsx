export default function StatHighlightBlock({
  value,
  label,
  context,
}: {
  value: string;
  label: string;
  context?: string;
}) {
  return (
    <div className="blk-stat">
      <div className="blk-stat__inner">
        <p className="blk-stat__value">{value}</p>
        <p className="blk-stat__label">{label}</p>
        {context && (
          <p className="blk-stat__context">{context}</p>
        )}
      </div>
    </div>
  );
}
