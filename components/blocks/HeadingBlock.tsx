export default function HeadingBlock({
  text,
  level = 3,
}: {
  text: string;
  level?: 2 | 3;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag className={`blk-heading blk-heading--${level}`}>
      {text}
    </Tag>
  );
}
