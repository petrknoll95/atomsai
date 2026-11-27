import type { ReactNode } from 'react';
import { ArrowIcon } from '@/components/arrow-icon';
import { SceneCanvas, SceneEvent, SceneLine, SceneMuted, ScenePill, ScenePills, SceneRow, SceneSoft, SceneWindow } from './scene-kit';
import styles from './applications-scenes.module.css';

/*
 * One picture per step of the two Applications chapters, in the homepage
 * "Now it's your turn" language: two pale windows on a faint dashboard outline,
 * the second dropped and joined by a small arrow. Words come from the page's own
 * copy (step bodies, the hero events, the "Every hello" lists and the ServiceAgent
 * trade note) plus plain interface labels. People are neutral placeholders.
 */

const serviceAgent = 'serviceagent-mark.svg';
const justCall = 'justcall-mark.svg';

/** Two windows: the first sits high, the second drops and is joined by an arrow. */
function Pair({ first, second }: { first: ReactNode; second: ReactNode }) {
  return <SceneCanvas width={44}>
    <div className={styles.pair}>
      <div className={styles.first}>{first}</div>
      <div className={styles.second}>
        <span className={styles.connector}><ArrowIcon size="1.25em" /></span>
        {second}
      </div>
    </div>
  </SceneCanvas>;
}

/** Label beside value, ruled like the homepage call outcome. */
function Record({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return <dl className={styles.record}>{rows.map(([label, value], index) => <div key={index}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function Result({ children }: { children: ReactNode }) {
  return <p className={styles.result}>{children}</p>;
}

function Person({ name, role }: { name: string; role?: ReactNode }) {
  return <div className={styles.person}>
    <span className={styles.avatar}>{name.split(' ').map(part => part[0]).join('')}</span>
    <span className={styles.personText}><span>{name}</span>{role && <SceneMuted>{role}</SceneMuted>}</span>
  </div>;
}

function Check({ done = true }: { done?: boolean }) {
  return <span className={styles.check} data-done={done}>
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={done ? 'm5 10.5 3.2 3.2L15 7' : 'M6 10h.1m3.9 0h.1m3.9 0h.1'} />
    </svg>
  </span>;
}

/** States in order, each with a check and a trailing pill. */
function Progress({ steps }: { steps: { label: string; state: ReactNode; done?: boolean }[] }) {
  return <ol className={styles.progress}>{steps.map(step => <li key={step.label}>
    <Check done={step.done ?? true} /><span>{step.label}</span><span className={styles.progressState}>{step.state}</span>
  </li>)}</ol>;
}

function Meter({ value, of = 5 }: { value: number; of?: number }) {
  return <span className={styles.meter}>{Array.from({ length: of }, (_, index) => <i key={index} data-on={index < value} />)}</span>;
}

/* ---------- ServiceAgent ---------- */

const serviceAgentScenes: ReactNode[] = [
  // Know what the job needs: the call answered at night, the job and its urgency captured.
  <Pair key="job" first={<SceneWindow title="Incoming call" meta="11:48 pm">
    <SceneSoft><p className={styles.request}>“Can someone come today?”</p><SceneMuted>Olivia Bennett</SceneMuted></SceneSoft>
    <ScenePills><ScenePill live>Call answered</ScenePill></ScenePills>
  </SceneWindow>} second={<SceneWindow title="Job details" mark={serviceAgent} meta={<ScenePill tone="ink">Urgent</ScenePill>}>
    <Result>Job details and urgency captured</Result>
    <Record rows={[['Trade', 'HVAC'], ['Issue', 'AC breakdown'], ['Customer', 'Olivia Bennett'], ['Urgency', 'Today']]} />
  </SceneWindow>} />,

  // Get the right visit booked: technician availability, a schedule change, the visit booked.
  <Pair key="visit" first={<SceneWindow title="Technicians" meta="Today">
    <div className={styles.rows}>
      <SceneRow end={<ScenePill tone="success">7:30 am</ScenePill>}><Person name="Ethan Brooks" role="HVAC" /></SceneRow>
      <SceneRow end={<SceneMuted>Rescheduled</SceneMuted>}><Person name="Sophia Reed" role="Plumbing" /></SceneRow>
      <SceneRow end={<SceneMuted>Available</SceneMuted>}><Person name="Daniel Moore" role="Electrical" /></SceneRow>
    </div>
  </SceneWindow>} second={<SceneWindow title="Appointment" mark={serviceAgent} meta={<ScenePill tone="success">Booked</ScenePill>}>
    <Result>Visit booked around the crew</Result>
    <Record rows={[['Job', 'AC breakdown'], ['Technician', 'Ethan Brooks'], ['Arrival', '7:30 am']]} />
    <SceneEvent>Tech notified</SceneEvent>
  </SceneWindow>} />,

  // Keep customers in the loop: confirmation and reminder sent; the job at hand when she calls back.
  <Pair key="loop" first={<SceneWindow title="Messages" meta="Olivia Bennett">
    <div className={styles.thread}>
      <SceneLine speaker="Confirmation" side="end">Booked for 7:30 am, tech notified</SceneLine>
      <SceneEvent>Reminder sent</SceneEvent>
      <SceneLine speaker="Update" side="end">Ethan Brooks, 7:30 am</SceneLine>
    </div>
  </SceneWindow>} second={<SceneWindow title="Incoming call" mark={serviceAgent} meta={<ScenePill live>Calling back</ScenePill>}>
    <Person name="Olivia Bennett" role="Customer" />
    <Record rows={[['Job', 'AC breakdown'], ['Technician', 'Ethan Brooks'], ['Arrival', '7:30 am'], ['Status', <ScenePill key="s" tone="success">Booked</ScenePill>]]} />
  </SceneWindow>} />,

  // See the job through to payment: estimate, invoice, payment and follow-up on one job.
  <Pair key="payment" first={<SceneWindow title="Job" meta="AC breakdown">
    <Person name="Olivia Bennett" role="Customer" />
    <Record rows={[['Technician', 'Ethan Brooks'], ['Visit', '7:30 am'], ['Trade', 'HVAC']]} />
  </SceneWindow>} second={<SceneWindow title="Estimate to payment" mark={serviceAgent} meta={<ScenePill tone="success">Paid</ScenePill>}>
    <Progress steps={[
      { label: 'Estimate', state: <ScenePill>Approved</ScenePill> },
      { label: 'Invoice', state: <ScenePill>Sent</ScenePill> },
      { label: 'Payment', state: <ScenePill tone="success">Paid</ScenePill> },
      { label: 'Follow-up', state: <SceneMuted>Scheduled</SceneMuted>, done: false },
    ]} />
  </SceneWindow>} />,

  // Make today's customers tomorrow's business: follow-ups, a review request, a return visit.
  <Pair key="return" first={<SceneWindow title="After the job" meta="This week">
    <div className={styles.rows}>
      <SceneRow end={<ScenePill tone="success">Review request</ScenePill>}><Person name="Olivia Bennett" role="AC breakdown" /></SceneRow>
      <SceneRow end={<ScenePill>Follow-up</ScenePill>}><Person name="James Turner" role="Plumbing repair" /></SceneRow>
      <SceneRow end={<ScenePill>Return visit</ScenePill>}><Person name="Grace Kim" role="Roof inspection" /></SceneRow>
    </div>
  </SceneWindow>} second={<SceneWindow title="Olivia Bennett" mark={serviceAgent} meta="Customer">
    <Progress steps={[
      { label: 'Job complete', state: <SceneMuted>AC breakdown</SceneMuted> },
      { label: 'Follow-up', state: <ScenePill>Sent</ScenePill> },
      { label: 'Review request', state: <ScenePill tone="success">Sent</ScenePill> },
      { label: 'Next visit', state: <SceneMuted>Suggested</SceneMuted>, done: false },
    ]} />
  </SceneWindow>} />,
];

/* ---------- JustCall ---------- */

const justCallScenes: ReactNode[] = [
  // Make the calling hour count: the three dialing modes, the queue, and the CRM context behind the next try.
  <Pair key="dialer" first={<SceneWindow title="Dialer" mark={justCall} meta={<ScenePill live>Calling</ScenePill>}>
    <ScenePills><ScenePill>Power</ScenePill><ScenePill tone="ink">Dynamic</ScenePill><ScenePill>Predictive</ScenePill></ScenePills>
    <div className={styles.rows}>
      <SceneRow end={<ScenePill tone="success">Connected</ScenePill>}><Person name="Sophia Reed" role="Prospect" /></SceneRow>
      <SceneRow end={<SceneMuted>Voicemail</SceneMuted>}><Person name="Daniel Moore" role="Prospect" /></SceneRow>
      <SceneRow end={<SceneMuted>Next</SceneMuted>}><Person name="Grace Kim" role="Prospect" /></SceneRow>
    </div>
  </SceneWindow>} second={<SceneWindow title="CRM record" meta="Prospect">
    <Person name="Sophia Reed" role="Form fill" />
    <Record rows={[['Last outcome', 'Voicemail'], ['Next attempt', 'Dynamic dialing'], ['This call', <ScenePill key="c" tone="success">Connected</ScenePill>]]} />
  </SceneWindow>} />,

  // Be there when customers call: route by need and availability, AI or the team.
  <Pair key="route" first={<SceneWindow title="Incoming call" meta="09:12">
    <Person name="Grace Kim" role="Customer" />
    <Record rows={[['Need', 'Support'], ['Team', 'Available'], ['Language', 'en-US · es-MX']]} />
  </SceneWindow>} second={<SceneWindow title="Routing" mark={justCall} meta="Inbound">
    <div className={styles.rows}>
      <SceneRow end={<ScenePill tone="success" live>Answering</ScenePill>}><span className={styles.rowTitle}>AI agent</span><SceneMuted>The calls you choose</SceneMuted></SceneRow>
      <SceneRow end={<ScenePill>Available</ScenePill>}><span className={styles.rowTitle}>Your team</span><SceneMuted>Ready to step in</SceneMuted></SceneRow>
    </div>
  </SceneWindow>} />,

  // Carry the conversation into SMS: a text on the outcome, a reply, all on the record.
  <Pair key="sms" first={<SceneWindow title="Customer record" meta="Grace Kim">
    <Progress steps={[
      { label: 'Call', state: <SceneMuted>Connected</SceneMuted> },
      { label: 'Text', state: <ScenePill>Sent</ScenePill> },
      { label: 'Reply', state: <ScenePill tone="success">Received</ScenePill> },
      { label: 'Follow-up', state: <SceneMuted>Scheduled</SceneMuted>, done: false },
    ]} />
  </SceneWindow>} second={<SceneWindow title="SMS" mark={justCall} meta="Grace Kim">
    <div className={styles.thread}>
      <SceneEvent>Follow-up text sent on the outcome</SceneEvent>
      <SceneLine speaker="Grace Kim">“You have my details, right?”</SceneLine>
      <SceneEvent>Call and text logged to the CRM</SceneEvent>
    </div>
  </SceneWindow>} />,

  // Give AI a job and a goal: what the voice agent knows and aims for, and when it hands off.
  <Pair key="agent" first={<SceneWindow title="AI voice agent" mark={justCall} meta={<ScenePill live>Live</ScenePill>}>
    <Person name="Steven Carter" role="Voice agent" />
    <Record rows={[['Job', 'Policy questions'], ['Knowledge', 'Warranty timelines'], ['Goal', 'Meetings booked']]} />
  </SceneWindow>} second={<SceneWindow title="Human handoff" meta={<ScenePill>Rule</ScenePill>}>
    <SceneSoft><SceneMuted>When</SceneMuted><p>A conversation needs a human touch</p></SceneSoft>
    <SceneRow end={<ScenePill tone="success">Hand to human</ScenePill>}><Person name="Maya" role="Your team" /></SceneRow>
  </SceneWindow>} />,

  // Make the next conversation better: the call logged and summarised, then scored for coaching.
  <Pair key="coach" first={<SceneWindow title="Call summary" mark={justCall} meta="14:05">
    <ScenePills><ScenePill>Recording</ScenePill><ScenePill>Transcript</ScenePill><ScenePill tone="ink">Summary</ScenePill></ScenePills>
    <Record rows={[['Outcome', 'Resolved'], ['Next step', 'Follow-up text'], ['Record', <ScenePill key="l" tone="success">Logged</ScenePill>]]} />
  </SceneWindow>} second={<SceneWindow title="Coaching" meta="Daniel Moore">
    <div className={styles.rows}>
      <SceneRow end={<SceneMuted>On the record</SceneMuted>}><span className={styles.rowTitle}>Summary</span></SceneRow>
      <SceneRow end={<Meter value={4} />}><span className={styles.rowTitle}>AI score</span></SceneRow>
      <SceneRow end={<ScenePill tone="success">Ready</ScenePill>}><span className={styles.rowTitle}>Coaching insights</span></SceneRow>
    </div>
  </SceneWindow>} />,
];

/** The five scenes for each chapter, in step order. */
export const productScenes: Record<string, ReactNode[]> = {
  serviceagent: serviceAgentScenes,
  justcall: justCallScenes,
};
