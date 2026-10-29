import { ButtonLink, Eyebrow } from "../ui";
import styles from "./lower.module.css";
import { AskQuestion } from "./ask-question";

const contactUrl = "/company/contact";

// Only the second answer is supplied in Figma. The other expanded states offer
// navigation to the page or the verified contact destination, without new claims.
const questions = [
  {
    question: "How do Applications, PyAI and AI Services fit together?",
    answer: <>Explore the <a className="link-underline" href="#offerings">three starting points</a> to compare applications, infrastructure and custom engineering.</>,
  },
  {
    question: "Can I use a product without a custom project?",
    answer: <>Yes. You can use our applications without a custom engineering project. Explore each product to find the right fit. Custom engineering is an option when an existing product doesn’t cover what you need.</>,
  },
  {
    question: "Which application fits my team?",
    answer: <>Start with the <a className="link-underline" href="#applications">applications</a> to explore the available products.</>,
  },
  {
    question: "Can I build PyAI into my own product?",
    answer: <>Explore <a className="link-underline" href="https://pyai.com/">PyAI infrastructure</a>, or <a className="link-underline" href={contactUrl}>contact the team</a> about your product.</>,
  },
  {
    question: "Can you work with our existing systems?",
    answer: <><a className="link-underline" href={contactUrl}>Contact the team</a> to discuss your existing systems and the work you have in mind.</>,
  },
  {
    question: "How do you handle our data requirements?",
    answer: <><a className="link-underline" href={contactUrl}>Contact the team</a> to discuss the data requirements for your project.</>,
  },
  {
    question: "How much can an AI system do on its own?",
    answer: <><a className="link-underline" href={contactUrl}>Discuss your use case with the team</a> to explore the level of automation you need.</>,
  },
];

export function Faq() {
  return (
    <section className={styles.faq} id="faq" aria-labelledby="faq-heading">
      <div className={`page-container ${styles.faqGrid}`}>
        <div className={styles.faqIntro}>
          <div className={styles.faqHeader}>
            <Eyebrow href={contactUrl}>FAQ</Eyebrow>
            <h2 className={`display ${styles.faqHeading}`} id="faq-heading">
              <span>A few things to know first.</span>
              <span>Choose a starting point with a clearer picture of what comes next.</span>
            </h2>
          </div>
          <ButtonLink href="/trust">Visit the Trust Center</ButtonLink>
        </div>
        <div className={styles.questions}>
          {questions.map(({ question, answer }, index) => (
            <details className={styles.question} key={question} name="home-faq" open={index === 1}>
              <summary>
                <span>{question}</span>
                <span className={styles.questionIcon} aria-hidden="true">
                  <img className={styles.openIcon} src="/assets/figma/faq-IconArtwork.svg" width="24" height="24" alt="" />
                  <img className={styles.closeIcon} src="/assets/figma/faq-IconArtwork1.svg" width="24" height="24" alt="" />
                </span>
              </summary>
              <div className={styles.answerClip}>
                <p className={styles.answer}>{answer}</p>
              </div>
            </details>
          ))}
          <AskQuestion />
        </div>
      </div>
    </section>
  );
}
