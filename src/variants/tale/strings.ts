import type { Lang } from '../../translations';

/**
 * Narration and UI strings of the storybook. The narration is connective framing only:
 * every fact (roles, companies, dates, numbers, bullets) comes verbatim from translations.ts.
 * `{company}` is replaced with the company name from the data.
 */
export interface TaleStrings {
  title: string;
  shortTitle: string;
  coverKicker: string;
  coverAbout: string;
  heroAlt: string;
  open: string;
  cover: string;
  contents: string;
  contentsNote: string;
  chapter: string;
  page: (n: number, total: number) => string;
  pages: (a: number, b: number, total: number) => string;
  prev: string;
  next: string;
  toContents: string;
  close: string;
  language: string;
  bookLabel: string;
  once: { title: string; narr: string };
  numbers: { title: string; narr: string };
  earlyNarr: string;
  jobs: string[];
  jobNow: string;
  deeds: string;
  feats: { title: string; narr: string; word: string; ordinals: string[] };
  chest: { title: string; narr: string; more: string };
  end: { title: string; narr: string; moral: string };
  contactNarr: string;
  cvTitle: string;
}

export const S: Record<Lang, TaleStrings> = {
  en: {
    title: 'The Tale of Senior Tomato of the Frontend',
    shortTitle: 'The Tale of Senior Tomato',
    coverKicker: 'A true tale, with pictures',
    coverAbout: 'The hero of this tale is known as',
    heroAlt: 'Senior Tomato: a round tomato in glasses, a little crown and a cape, with a laptop',
    open: 'Open the book',
    cover: 'Cover',
    contents: 'Contents',
    contentsNote: 'What is told, and in what order:',
    chapter: 'Chapter',
    page: (n, total) => `p. ${n} of ${total}`,
    pages: (a, b, total) => `pp. ${a}–${b} of ${total}`,
    prev: 'Previous page',
    next: 'Next page',
    toContents: 'Contents',
    close: 'Close the book',
    language: 'Language',
    bookLabel: 'Storybook',
    once: {
      title: 'Once upon a time',
      narr: 'Once upon a time, in a kingdom of browsers far, far away, there lived a Tomato — and not just any tomato, but a Senior one. Out in the wide world, this is what they say of him:',
    },
    numbers: {
      title: 'The tale in numbers',
      narr: 'A tale is a tale, but numbers like to be exact. Here is what the chroniclers counted:',
    },
    earlyNarr: 'Every long road begins with a first step. Our Tomato was still a little green when he set out:',
    jobs: [
      'Whether the road was long or short, it brought our Tomato to the land of {company}.',
      'A tale is quickly told, but the work is slowly done. The next stop on the road was {company}.',
      'Beyond the hills and past the forests lay the country of {company}. And that is where our Tomato went.',
      'And there was one more story in our Tomato’s travels — in a place called {company}.',
      'Another road led our Tomato to {company}. Here is what came of it.',
    ],
    jobNow: 'And so we come to this very day. The tale is still being written, and our Tomato labours here: {company}.',
    deeds: 'Deeds and doings',
    feats: {
      title: 'The feats',
      narr: 'Every storybook hero has feats to his name. Our Tomato has his too — and every one of them is real.',
      word: 'Feat',
      ordinals: ['The first feat', 'The second feat', 'The third feat', 'The fourth feat', 'The fifth feat', 'The sixth feat', 'The seventh feat'],
    },
    chest: {
      title: 'The magic chest of tools',
      narr: 'On every journey the Tomato carries a chest. Lift the lid and see what lies inside.',
      more: 'And deeper in the chest:',
    },
    end: {
      title: 'The End… or the beginning?',
      narr: 'And that is the end of the tale — well done to all who read this far. But is it truly the end?',
      moral: 'The next chapter could be written together with you.',
    },
    contactNarr: 'Send the Tomato a word, and a new chapter begins:',
    cvTitle: 'The same tale, told plainly',
  },
  ru: {
    title: 'Сказка о Сеньоре Помидоре Фронтенда',
    shortTitle: 'Сказка о Сеньоре Помидоре',
    coverKicker: 'Сказка-быль с картинками',
    coverAbout: 'А в миру героя этой сказки зовут',
    heroAlt: 'Сеньор Помидор: круглый помидор в очках, с маленькой короной, в плаще и с ноутбуком',
    open: 'Открыть книгу',
    cover: 'Обложка',
    contents: 'Оглавление',
    contentsNote: 'Что и в каком порядке сказывается:',
    chapter: 'Глава',
    page: (n, total) => `стр. ${n} из ${total}`,
    pages: (a, b, total) => `стр. ${a}–${b} из ${total}`,
    prev: 'Предыдущая страница',
    next: 'Следующая страница',
    toContents: 'Оглавление',
    close: 'Закрыть книгу',
    language: 'Язык',
    bookLabel: 'Книга сказок',
    once: {
      title: 'Жил-был…',
      narr: 'В некотором царстве, в интернет-государстве жил-был Помидор — да не простой, а Сеньор. А в миру про него сказывают так:',
    },
    numbers: {
      title: 'Сказка в цифрах',
      narr: 'Сказка сказкой, а счёт любит точность. Вот что насчитали летописцы:',
    },
    earlyNarr: 'Всякая дальняя дорога начинается с первого шага. Был наш Помидор ещё зелен, когда отправился в путь:',
    jobs: [
      'Долго ли, коротко ли шёл Помидор — и привела его дорога в земли {company}.',
      'Скоро сказка сказывается, да не скоро дело делается. Следующей остановкой в пути стала {company}.',
      'За горами, за лесами лежала страна {company}. Туда и направился наш Помидор.',
      'Была у Помидора и ещё одна история — в краю под названием {company}.',
      'Другая дорога привела нашего Помидора в {company}. Вот что из этого вышло.',
    ],
    jobNow: 'И вот мы добрались до дня нынешнего. Сказка ещё пишется, а Помидор трудится здесь: {company}.',
    deeds: 'Дела и свершения',
    feats: {
      title: 'Подвиги',
      narr: 'У всякого сказочного героя есть подвиги. Есть они и у нашего Помидора — и все до единого настоящие.',
      word: 'Подвиг',
      ordinals: ['Подвиг первый', 'Подвиг второй', 'Подвиг третий', 'Подвиг четвёртый', 'Подвиг пятый', 'Подвиг шестой', 'Подвиг седьмой'],
    },
    chest: {
      title: 'Волшебный сундук инструментов',
      narr: 'В дорогу Помидор всегда берёт с собой сундук. Поднимите крышку — и глядите сами, что в нём лежит.',
      more: 'А на дне сундука ещё:',
    },
    end: {
      title: 'Конец… или начало?',
      narr: 'Тут и сказке конец, а кто дочитал — молодец. Да только конец ли это?',
      moral: 'Следующую главу можно написать вместе с вами.',
    },
    contactNarr: 'Пошлите Помидору весточку — и начнётся новая глава:',
    cvTitle: 'Та же сказка, но без прикрас',
  },
};
