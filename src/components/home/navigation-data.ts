export type MenuLink = { label: string; href: string; children?: readonly (readonly string[])[]; overviewLabel?: string };

export const products = [
  { name: 'JustCall', mark: 'justcall-mark.svg', href: 'https://justcall.io/', description: 'Calls, messages and AI for sales and support.' },
  { name: 'Helpwise', mark: 'helpwise-mark.svg', href: 'https://helpwise.io/', description: 'One shared inbox for customer conversations.' },
  { name: 'ServiceAgent', mark: 'serviceagent-mark.svg', href: 'https://serviceagent.ai/', description: 'AI for calls, bookings and home-service admin.' },
  { name: 'CallPage', mark: 'callpage-mark.svg', href: 'https://www.callpage.io/', description: 'Turn website visits into callbacks and meetings.' },
] as const;
export const navigationLinks = [
  { label: 'Applications', href: '/#applications', children: products.map(({ name, href }) => [name, href]) },
  { label: 'Infrastructure', href: 'https://pyai.com/', children: [['Explore PyAI', 'https://pyai.com/'], ['Try the playground', 'https://pyai.com/playground']] },
  { label: 'AI Services', href: '/approach' },
  { label: 'Industries', href: '/#industries', children: [
    ['Manufacturing', 'https://atomsai.com/industries/manufacturing'],
    ['Insurance', 'https://atomsai.com/industries/insurance'],
    ['Healthcare', '/industries/healthcare'],
    ['Logistics', 'https://atomsai.com/industries/logistics'],
    ['Lending', 'https://atomsai.com/industries/lending'],
    ['Real estate', 'https://atomsai.com/industries/real-estate'],
    ['Auto dealers', 'https://atomsai.com/industries/auto-dealers'],
    ['Retail & e-commerce', 'https://atomsai.com/industries/retail'],
  ] },
  { label: 'Resources', href: 'https://atomsai.com/resources', children: [
    ['Case studies', 'https://atomsai.com/resources/case-studies'],
    ['Blog', '/blog'],
    ['Help center', '/#faq'],
    ['Website updates', 'https://atomsai.com/changelog'],
  ] },
  { label: 'Company', href: 'https://atomsai.com/company', overviewLabel: 'Company overview', children: [
    ['About us', 'https://atomsai.com/company/about'],
    ['Careers', 'https://atomsai.com/company/careers'],
    ['Contact us', '/company/contact'],
    ['Trust Center', '/trust'],
    ['Brand', 'https://atomsai.com/brand'],
  ] },
];

