import { withBasePath, assetPath } from '@/lib/base-path';
import { ButtonLink, Eyebrow } from "../ui";
import styles from "./lower.module.css";
import { AskQuestion, type FaqEntry } from "./ask-question";
import type { ReactNode } from 'react';

const contactUrl = "/company/contact";

// Only the second answer is supplied in Figma. The other expanded states offer
// navigation to the page or the verified contact destination, without new claims.
const homeQuestions: readonly FaqEntry[] = [
  {
    question: "How do Applications, PyAI and AI Services fit together?",
    keywords: ['fit together', 'operating model', 'four layers', 'how atomsai works'],
    answer: <>Explore the <a className="link-underline" href={withBasePath("#offerings")}>four connected layers</a>: models and infrastructure, orchestration and workflows, applications, and custom engineering. Together, they connect AI capability to the work your business needs to do.</>,
  },
  {
    question: "Can I use a product without a custom project?",
    keywords: ['without a custom project', 'without a custom build', 'need a custom project', 'ready made product', 'standalone product', 'custom engineering'],
    answer: <>Yes. You can use our applications without a custom engineering project. Explore each product to find the right fit. Custom engineering is an option when an existing product doesn’t cover what you need.</>,
  },
  {
    question: "Which application fits my team?",
    keywords: ['which application', 'which product', 'available products', 'applications', 'what products'],
    answer: <>Start with the <a className="link-underline" href={withBasePath("#applications")}>applications</a> to explore the available products.</>,
  },
  {
    question: "Can I build PyAI into my own product?",
    keywords: ['build pyai', 'integrate pyai', 'own product', 'pyai api', 'pyai sdk'],
    answer: <>Explore <a className="link-underline" href={withBasePath("https://pyai.com/")}>PyAI infrastructure</a>, or <a className="link-underline" href={withBasePath(contactUrl)}>contact the team</a> about your product.</>,
  },
  {
    question: "Can you work with our existing systems?",
    keywords: ['existing systems', 'tech stack', 'integrations', 'integrate with', 'connect to', 'crm'],
    answer: <><a className="link-underline" href={withBasePath(contactUrl)}>Contact the team</a> to discuss your existing systems and the work you have in mind.</>,
  },
  {
    question: "How do you handle our data requirements?",
    keywords: ['data requirements', 'data handling', 'data protected', 'data protection', 'data residency', 'security', 'compliance', 'privacy', 'secure', 'retention', 'soc 2'],
    answer: <>See the <a className="link-underline" href={withBasePath('/trust')}>Trust Center</a> for security controls and product-specific documentation. <a className="link-underline" href={withBasePath(contactUrl)}>Contact the team</a> to discuss the data requirements for your project.</>,
  },
  {
    question: "How much can an AI system do on its own?",
    keywords: ['on its own', 'level of automation', 'human oversight', 'human in the loop', 'autonomy', 'escalation', 'handoff'],
    answer: <><a className="link-underline" href={withBasePath(contactUrl)}>Discuss your use case with the team</a> to explore the level of automation you need.</>,
  },
];

const additionalAnswers: readonly FaqEntry[] = [
  {
    question: 'Where should our team start with AI?',
    keywords: ['where should', 'where do we start', 'get started', 'getting started', 'small pilot', 'first workflow'],
    answer: <>Start with one workflow you want to improve. Explore the <a className="link-underline" href={withBasePath('#applications')}>available applications</a> or <a className="link-underline" href={withBasePath(contactUrl)}>talk to the team</a> about what a custom build could cover.</>,
  },
  {
    question: 'What is ServiceAgent?',
    keywords: ['serviceagent', 'service agent', 'front desk', 'home service', 'home services', 'dispatch'],
    answer: <>ServiceAgent helps home-service teams handle calls, bookings, and office work. <a className="link-underline" href={withBasePath('#applications')}>Listen to the ServiceAgent demos</a> for examples of dispatch, rescheduling, and billing.</>,
  },
  {
    question: 'What is JustCall?',
    keywords: ['justcall', 'just call', 'sales calls', 'support calls', 'send sms', 'switch languages'],
    answer: <>JustCall brings calls, messages, and AI together for sales and support teams. <a className="link-underline" href={withBasePath('#applications')}>Try the JustCall demo</a> to see language switching and follow-up by text.</>,
  },
  {
    question: 'What is PyAI?',
    keywords: ['pyai', 'py ai', 'speech to text', 'voice models', 'transcription', 'playground'],
    answer: <>PyAI is the voice infrastructure behind AtomsAI’s products. <a className="link-underline" href="https://pyai.com/playground">Open the PyAI Playground</a> to explore voice and transcription.</>,
  },
];

type FaqProps = {
  id?: string;
  label?: string;
  heading?: ReactNode;
  questions?: readonly FaqEntry[];
  showAskQuestion?: boolean;
};

export function Faq({
  id = 'faq',
  label = 'FAQ',
  heading = <><span>A few things to know first.</span><span>Choose a starting point with a clearer picture of what comes next.</span></>,
  questions = homeQuestions,
  showAskQuestion = true,
}: FaqProps = {}) {
  const group = `${id}-questions`;
  return (
    <section className={styles.faq} id={id} aria-labelledby={`${id}-heading`}>
      <div className={`page-container ${styles.faqGrid}`}>
        <div className={styles.faqIntro}>
          <div className={styles.faqHeader}>
            <Eyebrow href={contactUrl}>{label}</Eyebrow>
            <h2 className={`display ${styles.faqHeading}`} id={`${id}-heading`}>
              {heading}
            </h2>
          </div>
          <ButtonLink href="/trust">Visit the Trust Center</ButtonLink>
        </div>
        <div className={styles.questions}>
          {questions.map(({ question, answer }, index) => (
            <details className={styles.question} key={question} name={group} open={index === 1}>
              <summary>
                <span>{question}</span>
                <span className={styles.questionIcon} aria-hidden="true">
                  <img className={styles.openIcon} src={assetPath("/assets/figma/faq-IconArtwork.svg")} width="24" height="24" alt="" />
                  <img className={styles.closeIcon} src={assetPath("/assets/figma/faq-IconArtwork1.svg")} width="24" height="24" alt="" />
                </span>
              </summary>
              <div className={styles.answerClip}>
                <p className={styles.answer}>{answer}</p>
              </div>
            </details>
          ))}
          {showAskQuestion && <AskQuestion group={group} entries={questions === homeQuestions ? [...questions, ...additionalAnswers] : questions} />}
        </div>
      </div>
    </section>
  );
}
