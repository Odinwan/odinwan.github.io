import { Lang } from '../../translations';

/** UI strings that exist only in the classic variant. CV content itself comes from translations.ts. */
export const strings: Record<Lang, {
  summary: string;
  numbers: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  contact: string;
  print: string;
  printLong: string;
  pdfShort: string;
  moreCv: string;
  language: string;
  sections: string;
  toolbar: string;
  photoAlt: string;
  stack: string;
  toTop: string;
}> = {
  en: {
    summary: 'Profile',
    numbers: 'Key numbers',
    experience: 'Experience',
    projects: 'Selected projects',
    skills: 'Skills',
    education: 'Education & languages',
    contact: 'Contact',
    print: 'Print',
    printLong: 'Print / Save as PDF',
    pdfShort: 'PDF',
    moreCv: 'Other CV versions',
    language: 'Language',
    sections: 'Sections',
    toolbar: 'Page tools',
    photoAlt: 'Portrait of Vladislav Cupnii',
    stack: 'Stack',
    toTop: 'Back to top',
  },
  ru: {
    summary: 'Профиль',
    numbers: 'В цифрах',
    experience: 'Опыт работы',
    projects: 'Избранные проекты',
    skills: 'Навыки',
    education: 'Образование и языки',
    contact: 'Контакты',
    print: 'Печать',
    printLong: 'Печать / Сохранить как PDF',
    pdfShort: 'PDF',
    moreCv: 'Другие версии резюме',
    language: 'Язык',
    sections: 'Разделы',
    toolbar: 'Инструменты страницы',
    photoAlt: 'Портрет: Владислав Купный',
    stack: 'Стек',
    toTop: 'Наверх',
  },
};
