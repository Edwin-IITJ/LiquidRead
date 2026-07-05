export default function SourceBadgeBlock({
  journal,
  year,
  doi,
}: {
  journal: string;
  year: number;
  doi?: string | null;
}) {
  const doiUrl = doi
    ? doi.startsWith("http")
      ? doi
      : `https://doi.org/${doi}`
    : null;

  return (
    <div className="blk-source">
      <span className="blk-source__icon" aria-hidden="true">📄</span>
      <span className="blk-source__journal">{journal}</span>
      <span className="blk-source__sep">·</span>
      <span className="blk-source__year">{year}</span>
      {doiUrl && (
        <>
          <span className="blk-source__sep">·</span>
          <a
            href={doiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="blk-source__link"
          >
            Read paper ↗
          </a>
        </>
      )}
    </div>
  );
}
