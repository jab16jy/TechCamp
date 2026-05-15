const CropIcon = ({ type, size = 28 }) => {
  const icons = {
    yuca: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M24 6C24 6 18 14 18 24C18 34 24 42 24 42" stroke="#0f5238" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 6C24 6 30 14 30 24C30 34 24 42 24 42" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20 14C16 16 12 20 12 26" stroke="#0f5238" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <path d="M28 14C32 16 36 20 36 26" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <path d="M18 20C14 22 10 26 10 32" stroke="#0f5238" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M30 20C34 22 38 26 38 32" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <circle cx="24" cy="24" r="3" fill="#0f5238" opacity="0.15"/>
      </svg>
    ),
    ñame: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="28" rx="10" ry="14" fill="#2d6a4f" opacity="0.1" stroke="#0f5238" strokeWidth="2"/>
        <path d="M24 10C24 10 20 16 20 22" stroke="#0f5238" strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 10C24 10 28 16 28 22" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="10" r="2.5" fill="#0f5238" opacity="0.3"/>
        <path d="M18 28C18 28 20 32 24 32C28 32 30 28 30 28" stroke="#0f5238" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M20 34C20 34 22 36 24 36C26 36 28 34 28 34" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    guineo: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M16 8C16 8 12 18 14 28C16 38 22 42 24 42" stroke="#0f5238" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M16 8C16 8 20 18 18 28C16 38 22 42 24 42" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 42C24 42 28 38 30 28C32 18 28 8 28 8" stroke="#0f5238" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 42C24 42 28 38 30 28C32 18 28 8 28 8" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M18 14C18 14 16 20 17 26" stroke="#0f5238" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M28 14C28 14 30 20 29 26" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <circle cx="22" cy="10" r="2" fill="#0f5238" opacity="0.2"/>
      </svg>
    ),
    papa: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="26" rx="14" ry="12" fill="#2d6a4f" opacity="0.08" stroke="#0f5238" strokeWidth="2"/>
        <circle cx="18" cy="22" r="1.5" fill="#0f5238" opacity="0.3"/>
        <circle cx="28" cy="20" r="1.5" fill="#0f5238" opacity="0.3"/>
        <circle cx="22" cy="30" r="1.5" fill="#0f5238" opacity="0.3"/>
        <circle cx="30" cy="28" r="1.5" fill="#0f5238" opacity="0.3"/>
        <circle cx="16" cy="28" r="1" fill="#2d6a4f" opacity="0.2"/>
        <circle cx="26" cy="34" r="1" fill="#2d6a4f" opacity="0.2"/>
        <path d="M24 14C24 14 22 10 24 8C26 10 24 14 24 14Z" fill="#0f5238" opacity="0.2"/>
        <path d="M24 14C24 14 22 10 24 8C26 10 24 14 24 14Z" stroke="#0f5238" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };
  return icons[type] || null;
};

export default CropIcon;
