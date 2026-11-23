'use client';

import { useId, type CSSProperties } from 'react';
import { OperatingModel } from './operating-model';
import { useOperatingModelScene, type OperatingModelSceneProps } from './operating-model-scene';
import { carouselCirclePath, carouselLogoProfiles } from './operating-model-diagram/carousel-profile';
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
      <div className={styles.carouselViewport} data-model-viewport data-model-morph="">
        <div className={styles.carouselTrack}>
          {circleSlides.map((plate, index) => {
            // First paint uses the same five paths as the live deck at the mark.
            const slot = (index + 1) % circleSlides.length;
            const profile = carouselLogoProfiles[slot];
            const pathId = `${id}-profile-${index}`;
            const clipId = `${id}-clip-${index}`;
            return <div key={index} className={styles.carouselSlide} data-model-plate={plate.key}
              data-model-logo-slot={profile ? slot : undefined}
              style={profile ? { '--model-logo-x': profile.offset - index } as CSSProperties : undefined}>
              <div className={styles.carouselPlate} data-model-plate-surface>
                <svg className={styles.carouselDrawing} viewBox="0 0 1 1" overflow="visible">
                  <path id={pathId} className={styles.carouselProfile} data-model-profile
                    d={profile?.path ?? carouselCirclePath} vectorEffect="non-scaling-stroke" />
                  <clipPath id={clipId}><use href={`#${pathId}`} /></clipPath>
                  <g clipPath={`url(#${clipId})`} className={styles.carouselArtwork}
                    fill="none" stroke="currentColor" strokeWidth="1.7"
                    strokeLinecap="round" strokeLinejoin="round">
                    <g transform="scale(.003125)"><g data-model-plate-art>{plate}</g></g>
                  </g>
                </svg>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

export function OperatingModelCarousel() {
  return <OperatingModel Scene={CarouselScene} />;
}
