import { useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="ac-tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={14} className="ac-info-icon" />
      {show && <div className="ac-tooltip">{text}</div>}
    </span>
  );
}

const trendMeta = {
  positive: { Icon: CheckCircle2, css: 'ac-trend--positive' },
  warning: { Icon: AlertTriangle, css: 'ac-trend--warning' },
  neutral: { Icon: Info, css: 'ac-trend--neutral' },
};

const iconVariant = {
  positive: 'ac-metric-icon--primary',
  warning: 'ac-metric-icon--secondary',
  neutral: 'ac-metric-icon--neutral',
};

const badgeVariant = {
  positive: 'ac-metric-badge--positive',
  warning: 'ac-metric-badge--negative',
  neutral: 'ac-metric-badge--neutral',
};

const MetricCardsGrid = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, i) => {
        const t = trendMeta[metric.tone] || trendMeta.neutral;
        const TrendIcon = t.Icon;
        const MetricIcon = metric.Icon;
        return (
          <article key={metric.key} className="ac-metric-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-full ${iconVariant[metric.tone]}`}>
                <MetricIcon size={24} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeVariant[metric.tone]}`}>
                {metric.trend}
              </span>
            </div>
            <div>
              <div className="ac-metric-label-row">
                <p className="text-[10px] text-[#707973] uppercase tracking-wider font-semibold mb-1">{metric.label}</p>
                <InfoTip text={metric.tip} />
              </div>
              <h3 className="text-3xl text-[#191c1d] font-bold">{metric.value}</h3>
              <p className={`text-xs mt-1 flex items-center gap-1 ${t.css}`}>
                <TrendIcon size={14} /> {metric.trend}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MetricCardsGrid;
