import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href:string; size?:'small'|'medium'|'large'; variant?:'primary'|'secondary'|'outline'|'ghost'; children:ReactNode; };
export function ButtonLink({size='medium',variant='primary',className='',children,...props}:ButtonLinkProps) {
  return <a className={`button button-${size} button-${variant} ${className}`} {...props} href={withBasePath(props.href)}>{children}</a>;
}
type EyebrowProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: 'default' | 'translucent'; children: ReactNode };
export function Eyebrow({ children, className = '', variant = 'default', ...props }: EyebrowProps) {
  return <a className={`eyebrow ${variant === 'translucent' ? 'eyebrow-translucent' : ''} ${className}`} {...props} href={withBasePath(props.href)}>
    <span>{children}</span>
    <span className="eyebrow-arrow" aria-hidden="true">
      <ArrowIcon size={16} />
    </span>
  </a>;
}
/** Announcement bar: the interactive eyebrow, defaulting to the translucent variant for use over imagery. */
export function Announcement({ variant = 'translucent', ...props }: EyebrowProps) {
  return <Eyebrow variant={variant} {...props} />;
}
