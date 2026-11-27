import source from '@/content/client-pages/ai-services.json';
import type { ContentPage, ContentSection } from './client-content';

/** The order record that the five workflow steps fill in (prototype ai-services.html). */
export type OrderRecord = { title: string; reference: string; rows: { label: string; value: string; previous?: string }[]; status: string };
/** One column of the integration diagram: its caption and its nodes. */
export type DiagramColumn = { label: string; items: string[] };
export type ApproachSection = ContentSection & { record?: OrderRecord; diagram?: DiagramColumn[] };
export type ApproachContent = Omit<ContentPage, 'sections'> & { sections: ApproachSection[] };

export const approachContent = source as unknown as ApproachContent;

export function approachSection(id: string): ApproachSection {
  const section = approachContent.sections.find(entry => entry.id === id);
  if (!section) throw new Error(`ai-services.json is missing section "${id}"`);
  return section;
}
