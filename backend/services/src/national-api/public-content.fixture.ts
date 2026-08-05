export interface PublicFaqFixture {
  id: string;
  questionKey: string;
  answerKey: string;
  category: "registry" | "governance" | "deployment" | "open_source";
  publicationStatus: "synthetic_demo";
  contentVersion: string;
}

const FAQ_ROWS: Array<[number, string, string, PublicFaqFixture["category"]]> = [
  [1, "faqQ1", "faqA1", "registry"],
  [2, "faqQ2", "faqA2", "registry"],
  [3, "faqQ3", "faqA3", "deployment"],
  [4, "faqQ4", "faqA4", "deployment"],
  [5, "faqQ5", "faqA5", "governance"],
  [6, "faqQ6", "faqA6", "deployment"],
  [7, "faqQ7", "faqA7", "open_source"],
  [8, "faqQ8", "faqA8", "open_source"],
  [9, "faqQ9", "faqA9", "governance"],
];

export const PUBLIC_FAQ_FIXTURE: PublicFaqFixture[] = FAQ_ROWS.map(([id, questionKey, answerKey, category]) => ({
  id: `faq-demo-${id}`,
  questionKey,
  answerKey,
  category,
  publicationStatus: "synthetic_demo",
  contentVersion: "champa-content-demo-v1",
}));
