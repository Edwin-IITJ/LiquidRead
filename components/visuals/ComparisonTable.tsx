interface ComparisonTableRow {
  label: string;
  leftValue: string;
  rightValue: string;
}

interface ComparisonTableData {
  leftHeader: string;
  rightHeader: string;
  rows: ComparisonTableRow[];
}

interface ComparisonTableProps {
  data: ComparisonTableData;
  caption?: string | null;
}

export default function ComparisonTable({ data, caption }: ComparisonTableProps) {
  if (!data?.leftHeader || !data?.rightHeader || !data?.rows?.length) return null;

  const rows = data.rows.slice(0, 4);

  return (
    <div className="py-3">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-widest text-slate-500 font-semibold pb-2 w-1/3" />
            <th className="text-left text-xs uppercase tracking-widest text-slate-500 font-semibold pb-2 w-1/3">
              {data.leftHeader}
            </th>
            <th className="text-left text-xs uppercase tracking-widest text-slate-500 font-semibold pb-2 w-1/3">
              {data.rightHeader}
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}
            >
              <td className="py-2 px-2 text-xs text-slate-500">{row.label}</td>
              <td className="py-2 px-2 text-sm font-medium text-slate-800">
                {row.leftValue}
              </td>
              <td className="py-2 px-2 text-sm font-medium text-slate-800">
                {row.rightValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Caption */}
      {caption && (
        <p className="text-xs text-slate-400 italic mt-3">{caption}</p>
      )}
    </div>
  );
}
