/**
 * Seeds the database with sample content (one sample file per section, plus
 * clarifications, news, FAQ, deadlines, glossary) and generates real PDFs so
 * the viewer, search and OCR fallbacks can be tested end to end.
 *
 * Usage: npm run db:seed
 */
import { mkdirSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { batch, nowIso, one, run } from "../src/lib/db";
import { storeAndProcess } from "../src/lib/process";
import { DEFAULT_SETTINGS } from "../src/lib/queries";

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysFromNow = (n: number) => iso(new Date(now.getTime() + n * 86400_000));

type Page = string[]; // array of paragraphs

async function makePdf(title: string, pages: Page[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let p = 0; p < pages.length; p++) {
    const page = doc.addPage([595, 842]); // A4
    let y = 792;
    page.drawText(title, { x: 56, y: 812, size: 9, font: bold, color: rgb(0.42, 0.34, 0.18) });
    page.drawText(`${p + 1}`, { x: 520, y: 812, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
    for (const paragraph of pages[p]) {
      const words = paragraph.split(/\s+/);
      let line = "";
      const lines: string[] = [];
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 10.5) > 480) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      for (const l of lines) {
        if (y < 60) break;
        page.drawText(l, { x: 56, y, size: 10.5, font, color: rgb(0.1, 0.1, 0.1) });
        y -= 15;
      }
      y -= 12;
    }
    page.drawText("Unofficial community sample — for the library demo only.", {
      x: 56,
      y: 36,
      size: 8,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  }
  return Buffer.from(await doc.save());
}

function repeatParagraph(text: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${text} (${i + 1})`);
}

const clue = (n: number) =>
  `Item ${n}. The arbitral tribunal notes that the parties disagreed on the scope of the arbitration agreement, and that the seat of arbitration was designated as a place where the courts have adopted the UNCITRAL Model Law on International Commercial Arbitration.`;

async function main() {
  mkdirSync("./data/uploads", { recursive: true });
  console.log("Seeding…");

  /* ---------------- settings ---------------- */
  await batch(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      sql: "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [key, value],
    })),
  );

  /* ---------------- sections ---------------- */
  const sections = [
    {
      id: "sec_case",
      slug: "case",
      nameAr: "القضية",
      nameEn: "The Case",
      descAr: "ملف القضية الرسمي، التوضيحات، الأوامر الإجرائية، الملاحق والمستندات.",
      descEn: "Official case file, clarifications, procedural orders, annexes and exhibits.",
      accent: "#0B3D2E",
      icon: "scale",
      order: 10,
    },
    {
      id: "sec_laws",
      slug: "laws",
      nameAr: "القوانين واللوائح",
      nameEn: "Laws & Rules",
      descAr: "الاتفاقيات والمعاهدات والقوانين النموذجية وقواعد التحكيم وقواعد المنافسة.",
      descEn: "Conventions, treaties, model laws, institutional arbitration rules and competition rules.",
      accent: "#1E4E8C",
      icon: "book-open",
      order: 20,
    },
    {
      id: "sec_books",
      slug: "books",
      nameAr: "الكتب والمراجع",
      nameEn: "Books & References",
      descAr: "الكتب والمقالات والشروح والمراجع الأكاديمية.",
      descEn: "Books, articles, commentaries and academic references.",
      accent: "#7A3E65",
      icon: "library",
      order: 30,
    },
  ];

  for (const s of sections) {
    await run(
      `INSERT INTO sections (id, slug, name_ar, name_en, description_ar, description_en, accent, icon, sort_order, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name_ar=excluded.name_ar, name_en=excluded.name_en,
         description_ar=excluded.description_ar, description_en=excluded.description_en,
         accent=excluded.accent, sort_order=excluded.sort_order`,
      [s.id, s.slug, s.nameAr, s.nameEn, s.descAr, s.descEn, s.accent, s.icon, s.order, nowIso()],
    );
  }

  /* ---------------- categories ---------------- */
  const categories = [
    ["cat_problem", "sec_case", "problem", "ملف القضية", "Problem", 10],
    ["cat_clar", "sec_case", "clarifications", "التوضيحات", "Clarifications", 20],
    ["cat_po", "sec_case", "procedural-orders", "الأوامر الإجرائية", "Procedural Orders", 30],
    ["cat_annex", "sec_case", "annexes", "الملاحق", "Annexes", 40],
    ["cat_conv", "sec_laws", "conventions", "الاتفاقيات", "Conventions", 10],
    ["cat_model", "sec_laws", "model-laws", "القوانين النموذجية", "Model Laws", 20],
    ["cat_rules", "sec_laws", "rules", "قواعد التحكيم", "Arbitration Rules", 30],
    ["cat_comp", "sec_laws", "competition-rules", "قواعد المنافسة", "Competition Rules", 40],
    ["cat_text", "sec_books", "textbooks", "كتب دراسية", "Textbooks", 10],
    ["cat_art", "sec_books", "articles", "مقالات", "Articles", 20],
    ["cat_comm", "sec_books", "commentaries", "شروح", "Commentaries", 30],
  ] as const;

  for (const [id, sectionId, slug, ar, en, order] of categories) {
    await run(
      `INSERT INTO categories (id, section_id, slug, name_ar, name_en, sort_order, created_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name_ar=excluded.name_ar, name_en=excluded.name_en, sort_order=excluded.sort_order`,
      [id, sectionId, slug, ar, en, order, nowIso()],
    );
  }

  /* ---------------- glossary ---------------- */
  const glossary = [
    ["gl_1", "التحكيم", "Arbitration", "طريقة لتسوية المنازعات يحسمها طرف ثالث محايد يصدر قرارًا ملزمًا.", "A dispute resolution method in which a neutral third party issues a binding decision."],
    ["gl_2", "شرط التحكيم", "Arbitration clause", "اتفاق بين الطرفين على إحالة المنازعات المستقبلية إلى التحكيم.", "An agreement to submit future disputes to arbitration."],
    ["gl_3", "اتفاق التحكيم", "Arbitration agreement", "يشمل شرط التحكيم واتفاق التحكيم المستقل، ويكون مكتوبًا.", "Covers both the arbitration clause and the submission agreement; must be in writing."],
    ["gl_4", "هيئة التحكيم", "Arbitral tribunal", "المحكم الواحد أو هيئة المحكمين التي تنظر النزاع.", "The sole arbitrator or panel of arbitrators deciding the dispute."],
    ["gl_5", "مكان التحكيم", "Seat of arbitration", "المكان القانوني الذي يحدد قانون الإجراءات الحاكم للتحكيم.", "The legal place that determines the law governing the arbitral procedure."],
    ["gl_6", "حكم التحكيم", "Arbitral award", "القرار النهائي الصادر عن هيئة التحكيم.", "The final decision issued by the arbitral tribunal."],
    ["gl_7", "تنفيذ الأحكام", "Enforcement of awards", "إجراءات إعطاء الحكم قوة تنفيذية في دولة أخرى.", "The process of giving an award effect in another State."],
    ["gl_8", "بطلان الحكم", "Setting aside an award", "الطعن أمام محكمة مكان التحكيم لإلغاء الحكم وفق أسباب محددة.", "A challenge before the courts of the seat to annul the award on limited grounds."],
    ["gl_9", "النظام العام", "Public policy", "المبادئ الأساسية التي لا يجوز مخالفتها في الدولة.", "Fundamental principles of a State that cannot be derogated from."],
    ["gl_10", "الاختصاص", "Jurisdiction", "سلطة هيئة التحكيم في نظر النزاع.", "The tribunal's power to hear the dispute."],
    ["gl_11", "التحكيم الاستثماري", "Investment arbitration", "تحكيم بين مستثمر ودولة يستند عادة إلى معاهدة استثمار.", "Arbitration between an investor and a State, typically based on an investment treaty."],
    ["gl_12", "الوساطة", "Mediation", "تسوية ودية بمساعدة وسيط دون قرار ملزم.", "Facilitated settlement with a mediator and no binding decision."],
    ["gl_13", "الأمر الإجرائي", "Procedural order", "قرار إجرائي من هيئة التحكيم بشأن سير الخصومة.", "A procedural decision by the tribunal about the conduct of the case."],
    ["gl_14", "فقرات القضية", "Moot problem paragraphs", "الفقرات المرقّمة التي تُحال إليها مذكرات الفريقين.", "The numbered paragraphs referenced by team memorials."],
  ];
  for (const [id, ar, en, defAr, defEn] of glossary) {
    await run(
      `INSERT INTO glossary (id, term_ar, term_en, def_ar, def_en, sort_order) VALUES (?,?,?,?,?,0)
       ON CONFLICT(id) DO UPDATE SET term_ar=excluded.term_ar, term_en=excluded.term_en, def_ar=excluded.def_ar, def_en=excluded.def_en`,
      [id, ar, en, defAr, defEn],
    );
  }

  /* ---------------- files ---------------- */
  type SeedFile = {
    id: string;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    sectionId: string;
    categoryId: string;
    importance: "essential" | "important" | "reference";
    pinned?: boolean;
    year?: string;
    tags: string;
    pages: Page[];
    visibility?: "published" | "hidden" | "scheduled";
    password?: string;
    source?: string;
  };

  const mootProblem: Page[] = Array.from({ length: 9 }, (_, p) => [
    `MOOT PROBLEM 2026 — PART ${p + 1}`,
    ...repeatParagraph(clue(p * 4 + 1), 2).map((t) => t),
    `The Respondent, a State-owned energy company, entered into a long-term supply contract with a private distributor. The contract contained an arbitration clause referring disputes to arbitration under institutional rules, with the seat in a Model Law jurisdiction and the language of the arbitration being English.`,
    `Following a change of government, the Respondent suspended deliveries. The Claimant commenced arbitration and the tribunal was constituted. The Respondent objected that the tribunal lacked jurisdiction because the arbitration agreement was allegedly invalid under its own law.`,
    `The parties exchanged memorials on jurisdiction, applicable law and the merits. The tribunal issued Procedural Order No. 1 fixing a timetable and allowing document production.`,
  ]);

  const clarifications: Page[] = [
    [
      "CLARIFICATION NO. 1 — 12 October 2026",
      "Question: May teams assume that the arbitration clause in the supply contract was signed by both parties on the same date?",
      "Answer: Yes. Teams may assume the clause was signed by both parties on 3 March 2024, and that no separate submission agreement exists.",
      "Affected paragraphs: 4, 7 and 12 of the moot problem.",
      "This clarification does not change the applicable law analysis.",
    ],
    [
      "CLARIFICATION NO. 2 — 27 October 2026",
      "Question: Does the record include the Respondent's internal approval documents?",
      "Answer: No. Teams should assume that internal approvals were obtained but that the documents are not part of the record and may not be cited as evidence.",
      "Affected paragraphs: 9 and 14 of the moot problem.",
      "Teams may nevertheless argue that the absence of the documents affects the weight of the Respondent's evidence.",
    ],
  ];

  const proceduralOrder: Page[] = [
    [
      "PROCEDURAL ORDER NO. 1",
      "The Tribunal, having consulted the parties, orders as follows:",
      "1. The timetable set out in the Annex to this Order shall govern the proceedings.",
      "2. Document production requests shall be exchanged within 14 days and shall address only documents that are relevant and material to the outcome of the case.",
      "3. The hearing on jurisdiction shall be held in the seat of arbitration and shall not exceed two days.",
      "4. Any request for an extension must be made in writing and copied to both parties.",
    ],
  ];

  const newYork: Page[] = Array.from({ length: 6 }, (_, p) => [
    `CONVENTION ON THE RECOGNITION AND ENFORCEMENT OF FOREIGN ARBITRAL AWARDS (NEW YORK, 1958) — extract ${p + 1}`,
    `Article I. This Convention shall apply to the recognition and enforcement of arbitral awards made in the territory of a State other than the State where the recognition and enforcement of such awards are sought, and arising out of differences between persons, whether physical or legal.`,
    `Article II. Each Contracting State shall recognize an agreement in writing under which the parties undertake to submit to arbitration all or any differences which have arisen or which may arise between them in respect of a defined legal relationship, whether contractual or not, concerning a subject matter capable of settlement by arbitration.`,
    `Article III. Each Contracting State shall recognize arbitral awards as binding and enforce them in accordance with the rules of procedure of the territory where the award is relied upon, under the conditions laid down in the following articles.`,
    `Article V. Recognition and enforcement of the award may be refused, at the request of the party against whom it is invoked, only if that party furnishes proof of the circumstances listed in this article.`,
    `Article VII. The provisions of the present Convention shall not affect the validity of multilateral or bilateral agreements concerning the recognition and enforcement of arbitral awards entered into by the Contracting States.`,
  ]);

  const modelLaw: Page[] = Array.from({ length: 5 }, (_, p) => [
    `UNCITRAL MODEL LAW ON INTERNATIONAL COMMERCIAL ARBITRATION — chapter ${p + 1}`,
    `Article 5. In matters governed by this Law, no court shall intervene except where so provided in this Law.`,
    `Article 7. An arbitration agreement is in writing if its content is recorded in any form, whether or not the arbitration agreement or contract has been concluded orally, by conduct, or by other means.`,
    `Article 11. No person shall be precluded by reason of his nationality from acting as an arbitrator, unless otherwise agreed by the parties.`,
    `Article 16. The arbitral tribunal may rule on its own jurisdiction, including any objections with respect to the existence or validity of the arbitration agreement.`,
    `Article 34. Recourse to a court against an arbitral award may be made only by an application for setting aside in accordance with paragraphs 2 and 3 of this article.`,
  ]);

  const ibaRules: Page[] = Array.from({ length: 4 }, (_, p) => [
    `IBA RULES ON THE TAKING OF EVIDENCE IN INTERNATIONAL ARBITRATION — summary ${p + 1}`,
    `Article 3. Within the time ordered by the Arbitral Tribunal, each Party shall submit to the Arbitral Tribunal and to the other Parties a Request to Produce.`,
    `Article 9. The Arbitral Tribunal shall determine the admissibility, relevance, materiality and weight of the evidence offered.`,
    `Article 9(2). The Arbitral Tribunal shall, at the request of a Party, exclude from evidence or production any document for legal impediment, privilege, or lack of sufficient relevance.`,
    `The Rules are intended to provide an efficient, economical and fair process for the taking of evidence in international arbitration.`,
  ]);

  const competitionRules: Page[] = [
    [
      "COMPETITION RULES — participant summary",
      "1. Teams consist of two to four students. The memorial must be submitted in the language of the competition.",
      "2. Each team submits a memorandum for the Claimant and one for the Respondent, not exceeding the page limit announced in the schedule.",
      "3. Citations must follow the competition citation guide. Plagiarism results in disqualification.",
      "4. The oral rounds consist of a preliminary round and an advanced round. Each oralist speaks for a fixed time and may be questioned by the bench.",
      "5. Clarifications issued by the organisers form part of the problem and prevail over the original text.",
      "Unofficial summary prepared by the community; always check the official competition website for the binding text.",
    ],
  ];

  const readingGuide: Page[] = Array.from({ length: 5 }, (_, p) => [
    `READING GUIDE FOR ARBITRATION MOOTS — chapter ${p + 1}`,
    `Start with the arbitration agreement. Ask three questions: is there a written agreement, does it cover this dispute, and is it valid under the law chosen by the parties?`,
    `Then examine the tribunal's jurisdiction. Kompetenz-Kompetenz allows the tribunal to rule on its own jurisdiction, but the courts of the seat retain the final word on setting aside.`,
    `Separability means the arbitration clause survives the termination of the underlying contract. This is why a claim that the contract was induced by fraud may still go to arbitration.`,
    `When the award is rendered, enforcement under the New York Convention is the default. Refusal grounds are exhaustive and narrowly construed by most courts.`,
    `For the memorial, remember that a strong legal argument answers the counter-argument before the bench raises it.`,
  ]);

  const article: Page[] = Array.from({ length: 4 }, (_, p) => [
    `ENFORCEMENT OF ANNULED AWARDS: A COMPARATIVE NOTE — part ${p + 1}`,
    `The tension between Article V(1)(e) and Article VII of the New York Convention is well known. Courts differ on whether an award annulled at the seat may still be enforced elsewhere.`,
    `Some jurisdictions apply the more-favourable-right provision of Article VII and enforce the award under domestic law. Others treat annulment as conclusive.`,
    `For the moot, the practical lesson is to identify the enforcement jurisdiction, the applicable domestic law, and the policy arguments on both sides.`,
    `Drafting tip: separate the procedural history from the legal argument. The bench should never have to reconstruct the facts.`,
  ]);

  const commentary: Page[] = Array.from({ length: 4 }, (_, p) => [
    `COMMENTARY ON THE MODEL LAW — note ${p + 1}`,
    `Article 16 is the textual home of competence-competence. Its second paragraph allows a party to challenge a preliminary ruling on jurisdiction within thirty days.`,
    `Article 34 lists the exhaustive grounds for setting aside. Notably, the list does not include a review of the merits.`,
    `The 2006 amendments introduced a modern definition of the written form of the arbitration agreement and interim measures.`,
    `Use these provisions to structure your jurisdictional plea: existence, validity, scope, and arbitrability.`,
  ]);

  const annex: Page[] = [
    [
      "ANNEX A — LIST OF EXHIBITS",
      "C-1 Supply contract dated 3 March 2024 (extract).",
      "C-2 Notices of suspension dated 14 and 28 April 2025.",
      "C-3 Notice of arbitration dated 2 June 2025.",
      "R-1 Constitutional amendment relied on by the Respondent.",
      "R-2 Internal approval memorandum (not in the record — see Clarification No. 2).",
      "All exhibits are illustrative samples created for this unofficial library demo.",
    ],
  ];

  const locked: Page[] = [
    [
      "LOCKED SAMPLE — STRATEGY NOTE (password: sccam)",
      "This document demonstrates per-file password protection. Visitors must enter the password before the viewer, download and text endpoints release any content.",
      "Do not store real confidential notes in a public deployment without a private storage bucket.",
    ],
  ];

  const files: SeedFile[] = [
    {
      id: "f_moot2026",
      titleAr: "ملف القضية — التحكيم التجاري الدولي 2026",
      titleEn: "Moot Problem — International Commercial Arbitration 2026",
      descAr: "النص الكامل لملف القضية مع الوقائع والفقرات المرقّمة وطلبات الطرفين.",
      descEn: "Full moot problem with facts, numbered paragraphs and the parties' requests for relief.",
      sectionId: "sec_case",
      categoryId: "cat_problem",
      importance: "essential",
      pinned: true,
      year: "2026",
      tags: "moot problem, facts, 2026, jurisdiction",
      pages: mootProblem,
      source: "Sample content created for the library demo.",
    },
    {
      id: "f_clar1",
      titleAr: "توضيح رقم ١ — تاريخ توقيع شرط التحكيم",
      titleEn: "Clarification No. 1 — Date of signature",
      descAr: "يوضح تاريخ توقيع شرط التحكيم ويشير إلى الفقرات المتأثرة.",
      descEn: "Clarifies the date the arbitration clause was signed and the affected paragraphs.",
      sectionId: "sec_case",
      categoryId: "cat_clar",
      importance: "important",
      year: "2026",
      tags: "clarification, signature, paragraph 4",
      pages: [clarifications[0]],
      source: "Illustrative clarification (sample).",
    },
    {
      id: "f_clar2",
      titleAr: "توضيح رقم ٢ — مستندات الموافقة الداخلية",
      titleEn: "Clarification No. 2 — Internal approvals",
      descAr: "يوضح عدم إدراج مستندات الموافقة الداخلية في سجل القضية.",
      descEn: "Explains that internal approval documents are not part of the record.",
      sectionId: "sec_case",
      categoryId: "cat_clar",
      importance: "important",
      year: "2026",
      tags: "clarification, evidence, record",
      pages: [clarifications[1]],
      source: "Illustrative clarification (sample).",
    },
    {
      id: "f_po1",
      titleAr: "الأمر الإجرائي رقم ١",
      titleEn: "Procedural Order No. 1",
      descAr: "الجدول الزمني وقواعد تقديم المستندات وجلسة الاختصاص.",
      descEn: "Timetable, document production rules and the jurisdiction hearing.",
      sectionId: "sec_case",
      categoryId: "cat_po",
      importance: "important",
      year: "2026",
      tags: "procedural order, timetable, document production",
      pages: proceduralOrder,
      source: "Illustrative procedural order (sample).",
    },
    {
      id: "f_annex",
      titleAr: "الملحق (أ) — قائمة المستندات",
      titleEn: "Annex A — List of exhibits",
      descAr: "قائمة المستندات المقدمة من الطرفين في سجل القضية.",
      descEn: "List of exhibits submitted by the parties in the case record.",
      sectionId: "sec_case",
      categoryId: "cat_annex",
      importance: "reference",
      year: "2026",
      tags: "annex, exhibits, record",
      pages: annex,
    },
    {
      id: "f_ny",
      titleAr: "اتفاقية نيويورك ١٩٥٨ بشأن الاعتراف بأحكام التحكيم الأجنبية وتنفيذها",
      titleEn: "New York Convention 1958 on the Recognition and Enforcement of Foreign Arbitral Awards",
      descAr: "النص الكامل للاتفاقية مع ملاحظات على المواد الأساسية.",
      descEn: "The full text of the Convention with notes on the key articles.",
      sectionId: "sec_laws",
      categoryId: "cat_conv",
      importance: "essential",
      pinned: true,
      year: "2026",
      tags: "New York Convention, enforcement, article V, 1958",
      pages: newYork,
      source: "Public domain treaty text (extract).",
    },
    {
      id: "f_modellaw",
      titleAr: "القانون النموذجي للتحكيم التجاري الدولي (الأونسيترال)",
      titleEn: "UNCITRAL Model Law on International Commercial Arbitration",
      descAr: "نسخة محدّثة مع تعديلات ٢٠٠٦ والمواد المتعلقة بالاختصاص والبطلان.",
      descEn: "Consolidated version with the 2006 amendments, jurisdiction and setting aside.",
      sectionId: "sec_laws",
      categoryId: "cat_model",
      importance: "essential",
      year: "2026",
      tags: "UNCITRAL, model law, article 16, article 34",
      pages: modelLaw,
      source: "Public domain model law text (extract).",
    },
    {
      id: "f_iba",
      titleAr: "قواعد إيـبا لتقديم الأدلة في التحكيم الدولي",
      titleEn: "IBA Rules on the Taking of Evidence in International Arbitration",
      descAr: "ملخص عملي لقواعد تقديم المستندات والاستبعاد.",
      descEn: "Practical summary of document production and exclusion rules.",
      sectionId: "sec_laws",
      categoryId: "cat_rules",
      importance: "important",
      year: "2026",
      tags: "IBA, evidence, document production, privilege",
      pages: ibaRules,
      source: "Summary prepared for teaching purposes.",
    },
    {
      id: "f_comp",
      titleAr: "ملخص قواعد المنافسة للمشاركين",
      titleEn: "Competition rules — participant summary",
      descAr: "ملخص غير رسمي لقواعد المنافسة: الفرق، المذكرات، الجولات الشفهية.",
      descEn: "Unofficial summary of the competition rules: teams, memorials and oral rounds.",
      sectionId: "sec_laws",
      categoryId: "cat_comp",
      importance: "important",
      year: "2026",
      tags: "competition rules, memorial, oral rounds",
      pages: competitionRules,
      source: "Unofficial summary — always check the official website.",
    },
    {
      id: "f_guide",
      titleAr: "دليل القراءة لمنافسات التحكيم",
      titleEn: "Reading guide for arbitration moots",
      descAr: "خطوات عملية لتحليل شرط التحكيم والاختصاص وتنفيذ الحكم.",
      descEn: "A practical method for analysing the arbitration clause, jurisdiction and enforcement.",
      sectionId: "sec_books",
      categoryId: "cat_text",
      importance: "essential",
      pinned: true,
      year: "2026",
      tags: "study guide, separability, kompetenz-kompetenz, enforcement",
      pages: readingGuide,
    },
    {
      id: "f_article",
      titleAr: "مقال: تنفيذ الأحكام الملغاة — ملاحظة مقارنة",
      titleEn: "Article: enforcement of annulled awards — a comparative note",
      descAr: "ملاحظة مقارنة حول المادة الخامسة/١(هـ) والمادة السابعة من اتفاقية نيويورك.",
      descEn: "A comparative note on Article V(1)(e) and Article VII of the New York Convention.",
      sectionId: "sec_books",
      categoryId: "cat_art",
      importance: "reference",
      year: "2025",
      tags: "annulment, article VII, enforcement, comparative",
      pages: article,
    },
    {
      id: "f_commentary",
      titleAr: "شرح القانون النموذجي — ملاحظات على المواد ١٦ و٣٤",
      titleEn: "Commentary on the Model Law — notes on Articles 16 and 34",
      descAr: "شرح موجز لأثر الاختصاص والبطلان في مذكرات الفريقين.",
      descEn: "A short commentary on competence-competence and setting aside for memorial drafting.",
      sectionId: "sec_books",
      categoryId: "cat_comm",
      importance: "reference",
      year: "2025",
      tags: "commentary, article 16, article 34, setting aside",
      pages: commentary,
    },
    {
      id: "f_locked",
      titleAr: "نموذج ملف محمي بكلمة مرور",
      titleEn: "Password-protected sample file",
      descAr: "ملف تجريبي يوضح حماية الملفات بكلمة مرور (كلمة المرور: sccam).",
      descEn: "Demo file showing per-file password protection (password: sccam).",
      sectionId: "sec_case",
      categoryId: "cat_annex",
      importance: "reference",
      year: "2026",
      tags: "password, demo",
      pages: locked,
      password: "sccam",
    },
  ];

  for (const [i, f] of files.entries()) {
    const existing = await one<{ id: string }>("SELECT id FROM files WHERE id = ?", [f.id]);
    if (existing) {
      await run("DELETE FROM files WHERE id = ?", [f.id]);
    }
    const created = iso(new Date(now.getTime() - (files.length - i) * 36 * 3600_000));
    await run(
      `INSERT INTO files (id, title_ar, title_en, description_ar, description_en, section_id, category_id, tags,
        edition_year, doc_date, importance, pinned, sort_order, visibility, publish_at, download_allowed, print_allowed,
        source_note, file_password_hash, mime, size_bytes, page_count, storage_key, current_version, text_status,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        f.id,
        f.titleAr,
        f.titleEn,
        f.descAr,
        f.descEn,
        f.sectionId,
        f.categoryId,
        f.tags,
        f.year ?? "2026",
        created,
        f.importance,
        f.pinned ? 1 : 0,
        (i + 1) * 10,
        f.visibility ?? "published",
        null,
        1,
        1,
        f.source ?? "",
        f.password ? await bcryptHash(f.password) : null,
        "application/pdf",
        0,
        0,
        "",
        1,
        "pending",
        created,
        created,
      ],
    );

    const pdf = await makePdf(f.titleEn, f.pages);
    const result = await storeAndProcess({
      fileId: f.id,
      buffer: pdf,
      mime: "application/pdf",
      filename: `${f.id}.pdf`,
      version: 1,
      changelog: "Initial upload",
    });
    if (!result.ok) console.error("  ! processing failed", f.id, result.error);
    else console.log(`  ✓ ${f.id} — ${result.pageCount} pages (${result.status})`);
  }

  /* ---------------- clarifications links + views ---------------- */
  await run("DELETE FROM clarification_links");
  await run(
    "INSERT INTO clarification_links (id, file_id, target_file_id, target_page, note) VALUES (?,?,?,?,?)",
    ["cl_link_1", "f_clar1", "f_moot2026", 4, "paragraphs 4 and 7"],
  );
  await run(
    "INSERT INTO clarification_links (id, file_id, target_file_id, target_page, note) VALUES (?,?,?,?,?)",
    ["cl_link_2", "f_clar2", "f_moot2026", 9, "paragraph 9"],
  );

  const viewSeeds: [string, number][] = [
    ["f_ny", 148],
    ["f_moot2026", 231],
    ["f_modellaw", 97],
    ["f_guide", 64],
    ["f_iba", 41],
    ["f_article", 22],
    ["f_po1", 18],
    ["f_clar1", 33],
    ["f_clar2", 12],
    ["f_commentary", 9],
    ["f_comp", 27],
    ["f_annex", 5],
    ["f_locked", 3],
  ];
  for (const [id, views] of viewSeeds) {
    await run("UPDATE files SET views = ? WHERE id = ?", [views, id]);
  }

  /* ---------------- news ---------------- */
  const news = [
    ["n_1", "فتح باب التسجيل في نسخة 2026", "Registration open for the 2026 edition", "أعلنت الجهة المنظمة فتح التسجيل. راجع صفحة القضية للاطلاع على ملف القضية والتوضيحات.", "Registration is open. Check the case page for the problem and clarifications.", "news", daysFromNow(-2), 1],
    ["n_2", "نشر التوضيح رقم ٢", "Clarification No. 2 published", "أُضيف توضيح جديد حول مستندات الموافقة الداخلية في سجل القضية.", "A new clarification about internal approval documents was added to the record.", "update", daysFromNow(-6), 0],
    ["n_3", "تحديث اتفاقية نيويورك مع ملاحظات المواد", "New York Convention updated with article notes", "أُضيفت نسخة مشروحة من الاتفاقية إلى قسم القوانين.", "An annotated copy of the Convention was added to the laws section.", "update", daysFromNow(-12), 0],
    ["n_4", "ورشة تدريبية على البحث في المصادر", "Research workshop for participants", "ورشة قصيرة عن البحث في اتفاقية نيويورك والقانون النموذجي باستخدام المكتبة.", "A short workshop on researching the Convention and the Model Law using this library.", "news", daysFromNow(-20), 0],
  ];
  for (const [id, tar, ten, bar, ben, kind, published, pinned] of news) {
    await run(
      `INSERT INTO news (id, title_ar, title_en, body_ar, body_en, kind, link, published_at, is_pinned, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO NOTHING`,
      [id, tar, ten, bar, ben, kind, "", String(published), pinned, nowIso()],
    );
  }

  /* ---------------- FAQ ---------------- */
  const faqs = [
    ["q_1", "هل هذا الموقع رسمي؟", "Is this site official?", "لا. الموقع غير رسمي ولا يتبع الجهة المنظمة ولا يمثلها. المحتوى مجمع من المجتمع الطلابي ولغرض تعليمي.", "No. This site is unofficial, not affiliated with and not endorsed by the organisers. It is community-gathered for educational use.", 10],
    ["q_2", "كيف أبحث داخل كل صفحات الملفات؟", "How do I search the full text of every page?", "استخدم شريط البحث في الأعلى أو صفحة البحث. نستخرج نص كل صفحة ونفهرسها بالعربية والإنجليزية مع تجاهل التشكيل وفروق الألف والياء.", "Use the header search or the search page. Every page is text-extracted and indexed in Arabic and English, ignoring diacritics and letter variants.", 20],
    ["q_3", "لماذا لا أستطيع تنزيل بعض الملفات؟", "Why can't I download some files?", "بعض الملفات مسموح بقراءتها فقط دون تنزيل، بحسب إعدادات المصدر. القراءة والبحث والتظليل متاحة دائمًا.", "Some files are read-only according to the source's terms. Reading, searching and highlighting are always available.", 30],
    ["q_4", "هل تُحفظ ملاحظاتي على السيرفر؟", "Are my notes stored on the server?", "لا. العلامات المرجعية والتظليلات والملاحظات محفوظة في متصفحك فقط، ويمكنك تصديرها واستيرادها بصيغة JSON.", "No. Bookmarks, highlights and notes live in your browser only; you can export and import them as JSON.", 40],
    ["q_5", "كيف أبلّغ عن خطأ أو ملف قديم؟", "How do I report an error or an outdated file?", "من صفحة الملف اضغط «الإبلاغ عن مشكلة»، أو استخدم صفحة اتصل بنا. تصل الرسائل إلى بريد مسؤول الموقع.", "Use “Report an issue” on the file page, or the contact page. Messages go to the admin inbox.", 50],
  ];
  for (const [id, qar, qen, aar, aen, order] of faqs) {
    await run(
      `INSERT INTO faqs (id, question_ar, question_en, answer_ar, answer_en, sort_order) VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET sort_order=excluded.sort_order`,
      [id, qar, qen, aar, aen, order],
    );
  }

  /* ---------------- deadlines ---------------- */
  const deadlines = [
    ["d_reg", "إغلاق التسجيل", "Registration closes", "تأكد من تسجيل الفريق قبل الموعد.", "Make sure the team is registered before the deadline.", "registration", daysFromNow(9)],
    ["d_mem", "تسليم المذكرات", "Memorial submission", "رفع مذكرة المدعي والمدعى عليه قبل الساعة ٢٣:٥٩.", "Upload both memorials before 23:59.", "memorial", daysFromNow(26)],
    ["d_oral", "الجولات الشفهية", "Oral rounds", "تُعلن الجدولة لاحقًا عبر الموقع الرسمي.", "Pairings are announced later on the official website.", "oral", daysFromNow(54)],
  ];
  for (const [id, tar, ten, nar, nen, kind, dueAt] of deadlines) {
    await run(
      `INSERT INTO deadlines (id, title_ar, title_en, note_ar, note_en, kind, due_at, sort_order)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET due_at=excluded.due_at`,
      [id, tar, ten, nar, nen, kind, String(dueAt), 0],
    );
  }

  /* ---------------- changelog + analytics ---------------- */
  await run("DELETE FROM changelog_entries");
  const changelog: [string, string | null, string, string, string, string, string, number, string][] = [
    ["cl_1", "f_moot2026", "add", "إضافة ملف القضية 2026", "Moot problem 2026 added", "النص الكامل مع ٩ صفحات", "Full text, 9 pages", 1, daysFromNow(-14)],
    ["cl_2", "f_clar2", "add", "إضافة التوضيح رقم ٢", "Clarification No. 2 added", "يتعلق بالفقرتين ٩ و١٤", "Relates to paragraphs 9 and 14", 1, daysFromNow(-6)],
    ["cl_3", "f_clar1", "add", "إضافة التوضيح رقم ١", "Clarification No. 1 added", "تاريخ توقيع شرط التحكيم", "Date the clause was signed", 1, daysFromNow(-12)],
    ["cl_4", "f_ny", "update", "تحديث اتفاقية نيويورك", "New York Convention updated", "أُضيفت ملاحظات على المواد", "Article notes added", 2, daysFromNow(-3)],
    ["cl_5", "f_guide", "add", "إضافة دليل القراءة", "Reading guide added", "خطوات تحليل شرط التحكيم", "A method for analysing the clause", 1, daysFromNow(-9)],
    ["cl_6", null, "note", "افتتاح المكتبة", "Library launched", "نسخة تجريبية من الموقع", "First public preview", 1, daysFromNow(-30)],
  ];
  for (const [id, fileId, kind, tar, ten, dar, den, version, createdAt] of changelog) {
    await run(
      "INSERT INTO changelog_entries (id, file_id, kind, title_ar, title_en, detail_ar, detail_en, version, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, fileId, kind, tar, ten, dar, den, version, String(createdAt)],
    );
  }

  await run("DELETE FROM analytics_events");
  const queries: [string, number][] = [
    ["New York Convention", 3],
    ["arbitral tribunal jurisdiction", 5],
    ["تحكيم", 4],
    ["Model Law", 6],
    ["document production", 2],
    ["تنفيذ الأحكام", 3],
    ["separability", 1],
    ["public policy", 2],
    ["kompetenz", 0],
    ["securitisation", 0],
  ];
  for (const [query, results] of queries) {
    for (let i = 0; i < 2; i++) {
      await run(
        "INSERT INTO analytics_events (kind, query, result_count, created_at) VALUES ('search', ?, ?, ?)",
        [query, results, iso(new Date(now.getTime() - i * 3600_000))],
      );
    }
  }

  const total = await one<{ c: number }>("SELECT COUNT(*) AS c FROM files");
  console.log(`Done — ${total?.c ?? 0} files indexed.`);
  console.log("Admin setup is available at /admin (first run creates the password).");
}

async function bcryptHash(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 11);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
