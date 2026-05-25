/**
 * BentoGrid — 12-column CSS Grid layout for the DSS Integral dashboard.
 *
 * Visual hierarchy:
 *   Row 1: Critical KPIs (risks + soil moisture) — always visible
 *   Row 2: Query config + Phenology timeline
 *   Row 3: Projections (tabs) + Climate risk panel
 *   Row 4: Simulator + XAI side by side
 *   Row 5: Plan (when active)
 *
 * Responsive: stacks to single column on mobile.
 */
export default function BentoGrid({ children }) {
  return (
    <div className="bento-grid">
      {children}
    </div>
  );
}