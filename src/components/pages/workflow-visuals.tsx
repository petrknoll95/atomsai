import type { ContentBlock } from './client-content';
import ui from './workflow-visuals.module.css';

function ActivityBackdrop({ label = 'Order activity' }: { label?: string }) {
  return <div className={ui.backdrop} aria-hidden="true">
    <div className={ui.backdropHeader}><span>{label}</span><span>All activity</span></div>
    {['#48213', '#48212', '#48211', '#48210', '#48209'].map((order, index) => <div className={ui.backdropRow} key={order}><span className={ui.outlineCheck}/><span>{order}</span><span>{index === 0 ? 'Delivery updated' : 'Synced'}</span><span>✓</span></div>)}
    <div className={ui.backdropFooter}>All systems connected</div>
  </div>;
}

export function DeliveryWorkflow({ blocks }: { blocks: ContentBlock[] }) {
  return <figure className={`${ui.visual} ${ui.delivery}`} aria-label="Delivery change for order 48213">
    <ActivityBackdrop />
    <div className={ui.sceneLabel}><span>Order #48213</span><span>Activity</span></div>
    <div className={ui.foreground}>
      <div className={`${ui.card} ${ui.requestCard}`}>
        <div className={ui.header}><span className={ui.heading}>{blocks[0].title}</span><span className={ui.muted}>Inbox</span></div>
        <div className={`${ui.surface} ${ui.message}`}><span className={ui.avatar} aria-hidden="true">C</span><div><span className={ui.muted}>Customer</span><p>{blocks[0].body[0]}</p></div></div>
      </div>
      <div className={`${ui.card} ${ui.activityCard}`}>
        <div className={ui.header}><span className={ui.heading}>Delivery change</span><span className={ui.pill}>Completed</span></div>
        <ol className={`${ui.surface} ${ui.activityList}`}>
          {blocks.slice(1,4).map(block=><li key={block.title}><span className={ui.check} aria-hidden="true">✓</span><div><h3>{block.title}</h3><p>{block.body[0]}</p></div></li>)}
        </ol>
      </div>
      <div className={`${ui.card} ${ui.confirmationCard}`}>
        <div className={ui.header}><span className={ui.heading}>Confirmation</span><span className={ui.muted}>Sent</span></div>
        <div className={`${ui.surface} ${ui.confirmation}`}><span className={ui.check} aria-hidden="true">✓</span><div><p>{blocks[4].body[0]}</p><span className={ui.muted}>SMS delivered · Email delivered</span></div></div>
      </div>
    </div>
  </figure>;
}

export function ApprovalWorkflow() {
  return <figure className={`${ui.visual} ${ui.approval}`} aria-label="Approval rules and escalation">
    <ActivityBackdrop label="Workflow activity" />
    <div className={ui.sceneLabel}><span>Workflow controls</span><span>Settings</span></div>
    <div className={`${ui.card} ${ui.approvalCard}`}>
      <div className={ui.header}><span className={ui.heading}>Approval flow</span><span className={ui.pill}>Your policy</span></div>
      <div className={ui.surface}>
        <div className={ui.requestRow}><span className={ui.statusDot}/><span>New request</span><span className={ui.muted}>Received</span></div>
        <div className={ui.rule}><span className={ui.check} aria-hidden="true">✓</span><div><p>Check the rules</p><span className={ui.muted}>Scope · permissions · confidence</span></div></div>
        <div className={ui.ruleOutcomes}>
          <div><span className={ui.muted}>Within agreed policy</span><h3>Take action</h3><p>Update the system.<br/>Log what happened.</p></div>
          <div><span className={ui.muted}>Needs a decision</span><h3>Ask your team</h3><p>Share the context.<br/>Wait for approval.</p></div>
        </div>
      </div>
      <div className={ui.cardFooter}><span className={ui.statusDot}/><span>Changes saved</span></div>
    </div>
    <figcaption>Every outcome has a record.<br/>Every exception has an owner.</figcaption>
  </figure>;
}

export function HandoverVisual() {
  return <div className={`${ui.visual} ${ui.handover}`}>
    <div className={ui.sceneLabel}><span>Project workspace</span><span>Handover</span></div>
    <div className={ui.card}>
      <div className={ui.header}><span className={ui.heading}>Your working system</span><span className={ui.pill}>Yours</span></div>
      <div className={`${ui.surface} ${ui.fileList}`}>
        {[
          ['The build', 'Code, prompts and integrations'],
          ['The checks', 'Evaluations and monitoring'],
          ['The operation', 'Infrastructure and runbooks'],
          ['The knowledge', 'Training and handover'],
        ].map(([label,value])=><div key={label}><span className={ui.fileIcon} aria-hidden="true"/><div><p>{label}</p><span className={ui.muted}>{value}</span></div><span className={ui.check} aria-label="Included">✓</span></div>)}
      </div>
      <p className={ui.cardFooter}>In your repository. Under your license.</p>
    </div>
  </div>;
}
