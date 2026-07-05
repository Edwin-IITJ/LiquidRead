export default function KeyPointsBlock({
  items,
  heading,
}: {
  items: string[];
  heading?: string;
}) {
  return (
    <div className="blk-keypoints">
      {heading && (
        <p className="blk-keypoints__heading">{heading}</p>
      )}
      <ul className="blk-keypoints__list">
        {items.map((item, i) => (
          <li key={i} className="blk-keypoints__item">
            <span className="blk-keypoints__dot" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
