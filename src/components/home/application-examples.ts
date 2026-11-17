// Authored examples from the V2 direction, not recordings or live product output.
export const justCallExamples = [
  { label: 'Interrupt', caller: 'Before the plans — is there a contract?', reply: 'No contract. You can cancel any month. Shall I go through the plans?', followUp: 'Yes, go ahead.' },
  { label: 'Switch language', caller: 'Can we do this in Hindi?', reply: 'Bilkul. Aap kis plan ke baare mein jaanna chahenge?', followUp: 'Plus plan batao.' },
  { label: 'Follow up', caller: 'Can you text me the plan details?', reply: 'Sure. I’ll send the details to this number.', followUp: 'Thanks — that helps.' },
];

export const serviceAgentExamples = [
  { label: 'Repair request', request: 'My AC stopped cooling. Can someone come today?', steps: [
    { title: 'Capture the request', detail: 'AC not cooling · Same-day visit requested' },
    { title: 'Check the calendar', detail: 'Offer an available technician and time window' },
    { title: 'Prepare the job', detail: 'Attach the caller’s details and send a confirmation' },
  ] },
  { label: 'Reschedule', request: 'Can we move my service visit to Thursday?', steps: [
    { title: 'Find the visit', detail: 'Match the caller to the existing booking' },
    { title: 'Check availability', detail: 'Offer available Thursday appointment slots' },
    { title: 'Update the booking', detail: 'Save the new time and confirm it with the customer' },
  ] },
  { label: 'Billing question', request: 'I have a question about the charge on my invoice.', steps: [
    { title: 'Identify the invoice', detail: 'Capture the customer and invoice reference' },
    { title: 'Record the question', detail: 'Keep the disputed charge and call notes together' },
    { title: 'Hand off with context', detail: 'Route the request to the billing team for review' },
  ] },
];

export const pyaiFields = [
  { label: 'Intent', field: 'intent' },
  { label: 'Day', field: 'day' },
  { label: 'Language', field: 'language' },
] as const;
