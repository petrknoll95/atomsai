import { assetPath } from '@/lib/base-path';
export interface StoryPortrait {
  src: string;
  srcSet: string;
  alt: string;
}
export interface CustomerStory {
  id: string;
  company: string;
  product: string;
  productHref: string;
  logo?: string;
  name: string;
  role: string;
  quote: string;
  portrait: StoryPortrait;
  metrics: { before?: string; value: string; description: string }[];
}
const storyImage = (name: string, alt: string): StoryPortrait => ({
  src: assetPath(`/assets/stories/${name}-960.webp`),
  srcSet: assetPath(`/assets/stories/${name}-480.webp 480w, /assets/stories/${name}-960.webp 960w`),
  alt,
});

// Client-supplied testimonials, approved on 16 November 2026, with illustrative industry photography.
export const customerStories: readonly CustomerStory[] = [
  {
    id: 'pinegrove', company: 'Pinegrove Realty', product: 'JustCall', productHref: 'https://justcall.io/',
    name: 'Marco Bellini', role: 'Owner, Pinegrove Realty',
    quote: '“Every new lead gets a call back in under a minute, in English or Spanish. We stopped losing weekend inquiries to whoever picked up first.”',
    portrait: storyImage('pinegrove-property', 'A cream house with a green front door and a shaded garden'),
    metrics: [
      { value: '38%', description: 'Faster lead response' },
      { value: '12h', description: 'Hours saved / week' },
    ],
  },
  {
    id: 'brightline', company: 'Brightline Plumbing', product: 'ServiceAgent', productHref: 'https://serviceagent.ai/',
    name: 'Dana Whitfield', role: 'Operations manager, Brightline Plumbing',
    quote: '“After-hours calls used to hit voicemail. Now emergencies are booked and dispatched before my techs are even awake.”',
    portrait: storyImage('brightline-plumbing', 'A plumber working on the copper pipes under a utility sink'),
    metrics: [
      { value: '27%', description: 'More jobs booked' },
      { value: '15h', description: 'Hours saved / week' },
    ],
  },
  {
    id: 'kestrel', company: 'Kestrel Freight', product: 'AtomsAI engineers', productHref: '/approach',
    name: 'Theo Marchetti', role: 'Engineering lead, Kestrel Freight',
    quote: '“AtomsAI built a voice workflow on top of our own dispatch stack. It went to production in six weeks, not six months.”',
    portrait: storyImage('kestrel-freight', 'A white freight truck at a warehouse loading bay'),
    metrics: [
      { value: '52%', description: 'Calls handled by AI' },
      { value: '30h', description: 'Hours saved / week' },
    ],
  },
];
export const storyPortraits = customerStories.map(story => story.portrait);
export const storySlots = customerStories.map(story => story.id);
