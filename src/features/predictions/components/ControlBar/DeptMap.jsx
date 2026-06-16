import { useState } from 'react';

// ── Real geographic SVG paths (from Colombia DANE GeoJSON, projected to 460×380) ──
// Caribbean region mainland departments. San Andrés rendered as an inset.

const DEPTS = [
  { name: 'La Guajira', d: 'M 364.2,24.8 L 382.7,32.5 L 388.5,44.3 L 388.9,49.9 L 375.3,61.1 L 376.9,61.5 L 376.3,63.3 L 342.9,72 L 326.2,102.7 L 320.5,102 L 311.4,106 L 300.8,131.2 L 291.5,147.1 L 282.6,148.4 L 275.7,146.3 L 270.7,149 L 268.8,143.8 L 272.7,140.6 L 276.4,133 L 272.3,131.7 L 267.8,126.4 L 265.1,127.9 L 264.6,120.1 L 253.5,119.2 L 243.1,121.9 L 240.8,115.2 L 240.7,103.7 L 244.2,100.2 L 244.8,96.3 L 259.4,95.6 L 282.9,77.7 L 289,76.3 L 296.1,69.1 L 308,66 L 309.7,64.1 L 314,64.2 L 320.5,60.7 L 324.4,57.9 L 330.2,45 L 327.9,38.4 L 339.9,36.5 L 339.1,42.5 L 341.8,42 L 346.3,39.5 L 344.1,35.3 L 341,34.7 L 345.8,30.1 L 348,28.7 L 349.2,32.4 L 353.8,27.3 L 355.4,29.4 L 359.2,25.9 L 356.9,24.9 L 353.8,26.2 L 354.5,24.9 L 364.2,24.8 Z', labelX: 312, labelY: 84 },
  { name: 'Magdalena', d: 'M 216,91.4 L 219.6,91.2 L 229.9,96 L 244.8,96.3 L 244.2,100.2 L 240.7,103.7 L 240.5,112.3 L 243.1,121.9 L 246.1,120.9 L 240.1,125.3 L 245.4,126.7 L 242.9,132.3 L 243.9,140.9 L 239.9,144.9 L 237.4,145.2 L 236.7,147.4 L 227.1,149.1 L 224.1,151.6 L 217.2,160.8 L 214.9,168.2 L 220.2,176.4 L 229.8,186 L 232.8,195.5 L 232.2,198.2 L 218.3,197.6 L 212.2,204 L 221.6,212.1 L 223.7,217.4 L 222.4,221.3 L 227,222.1 L 231.3,229.5 L 231.5,232.2 L 228.9,235.7 L 220.3,234.3 L 218.4,231.9 L 212.5,232.5 L 205.7,224.5 L 202.2,224.1 L 202.3,221.6 L 199.7,220.3 L 196.1,221.4 L 193.9,218.2 L 189.5,219.4 L 180.8,208.9 L 173,207 L 172.9,200.1 L 174.9,196.5 L 170.8,191 L 172.2,186.7 L 168.1,177.9 L 173.8,170.8 L 169.9,166.2 L 165.4,165.5 L 164.5,163.5 L 171.9,144.6 L 177,138 L 177.7,118.5 L 170.4,107 L 189.4,113.7 L 202.3,112.9 L 206.1,109 L 205.4,98.6 L 209.2,92.9 L 213.5,90.7 L 216,91.4 Z', labelX: 200, labelY: 150 },
  { name: 'Atlántico', d: 'M 169.3,150.2 L 166.8,156.6 L 164.1,155.5 L 159.5,150.6 L 152.5,147.7 L 145.9,142.1 L 144.7,135.9 L 146.2,124.5 L 157.4,118.4 L 170,106.6 L 177.7,118.5 L 176.8,138.8 L 169.3,150.2 Z', labelX: 160, labelY: 130 },
  { name: 'Cesar', d: 'M 264.6,120.1 L 265.1,127.9 L 267.8,126.4 L 272.3,131.7 L 276.4,133 L 272.7,140.6 L 268.8,143.8 L 270.7,149 L 275.7,146.3 L 282.6,148.4 L 291.4,147.2 L 285,156.9 L 285.2,164.1 L 280.8,175.6 L 280.4,180.3 L 283.4,183.8 L 279.9,187.3 L 273.8,200.1 L 271.2,201.4 L 265.3,210.3 L 259.9,222.9 L 255.9,225.5 L 254.4,235.3 L 255.4,246.1 L 253.3,252 L 248.4,255.6 L 248.5,263.3 L 252.2,265.2 L 250.1,271.3 L 252.7,275.2 L 255.9,273.1 L 255.5,267.9 L 259.3,268.7 L 259.9,271.3 L 255.6,286.4 L 257.2,287.9 L 256.8,291.7 L 261.9,294 L 263.3,297.7 L 262.5,299.9 L 259,301.5 L 259.4,306.4 L 255.5,312.5 L 251,313.1 L 245.4,311 L 234.8,310.8 L 239.2,299.2 L 236,296 L 233,286.2 L 235.2,279.8 L 235.2,268.2 L 230.9,256.3 L 232.5,246.5 L 228.4,238.8 L 231.8,230.6 L 227,222.1 L 222.4,221.3 L 223.7,217.4 L 221.6,212.1 L 212.2,204 L 218.3,197.6 L 233,197.6 L 229.8,186 L 220.2,176.4 L 214.9,168.2 L 217.7,159.9 L 227.1,149.1 L 236.7,147.4 L 237.4,145.2 L 239.9,144.9 L 243.9,140.9 L 242.9,132.3 L 245.4,126.7 L 240.2,124.8 L 251.4,119.6 L 264.6,120.1 Z', labelX: 250, labelY: 215 },
  { name: 'Bolívar', d: 'M 152,146.4 L 166.8,156.6 L 164.7,164.9 L 169.9,166.2 L 173.8,170.8 L 168.1,177.9 L 172.2,186.7 L 170.8,191 L 174.9,196.5 L 172.9,200.1 L 173,207 L 180.8,208.9 L 189.5,219.4 L 193.9,218.2 L 196.1,221.4 L 199.7,220.3 L 202.3,221.6 L 202.2,224.1 L 205.7,224.5 L 212.5,232.5 L 218.4,231.9 L 220.3,234.3 L 228.9,235.7 L 228.8,240.4 L 232.5,246.5 L 230.9,256.3 L 235,267.1 L 235.4,276.8 L 233.5,286 L 228.2,290.4 L 228.1,295.3 L 232.1,308.5 L 230.9,317.1 L 225.5,326.1 L 224.3,338.7 L 206.6,355.6 L 199.2,354.7 L 195.9,344.4 L 196,335.8 L 199.7,332.2 L 198.2,326.1 L 193.3,334.6 L 191.1,335.4 L 184.7,328.7 L 187.3,318 L 192.9,312.3 L 189.5,306.3 L 189.2,299.7 L 171.5,282.6 L 175.4,278.4 L 183.7,274.7 L 184.3,271.3 L 186.3,271.9 L 188,268.5 L 184,251.2 L 187.1,247 L 186.1,242.8 L 179.8,233.8 L 171,228.7 L 166.5,220.2 L 165.8,208.1 L 161.4,201.8 L 146.5,191.9 L 139.7,192.6 L 139.9,194.8 L 138.4,194.7 L 141.3,181.1 L 132.8,179.6 L 132.9,172.5 L 130,169.7 L 131.2,165.1 L 128.4,166.9 L 126.1,166.3 L 125.8,164.9 L 130.5,162.8 L 128.8,160.4 L 129.7,157.9 L 119.6,164.7 L 123.5,160.2 L 125.3,154.6 L 127,156.2 L 130.1,154.4 L 129.7,150.2 L 127.3,148.1 L 130.6,143.2 L 131.5,146.6 L 132.5,145.6 L 130.2,138.1 L 133.6,136.7 L 137.2,131.7 L 144,128.5 L 145.4,124.5 L 146.6,128.1 L 144.7,135.9 L 145.7,141.8 L 152,146.4 Z', labelX: 178, labelY: 250 },
  { name: 'Sucre', d: 'M 132.6,179.2 L 141.3,181.1 L 141.1,186.2 L 138.3,191.2 L 138.9,195.4 L 139.7,192.6 L 146.5,191.9 L 161.4,201.8 L 165.8,208.1 L 166.5,220.2 L 171,228.7 L 179.8,233.8 L 185.5,241.5 L 187.1,247 L 184,251.2 L 188,268.5 L 181,276.8 L 175.2,278.7 L 173.1,271.6 L 167.5,266.8 L 159,264.9 L 153.3,270.6 L 150.2,270.5 L 148.6,268.9 L 149,264.4 L 142,263.4 L 139.5,250.1 L 141,248.2 L 137.3,243.8 L 142,241.6 L 149,241.3 L 146.7,229.8 L 143.2,229.5 L 140.2,225.1 L 136,225.1 L 136.1,223.1 L 133.4,222.3 L 133.6,218.5 L 130.3,219.2 L 119.5,213 L 119.3,208.6 L 122.5,207.5 L 127,197 L 124.6,191.4 L 119.3,190.1 L 123,186.3 L 126.4,174.9 L 129.2,172.8 L 128.8,169 L 126.5,167.2 L 130.8,164.9 L 130,169.7 L 132.9,172.5 L 132.6,179.2 Z', labelX: 150, labelY: 228 },
  { name: 'Córdoba', d: 'M 112.4,207.3 L 119.3,208.6 L 119.5,213 L 130.3,219.2 L 133.6,218.5 L 133.4,222.3 L 136.1,223.1 L 136,225.1 L 140.2,225.1 L 143.2,229.5 L 146.7,229.8 L 149,241.3 L 142,241.6 L 137.3,243.8 L 141,248.2 L 139.5,250.1 L 142.7,264.3 L 149,264.4 L 148.6,268.9 L 152.1,270.7 L 159,264.9 L 167.5,266.8 L 173.1,271.6 L 175.2,278.7 L 164.1,290.8 L 147.8,292.4 L 141.9,298.4 L 140.8,302.6 L 133.2,305.6 L 131.4,311.7 L 126.5,310.1 L 122.6,311.3 L 118.2,321.5 L 111.1,331.1 L 99.8,333.3 L 81.1,333.3 L 73,322.2 L 70.5,314.7 L 78,285.8 L 89.9,267.2 L 88.6,259.1 L 80.6,254.2 L 77.7,243.2 L 74.5,239.9 L 84.5,233.2 L 89.4,225.4 L 90.3,219.6 L 94.8,213.6 L 104.3,208.2 L 112.4,207.3 Z', labelX: 105, labelY: 270 },
];

const ISLAND = { name: 'San Andrés', cx: 36, cy: 48, rx: 11, ry: 16, labelX: 36, labelY: 22 };

// ── Component ──────────────────────────────────────────────────────────────

export default function DeptMap({ selectedDept, onDeptChange }) {
  const [hovered, setHovered] = useState(null);

  const activeName = hovered || selectedDept;
  const activeDept =
    DEPTS.find((d) => d.name === activeName) ||
    (ISLAND.name === activeName ? ISLAND : null);

  const renderDept = (dept) => {
    const isSelected = selectedDept === dept.name;
    const isHovered = hovered === dept.name;
    const isActive = isSelected || isHovered;

    return (
      <path
        key={dept.name}
        d={dept.d}
        fill={isSelected ? 'url(#dept-selected)' : isHovered ? 'url(#dept-hover)' : 'url(#dept-idle)'}
        stroke={isSelected ? '#0f5238' : isHovered ? '#1a6b44' : 'rgba(15,82,56,0.35)'}
        strokeWidth={isSelected ? 1.8 : isHovered ? 1.4 : 0.8}
        strokeLinejoin="round"
        filter={isSelected ? 'url(#dept-glow)' : undefined}
        onMouseEnter={() => setHovered(dept.name)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onDeptChange(isSelected ? null : dept.name)}
        style={{ cursor: 'pointer', transition: 'fill 0.2s ease, stroke 0.2s ease' }}
      >
        <title>{dept.name}</title>
      </path>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
      <svg
        viewBox="0 0 460 380"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Mapa departamentos Caribe colombiano"
        role="group"
      >
        <defs>
          <linearGradient id="dept-idle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,82,56,0.14)" />
            <stop offset="100%" stopColor="rgba(15,82,56,0.07)" />
          </linearGradient>
          <linearGradient id="dept-hover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(26,107,68,0.42)" />
            <stop offset="100%" stopColor="rgba(15,82,56,0.30)" />
          </linearGradient>
          <linearGradient id="dept-selected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a8d5a" />
            <stop offset="100%" stopColor="#0f5238" />
          </linearGradient>
          <radialGradient id="ocean-bg" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="rgba(186,230,253,0.30)" />
            <stop offset="100%" stopColor="rgba(186,230,253,0.10)" />
          </radialGradient>
          <filter id="dept-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0f5238" floodOpacity="0.45" />
          </filter>
          <filter id="label-bg" x="-12%" y="-30%" width="124%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#fff" floodOpacity="0.95" />
          </filter>
        </defs>

        {/* Ocean backdrop */}
        <rect width="460" height="380" fill="url(#ocean-bg)" rx="18" />
        <text x="320" y="40" textAnchor="middle" fontSize="11" fill="rgba(15,82,56,0.4)" fontStyle="italic">
          Mar Caribe
        </text>

        {/* Mainland departments */}
        {DEPTS.map(renderDept)}

        {/* San Andrés inset */}
        <g
          onMouseEnter={() => setHovered(ISLAND.name)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onDeptChange(selectedDept === ISLAND.name ? null : ISLAND.name)}
          style={{ cursor: 'pointer' }}
        >
          <rect x="14" y="14" width="64" height="68" rx="10" fill="rgba(255,255,255,0.35)" stroke="rgba(15,82,56,0.18)" strokeDasharray="3 3" strokeWidth="0.8" />
          <ellipse
            cx={ISLAND.cx} cy={ISLAND.cy} rx={ISLAND.rx} ry={ISLAND.ry}
            fill={selectedDept === ISLAND.name ? 'url(#dept-selected)' : hovered === ISLAND.name ? 'url(#dept-hover)' : 'url(#dept-idle)'}
            stroke={selectedDept === ISLAND.name ? '#0f5238' : 'rgba(15,82,56,0.35)'}
            strokeWidth={selectedDept === ISLAND.name ? 1.8 : 0.8}
            filter={selectedDept === ISLAND.name ? 'url(#dept-glow)' : undefined}
            style={{ transition: 'fill 0.2s ease' }}
          >
            <title>San Andrés</title>
          </ellipse>
          <text x={ISLAND.labelX} y={ISLAND.labelY} textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(15,82,56,0.65)">
            San Andrés
          </text>
        </g>

        {/* Active label (hover or selected) — rendered last so it sits on top */}
        {activeDept && activeDept.name !== ISLAND.name && (
          <text
            x={activeDept.labelX}
            y={activeDept.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="800"
            fill={selectedDept === activeDept.name ? '#fff' : '#0f5238'}
            filter={selectedDept === activeDept.name ? undefined : 'url(#label-bg)'}
            pointerEvents="none"
          >
            {activeDept.name}
          </text>
        )}
      </svg>

      {/* Hint / current selection */}
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center',
          color: selectedDept ? '#0f5238' : '#9ca3af',
          minHeight: 16,
          transition: 'color 0.2s ease',
        }}
      >
        {selectedDept
          ? `📍 ${selectedDept}`
          : hovered
            ? hovered
            : 'Pasa el mouse y haz clic para elegir'}
      </div>
    </div>
  );
}
