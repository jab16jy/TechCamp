/**
 * BentoGrid — 12-column CSS Grid layout.
 *
 * Responsive: stacks to single column on mobile.
 */
const BentoGrid = ({ children, className = '' }) => (
  <div className={`bento-grid ${className}`}>
    {children}
  </div>
);

export default BentoGrid;
