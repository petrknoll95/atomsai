import type { CallLine } from '@/lib/scripted-call-player';
import { assetPath } from '@/lib/base-path';

// Scripted demos from the client artifact (16 Nov). Names match our existing JustCall UI.
const lines = (...turns: [CallLine['speaker'], string][]): CallLine[] => turns.map(([speaker, text]) => ({ speaker, text }));
const recordedLines = (scenario: string, ...turns: [CallLine['speaker'], string][]): CallLine[] => lines(...turns).map((line, index) => ({ ...line, audio: assetPath(`/assets/demos/serviceagent/${scenario}-${index + 1}.mp3`) }));
export const justCallExamples = [
  { label: 'Interrupt', lines: lines(
    ['agent', 'Hi Priya, it’s Steven from Northstar about your quote. We have three plans —'],
    ['caller', 'Sorry, quick question first: is there a contract?'],
    ['agent', 'No contract. You can cancel any month. Want the plan details?'],
    ['caller', 'Yes, go ahead.']),
    states: ['Calling…', 'Interrupted · Listening', 'Answering', 'Back on track'],
    outcome: 'Interruption handled · Intent: pricing · CRM updated', sms: 'Plan details' },
  { label: 'Switch language', lines: lines(
    ['agent', 'Hi Priya, it’s Steven from Northstar about your quote.'],
    ['caller', 'Can we do this in Hindi?'],
    ['agent', 'Bilkul. Aapke quote mein teen plans hain.'],
    ['caller', 'Theek hai, Plus plan batao.']),
    states: ['Calling…', 'Language change', 'Speaking Hindi', 'Hindi · Plan: Plus'],
    outcome: 'Language: Hindi · Interest: Plus plan · CRM updated', sms: 'Plus plan details (Hindi)' },
  { label: 'Follow up', lines: lines(
    ['agent', 'The Plus plan includes 3 numbers and call recording.'],
    ['caller', 'Can you text me all of that?'],
    ['agent', 'Sure. Sending the details to this number now.'],
    ['caller', 'Got it, thanks.']),
    states: ['On call', 'SMS requested', 'Preparing text', 'Ready to send'],
    outcome: 'Follow-up: SMS · Activity logged in CRM', sms: 'Plan details sent' },
];

// Cues use a zero-based recording index and the time within that clip, in seconds.
export const serviceAgentExamples = [
  { label: 'Repair request', request: 'There’s water dripping through my kitchen ceiling.', steps: [
    { title: 'Capture the request', detail: 'Water leak · Emergency repair requested' },
    { title: 'Make it safe', detail: 'Guide the caller to turn off the main water valve' },
    { title: 'Technician dispatched', detail: 'Rafael · ETA 07:40 · Text confirmation' },
  ], recordFields: [
    { label: 'Job', value: 'Emergency water leak', cue: [0, 3.75] },
    { label: 'Technician', value: 'Rafael', cue: [3, 3.02] },
    { label: 'Arrival', value: '07:40', cue: [3, 4.58] },
    { label: 'Follow-up', value: 'Text when on the way', cue: [3, 6.28] },
  ], lines: recordedLines('repair',
    ['caller', 'Hi, sorry to call so early. There’s water dripping through my kitchen ceiling, and I’m not sure what to do.'],
    ['agent', 'No problem at all, we’ll get this sorted. First, can you turn off the main water valve? It’s usually under the sink.'],
    ['caller', 'Okay, I’ve just turned it off. Thank you.'],
    ['agent', 'Perfect, that will stop it getting worse. Rafael can be with you by seven forty, and I’ll text you when he’s on his way.']),
    outcome: 'Dispatched · ETA 07:40', outcomeCue: [3, 4.58] },
  { label: 'Reschedule', request: 'Can we move Thursday’s AC service to Friday?', steps: [
    { title: 'Find the visit', detail: 'Match the caller to the existing booking' },
    { title: 'Check availability', detail: 'Friday · 09:00 or 13:00' },
    { title: 'Booking updated', detail: 'Friday · 13:00 · Same technician · Confirmation sent' },
  ], recordFields: [
    { label: 'Visit', value: 'AC service', cue: [0, 4.5] },
    { label: 'New time', value: 'Friday at 13:00', cue: [3, 1.86] },
    { label: 'Technician', value: 'Same technician', cue: [3, 2.82] },
    { label: 'Follow-up', value: 'Confirmation text sent', cue: [3, 4.65] },
  ], lines: recordedLines('reschedule',
    ['caller', 'Hi there. Something came up at work, so I can’t make Thursday’s AC service. Is Friday possible?'],
    ['agent', 'Of course, happy to move it. On Friday I have nine in the morning or one in the afternoon.'],
    ['caller', 'One o’clock would be great, thanks.'],
    ['agent', 'You’re all set for Friday at one, with the same technician. I’ve sent a confirmation to your phone.']),
    outcome: 'Moved · Fri 13:00', outcomeCue: [3, 1.86] },
  { label: 'Billing question', request: 'I have a question about the charge on my invoice.', steps: [
    { title: 'Identify the invoice', detail: 'Charge higher than the quote' },
    { title: 'Explain the charge', detail: '$40 · Replacement breaker' },
    { title: 'Invoice sent', detail: 'Itemized invoice and payment link sent by text' },
  ], recordFields: [
    { label: 'Invoice', value: 'Received', cue: [0, 2.16] },
    { label: 'Charge', value: '$40 for a replacement breaker', cue: [1, 4] },
    { label: 'Delivered by', value: 'Text message', cue: [2, 2.46] },
    { label: 'Included', value: 'Itemized invoice and payment link', cue: [3, 2.46] },
  ], lines: recordedLines('billing',
    ['caller', 'Hi, I just got my invoice, and it’s a little higher than the quote. Could you help me understand why?'],
    ['agent', 'Of course. The extra forty dollars is for a breaker the electrician replaced while he was there.'],
    ['caller', 'Ah, that makes sense. Could you text me the itemized invoice?'],
    ['agent', 'Sure, it’s on its way now, with a payment link you can use whenever it suits you.']),
    outcome: 'Invoice sent', outcomeCue: [3, 1.66] },
] as const;

export const pyaiFields = [
  { label: 'Intent', field: 'intent' },
  { label: 'Day', field: 'day' },
  { label: 'Language', field: 'language' },
] as const;
