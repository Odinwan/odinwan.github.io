import { Lang } from '../../translations';
import { HelpGroupId } from './commands';

export interface TerminalStrings {
  boot: string;
  /** Banner hint, wrapped around two runnable commands: `{hint1} [next] {hint2} [help] {hint3}`. */
  hint1: string;
  hint2: string;
  hint3: string;
  fetchStatus: string;
  fetchExperience: string;
  fetchNow: string;
  fetchStack: string;
  fetchContact: string;
  fetchTheme: string;
  inputLabel: string;
  inputPlaceholder: string;
  placeholderNext: (cmd: string) => string;
  runLabel: string;
  chipsLabel: string;
  outputLabel: string;
  langLabel: string;
  helpTitle: string;
  helpGroups: Record<HelpGroupId, string>;
  help: Record<string, string>;
  helpKeysTitle: string;
  helpKeys: readonly { keys: string; desc: string }[];
  notFound: string;
  didYouMean: string;
  typeHelpBefore: string;
  typeHelpAfter: string;
  noEntry: (cmd: string, arg: string, max: number) => string;
  openHint: string;
  experienceTitle: string;
  projectsTitle: string;
  back: string;
  prev: string;
  next: string;
  nextUp: string;
  tourStep: (step: number, total: number) => string;
  tourTitle: string;
  tourText: (total: number) => string;
  tourStart: string;
  tourEnd: string;
  tourRestart: string;
  cvTitle: string;
  cvMain: string;
  copy: string;
  copied: string;
  langCurrent: string;
  langSet: string;
  usage: string;
  langBad: (arg: string) => string;
  langNames: Record<Lang, string>;
  themeTitle: string;
  themeSet: string;
  themeBad: (arg: string) => string;
  themeCurrent: string;
  themeHint: string;
  lsHint: string;
  noFile: (cmd: string, arg: string) => string;
  openUsage: string;
  whoami: string;
  whoamiOwner: string;
  sudoPassword: string;
  sudoGranted: string;
  sudoDenied: string;
  sudoTry: string;
  exit: string;
  rm: string;
}

export const strings: Record<Lang, TerminalStrings> = {
  en: {
    boot: 'interactive CV · session started',
    hint1: 'New here? Press Enter or tap',
    hint2: 'to walk through the CV step by step. Or pick a section below —',
    hint3: 'lists every command.',
    fetchStatus: 'status',
    fetchExperience: 'experience',
    fetchNow: 'now',
    fetchStack: 'stack',
    fetchContact: 'contact',
    fetchTheme: 'theme',
    inputLabel: 'Terminal command',
    inputPlaceholder: 'type a command…',
    placeholderNext: (cmd) => `↵ next: ${cmd}`,
    runLabel: 'Run',
    chipsLabel: 'Quick commands',
    outputLabel: 'Terminal output',
    langLabel: 'Language',
    helpTitle: 'Commands',
    helpGroups: { read: 'Read the CV', reach: 'Get in touch', session: 'Session' },
    help: {
      about: 'who I am, education, languages',
      stats: 'the career in four numbers',
      experience: 'career timeline, or one job in detail',
      projects: 'project list, or one project in detail',
      skills: 'tech stack by group',
      contact: 'email, LinkedIn, Telegram, phone',
      cv: 'download the CV as PDF (3 versions)',
      next: 'go to the next step of the tour',
      tour: 'start the guided tour from the beginning',
      ls: 'the CV as files — cat, cd and open work too',
      theme: 'switch the colour palette',
      lang: 'switch language',
      clear: 'clear the screen',
      help: 'show this list',
    },
    helpKeysTitle: 'Keys',
    helpKeys: [
      { keys: 'Enter', desc: 'on an empty line — next step of the tour' },
      { keys: '1–9', desc: 'open that item of the list on screen' },
      { keys: '↑ ↓', desc: 'command history' },
      { keys: 'Tab', desc: 'autocomplete' },
      { keys: 'Ctrl+L', desc: 'clear the screen' },
    ],
    notFound: 'command not found',
    didYouMean: 'Did you mean',
    typeHelpBefore: 'Type',
    typeHelpAfter: 'to see what is available.',
    noEntry: (cmd, arg, max) => `${cmd}: no entry "${arg}" — use a number from 1 to ${max}`,
    openHint: 'Click a row, or type its number, for details.',
    experienceTitle: 'Experience',
    projectsTitle: 'Projects',
    back: 'list',
    prev: 'prev',
    next: 'next',
    nextUp: 'Next',
    tourStep: (step, total) => `step ${step} of ${total}`,
    tourTitle: 'Guided tour',
    tourText: (total) => `The whole CV in ${total} short steps: who I am, the numbers, every job, the projects, the stack and how to reach me. Each press of Enter (or tap on "next") shows the next one; you can leave the route at any time.`,
    tourStart: 'Start',
    tourEnd: 'That was the last step of the tour — thank you for reading.',
    tourRestart: 'Start over',
    cvTitle: 'CV — pick a version',
    cvMain: 'Senior Frontend',
    copy: 'copy',
    copied: 'copied',
    langCurrent: 'Current language:',
    langSet: 'Language set to',
    usage: 'Usage:',
    langBad: (arg) => `lang: unknown language "${arg}"`,
    langNames: { en: 'English', ru: 'Russian' },
    themeTitle: 'Colour themes',
    themeSet: 'Theme set to',
    themeBad: (arg) => `theme: unknown theme "${arg}"`,
    themeCurrent: 'current',
    themeHint: 'Click a palette or type "theme <name>". The choice is remembered on this device.',
    lsHint: 'Every file opens a section — click one, or use cat / cd / open.',
    noFile: (cmd, arg) => `${cmd}: ${arg}: No such file or directory`,
    openUsage: 'a number or a file name',
    whoami: 'visitor',
    whoamiOwner: 'You are a guest here. The owner of this machine:',
    sudoPassword: '[sudo] password for visitor:',
    sudoGranted: 'Access granted. No password needed, really — just write:',
    sudoDenied: 'visitor is not in the sudoers file. This incident will not be reported.',
    sudoTry: 'There is one thing you are allowed to do, though:',
    exit: 'There is no logout — this terminal is the whole page. The other designs of this CV are in the title bar.',
    rm: 'rm: permission denied — this CV is read-only. Nice try, though.',
  },
  ru: {
    boot: 'интерактивное резюме · сессия открыта',
    hint1: 'Впервые здесь? Нажмите Enter или',
    hint2: '— и пройдёте резюме шаг за шагом. Или выберите раздел ниже,',
    hint3: 'покажет все команды.',
    fetchStatus: 'статус',
    fetchExperience: 'опыт',
    fetchNow: 'сейчас',
    fetchStack: 'стек',
    fetchContact: 'контакт',
    fetchTheme: 'тема',
    inputLabel: 'Команда терминала',
    inputPlaceholder: 'введите команду…',
    placeholderNext: (cmd) => `↵ дальше: ${cmd}`,
    runLabel: 'Выполнить',
    chipsLabel: 'Быстрые команды',
    outputLabel: 'Вывод терминала',
    langLabel: 'Язык',
    helpTitle: 'Команды',
    helpGroups: { read: 'Читать резюме', reach: 'Связаться', session: 'Сессия' },
    help: {
      about: 'кто я, образование, языки',
      stats: 'карьера в четырёх цифрах',
      experience: 'таймлайн карьеры или одно место работы подробно',
      projects: 'список проектов или один проект подробно',
      skills: 'стек по группам',
      contact: 'почта, LinkedIn, Telegram, телефон',
      cv: 'скачать резюме в PDF (3 версии)',
      next: 'следующий шаг тура',
      tour: 'начать тур по резюме сначала',
      ls: 'резюме в виде файлов — cat, cd и open тоже работают',
      theme: 'сменить цветовую тему',
      lang: 'сменить язык',
      clear: 'очистить экран',
      help: 'показать этот список',
    },
    helpKeysTitle: 'Клавиши',
    helpKeys: [
      { keys: 'Enter', desc: 'в пустой строке — следующий шаг тура' },
      { keys: '1–9', desc: 'открыть этот пункт списка на экране' },
      { keys: '↑ ↓', desc: 'история команд' },
      { keys: 'Tab', desc: 'автодополнение' },
      { keys: 'Ctrl+L', desc: 'очистить экран' },
    ],
    notFound: 'команда не найдена',
    didYouMean: 'Возможно, вы имели в виду',
    typeHelpBefore: 'Введите',
    typeHelpAfter: 'чтобы увидеть доступные команды.',
    noEntry: (cmd, arg, max) => `${cmd}: записи "${arg}" нет — укажите число от 1 до ${max}`,
    openHint: 'Нажмите на строку или введите её номер, чтобы увидеть детали.',
    experienceTitle: 'Опыт',
    projectsTitle: 'Проекты',
    back: 'список',
    prev: 'назад',
    next: 'дальше',
    nextUp: 'Дальше',
    tourStep: (step, total) => `шаг ${step} из ${total}`,
    tourTitle: 'Тур по резюме',
    tourText: (total) => `Всё резюме за ${total} коротких шагов: кто я, цифры, каждое место работы, проекты, стек и контакты. Каждое нажатие Enter (или кнопки «next») показывает следующий шаг; с маршрута можно сойти в любой момент.`,
    tourStart: 'Начать',
    tourEnd: 'Это был последний шаг тура — спасибо, что дочитали.',
    tourRestart: 'Пройти заново',
    cvTitle: 'Резюме — выберите версию',
    cvMain: 'Senior Frontend',
    copy: 'копировать',
    copied: 'скопировано',
    langCurrent: 'Текущий язык:',
    langSet: 'Язык переключён:',
    usage: 'Использование:',
    langBad: (arg) => `lang: неизвестный язык "${arg}"`,
    langNames: { en: 'английский', ru: 'русский' },
    themeTitle: 'Цветовые темы',
    themeSet: 'Тема переключена:',
    themeBad: (arg) => `theme: неизвестная тема "${arg}"`,
    themeCurrent: 'текущая',
    themeHint: 'Нажмите на палитру или введите "theme <имя>". Выбор запомнится на этом устройстве.',
    lsHint: 'Каждый файл открывает раздел — нажмите на него или используйте cat / cd / open.',
    noFile: (cmd, arg) => `${cmd}: ${arg}: Нет такого файла или каталога`,
    openUsage: 'номер или имя файла',
    whoami: 'visitor',
    whoamiOwner: 'Вы здесь гость. Владелец этой машины:',
    sudoPassword: '[sudo] пароль для visitor:',
    sudoGranted: 'Доступ разрешён. Пароль на самом деле не нужен — просто напишите:',
    sudoDenied: 'visitor отсутствует в файле sudoers. Об этом инциденте никому не сообщат.',
    sudoTry: 'Но одно действие вам всё же разрешено:',
    exit: 'Выйти не получится — этот терминал и есть вся страница. Другие варианты резюме — в заголовке окна.',
    rm: 'rm: доступ запрещён — это резюме только для чтения. Но попытка засчитана.',
  },
};
