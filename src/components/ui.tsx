import { ArrowIcon } from '@/components/arrow-icon';
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
      <ArrowIcon size={16} />
    </span>
  </a>;
}
