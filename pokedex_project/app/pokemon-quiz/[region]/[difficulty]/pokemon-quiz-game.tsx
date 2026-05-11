'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'expert';
type Language = 'ko' | 'en' | 'ja';
type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

interface NamedApiResource {
  name: string;
  url: string;
}

interface QuizAbility {
  name: string;
  description: string;
  isHidden: boolean;
}

interface QuizPokemon {
  id: number;
  names: string[];
  displayName: string;
  image: string;
  cry: string;
  types: PokemonType[];
  description: string;
  abilities: QuizAbility[];
  height: number;
  weight: number;
}

interface PokemonQuizGameProps {
  region: string;
  difficulty: string;
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const QUESTION_COUNT = 20;
const LANGUAGE_STORAGE_KEY = 'pokemon-language';

const regionNames: Record<string, string> = {
  all: '전체 지방',
  kanto: '관동',
  johto: '성도',
  hoenn: '호연',
  sinnoh: '신오',
  unova: '하나',
  kalos: '칼로스',
  alola: '알로라',
  galar: '가라르',
  paldea: '팔데아',
};

const regionGenerations: Record<string, number[]> = {
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  kanto: [1],
  johto: [2],
  hoenn: [3],
  sinnoh: [4],
  unova: [5],
  kalos: [6],
  alola: [7],
  galar: [8],
  paldea: [9],
};

const difficultyLabels: Record<Difficulty, string> = {
  beginner: '초보',
  intermediate: '중수',
  expert: '고수',
};

const typeLabels: Record<PokemonType, string> = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  electric: '전기',
  grass: '풀',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
};

const typeColors: Record<PokemonType, string> = {
  normal: '#929da3',
  fire: '#ff9d55',
  water: '#5090d6',
  electric: '#f4d23c',
  grass: '#63bc5a',
  ice: '#73cec0',
  fighting: '#ce416b',
  poison: '#aa6bc8',
  ground: '#d97845',
  flying: '#8fa9de',
  psychic: '#fa7179',
  bug: '#91c12f',
  rock: '#c5b78c',
  ghost: '#5269ad',
  dragon: '#0b6dc3',
  dark: '#5a5465',
  steel: '#5a8ea2',
  fairy: '#ec8fe6',
};

const versionOrder: Record<string, number> = {
  red: 101,
  blue: 102,
  yellow: 103,
  gold: 201,
  silver: 202,
  crystal: 203,
  ruby: 301,
  sapphire: 302,
  emerald: 303,
  firered: 304,
  leafgreen: 305,
  diamond: 401,
  pearl: 402,
  platinum: 403,
  heartgold: 404,
  soulsilver: 405,
  black: 501,
  white: 502,
  'black-2': 503,
  'white-2': 504,
  x: 601,
  y: 602,
  'omega-ruby': 603,
  'alpha-sapphire': 604,
  sun: 701,
  moon: 702,
  'ultra-sun': 703,
  'ultra-moon': 704,
  'lets-go-pikachu': 705,
  'lets-go-eevee': 706,
  sword: 801,
  shield: 802,
  'brilliant-diamond': 803,
  'shining-pearl': 804,
  'legends-arceus': 805,
  scarlet: 901,
  violet: 902,
};

const normalizeAnswer = (value: string) =>
  value.toLowerCase().replace(/[.\s_\-']/g, '').trim();

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const isLanguage = (value: string | null): value is Language =>
  value === 'ko' || value === 'en' || value === 'ja';

const getPokeApiLanguageNames = (language: Language) => {
  const languageNames: Record<Language, string[]> = {
    ko: ['ko'],
    en: ['en'],
    ja: ['ja-Hrkt', 'ja'],
  };

  return languageNames[language];
};

const getLocalizedName = (
  names: Array<{ language: { name: string }; name: string }> | undefined,
  language: Language,
  fallback: string
) =>
  names?.find((entry) => getPokeApiLanguageNames(language).includes(entry.language.name))?.name ||
  names?.find((entry) => entry.language.name === 'en')?.name ||
  fallback;

const getRecentDescription = (
  entries: Array<{ flavor_text: string; language: { name: string }; version: { name: string } }>,
  language: Language
) => {
  const languageEntries = entries.filter((entry) =>
    getPokeApiLanguageNames(language).includes(entry.language.name)
  );
  const fallbackEntries = entries.filter((entry) => entry.language.name === 'en');

  const sortedEntries = [...(languageEntries.length > 0 ? languageEntries : fallbackEntries)].sort((a, b) => {
    const orderDiff = (versionOrder[b.version.name] || 0) - (versionOrder[a.version.name] || 0);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return getPokeApiLanguageNames(language).includes(a.language.name) ? -1 : 1;
  });

  return cleanText(sortedEntries[0]?.flavor_text || '설명 정보가 없습니다.');
};

const getLocalizedAbilityDescription = (
  abilityData: { flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }> },
  language: Language
) => {
  const languageNames = getPokeApiLanguageNames(language);
  const localizedDescription = abilityData.flavor_text_entries?.find((entry) =>
    languageNames.includes(entry.language.name)
  )?.flavor_text;
  const fallbackDescription = abilityData.flavor_text_entries?.find(
    (entry) => entry.language.name === 'en'
  )?.flavor_text;

  return cleanText(localizedDescription || fallbackDescription || '특성 설명이 없습니다.');
};

const shuffle = <T,>(items: T[]) => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }

  return nextItems;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('PokeAPI 요청에 실패했습니다.');
  }

  return response.json();
};

const buildQuizPokemon = async (speciesResource: NamedApiResource, language: Language): Promise<QuizPokemon> => {
  const species = await fetchJson<{
    id: number;
    name: string;
    names: Array<{ language: { name: string }; name: string }>;
    flavor_text_entries: Array<{
      flavor_text: string;
      language: { name: string };
      version: { name: string };
    }>;
    varieties: Array<{ is_default: boolean; pokemon: NamedApiResource }>;
  }>(speciesResource.url);
  const defaultPokemon = species.varieties.find((variety) => variety.is_default)?.pokemon || species.varieties[0].pokemon;
  const pokemon = await fetchJson<{
    id: number;
    height: number;
    weight: number;
    cries?: { latest?: string; legacy?: string };
    sprites: { other?: { 'official-artwork'?: { front_default?: string } }; front_default?: string };
    types: Array<{ type: { name: PokemonType } }>;
    abilities: Array<{ ability: NamedApiResource; is_hidden: boolean }>;
  }>(defaultPokemon.url);
  const abilities = await Promise.all(
    pokemon.abilities.map(async ({ ability, is_hidden }) => {
      const abilityData = await fetchJson<{
        names: Array<{ language: { name: string }; name: string }>;
        flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }>;
      }>(ability.url);

      return {
        name: getLocalizedName(abilityData.names, language, ability.name.replaceAll('-', ' ')),
        description: getLocalizedAbilityDescription(abilityData, language),
        isHidden: is_hidden,
      };
    })
  );
  const displayName = getLocalizedName(species.names, language, species.name);
  const answerNames = [
    displayName,
    species.name,
    ...species.names
      .filter((entry) => ['ko', 'en', 'ja-Hrkt', 'ja'].includes(entry.language.name))
      .map((entry) => entry.name),
  ];

  return {
    id: pokemon.id,
    names: Array.from(new Set(answerNames.map(normalizeAnswer))),
    displayName,
    image: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '',
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || '',
    types: pokemon.types.map((entry) => entry.type.name),
    description: getRecentDescription(species.flavor_text_entries, language),
    abilities,
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
  };
};

const getQuestionPool = async (region: string) => {
  const generationIds = regionGenerations[region] || regionGenerations.all;
  const generationResults = await Promise.all(
    generationIds.map((generationId) =>
      fetchJson<{ pokemon_species: NamedApiResource[] }>(`${POKEAPI_BASE_URL}/generation/${generationId}/`)
    )
  );

  return generationResults.flatMap((generation) => generation.pokemon_species);
};

export default function PokemonQuizGame({ region, difficulty }: PokemonQuizGameProps) {
  const answerInputRef = useRef<HTMLInputElement>(null);
  const selectedDifficulty = (['beginner', 'intermediate', 'expert'].includes(difficulty)
    ? difficulty
    : 'beginner') as Difficulty;
  const regionName = regionNames[region] || '포켓몬';
  const [questions, setQuestions] = useState<QuizPokemon[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>('ko');
  const [inputFocused, setInputFocused] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isFinished = questions.length > 0 && currentIndex >= questions.length;

  const hintVisibility = useMemo(
    () => ({
      silhouette: selectedDifficulty === 'beginner',
      cry: selectedDifficulty !== 'expert',
      types: selectedDifficulty === 'beginner',
      description: true,
      abilities: selectedDifficulty !== 'expert',
      size: true,
    }),
    [selectedDifficulty]
  );

  useEffect(() => {
    const syncLanguage = () => {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      setLanguage(isLanguage(savedLanguage) ? savedLanguage : 'ko');
    };

    syncLanguage();
    window.addEventListener('storage', syncLanguage);
    window.addEventListener('pokemon-language-change', syncLanguage);

    return () => {
      window.removeEventListener('storage', syncLanguage);
      window.removeEventListener('pokemon-language-change', syncLanguage);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError('');

        const pool = await getQuestionPool(region);
        const selectedSpecies = shuffle(pool).slice(0, QUESTION_COUNT);
        const loadedQuestions = await Promise.all(
          selectedSpecies.map((species) => buildQuizPokemon(species, language))
        );

        if (isActive) {
          setQuestions(loadedQuestions);
          setCurrentIndex(0);
          setAnswer('');
          setFeedback('');
          setScore(0);
          setAnswered(false);
        }
      } catch {
        if (isActive) {
          setError('포켓몬 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadQuestions();

    return () => {
      isActive = false;
    };
  }, [region, language]);

  useEffect(() => {
    if (!currentQuestion || answered) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      answerInputRef.current?.focus({ preventScroll: true });
    }, 100);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [currentQuestion, answered]);

  const playCry = () => {
    if (!currentQuestion?.cry) {
      return;
    }

    new Audio(currentQuestion.cry).play();
  };

  const submitAnswer = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!currentQuestion || answered || !answer.trim()) {
      return;
    }

    const isCorrect = currentQuestion.names.includes(normalizeAnswer(answer));

    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
      setFeedback('정답입니다.');
    } else {
      setFeedback(`오답입니다. 정답은 ${currentQuestion.displayName}입니다.`);
    }

    setInputFocused(false);
    setAnswered(true);
    window.setTimeout(() => {
      goToNextQuestion();
    }, 2000);
  };

  const goToNextQuestion = () => {
    setCurrentIndex((index) => index + 1);
    setAnswer('');
    setFeedback('');
    setAnswered(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#1e1e1e] px-4 text-[#e0e0e0]">
        <div className="rounded-lg border border-white/10 bg-[#252526] px-6 py-5 text-lg font-bold">
          포켓몬 퀴즈를 준비하는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#1e1e1e] px-4 py-8 text-[#e0e0e0]">
        <main className="mx-auto max-w-3xl">
          <a href={`/pokemon-quiz/${region}`} className="rounded-lg bg-[#007acc] px-4 py-2 font-semibold text-white">
            난이도 선택으로 돌아가기
          </a>
          <p className="mt-8 rounded-lg border border-red-400/30 bg-red-500/10 px-5 py-4 font-bold text-red-200">
            {error}
          </p>
        </main>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#1e1e1e] px-4 py-8 text-[#e0e0e0]">
        <main className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-[#ce9178]">퀴즈 완료</h1>
          <p className="mt-6 text-2xl font-bold text-white">
            {QUESTION_COUNT}문제 중 {score}문제 정답
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`/pokemon-quiz/${region}`} className="rounded-lg bg-[#007acc] px-5 py-3 font-bold text-white">
              난이도 다시 선택
            </a>
            <a href="/pokemon-quiz" className="rounded-lg bg-[#ce9178] px-5 py-3 font-bold text-white">
              지방 다시 선택
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#1e1e1e] px-3 py-2 text-[#e0e0e0] sm:min-h-screen sm:overflow-x-hidden sm:px-4 sm:py-8">
      <main className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div
          className={`mb-2 shrink-0 flex-wrap items-center justify-between gap-2 sm:mb-8 sm:flex sm:gap-3 ${
            inputFocused ? 'hidden' : 'flex'
          }`}
        >
          <a
            href={`/pokemon-quiz/${region}`}
            className="rounded-lg bg-[#007acc] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 sm:px-4 sm:text-base"
          >
            난이도 선택으로 돌아가기
          </a>
          <div className="text-sm font-bold text-[#bdbdbd]">
            {regionName} · {difficultyLabels[selectedDifficulty]} · {currentIndex + 1}/{QUESTION_COUNT} · 점수 {score}
          </div>
        </div>

        {currentQuestion && (
          <section
            className={`min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#252526] p-3 sm:p-8 ${
              inputFocused ? 'flex flex-col justify-end' : ''
            }`}
          >
            <div
              className={`grid min-h-0 gap-2 lg:grid-cols-[320px_1fr] lg:gap-8 ${
                inputFocused ? 'h-auto w-full' : 'h-full'
              }`}
            >
              <div
                className={`h-20 items-center justify-center rounded-lg bg-[#111318] p-2 sm:flex sm:min-h-72 sm:p-6 ${
                  inputFocused ? 'hidden' : 'flex'
                }`}
              >
                {answered && currentQuestion.image ? (
                  <img
                    src={currentQuestion.image}
                    alt={currentQuestion.displayName}
                    className="h-20 w-20 object-contain transition duration-300 sm:h-64 sm:w-64"
                  />
                ) : hintVisibility.silhouette && currentQuestion.image ? (
                  <img
                    src={currentQuestion.image}
                    alt="포켓몬 실루엣"
                    className="h-20 w-20 object-contain transition duration-300 sm:h-64 sm:w-64"
                    style={{ filter: 'brightness(0)' }}
                  />
                ) : (
                  <div className="text-center text-sm font-bold text-[#858585] sm:text-lg">
                    정답 제출 후 포켓몬이 공개됩니다.
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col">
                <h1
                  className={`shrink-0 text-xl font-bold text-[#ce9178] sm:block sm:text-3xl ${
                    inputFocused ? 'hidden' : 'block'
                  }`}
                >
                  어떤 포켓몬일까요?
                </h1>

                <div className="grid min-h-0 gap-2 overflow-hidden sm:mt-6 sm:gap-4">
                  {hintVisibility.cry && (
                    <button
                      type="button"
                      onClick={playCry}
                      disabled={!currentQuestion.cry}
                      className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:gap-3 sm:px-4"
                    >
                      <span>🔊</span>
                      울음소리 재생
                    </button>
                  )}

                  {hintVisibility.types && (
                    <div>
                      <p className="mb-1 text-xs font-bold text-[#858585] sm:mb-2 sm:text-sm">타입</p>
                      <div className="flex flex-wrap gap-2">
                        {currentQuestion.types.map((type) => (
                          <span
                            key={type}
                            className="rounded px-2 py-1 text-xs font-bold text-white sm:px-3 sm:text-sm"
                            style={{ backgroundColor: typeColors[type] }}
                          >
                            {typeLabels[type]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-bold text-[#858585] sm:mb-2 sm:text-sm">설명</p>
                    <p className="max-h-16 overflow-hidden rounded-lg bg-white/[0.05] px-3 py-2 text-sm leading-5 text-white sm:max-h-none sm:px-4 sm:py-3 sm:text-base sm:leading-7">
                      {currentQuestion.description}
                    </p>
                  </div>

                  {hintVisibility.abilities && (
                    <div>
                      <p className="mb-1 text-xs font-bold text-[#858585] sm:mb-2 sm:text-sm">특성</p>
                      <div className="flex flex-wrap gap-2">
                        {currentQuestion.abilities.map((ability) => (
                          <span
                            key={`${ability.name}-${ability.isHidden}`}
                            className={`group relative cursor-help rounded-lg border px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-sm ${
                              ability.isHidden
                                ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                            }`}
                            tabIndex={0}
                            aria-label={`${ability.name}: ${ability.description}`}
                          >
                            {ability.name}
                            <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 z-20 hidden w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-left text-xs font-medium leading-5 text-slate-100 shadow-2xl group-hover:block group-focus:block sm:left-1/2 sm:-translate-x-1/2">
                              <span className="mb-1 block text-sm font-black text-white">{ability.name}</span>
                              {ability.description}
                              <span className="absolute left-6 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-[#111318] sm:left-1/2 sm:-translate-x-1/2" />
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hintVisibility.size && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/[0.05] px-3 py-2 sm:px-4 sm:py-3">
                        <p className="text-xs font-bold text-[#858585] sm:text-sm">키</p>
                        <p className="mt-1 text-base font-bold text-white sm:text-xl">{currentQuestion.height.toFixed(1)} m</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.05] px-3 py-2 sm:px-4 sm:py-3">
                        <p className="text-xs font-bold text-[#858585] sm:text-sm">몸무게</p>
                        <p className="mt-1 text-base font-bold text-white sm:text-xl">{currentQuestion.weight.toFixed(1)} kg</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={submitAnswer} className="mt-3 flex shrink-0 gap-2 sm:mt-7">
                  <input
                    ref={answerInputRef}
                    type="text"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    disabled={answered}
                    placeholder="정답 입력"
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-[#858585] focus:border-[#007acc]"
                  />
                  <button
                    type="submit"
                    disabled={answered || !answer.trim()}
                    aria-label="정답 제출"
                    className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#007acc] text-2xl font-black text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ↵
                  </button>
                </form>

                {feedback && (
                  <div className="mt-2 shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 sm:mt-4 sm:px-4 sm:py-3">
                    <p className="font-bold text-white">{feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
