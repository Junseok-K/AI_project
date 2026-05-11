'use client';

import { useEffect, useState } from 'react';

type Language = 'ko' | 'en' | 'ja';

const LANGUAGE_STORAGE_KEY = 'pokemon-language';

const isLanguage = (value: string | null): value is Language =>
  value === 'ko' || value === 'en' || value === 'ja';

const translations: Record<Language, Record<string, string>> = {
  ko: {
    language: '언어',
    pokedex: '포켓몬 도감',
    quiz: '포켓몬 퀴즈',
  },
  en: {
    language: 'Language',
    pokedex: 'Pokemon Pokedex',
    quiz: 'Pokemon Quiz',
  },
  ja: {
    language: '言語',
    pokedex: 'ポケモン図鑑',
    quiz: 'ポケモンクイズ',
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('ko');
  const t = translations[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (isLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event('pokemon-language-change'));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-[#1e1e1e]">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-8 sm:top-8">
        <label htmlFor="language" className="font-semibold text-[#e0e0e0]">
          {t.language}:
        </label>
        <select
          id="language"
          value={language}
          onChange={(event) => changeLanguage(event.target.value as Language)}
          className="rounded-lg px-3 py-2 font-semibold"
          style={{
            backgroundColor: '#252526',
            borderColor: '#3e3e42',
            color: '#e0e0e0',
            colorScheme: 'dark',
          }}
        >
          <option value="ko" style={{ backgroundColor: '#252526', color: '#e0e0e0' }}>
            한국어
          </option>
          <option value="en" style={{ backgroundColor: '#252526', color: '#e0e0e0' }}>
            English
          </option>
          <option value="ja" style={{ backgroundColor: '#252526', color: '#e0e0e0' }}>
            日本語
          </option>
        </select>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-xs flex-col gap-3">
          <a
            href="/pokemon"
            className="rounded-lg bg-[#007acc] px-6 py-3 text-center font-semibold text-white transition-opacity hover:opacity-80"
          >
            {t.pokedex}
          </a>
          <a
            href="/pokemon-quiz"
            className="rounded-lg bg-[#007acc] px-6 py-3 text-center font-semibold text-white transition-opacity hover:opacity-80"
          >
            {t.quiz}
          </a>
        </div>
      </main>
    </div>
  );
}
