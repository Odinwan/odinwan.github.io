import { Lang } from '../../translations';

/** What each prop says when poked. Jokes only — no claims beyond what the CV itself states. */
export const QUIPS: Record<string, Record<Lang, readonly string[]>> = {
  candle: {
    ru: ['Не дайте таланту погаснуть — зовите на собеседование.', 'Работает и при свечах, и при дедлайнах.'],
    en: ["Don't let the talent burn out — book the interview.", 'Works by candlelight and by deadline.'],
  },
  tomato: {
    ru: ['Сеньор. Спелый. Готов к офферу.', 'Найми, не потеряй такого профи!', 'Помидор, а не овощ: думает головой.'],
    en: ['Senior. Ripe. Ready for an offer.', "Hire him — don't lose a pro like this!", 'Fully ripened. No green code.'],
  },
  grove: {
    ru: ['Растут быстро. Почти как его pull request-ы.', 'Не ешьте. Лучше наймите разработчика.'],
    en: ['They grow fast. Almost like his pull requests.', "Don't eat these. Hire the developer instead."],
  },
  potion: {
    ru: ['Зелье продуктивности. Побочный эффект — закрытые задачи.', 'Один глоток — и легаси уже не страшно.', 'Состав: кофе, TypeScript, щепотка магии.'],
    en: ['Potion of productivity. Side effect: closed tickets.', 'One sip and legacy code stops being scary.', 'Contains: coffee, TypeScript, a pinch of magic.'],
  },
  writing: {
    ru: ['Этим пером подписывают офферы. Намёк понятен?', 'Пишет код аккуратнее, чем гусиным пером.'],
    en: ['Offers get signed with this quill. Just saying.', 'Writes cleaner code than any quill could.'],
  },
  windowGroup: {
    ru: ['Звезда упала — загадывайте: «нанять Владислава».', 'В том замке тоже ищут сеньора. Успейте первыми.'],
    en: ['A shooting star — wish for it: "hire Vladislav".', 'That castle is hiring a senior too. Be quicker.'],
  },
  cat: {
    ru: ['Мяу. В переводе: наймите его, он хороший.', 'Код-ревью от кота: одобрено.', 'Я здесь главный. Но его советую.'],
    en: ['Meow. Translation: hire him, he is good.', 'Code review by cat: approved.', 'I run this place. I still recommend him.'],
  },
  cauldron: {
    ru: ['Варится релиз. Без костылей.', 'Рецепт: React, Next.js и капля терпения.'],
    en: ['A release is brewing. No hacks in the pot.', 'Recipe: React, Next.js and a drop of patience.'],
  },
  wand: {
    ru: ['Абракадабра — и фича в проде.', 'Магии нет. Есть сеньор.'],
    en: ['Abracadabra — and the feature is in production.', 'There is no magic. There is a senior.'],
  },
  chest: {
    ru: ['Сокровище не здесь. Оно ищет работу.', 'Золото — пустяки. Вот хороший фронтендер — редкость.'],
    en: ['The treasure is not in here. It is open to work.', 'Gold is easy. A good frontend developer is rare.'],
  },
  lantern: {
    ru: ['Он светит даже в тёмном легаси.', 'Выключили свет? Он и так дорогу найдёт.'],
    en: ['He finds the way even through dark legacy code.', 'Lights out? He knows the codebase anyway.'],
  },
  hat: {
    ru: ['Шляпа сеньора. Носит по праву.', 'Колдует на TypeScript.'],
    en: ["A senior's hat. Rightfully worn.", 'Casts his spells in TypeScript.'],
  },
  crystals: {
    ru: ['Кристально чистый код. Примерно такой.', 'Блестит. Как его резюме.'],
    en: ['Crystal-clear code. Roughly like this.', 'Shiny. Like his CV.'],
  },
  orbGroup: {
    ru: ['Вижу будущее… вы пишете ему оффер.', 'Шар показывает: дедлайн будет соблюдён.', 'Туманно… а нет, это просто CSS.'],
    en: ['I see the future… you are writing him an offer.', 'The orb says: the deadline will be met.', 'Cloudy… oh wait, that is just CSS.'],
  },
  engine: {
    ru: ['Механический ПК. Билд идёт три минуты, зато на шестерёнках.', 'Три цилиндра, ноль зависаний.', 'Жрёт уголь, зато TypeScript тянет.'],
    en: ['A mechanical PC. The build takes three minutes, but on real gears.', 'Three cylinders, zero freezes.', 'Burns coal, still runs TypeScript.'],
  },
  cvScroll: {
    ru: ['Свиток с резюме летит к вам. Берегите, как оффер.', 'Королевский указ: нанять немедля. PDF прилагается.'],
    en: ['The CV scroll is on its way. Guard it like an offer.', 'By royal decree: hire at once. PDF attached.'],
  },
  mug: {
    ru: ['Кофе превращается в код. Проверенный конвейер.', 'Вторая чашка. Задача уже в ревью.', 'Без кофе деплой не начнётся.', 'Пусто. Как бэклог после него.', 'Долил. Можно брать следующий спринт.'],
    en: ['Coffee turns into code. A proven pipeline.', 'Second cup. The task is already in review.', 'No coffee, no deploy.', 'Empty. Like the backlog after he is done.', 'Refilled. Ready for the next sprint.'],
  },
  bugJar: {
    ru: ['Баги под контролем.', 'Пойманы, пронумерованы, закрыты.', 'Не фича. Но и не на проде.'],
    en: ['Bugs: under control.', 'Caught, numbered, closed.', 'Not a feature. Not in production either.'],
  },
  duck: {
    ru: ['Кря! Найми, не потеряй такого профи!', 'Я слушаю про его баги. Слушать почти нечего.', 'Уточка одобряет. Нанимайте.'],
    en: ["Quack! Hire him — don't lose a pro like this!", 'I listen to his bugs. There is not much to listen to.', 'The duck approves. Hire away.'],
  },
  keyboard: {
    ru: ['Клац-клац. Так звучит закрытая задача.', 'Стучит быстро. И по делу.'],
    en: ['Click-clack. The sound of a ticket closing.', 'Types fast. And to the point.'],
  },
  laptop: {
    ru: ['У него работает не только «на моей машине».', 'Тесты зелёные. Совесть чиста.', 'Собирается с первого раза. Иногда.'],
    en: ['It works — and not only "on my machine".', 'Tests are green. Conscience is clear.', 'Builds on the first try. Sometimes.'],
  },
  robot: {
    ru: ['Бип-буп. Обнаружен AI-first сеньор.', 'Меня он тоже автоматизировал.'],
    en: ['Beep-boop. AI-first senior detected.', 'He automated me, too.'],
  },
  caseLeft: {
    ru: ['Hello, world. Hello, оффер.', 'Сервер не упал. Он прилёг.', 'Кубок «Лучший найм года» ждёт вас.'],
    en: ['Hello, world. Hello, offer.', 'The server is not down. It is resting.', 'The "Best Hire of the Year" cup could be yours.'],
  },
  caseRight: {
    ru: ['Роутер ловит только хорошие вакансии.', 'На этих полках всё, кроме его недостатков.'],
    en: ['This router only picks up good job offers.', 'Everything is on these shelves except his flaws.'],
  },
};

/** What a prop is called in the label that appears when the pointer is over it. */
export const NAMES: Record<string, Record<Lang, string>> = {
  book: { ru: 'Открыть книгу', en: 'Open the book' },
  cvScroll: { ru: 'Скачать резюме', en: 'Download the CV' },
  candle: { ru: 'Свеча', en: 'Candle' },
  tomato: { ru: 'Сеньор Помидор', en: 'Senior Tomato' },
  grove: { ru: 'Мухоморы', en: 'Toadstools' },
  potion: { ru: 'Зелье', en: 'Potion' },
  writing: { ru: 'Перо', en: 'Quill' },
  windowGroup: { ru: 'Окно', en: 'Window' },
  cat: { ru: 'Кот', en: 'Cat' },
  cauldron: { ru: 'Котёл', en: 'Cauldron' },
  wand: { ru: 'Волшебная палочка', en: 'Wand' },
  chest: { ru: 'Сундук', en: 'Chest' },
  lantern: { ru: 'Фонарь', en: 'Lantern' },
  hat: { ru: 'Шляпа', en: 'Hat' },
  crystals: { ru: 'Кристаллы', en: 'Crystals' },
  orbGroup: { ru: 'Хрустальный шар', en: 'Crystal ball' },
  duck: { ru: 'Уточка', en: 'Rubber duck' },
  keyboard: { ru: 'Клавиатура', en: 'Keyboard' },
  laptop: { ru: 'Ноутбук', en: 'Laptop' },
  robot: { ru: 'Робот', en: 'Robot' },
  caseLeft: { ru: 'Стеллаж', en: 'Shelves' },
  caseRight: { ru: 'Стеллаж', en: 'Shelves' },
  bugJar: { ru: 'Банка с багами', en: 'Jar of bugs' },
  mug: { ru: 'Кофе', en: 'Coffee' },
  engine: { ru: 'Механический ПК', en: 'Mechanical PC' },
};
