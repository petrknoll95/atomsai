import { applicationsPath, infrastructurePath, navigationLinks, productNavHref, products, type MenuLink } from '@/components/home/navigation-data';

// Interior routes are local; the homepage keeps its existing navigation.
export const interiorNavigation: MenuLink[] = [
  { label: 'Applications', href: applicationsPath, children: products.map(product => [product.name, productNavHref(product)]) },
  { label: 'Infrastructure', href: infrastructurePath, children: [['Explore PyAI', infrastructurePath], ['Try the playground', 'https://pyai.com/playground'], ['Documentation', 'https://docs.pyai.com']] },
  { label: 'AI Services', href: '/approach' },
  navigationLinks.find(link => link.label === 'Use cases')!,
  { label: 'Resources', href: '/blog', overviewLabel: 'Notes from the field', children: [
    ['Success stories', '/customers/success-stories'], ['Testimonials', '/customers/testimonials'],
    ['Blog', '/blog'], ['Help center', '/help'],
  ] },
  { label: 'Company', href: '/company/about', overviewLabel: 'Company overview', children: [
    ['About us', '/company/about'], ['Careers', '/company/careers'], ['Contact us', '/company/contact'],
    ['Press & media', '/company/press'], ['Trust & Security', '/trust'], ['Brand', 'https://atomsai.com/brand'],
  ] },
];
