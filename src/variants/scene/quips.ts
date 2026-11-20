import { Lang } from '../../translations';

/** What each prop says when poked. Jokes only — no claims beyond what the CV itself states. */
export const QUIPS: Record<string, Record<Lang, readonly string[]>> = {
  knock: {
    ru: ['Тук-тук! «Гонец из Тридевятого: хорошая работа, Сеньор!»', 'Тук-тук! «Передайте Помидору: релиз вышел без единого бага».', 'Тук-тук! «Спасибо за код-ревью! — соседи по королевству».'],
    en: ['Knock-knock! “A herald from Far Far Away: good work, Senior!”', 'Knock-knock! “Tell the Tomato the release shipped without a single bug.”', 'Knock-knock! “Thanks for the code review! — the neighbours.”'],
  },
  bugDone: {
    ru: ['Спасибо, что нашли мне работу! Карточка уже на доске.', 'Баг пойман: задача заведена, банка пополнена. Благодарю!', 'Ещё один в банку. Спасибо — без вас я бы его до утра искал.'],
    en: ['Thanks for finding me some work! The card is already on the board.', 'Bug caught: ticket filed, jar topped up. Much obliged!', 'Another one for the jar. Thank you — I would have hunted it till morning.'],
  },
  portrait: {
    ru: ['Портрет кисти неизвестного джуна. Холст, масло, дедлайн.', 'Позировал три спринта подряд. Ни разу не моргнул.', 'Каждый клик — новый ракурс. Неудачных нет.', 'Раму выбирал сам. Отступы — тоже.'],
    en: ['Portrait by an unknown junior. Oil, canvas, deadline.', 'Sat for it three sprints running. Never blinked.', 'A new angle with every click. No bad ones.', 'Chose the frame himself. The padding, too.'],
  },
  // The cord has two sets of lines: these for lights back on, `cord` below for lights out.
  cordOn: {
    ru: ['Светлая тема. Смелый выбор.', 'Да будет свет! И code review при свете.', 'Свет включён. Баги попрятались — но карточки на доске остались.'],
    en: ['Light theme. A bold choice.', 'Let there be light! And code review by daylight.', 'Lights on. The bugs have hidden — the cards on the board have not.'],
  },
  cord: {
    ru: ['Тёмная тема включена. Глаза сеньора говорят спасибо.', 'Свет выключил, прод — нет.', 'В темноте видно главное: что светится, то и работает.'],
    en: ['Dark theme on. A senior’s eyes say thank you.', 'Lights off. Production stays on.', 'In the dark you see what matters: if it glows, it works.'],
  },
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
    ru: ['Бип-буп. Сеньор пишет сам. Я только подаю ключи.', 'Меня он тоже автоматизировал.'],
    en: ['Beep-boop. The senior writes it himself. I just hand him the spanners.', 'He automated me, too.'],
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

/**
 * Letters that blow in through the window. Storybook thank-yous from storybook senders —
 * plainly fiction, never a quote from a real client or employer.
 */
export const LETTERS: Record<Lang, readonly { text: string; from: string }[]> = {
  ru: [
    { text: 'Сеньор Помидор! Мост через Реку Легаси стоит третий год и не шатается. Весь двор говорит спасибо.', from: 'Король Дедлайн Первый' },
    { text: 'Благодарим за интерфейс: даже наш дракон разобрался с первого раза и никого не съел.', from: 'Гильдия тестировщиков Тридевятого царства' },
    { text: 'Вы объяснили мне баг так спокойно, что он сам ушёл. Кря — и спасибо.', from: 'Утка-отладчица' },
    { text: 'Сборка стала быстрее, чем гонец на свежем коне. Низкий поклон.', from: 'Мельник, смотритель CI' },
  ],
  en: [
    { text: 'Senior Tomato! The bridge over the River Legacy has stood three years without a wobble. The whole court says thank you.', from: 'King Deadline the First' },
    { text: 'Thank you for the interface: even our dragon worked it out first try and ate nobody.', from: 'The Testers’ Guild of Far Far Away' },
    { text: 'You explained my bug so calmly that it left by itself. Quack — and thank you.', from: 'The Debugging Duck' },
    { text: 'The build now runs faster than a herald on a fresh horse. A deep bow.', from: 'The Miller, keeper of CI' },
  ],
};

/**
 * Letters the post owl brings: offers from a school of wizardry that wants him on the staff.
 * A fond nod to stories about wizard schools; every name here is our own invention.
 */
export const OWL_LETTERS: Record<Lang, readonly { text: string; from: string }[]> = {
  ru: [
    { text: 'Уважаемый Владислав! Вы зачислены. Нет, не учиться — преподавать. Вы настоящий маг вёрстки, кафедра ждёт вас с понедельника.', from: 'Школа чародейства и фронтенда, приёмная комиссия' },
    { text: 'Ваш flexbox центрирует с первого взмаха, а grid ложится без единого заклинания. Возьмите у нас курс «Защита от тёмных багов».', from: 'Декан факультета Гриддиндор' },
    { text: 'Мантию выдадим, палочку заменит стилус, в подземелье у нас серверная. Жалованье — золотом, отпуск — по календарю релизов.', from: 'Завхоз школы' },
    { text: 'P.S. Сову, пожалуйста, покормите. Она третий раз врезается в ваше окно: у вас слишком чистые стёкла и слишком чистый код.', from: 'Директор, собственноручно' },
  ],
  en: [
    { text: 'Dear Vladislav! You have been accepted. No, not to study — to teach. You are a true wizard of layout; the chair awaits you from Monday.', from: 'The School of Wizardry and Frontend, admissions' },
    { text: 'Your flexbox centres at the first flick, and your grid falls into place without a single incantation. Do take our course “Defence Against the Dark Bugs”.', from: 'The Dean of Griddindor House' },
    { text: 'Robes are provided, a stylus will do for a wand, and the dungeon is our server room. Pay is in gold, holidays follow the release calendar.', from: 'The school caretaker' },
    { text: 'P.S. Please feed the owl. That is the third time she has flown into your window: your panes are too clean, and so is your code.', from: 'The Headmaster, in his own hand' },
  ],
};

/** What a prop is called in the label that appears when the pointer is over it. */
export const NAMES: Record<string, Record<Lang, string>> = {
  book: { ru: 'Открыть книгу', en: 'Open the book' },
  cvScroll: { ru: 'Скачать резюме', en: 'Download the CV' },
  cord: { ru: 'Выключатель', en: 'Light cord' },
  portrait: { ru: 'Портрет — сменить', en: 'Portrait — change it' },
  mail: { ru: 'Письмо — прочитать', en: 'A letter — read it' },
  bug: { ru: 'Жучок — лови!', en: 'A bug — catch it!' },
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
