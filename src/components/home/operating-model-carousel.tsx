'use client';

import { useId } from 'react';
import { OperatingModel } from './operating-model';
import { useOperatingModelScene, type OperatingModelSceneProps } from './operating-model-scene';
import { carouselCirclePath } from './operating-model-diagram/carousel-profile';
import { operatingModelArtwork } from './operating-model-diagram/plate-artwork';
import { initialKineticCircleStyle } from './kinetic-circles';
import styles from './operating-model.module.css';

const loadCarousel = () => import('./operating-model-carousel-motion').then(module => module.mountOperatingModelCarousel);
const plates = ['mark', 'models', 'workflows', 'applications'] as const;
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
            return <div key={index} className={styles.carouselSlide} data-model-plate={plate}
              style={initialKineticCircleStyle(index, 1, circleSlides.length)}>
              <div className={styles.carouselPlate} data-model-plate-surface>
                <svg className={styles.carouselDrawing} viewBox="0 0 1 1" overflow="visible">
                  <clipPath id={clipId}><use href={`#${pathId}`} /></clipPath>
                  <path id={pathId} className={styles.carouselProfile} d={carouselCirclePath} />
                  <g clipPath={`url(#${clipId})`} className={styles.carouselArtwork}
                    fill="none" stroke="currentColor" strokeWidth="1.7"
                    strokeLinecap="round" strokeLinejoin="round">
                    <g transform="scale(.003125)"><g data-model-plate-art>{plate === 'mark' ? null : operatingModelArtwork[plate]}</g></g>
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
