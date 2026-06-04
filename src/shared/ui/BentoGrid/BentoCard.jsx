/**
 * BentoCard — Individual card within the BentoGrid.
 *
 * Props:
 *   span       — { col, row } for CSS grid span (defaults: col 12, row 1)
 *   variant    — 'default' | 'critical' | 'highlight' — controls border/shadow
 *   className  — additional Tailwind classes
 *   title      — optional card title (shown in header)
 *   icon       — optional Lucide icon component
 *   badge      — optional badge text (shown in header)
 *   children
 */
import { AlertTriangle, Sparkles } from 'lucide-react';

const VARIANT_STYLES = {
  default: {
    '--bento-bg': 'rgba(255,255,255,0.55)',
    '--bento-border': '1px solid rgba(255,255,255,0.25)',
    '--bento-accent': '#2D5A27',
    '--bento-badge-bg': 'rgba(45,90,39,0.08)',
    '--bento-badge-color': '#2D5A27',
  },
  critical: {
    '--bento-bg': 'rgba(186,26,26,0.04)',
    '--bento-border': '1.5px solid rgba(186,26,26,0.2)',
    '--bento-accent': '#ba1a1a',
    '--bento-badge-bg': 'rgba(186,26,26,0.1)',
    '--bento-badge-color': '#ba1a1a',
  },
  highlight: {
    '--bento-bg': 'rgba(15,82,56,0.04)',
    '--bento-border': '1.5px solid rgba(15,82,56,0.15)',
    '--bento-accent': '#0f5238',
    '--bento-badge-bg': 'rgba(15,82,56,0.1)',
    '--bento-badge-color': '#0f5238',
  },
};

const BentoCard = ({
  span = { col: 12, row: 1 },
  variant = 'default',
  className = '',
  title,
  icon: Icon,
  badge,
  children,
}) => {
  const vars = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <div
      className={`bento-card ${className}`}
      style={{
        ...vars,
        gridColumn: `span ${span.col}`,
        gridRow: `span ${span.row}`,
      }}
    >
      {title && (
        <div className="bento-card-header">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} style={{ color: vars['--bento-accent'] }} />}
            <h3 className="bento-card-title">{title}</h3>
          </div>
          {badge && (
            <span
              className="bento-card-badge"
              style={{
                background: vars['--bento-badge-bg'],
                color: vars['--bento-badge-color'],
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default BentoCard;
