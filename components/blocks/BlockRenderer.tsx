"use client";

import type { Block } from "@/types/blocks";
import ParagraphBlock from "./ParagraphBlock";
import HeadingBlock from "./HeadingBlock";
import StatHighlightBlock from "./StatHighlightBlock";
import CalloutBlock from "./CalloutBlock";
import ComparisonPairBlock from "./ComparisonPairBlock";
import KeyPointsBlock from "./KeyPointsBlock";
import TwoColumnBlock from "./TwoColumnBlock";
import SourceBadgeBlock from "./SourceBadgeBlock";

interface BlockRendererProps {
  block: Block;
  /** Stagger index for streaming entrance animation */
  index?: number;
  /** Whether to animate entrance (for streaming) */
  animate?: boolean;
}

export default function BlockRenderer({ block, index = 0, animate = false }: BlockRendererProps) {
  const style = animate
    ? { animationDelay: `${index * 80}ms` }
    : undefined;
  const className = animate ? "block-enter" : "";

  const inner = (() => {
    switch (block.type) {
      case "paragraph":
        return <ParagraphBlock text={block.text} />;
      case "heading":
        return <HeadingBlock text={block.text} level={block.level} />;
      case "stat_highlight":
        return (
          <StatHighlightBlock
            value={block.value}
            label={block.label}
            context={block.context}
          />
        );
      case "callout":
        return <CalloutBlock variant={block.variant} text={block.text} />;
      case "comparison_pair":
        return (
          <ComparisonPairBlock
            left={block.left}
            right={block.right}
            delta={block.delta}
          />
        );
      case "key_points":
        return <KeyPointsBlock items={block.items} heading={block.heading} />;
      case "two_column":
        return <TwoColumnBlock left={block.left} right={block.right} />;
      case "source_badge":
        return (
          <SourceBadgeBlock
            journal={block.journal}
            year={block.year}
            doi={block.doi}
          />
        );
      default:
        return null;
    }
  })();

  if (!inner) return null;

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}
