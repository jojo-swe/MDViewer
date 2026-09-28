import type { Heading } from '../hooks/useOutline';
import './Outline.css';

interface OutlineProps {
  headings: Heading[];
  activeId: string | null;
  onHeadingClick: (heading: Heading) => void;
}

export default function Outline({ headings, activeId, onHeadingClick }: OutlineProps) {
  if (headings.length === 0) {
    return (
      <div className="outline-empty">
        <span>No headings found</span>
      </div>
    );
  }

  return (
    <div className="outline">
      {headings.map((heading) => (
        <button
          key={heading.id}
          className={`outline-item ${activeId === heading.id ? 'outline-item--active' : ''}`}
          style={{ paddingLeft: `${12 + (heading.level - 1) * 16}px` }}
          onClick={() => onHeadingClick(heading)}
          title={heading.text}
        >
          <span className="outline-item-marker">{'#'.repeat(heading.level)}</span>
          <span className="outline-item-text">{heading.text}</span>
        </button>
      ))}
    </div>
  );
}
