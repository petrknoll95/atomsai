import type { AnchorHTMLAttributes, ReactNode } from 'react';
type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href:string; size?:'small'|'medium'|'large'; variant?:'primary'|'secondary'|'outline'; children:ReactNode; };
export function ButtonLink({size='medium',variant='primary',className='',children,...props}:ButtonLinkProps) {
  return <a className={`button button-${size} button-${variant} ${className}`} {...props}>{children}</a>;
}
type EyebrowProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode };
export function Eyebrow({ children, className = '', ...props }: EyebrowProps) {
  return <a className={`eyebrow ${className}`} {...props}>
    <span>{children}</span>
    <span className="eyebrow-arrow" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12H14.5M12 4L20 12L12 20" /></svg>
    </span>
  </a>;
}
