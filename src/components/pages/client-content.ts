import about from '@/content/client-pages/about.json';
import careers from '@/content/client-pages/careers.json';
import applications from '@/content/client-pages/applications.json';
import infrastructure from '@/content/client-pages/infrastructure.json';
import services from '@/content/client-pages/ai-services.json';
import testimonials from '@/content/client-pages/testimonials.json';
import stories from '@/content/client-pages/success-stories.json';
import press from '@/content/client-pages/press.json';
import help from '@/content/client-pages/help.json';
import trust from '@/content/client-pages/trust.json';
import blog from '@/content/client-pages/blog.json';

export type ContentLink = { label: string; href: string };
export type ContentBlock = {
  title: string; body: string[]; links: ContentLink[]; list: string[];
  label?: string; category?: string; tags?: string[]; quote?: string;
  attribution?: string; metric?: string; company?: string; industry?: string;
};
export type ContentSection = {
  id: string; title: string; label: string; intro: string[]; blocks: ContentBlock[];
  links: ContentLink[]; kind: string; items?: string[]; stats?: { value: string; label: string }[];
  examples?: { label: string; code: string }[];
};
export type ContentPage = {
  label: string; route: string; title: string; intro: string[]; actions: ContentLink[];
  sections: ContentSection[]; stats?: { value: string; label: string }[];
  closing: { title: string; body: string[]; links: ContentLink[] };
  featured?: ContentBlock;
};

export const clientPages: Record<string, ContentPage> = {
  about, careers, applications, infrastructure, services, testimonials, stories, press, help, trust, blog,
};
