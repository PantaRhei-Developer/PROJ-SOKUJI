import { Check, CheckCircle2 } from 'lucide-react';
import './ModeCard.scss';

interface ModeCardProps {
  title: string;
  bullets: string[];
  tagline?: string;
  selected: boolean;
  onSelect: () => void;
}

function ModeCard({ title, bullets, tagline, selected, onSelect }: ModeCardProps) {
  return (
    <div
      className={`mode-card${selected ? ' mode-card--selected' : ''}`}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {tagline && <span className="mode-card__tagline">{tagline}</span>}
      {selected && <CheckCircle2 className="mode-card__check" size={20} />}
      <h3 className="mode-card__title">{title}</h3>
      <ul className="mode-card__bullets">
        {bullets.map((bullet) => (
          <li key={bullet}>
            <Check size={14} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ModeCard;
