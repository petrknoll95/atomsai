export interface StoryPortrait {
  src: string;
  srcSet: string;
  alt: string;
}
export interface CustomerStory {
  id: string;
  company: string;
  logo?: string;
  name: string;
  role: string;
  quote: string;
  portrait: StoryPortrait;
  metrics: { before?: string; value: string; description: string }[];
}
const stockPortrait = (name: string, alt: string): StoryPortrait => ({
  src: `/assets/stories/${name}-960.webp`,
  srcSet: `/assets/stories/${name}-480.webp 480w, /assets/stories/${name}-960.webp 960w`,
  alt,
});

// The original supplied Northwind story is retained. Additional stories are
// illustrative demo copy, not customer claims; stock subjects are not endorsers.
export const customerStories: readonly CustomerStory[] = [
  {
    id: 'northwind', company: 'Northwind Logistics', logo: '/assets/figma/stories-Company.svg',
    name: 'Aaron Vasquez', role: 'Global Operations Manager',
    quote: '“The evals are what sold my board. I can show a number for accuracy and a number for cost, per workflow, per month.”',
    portrait: { src: '/assets/figma/stories-Media.webp', srcSet: '/assets/figma/stories-Media-512.webp 512w, /assets/figma/stories-Media-1024.webp 1024w, /assets/figma/stories-Media.webp 2048w', alt: 'Aaron Vasquez seated beside a plinth' },
    metrics: [
      { before: '78%', value: '94%', description: 'Invoice auto-match rate on 40k invoices/quarter' },
      { before: '5 days', value: '4 hours', description: 'Month-end audit prep\nfirst two quarters' },
      { value: '−81%', description: 'Cost per processed document vs. prior BPO rate' },
    ],
  },
  {
    id: 'linden-demo', company: 'Linden Commerce', name: 'Maya Chen', role: 'Head of Customer Experience',
    quote: '“Our inbox used to run the day. Now every conversation has an owner, and our team has time to make the answer count.”',
    portrait: stockPortrait('abigail-boone', 'Stock portrait of a smiling seated woman against a light gray background'),
    metrics: [
      { before: '4 hours', value: '12 min', description: 'First-response time across support channels' },
      { value: 'One inbox', description: 'Email, chat and customer context in one shared workspace' },
      { value: '−42%', description: 'Reduction in repeat customer contacts' },
    ],
  },
  {
    id: 'fieldwork-demo', company: 'Fieldwork Services', name: 'Daniel Brooks', role: 'Director of Service Operations',
    quote: '“When the team is out on a job, the phone still gets answered. Customers can book a visit without waiting for us to call back.”',
    portrait: stockPortrait('brauer', 'Stock studio portrait of a smiling man seated on a stool against a light gray backdrop'),
    metrics: [
      { value: '24/7', description: 'An always-available first point of contact for service calls' },
      { before: '3 steps', value: '1 call', description: 'From the initial enquiry to a confirmed appointment' },
      { value: '+28%', description: 'Increase in enquiries converted to bookings' },
    ],
  },
  {
    id: 'clearpath-demo', company: 'Clearpath Assurance', name: 'Emma Wilson', role: 'Head of Claims Transformation',
    quote: '“We spend less time finding the right document and more time making the right decision. The evidence stays with every answer.”',
    portrait: stockPortrait('ageing-better', 'Stock studio portrait of a smiling woman in a beige jumpsuit seated against a pale gray backdrop'),
    metrics: [
      { before: '2 days', value: '30 min', description: 'Time to prepare a claim for review' },
      { value: 'One view', description: 'Policy details, documents and supporting evidence together' },
      { value: '−60%', description: 'Reduction in manual document handling' },
    ],
  },
];
export const storyPortraits = customerStories.map(story => story.portrait);
export const storySlots = customerStories.map(story => story.id);
