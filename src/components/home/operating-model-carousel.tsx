'use client';

import { useId } from 'react';
import { OperatingModel } from './operating-model';
import { useOperatingModelScene, type OperatingModelSceneProps } from './operating-model-scene';
import { carouselCirclePath } from './operating-model-diagram/carousel-profile';
import { modelDotRadius, modelDotRings } from './operating-model-diagram/model-dots';
import { initialKineticCircleStyle } from './kinetic-circles';
import styles from './operating-model.module.css';

const loadCarousel = () => import('./operating-model-carousel-motion').then(module => module.mountOperatingModelCarousel);
const plates = [
  <g key="mark" />,
  <g key="models">
    <circle cx="160" cy="160" r={modelDotRadius * 320} fill="currentColor" stroke="none" />
    {modelDotRings.map(({ radius, count, stagger }) => (
      <circle key={count} cx="160" cy="160" r={radius * 320} strokeWidth={2 * modelDotRadius * 320}
        pathLength={count} strokeDasharray="0.001 0.999" strokeDashoffset={-stagger} />
    ))}
  </g>,
  <g key="workflows">
    <path d="M160 116V141M160 179V194M110 212V203Q110 194 119 194H201Q210 194 210 203V212"
      strokeWidth="1.35" opacity=".74" />
    <rect x="112" y="76" width="96" height="40" rx="8" />
    <rect x="136" y="141" width="48" height="38" rx="8" />
    <rect x="86" y="212" width="48" height="32" rx="7" />
    <rect x="186" y="212" width="48" height="32" rx="7" />
    <path d="M138 92H182M138 102H169M150 160L157 166L170 153M100 228H120M200 228H220" />
    <circle cx="160" cy="128.5" r="3" fill="var(--palette-iris)" stroke="none" />
  </g>,
  <g key="applications" strokeWidth="1.1" opacity=".85">
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
];
const circleSlides = [...plates, ...plates];

function CarouselScene(props: OperatingModelSceneProps) {
  const host = useOperatingModelScene(props, loadCarousel);
  const id = useId();

  return (
    <div ref={host} className={styles.art} data-model-carousel aria-hidden="true">
      <div className={styles.carouselViewport} data-model-viewport>
        <div className={styles.carouselTrack}>
          {circleSlides.map((plate, index) => {
            const pathId = `${id}-profile-${index}`;
            const clipId = `${id}-clip-${index}`;
            return <div key={index} className={styles.carouselSlide} data-model-plate={plate.key}
              style={initialKineticCircleStyle(index, 1, circleSlides.length)}>
              <div className={styles.carouselPlate} data-model-plate-surface>
                <svg className={styles.carouselDrawing} viewBox="0 0 1 1" overflow="visible">
                  <clipPath id={clipId}><use href={`#${pathId}`} /></clipPath>
                  <path id={pathId} className={styles.carouselProfile} d={carouselCirclePath} />
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
        <div className={styles.carouselCanvas} data-model-canvas-host />
      </div>
    </div>
  );
}

export function OperatingModelCarousel() {
  return <OperatingModel Scene={CarouselScene} />;
}
