'use client';

import { useId } from 'react';
import { OperatingModel } from './operating-model';
import { useOperatingModelScene, type OperatingModelSceneProps } from './operating-model-scene';
import { logoMarkPath } from './operating-model-diagram/logo-mark';
import styles from './operating-model.module.css';

const loadCarousel = () => import('./operating-model-carousel-motion').then(module => module.mountOperatingModelCarousel);
const dotCoordinates = Array.from({ length: 13 }, (_, index) => 82 + 13 * index);
const plates = [
  <g key="mark" />,
  <g key="models" fill="currentColor" stroke="none">
    {dotCoordinates.flatMap((cy, row) => dotCoordinates.map((cx, column) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy}
        r={(1.05 + 1.65 * Math.max(0, 1 - Math.hypot((column - 6) / 4, (row - 6) / 7))).toFixed(2)} />
    )))}
  </g>,
  <g key="workflows">
    <path d="M144 160H176M224 160H235Q244 160 244 151V134M224 160H235Q244 160 244 169V186" />
    <rect x="76" y="141" width="68" height="38" rx="8" />
    <rect x="176" y="141" width="48" height="38" rx="8" />
    <rect x="222" y="103" width="44" height="31" rx="7" />
    <rect x="222" y="186" width="44" height="31" rx="7" />
    <path d="M94 155H126M94 164H116M190 160L197 166L210 153M235 118H253M235 202H253" />
    <circle cx="160" cy="160" r="3" fill="currentColor" />
  </g>,
  <g key="applications">
    <rect x="66" y="86" width="188" height="148" rx="11" />
    <path d="M66 112H254M140 112V234" />
    <path d="M81 99H82M91 99H92M101 99H102" strokeWidth="3" />
    <rect x="80" y="127" width="46" height="38" rx="5" />
    <path d="M88 153L98 145L104 149L118 137M80 184H122M80 196H113M80 208H102" opacity=".75" />
    {[136, 163, 190, 217].map(y => <g key={y}>
      <circle cx="156" cy={y - 2} r="4" />
      <path d={`M168 ${y - 5}H223m-55 6h38`} />
    </g>)}
  </g>,
  <g key="engineering" transform="translate(74.2 82) scale(.39)">
    <path d={logoMarkPath} strokeWidth="4.6" />
  </g>,
];
const circleSlides = [...plates, ...plates];

function CarouselScene(props: OperatingModelSceneProps) {
  const host = useOperatingModelScene(props, loadCarousel);
  const id = useId();

  return (
    <div ref={host} className={styles.art} data-model-carousel aria-hidden="true">
      <div className={styles.carouselViewport} data-model-viewport>
        <div className={styles.carouselTrack}>
          {circleSlides.map((plate, index) => (
            <div key={index} className={styles.carouselSlide} data-model-plate={plate.key}>
              <div className={styles.carouselPlate} data-model-plate-surface>
                <div className={styles.carouselArtwork} data-model-plate-art>
                  <svg viewBox="0 0 320 320" fill="none" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {plate}
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        <svg className={styles.carouselLogo} viewBox="0 0 440 400" fill="currentColor">
          <defs>
            <path id={`${id}-mark`} d={logoMarkPath} />
            <clipPath id={`${id}-left`}><rect width="220.5" height="400" /></clipPath>
            <clipPath id={`${id}-right`}><rect x="219.5" width="220.5" height="400" /></clipPath>
          </defs>
          {['left', 'right'].map(side => (
            <g key={side} data-model-logo-half={side}>
              <use href={`#${id}-mark`} clipPath={`url(#${id}-${side})`} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function OperatingModelCarousel() {
  return <OperatingModel Scene={CarouselScene} />;
}
