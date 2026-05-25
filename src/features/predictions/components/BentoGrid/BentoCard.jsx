/**
 * BentoCard — Individual card within the BentoGrid.
 *
 * Props:
 *   - span: object with `col` and `row` for CSS grid span (defaults: col 12, row 1)
 *   - variant: 'default' | 'critical' | 'highlight' — controls border/shadow emphasis
 *   - className: additional tailwind classes
 *   - children
 */
import { AlertTriangle } from 'lucide-react';

const VARIANT_STYLES = {
  default: {
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  critical: {
    background: 'rgba(186,26,26,0.04)',
    border: '1.5px solid rgba(186,26,26,0.2)',
  },
  highlight: {
    background: 'rgba(15,82,56,0.04)',
    border: '1.5px solid rgba(15,82,56,0.15)',
  },
};

export default function BentoCard({
  span = { col: 12, row: 1 },
  variant = 'default',
  className = '',
  title,
  icon: Icon,
  badge,
  children,
}) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <div
      className={`bento-card ${className}`}
      style={{
        ...style,
        backdropFilter: 'blur(16px)',
        gridColumn: `span ${span.col}`,
        gridRow: `span ${span.row}`,
      }}
    >
      {title && (
        <div className="bento-card-header">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} style={{ color: variant === 'critical' ? '#ba1a1a' : '#0f5238' }} />}
            <h3 className="bento-card-title">{title}</h3>
          </div>
          {badge && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: variant === 'critical' ? 'rgba(186,26,26,0.1)' : 'rgba(15,82,56,0.1)',
                color: variant === 'critical' ? '#ba1a1a' : '#0f5238',
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
}