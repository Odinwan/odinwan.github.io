import { Lang } from '../../translations';
import type { Topic } from './engine';

/** Connective phrases Vladislav "says". They carry no facts of their own — facts come from translations.ts. */
export type SayKey = 'hint' | 'now' | 'experience' | 'job' | 'projects' | 'stack' | 'stats' | 'cv' | 'hello' | 'thanks' | 'wrap';

interface Copy {
  hi: (name: string) => string;
  say: Record<SayKey, string>;
  help: string;
  /** Full question, used on a cold start. */
  q: Record<Topic, string>;
  /** Shorter follow-up wording, used when the topic continues the conversation. */
  follow: Record<Topic, string>;
  moreAbout: (company: string) => string;
  details: string;
  hide: string;
  earlier: (count: number) => string;
  online: string;
  typing: string;
  today: string;
  you: string;
  sent: string;
  read: string;
  log: string;
  suggestions: string;
  placeholder: string;
  inputLabel: string;
  send: string;
  language: string;
  topics: string;
  openTopics: string;
  progress: (done: number, total: number) => string;
  asked: string;
  jump: string;
  latest: string;
  prev: string;
  next: string;
  cvMain: string;
  projectsHint: string;
}

export const copy: Record<Lang, Copy> = {
  en: {
    hi: (name) => `Hi! I'm ${name}.`,
    say: {
      hint: 'This is my CV, just as a conversation. Tap a question below or type your own.',
      now: "Right now I'm here:",
      experience: 'Here is the whole path, newest first. Tap a role to see what I did there.',
      job: "Here's what that job is about:",
      projects: 'Some of the things I have built. Scroll through the cards.',
      stack: "Here's what I work with.",
      stats: 'In short, like this:',
      cv: 'Sure. Three versions — pick the one that fits the role.',
      hello: 'Hi! Ask away — the questions are right below.',
      thanks: 'Glad to help! If you want to continue, my contacts are one tap away.',
      wrap: "That's the whole CV. If it looks like a match, write to me — happy to talk.",
    },
    help: "I'm a simple chat, so I didn't catch that one. Here is what you can ask me:",
    q: {
      about: 'Who are you?',
      now: 'Where do you work now?',
      experience: 'Show your experience',
      projects: 'What have you built?',
      stack: "What's your stack?",
      stats: 'Numbers?',
      cv: 'Send me your CV',
      contact: 'How to contact you?',
    },
    follow: {
      about: 'Tell me about yourself',
      now: 'And where are you now?',
      experience: 'And the whole career?',
      projects: 'And projects?',
      stack: 'And the stack?',
      stats: 'Any numbers?',
      cv: 'Can you send the CV?',
      contact: 'How do I reach you?',
    },
    moreAbout: (company) => `Tell me more about ${company}`,
    details: 'Details',
    hide: 'Hide',
    earlier: (count) => `Show ${count} earlier roles`,
    online: 'online',
    typing: 'typing…',
    today: 'Today',
    you: 'You',
    sent: 'sent',
    read: 'read',
    log: 'Conversation',
    suggestions: 'Suggested questions',
    placeholder: 'Type a question…',
    inputLabel: 'Your message',
    send: 'Send',
    language: 'Language',
    topics: 'Topics',
    openTopics: 'All topics',
    progress: (done, total) => `${done} of ${total} asked`,
    asked: 'asked',
    jump: 'show the answer',
    latest: 'Scroll to the latest message',
    prev: 'Scroll back',
    next: 'Scroll forward',
    cvMain: 'Senior Frontend',
    projectsHint: 'Projects, scroll horizontally',
  },
  ru: {
    hi: (name) => `Привет! Я ${name}.`,
    say: {
      hint: 'Это моё резюме, только в формате переписки. Нажми на вопрос ниже или напиши свой.',
      now: 'Сейчас я здесь:',
      experience: 'Вот весь путь, от нового к старому. Нажми на любую роль — расскажу, чем там занимался.',
      job: 'Вот что это за работа:',
      projects: 'Кое-что из того, что я построил. Листай карточки.',
      stack: 'Вот с чем я работаю.',
      stats: 'Если коротко, то вот так:',
      cv: 'Конечно. Три версии — выбирай ту, что ближе к роли.',
      hello: 'Привет! Спрашивай — вопросы прямо под чатом.',
      thanks: 'Рад помочь! Если захочется продолжить — контакты в один тап.',
      wrap: 'Это всё резюме. Если похоже на то, что нужно, — напиши, буду рад пообщаться.',
    },
    help: 'Я простой чат и этот вопрос не понял. Вот о чём меня можно спросить:',
    q: {
      about: 'Кто ты?',
      now: 'Где ты сейчас работаешь?',
      experience: 'Покажи опыт',
      projects: 'Что ты построил?',
      stack: 'Какой у тебя стек?',
      stats: 'Цифры?',
      cv: 'Пришли резюме',
      contact: 'Как с тобой связаться?',
    },
    follow: {
      about: 'Расскажи о себе',
      now: 'А где ты сейчас?',
      experience: 'А весь путь целиком?',
      projects: 'А проекты?',
      stack: 'А стек?',
      stats: 'А в цифрах?',
      cv: 'Пришлёшь резюме?',
      contact: 'Как с тобой связаться?',
    },
    moreAbout: (company) => `Расскажи подробнее: ${company}`,
    details: 'Подробнее',
    hide: 'Свернуть',
    earlier: (count) => `Показать более ранние роли: ${count}`,
    online: 'в сети',
    typing: 'печатает…',
    today: 'Сегодня',
    you: 'Вы',
    sent: 'отправлено',
    read: 'прочитано',
    log: 'Переписка',
    suggestions: 'Подсказки вопросов',
    placeholder: 'Напиши вопрос…',
    inputLabel: 'Сообщение',
    send: 'Отправить',
    language: 'Язык',
    topics: 'Темы',
    openTopics: 'Все темы',
    progress: (done, total) => `Спрошено ${done} из ${total}`,
    asked: 'спрошено',
    jump: 'показать ответ',
    latest: 'К последнему сообщению',
    prev: 'Назад',
    next: 'Вперёд',
    cvMain: 'Senior Frontend',
    projectsHint: 'Проекты, листайте по горизонтали',
  },
};
