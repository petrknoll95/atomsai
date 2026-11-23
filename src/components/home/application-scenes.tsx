import { JustCallScene } from './justcall-scene';
import { HelpwiseScene } from './helpwise-scene';
import { ServiceAgentScene } from './serviceagent-scene';
import { CallPageScene } from './callpage-scene';
import styles from './application-preview.module.css';

export { JustCallScene };

const previews = {
  JustCall: JustCallScene,
  Helpwise: () => <HelpwiseScene compact />,
  ServiceAgent: ServiceAgentScene,
  CallPage: CallPageScene,
};

export function ApplicationPreview({ product }: { product: keyof typeof previews }) {
  const Scene = previews[product];
  return <div className={styles.canvas} data-preview-product={product}><Scene /></div>;
}
