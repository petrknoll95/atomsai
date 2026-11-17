import { withBasePath } from '@/lib/base-path';
import { ArrowIcon } from '@/components/arrow-icon';
import type { AnchorHTMLAttributes, ComponentPropsWithRef, ReactNode } from 'react';
type ButtonAppearance = { size?:'small'|'medium'|'large'; variant?:'primary'|'secondary'|'outline'|'ghost'; className?:string };
function buttonClasses({ size = 'medium', variant = 'primary', className = '' }: ButtonAppearance) {
  return `button button-${size} button-${variant} ${className}`.trim();
}
type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & ButtonAppearance & { href:string; children:ReactNode; };
export function ButtonLink({size='medium',variant='primary',className='',children,...props}:ButtonLinkProps) {
  return <a className={buttonClasses({ size, variant, className })} {...props} href={withBasePath(props.href)}>{children}</a>;
}
type ButtonProps = ComponentPropsWithRef<'button'> & ButtonAppearance;
export function Button({ size = 'medium', variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button className={buttonClasses({ size, variant, className })} type={type} {...props} />;
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
