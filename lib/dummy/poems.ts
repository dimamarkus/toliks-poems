export interface PoemDummy {
  id: string;
  title: string;
  slug: string;
  date: string; // YYYY-MM-DD
  themes: string[];
  contentHtml: string;
  pinned?: boolean;
}

export const POEMS_DUMMY: PoemDummy[] = [
  {
    id: "1",
    title: "Слова на веточках",
    slug: "slova-na-vetochkah",
    date: "2021-09-10",
    themes: ["сад", "воображение"],
    contentHtml: `<p>Слова на веточках висят —<br/>Плоды моих воображений...</p>`,
  },
  {
    id: "2",
    title: "Никого никогда",
    slug: "nikogo-nikogda",
    date: "2025-08-19",
    themes: ["покой", "прощение"],
    contentHtml: `<p>Никого никогда не кляну,<br/>Пусть в душе и бушует ненастье...</p>`,
    pinned: true,
  },
];


