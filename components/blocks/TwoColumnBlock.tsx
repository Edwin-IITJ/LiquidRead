export default function TwoColumnBlock({
  left,
  right,
}: {
  left: { heading: string; items: string[] };
  right: { heading: string; items: string[] };
}) {
  return (
    <div className="blk-twocol">
      <div className="blk-twocol__col">
        <p className="blk-twocol__heading">{left.heading}</p>
        <ul className="blk-twocol__list">
          {left.items.map((item, i) => (
            <li key={i} className="blk-twocol__item">{item}</li>
          ))}
        </ul>
      </div>

      <div className="blk-twocol__divider" />

      <div className="blk-twocol__col">
        <p className="blk-twocol__heading">{right.heading}</p>
        <ul className="blk-twocol__list">
          {right.items.map((item, i) => (
            <li key={i} className="blk-twocol__item">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
