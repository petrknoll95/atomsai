export type MenuLink = { label: string; href: string; children?: readonly (readonly string[])[]; overviewLabel?: string };

export const homepageUseCases = [
  { name: 'Book service calls', slug: 'home-services', image: 'BackgroundImage3',
    description: 'Capture job inquiries, fill the calendar, and keep the office organized.' },
  { name: 'Coordinate patient visits', slug: 'healthcare', image: 'BackgroundImage1',
    description: 'Handle routine patient inquiries, coordinate appointments, and route requests to staff.' },
  { name: 'Follow up with customers', slug: 'financial-services', image: 'BackgroundImage2',
    description: 'Reach customers with context and manage timely, traceable follow-ups.' },
  { name: 'Answer admissions inquiries', slug: 'education', image: 'BackgroundImage',
    description: 'Respond to admissions inquiries and connect prospective students with advisors.' },
] as const;

// Preserve the anchors in previously shared homepage links.
export const useCaseLinks = homepageUseCases.map(({ name, slug }) => [name, `/#industry-${slug}`] as const);

export const applicationsPath = '/applications';
export const infrastructurePath = '/infrastructure';

// `href` is the product's own site, for deliberate outbound CTAs. Navigation
// uses `page` when the Applications overview has a section for the product.
export const products = [
  { name: 'JustCall', mark: 'justcall-mark.svg', href: 'https://justcall.io/', page: `${applicationsPath}#justcall`, description: 'Calls, messages and AI for sales and support.' },
  { name: 'Helpwise', mark: 'helpwise-mark.svg', href: 'https://helpwise.io/', description: 'One shared inbox for customer conversations.' },
  { name: 'ServiceAgent', mark: 'serviceagent-mark.svg', href: 'https://serviceagent.ai/', page: `${applicationsPath}#serviceagent`, description: 'AI for calls, bookings and home-service admin.' },
  { name: 'CallPage', mark: 'callpage-mark.svg', href: 'https://www.callpage.io/', description: 'Turn website visits into callbacks and meetings.' },
] as const;
export type Product = typeof products[number];
export const productNavHref = (product: Product): string => ('page' in product ? product.page : product.href);

export const navigationLinks = [
  { label: 'Applications', href: applicationsPath, children: products.map(product => [product.name, productNavHref(product)]) },
  { label: 'Infrastructure', href: infrastructurePath, children: [['Explore PyAI', infrastructurePath], ['Try the playground', 'https://pyai.com/playground']] },
  { label: 'AI Services', href: '/approach' },
  { label: 'Use cases', href: '/#industries', children: useCaseLinks },
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

