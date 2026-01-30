export const locales = ['en', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  fr: 'Francais',
  en: 'English',
  es: 'Español',
};
