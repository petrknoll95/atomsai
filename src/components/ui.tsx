import type { AnchorHTMLAttributes, ReactNode } from 'react';
type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href:string; size?:'small'|'medium'|'large'; variant?:'primary'|'secondary'|'outline'; children:ReactNode; };
export function ButtonLink({size='medium',variant='primary',className='',children,...props}:ButtonLinkProps) {
  return <a className={`button button-${size} button-${variant} ${className}`} {...props}>{children}</a>;
}
export function Eyebrow({children,className=''}:{children:ReactNode;className?:string}) {
  return <div className={`eyebrow ${className}`}><img src='/assets/figma/offerings-Frame15.svg' width='10' height='20' alt='' aria-hidden='true'/><span>{children}</span></div>;
}
