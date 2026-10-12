export const languages = [
  {
    id: "Kannada",
    native: "ಕನ್ನಡ",
    code: "KN",
    group: "Regional",
    greeting: "ನಮಸ್ಕಾರ",
    roman: "Namaskāra",
    intro: "Nanna hesaru …",
    meaning: "My name is …",
    color: "#c2a1ff",
  },
  {
    id: "Hindi",
    native: "हिन्दी",
    code: "HI",
    group: "Regional",
    greeting: "नमस्ते",
    roman: "Namaste",
    intro: "Mera naam … hai",
    meaning: "My name is …",
    color: "#ffb882",
  },
  {
    id: "Japanese",
    native: "日本語",
    code: "JP",
    group: "Global",
    greeting: "こんにちは",
    roman: "Konnichiwa",
    intro: "Watashi no namae wa … desu",
    meaning: "My name is …",
    color: "#ffa2ba",
  },
  {
    id: "German",
    native: "Deutsch",
    code: "DE",
    group: "Global",
    greeting: "Hallo",
    roman: "Hallo",
    intro: "Ich heiße …",
    meaning: "My name is …",
    color: "#9cbaff",
  },
  {
    id: "French",
    native: "Français",
    code: "FR",
    group: "Global",
    greeting: "Bonjour",
    roman: "Bonjour",
    intro: "Je m’appelle …",
    meaning: "My name is …",
    color: "#99e4ce",
  },
  {
    id: "Italian",
    native: "Italiano",
    code: "IT",
    group: "Global",
    greeting: "Ciao",
    roman: "Ciao",
    intro: "Mi chiamo …",
    meaning: "My name is …",
    color: "#d8d98c",
  },
  {
    id: "Korean",
    native: "한국어",
    code: "KR",
    group: "Global",
    greeting: "안녕하세요",
    roman: "Annyeonghaseyo",
    intro: "Je ireumeun … imnida",
    meaning: "My name is …",
    color: "#a4d0ff",
  },
  {
    id: "Tamil",
    native: "தமிழ்",
    code: "TA",
    group: "Regional",
    greeting: "வணக்கம்",
    roman: "Vanakkam",
    intro: "En peyar …",
    meaning: "My name is …",
    color: "#eea5ff",
  },
  {
    id: "Telugu",
    native: "తెలుగు",
    code: "TE",
    group: "Regional",
    greeting: "నమస్కారం",
    roman: "Namaskāram",
    intro: "Nā pēru …",
    meaning: "My name is …",
    color: "#ffc791",
  },
  {
    id: "Marathi",
    native: "मराठी",
    code: "MR",
    group: "Regional",
    greeting: "नमस्कार",
    roman: "Namaskār",
    intro: "Mājhe nāv …",
    meaning: "My name is …",
    color: "#a9d3b4",
  },
  {
    id: "Bengali",
    native: "বাংলা",
    code: "BN",
    group: "Regional",
    greeting: "নমস্কার",
    roman: "Nomoshkar",
    intro: "Āmār nām …",
    meaning: "My name is …",
    color: "#eabfa1",
  },
  {
    id: "Malayalam",
    native: "മലയാളം",
    code: "ML",
    group: "Regional",
    greeting: "നമസ്കാരം",
    roman: "Namaskāram",
    intro: "Ente pēru …",
    meaning: "My name is …",
    color: "#b5c2ff",
  },
  {
    id: "English",
    native: "English",
    code: "EN",
    group: "Global",
    greeting: "Hello",
    roman: "Hello",
    intro: "My name is …",
    meaning: "My name is …",
    color: "#b8b5ff",
  },
] as const;
export type Language = (typeof languages)[number]["id"];
export const language = (id: string) =>
  languages.find((l) => l.id === id) ?? languages[0];
export type Partner = {
  id: string;
  name: string;
  known: Language[];
  proficiency?: Partial<
    Record<Language, "Native" | "Fluent" | "Conversational">
  >;
  target: Language;
  level: string;
  slot: string;
  bio: string;
  streak: number;
  completed: number;
  misses: number;
  cooldownUntil: string | null;
  interests: string[];
  demo?: boolean;
};
export const demoPartners: Partner[] = [
  {
    id: "demo-ananya",
    name: "Ananya Rao",
    known: ["Kannada", "English"],
    target: "Hindi",
    level: "Beginner",
    slot: "Evening",
    bio: "Bengaluru girl, coffee enthusiast. Let’s trade everyday conversations and a little culture.",
    streak: 12,
    completed: 28,
    misses: 1,
    cooldownUntil: null,
    interests: ["Coffee", "Films", "Travel"],
    demo: true,
  },
  {
    id: "demo-kiran",
    name: "Kiran Hegde",
    known: ["Kannada"],
    target: "English",
    level: "Intermediate",
    slot: "Evening",
    bio: "I’ll help you navigate Bengaluru in Kannada. Help me get comfortable speaking English!",
    streak: 8,
    completed: 18,
    misses: 1,
    cooldownUntil: null,
    interests: ["Technology", "Cricket"],
    demo: true,
  },
  {
    id: "demo-meera",
    name: "Meera Shetty",
    known: ["Kannada", "Hindi"],
    target: "English",
    level: "Beginner",
    slot: "Morning",
    bio: "Small daily conversations beat long weekly lessons. Let’s keep showing up.",
    streak: 3,
    completed: 8,
    misses: 3,
    cooldownUntil: null,
    interests: ["Books", "Music"],
    demo: true,
  },
  ...(
    [
      "Japanese",
      "German",
      "French",
      "Italian",
      "Korean",
      "Tamil",
      "Telugu",
      "Marathi",
      "Bengali",
      "Malayalam",
      "Hindi",
    ] as Language[]
  ).map((l, i) => ({
    id: `demo-${l.toLowerCase()}`,
    name: [
      "Yuki Tanaka",
      "Lena Fischer",
      "Camille Laurent",
      "Luca Rossi",
      "Jiwoo Kim",
      "Kavya Raman",
      "Sai Reddy",
      "Aarav Deshmukh",
      "Riya Sen",
      "Nila Menon",
      "Aditi Sharma",
    ][i],
    known: [l] as Language[],
    target: "English" as Language,
    level: "Intermediate",
    slot: "Evening",
    bio: `Happy to share ${l} through everyday conversation. Looking for a consistent English practice partner.`,
    streak: 5 + i,
    completed: 20 + i,
    misses: i % 3,
    cooldownUntil: null,
    interests: ["Culture", "Music"],
    demo: true,
  })),
];
export type Resource = {
  id: string;
  language: Language;
  title: string;
  description: string;
  url: string;
  skill: "Grammar" | "Vocabulary" | "Listening" | "All skills";
  access: "Free" | "Free tier";
  level: string;
};
export const resources: Resource[] = [
  {
    id: "kn1",
    language: "Kannada",
    title: "Kannada learning · KSP",
    description:
      "Karnataka’s Kannada Sahitya Parishat. Explore language and literature materials.",
    url: "https://kannadasahithyaparishattu.in/",
    skill: "All skills",
    access: "Free",
    level: "All levels",
  },
  {
    id: "kn2",
    language: "Kannada",
    title: "Kannada · Wikibooks",
    description:
      "Community-written alphabet, vocabulary, and introductory lessons.",
    url: "https://en.wikibooks.org/wiki/Kannada",
    skill: "Grammar",
    access: "Free",
    level: "Beginner",
  },
  {
    id: "hi1",
    language: "Hindi",
    title: "Hindi · Wikibooks",
    description:
      "Start with Devanagari, simple sentences, and foundational grammar.",
    url: "https://en.wikibooks.org/wiki/Hindi",
    skill: "Grammar",
    access: "Free",
    level: "Beginner",
  },
  {
    id: "hi2",
    language: "Hindi",
    title: "Hindi · BBC News",
    description:
      "Read current stories aloud and collect useful everyday vocabulary.",
    url: "https://www.bbc.com/hindi",
    skill: "Vocabulary",
    access: "Free",
    level: "Intermediate",
  },
  {
    id: "jp1",
    language: "Japanese",
    title: "Tofugu",
    description:
      "Friendly, detailed guides to hiragana, katakana, and learning Japanese.",
    url: "https://www.tofugu.com/learn-japanese/",
    skill: "All skills",
    access: "Free",
    level: "Beginner",
  },
  {
    id: "jp2",
    language: "Japanese",
    title: "WaniKani",
    description:
      "Kanji and vocabulary with spaced repetition. First three levels are free; later levels are paid.",
    url: "https://www.wanikani.com/",
    skill: "Vocabulary",
    access: "Free tier",
    level: "N5–N1",
  },
  {
    id: "jp3",
    language: "Japanese",
    title: "Tae Kim’s guide",
    description:
      "A free guide to Japanese grammar, from sentence basics to advanced patterns.",
    url: "https://guidetojapanese.org/learn/",
    skill: "Grammar",
    access: "Free",
    level: "N5–N1",
  },
  {
    id: "jp4",
    language: "Japanese",
    title: "NHK Easy Japanese",
    description:
      "Short audio lessons and everyday dialogues with multilingual explanations.",
    url: "https://www.nhk.or.jp/lesson/en/",
    skill: "Listening",
    access: "Free",
    level: "Beginner",
  },
  {
    id: "de1",
    language: "German",
    title: "DW · Learn German",
    description: "Nicos Weg and structured courses for real-world German.",
    url: "https://learngerman.dw.com/en/learn-german/s-9528",
    skill: "All skills",
    access: "Free",
    level: "A1–B1",
  },
  {
    id: "de2",
    language: "German",
    title: "Goethe · Exam training",
    description:
      "Official exam practice and model materials organized by level.",
    url: "https://www.goethe.de/en/spr/prf/ueb.html",
    skill: "All skills",
    access: "Free",
    level: "A1–C2",
  },
  {
    id: "fr1",
    language: "French",
    title: "TV5MONDE · Learn French",
    description: "Video-based exercises organized by CEFR level.",
    url: "https://apprendre.tv5monde.com/en",
    skill: "Listening",
    access: "Free",
    level: "A1–B2",
  },
  {
    id: "fr2",
    language: "French",
    title: "RFI · Français facile",
    description: "News, audio, and exercises for listening and vocabulary.",
    url: "https://francaisfacile.rfi.fr/en/",
    skill: "Listening",
    access: "Free",
    level: "A1–C2",
  },
  {
    id: "it1",
    language: "Italian",
    title: "RAI · Italiano",
    description:
      "Public broadcaster learning materials for Italian language and culture.",
    url: "https://www.raiscuola.rai.it/italianoperstranieri",
    skill: "All skills",
    access: "Free",
    level: "A1–B2",
  },
  {
    id: "it2",
    language: "Italian",
    title: "CILS · Official materials",
    description:
      "University of Siena’s official Italian certification and practice materials.",
    url: "https://cils.unistrasi.it/",
    skill: "All skills",
    access: "Free",
    level: "A1–C2",
  },
  {
    id: "kr1",
    language: "Korean",
    title: "Online King Sejong Institute",
    description:
      "Official Korean courses, from beginner introductions onward. Account may be required.",
    url: "https://www.iksi.or.kr/",
    skill: "All skills",
    access: "Free",
    level: "Beginner–Advanced",
  },
  {
    id: "kr2",
    language: "Korean",
    title: "TOPIK · Official portal",
    description:
      "Find official test information, notices, and released learning materials.",
    url: "https://www.topik.go.kr/",
    skill: "All skills",
    access: "Free",
    level: "TOPIK 1–6",
  },
  ...(
    [
      "Tamil",
      "Telugu",
      "Marathi",
      "Bengali",
      "Malayalam",
      "English",
    ] as Language[]
  ).map((l) => ({
    id: `${l}-wiki`,
    language: l,
    title: `${l} · Wikibooks`,
    description:
      "A starter collection of community-maintained language lessons. Coverage varies.",
    url: `https://en.wikibooks.org/wiki/${l}`,
    skill: "All skills" as const,
    access: "Free" as const,
    level: "Beginner",
  })),
];
export const examSources: Record<
  string,
  { name: string; url: string; note: string }
> = {
  German: {
    name: "Goethe-Institut",
    url: "https://www.goethe.de/en/spr/prf/ueb.html",
    note: "Official model tests and exam training, A1–C2.",
  },
  French: {
    name: "France Éducation international",
    url: "https://www.france-education-international.fr/diplome/delf-tout-public",
    note: "DELF sample materials for A1–B2; use the DALF section for C1–C2.",
  },
  Italian: {
    name: "CILS · University of Siena",
    url: "https://cils.unistrasi.it/",
    note: "Official certification portal. Look for example tests and released materials.",
  },
  Japanese: {
    name: "JLPT · Official samples",
    url: "https://www.jlpt.jp/e/samples/forlearners.html",
    note: "Official sample questions and practice workbooks for N5–N1.",
  },
  Korean: {
    name: "TOPIK · Official portal",
    url: "https://www.topik.go.kr/",
    note: "TOPIK I covers grades 1–2; TOPIK II covers grades 3–6. Browse released materials on the portal.",
  },
};
