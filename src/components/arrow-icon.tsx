import type { SVGProps } from 'react';

const rotations = {
  right: 0, 'up-right': -45, up: -90, 'up-left': -135,
  left: 180, 'down-left': 135, down: 90, 'down-right': 45,
} as const;

type ArrowIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  direction?: keyof typeof rotations;
  size?: number | string;
};

/** The branded, detached-shaft arrow from the original Figma artwork. */
export function ArrowIcon({ direction = 'right', size = '1em', style, ...props }: ArrowIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    aria-hidden={props['aria-label'] ? undefined : true}
    role={props['aria-label'] ? 'img' : undefined} focusable="false"
    style={{ display: 'inline-block', verticalAlign: '-0.125em', flexShrink: 0, ...style }}
    {...props} data-brand-arrow={direction}>
    <g transform={`rotate(${rotations[direction]} 12 12)`}>
      <path d="M4 12H14.5M12 4L20 12L12 20" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
    </g>
  </svg>;
}
