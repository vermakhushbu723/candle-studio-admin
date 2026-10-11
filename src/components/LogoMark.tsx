interface Props {
  size?: number;
  /** full = J-candle mark + JYOTESSA wordmark; mark = the J-candle only */
  variant?: 'full' | 'mark';
  /** cream artwork for dark backgrounds (sidebar, login panel) */
  light?: boolean;
  className?: string;
}

/** Jyotessa logo (transparent PNGs in /public). */
export default function LogoMark({ size = 40, variant = 'full', light = false, className = '' }: Props) {
  const file = `/${variant === 'mark' ? 'logo-mark' : 'logo'}${light ? '-light' : ''}.png`;
  return <img src={file} alt="Jyotessa" width={size} height={size} style={{ width: size, height: size }} className={`shrink-0 object-contain ${className}`} />;
}
