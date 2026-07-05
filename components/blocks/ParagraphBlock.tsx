export default function ParagraphBlock({ text }: { text: string }) {
  return (
    <p className="blk-paragraph">
      {text}
    </p>
  );
}
