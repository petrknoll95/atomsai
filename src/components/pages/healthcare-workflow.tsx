'use client';

import { ArrowIcon } from '@/components/arrow-icon';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './healthcare.module.css';

const scenarios = [
  { label: 'Move an appointment', tag: 'Scheduling', title: 'A change of plan. A clear next step.', description: 'Offer real availability, confirm the patient’s choice and keep the practice record up to date.', input: '“Could I move my Thursday appointment?”', steps: ['Verify the patient', 'Check provider availability', 'Confirm the new time'], result: 'Appointment moved', detail: 'Tuesday · 4:00 pm', note: 'Same provider · confirmation sent', next: 'Offer the freed slot to the waitlist, following your consent and contact rules.' },
  { label: 'Answer a billing question', tag: 'Billing support', title: 'An explanation, without another callback.', description: 'Use the patient’s verified account to explain a statement. Pass disputed or unclear charges to your billing team.', input: '“Can you help me understand this statement?”', steps: ['Verify the patient', 'Read the statement', 'Explain the listed charges'], result: 'Next step shared', detail: 'Secure payment link', note: 'Sent through the approved channel', next: 'Route disputes and account exceptions to billing, with the question and account context attached.' },
  { label: 'Bring in your team', tag: 'Staff handoff', title: 'Know when a person should take over.', description: 'An administrative workflow should know its limits. Clinical questions follow the routing rules agreed with your team.', input: '“I’d like to speak to someone about my symptoms.”', steps: ['Recognise a clinical question', 'Follow the escalation rules', 'Share context with your team'], result: 'Routed to your team', detail: 'Clinical question', note: 'No medical advice provided by the agent', next: 'Your clinical team decides what happens next. Urgent concerns follow the escalation process you define.' },
];

export function HealthcareWorkflow() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const item = scenarios[selected];
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % scenarios.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + scenarios.length - 1) % scenarios.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = scenarios.length - 1;
    else return;
    event.preventDefault(); setSelected(next); tabs.current[next]?.focus();
  }
  return <div className={styles.workflow}>
    <div className={styles.workflowChooser}><div role="tablist" aria-label="Explore patient workflows" aria-orientation="vertical" className={styles.workflowTabs}>{scenarios.map((scenario, index) => <button ref={element => { tabs.current[index] = element; }} key={scenario.label} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1} onKeyDown={event => handleKey(event, index)} onClick={() => setSelected(index)} className={styles.workflowTab}><span className={styles.tabNumber}>0{index + 1}</span><span>{scenario.label}</span><span className={styles.tabArrow} aria-hidden="true"><ArrowIcon direction="up-right" /></span></button>)}</div><p className={styles.caption}>Illustrative workflows.<br />No patient data or live system is connected.</p></div>
    {scenarios.map((scenario,index) => <div key={scenario.label} role="tabpanel" hidden={selected !== index} id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} tabIndex={0} className={styles.workflowPanel}>
      {selected === index && <><div className={styles.workflowPanelIntro}><span className={styles.workflowTag}>{item.tag}</span><h3 className={`display ${styles.workflowHeading}`}>{item.title}</h3><p>{item.description}</p></div><div className={styles.workflowDiagram}><div className={styles.request}><span className={styles.microLabel}>Patient request</span><p>{item.input}</p></div><div className={styles.processSteps}>{item.steps.map((step,stepIndex) => <div key={step}><span className={styles.stepDot}>{stepIndex + 1}</span><p>{step}</p></div>)}</div><div className={styles.result}><div className={styles.resultStatus}><span aria-hidden="true">✓</span>{item.result}</div>{selected === 0 ? <div className={styles.appointment}><div className={styles.calendarDay}><span>Tuesday</span><strong className="display">4:00</strong><span>pm</span></div><div><span className={styles.microLabel}>Routine visit</span><p>Same provider</p><span className={styles.previousTime}>Thursday · 3:00 pm</span></div></div> : <p className={`display ${styles.resultDetail}`}>{item.detail}</p>}<p>{item.note}</p></div></div><div className={styles.workflowNext}><span>And then?</span><p>{item.next}</p></div></>}
    </div>)}
  </div>;
}
