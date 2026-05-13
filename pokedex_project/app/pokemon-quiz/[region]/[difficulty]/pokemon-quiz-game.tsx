'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'silhouette';
type HintKey = 'silhouette' | 'cry' | 'types' | 'stats' | 'gender' | 'abilities' | 'size' | 'evolution';
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

interface QuizStat {
  label: Record<Language, string>;
  value: number;
}

interface QuizEvolutionPokemon {
  id: number;
  name: string;
  sprite: string;
  types: PokemonType[];
  minLevel?: number;
}

interface QuizFlavorText {
  version: string;
  generation: string;
  generationLabel: Record<Language, string>;
  versionLabel: Record<Language, string>;
  order: number;
  text: string;
}

interface EvolutionNode {
  species: { name: string; url: string };
  evolves_to: EvolutionNode[];
  evolution_details: Array<{ min_level: number | null }>;
}

interface QuizPokemon {
  id: number;
  names: string[];
  displayName: string;
  image: string;
  cry: string;
  types: PokemonType[];
  descriptions: QuizFlavorText[];
  abilities: QuizAbility[];
  stats: QuizStat[];
  genderRate: number;
  evolutionChain: QuizEvolutionPokemon[];
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

const initialHintsByDifficulty: Record<Difficulty, HintKey[]> = {
  beginner: ['silhouette', 'cry', 'types', 'stats', 'gender', 'abilities', 'size', 'evolution'],
  intermediate: ['cry', 'abilities', 'size'],
  expert: ['size'],
  silhouette: ['silhouette'],
};

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
  silhouette: '뭘까요?',
};

const typeLabels: Record<PokemonType, Record<Language, string>> = {
  normal: { ko: '노말', en: 'Normal', ja: 'ノーマル' },
  fire: { ko: '불꽃', en: 'Fire', ja: 'ほのお' },
  water: { ko: '물', en: 'Water', ja: 'みず' },
  electric: { ko: '전기', en: 'Electric', ja: 'でんき' },
  grass: { ko: '풀', en: 'Grass', ja: 'くさ' },
  ice: { ko: '얼음', en: 'Ice', ja: 'こおり' },
  fighting: { ko: '격투', en: 'Fighting', ja: 'かくとう' },
  poison: { ko: '독', en: 'Poison', ja: 'どく' },
  ground: { ko: '땅', en: 'Ground', ja: 'じめん' },
  flying: { ko: '비행', en: 'Flying', ja: 'ひこう' },
  psychic: { ko: '에스퍼', en: 'Psychic', ja: 'エスパー' },
  bug: { ko: '벌레', en: 'Bug', ja: 'むし' },
  rock: { ko: '바위', en: 'Rock', ja: 'いわ' },
  ghost: { ko: '고스트', en: 'Ghost', ja: 'ゴースト' },
  dragon: { ko: '드래곤', en: 'Dragon', ja: 'ドラゴン' },
  dark: { ko: '악', en: 'Dark', ja: 'あく' },
  steel: { ko: '강철', en: 'Steel', ja: 'はがね' },
  fairy: { ko: '페어리', en: 'Fairy', ja: 'フェアリー' },
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

const statLabels: Record<string, Record<Language, string>> = {
  hp: { ko: 'HP', en: 'HP', ja: 'HP' },
  attack: { ko: '공격', en: 'Attack', ja: 'こうげき' },
  defense: { ko: '방어', en: 'Defense', ja: 'ぼうぎょ' },
  'special-attack': { ko: '특공', en: 'Sp. Atk', ja: 'とくこう' },
  'special-defense': { ko: '특방', en: 'Sp. Def', ja: 'とくぼう' },
  speed: { ko: '스피드', en: 'Speed', ja: 'すばやさ' },
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

const getVersionGeneration = (order: number) => `gen${Math.floor(order / 100)}`;

const getGenerationLabel = (generation: string, language: Language) => {
  const generationNumber = generation.replace('gen', '');
  const labels: Record<Language, string> = {
    ko: `${generationNumber}세대`,
    en: `Generation ${generationNumber}`,
    ja: `第${generationNumber}世代`,
  };

  return labels[language];
};

const getVersionLabel = (version: string) => version.replaceAll('-', ' ');

const normalizeAnswer = (value: string) =>
  value.toLowerCase().replace(/[.\s_\-']/g, '').trim();

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const getTypeStyle = (type: PokemonType) => ({
  backgroundColor: typeColors[type],
  color: type === 'electric' || type === 'ice' || type === 'fairy' ? '#1f2933' : '#ffffff',
});

const getPokemonIdFromSpeciesUrl = (url: string) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

const getGenderRatio = (genderRate: number) => {
  if (genderRate === -1) {
    return null;
  }

  const female = genderRate * 12.5;

  return {
    female,
    male: 100 - female,
  };
};

const formatGenderPercent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

const flattenEvolutionChain = (node: EvolutionNode, minLevel?: number): Array<{ id: number; minLevel?: number }> => {
  const current = {
    id: getPokemonIdFromSpeciesUrl(node.species.url),
    minLevel,
  };

  return [
    current,
    ...node.evolves_to.flatMap((child) =>
      flattenEvolutionChain(child, child.evolution_details[0]?.min_level || undefined)
    ),
  ];
};

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

const buildFlavorTexts = (
  entries: Array<{ flavor_text: string; language: { name: string }; version: { name: string } }>,
  language: Language
) => {
  const descriptionsByVersion = new Map<string, QuizFlavorText>();
  const languageNames = getPokeApiLanguageNames(language);

  entries.forEach((entry) => {
    const order = versionOrder[entry.version.name];

    if (!order || !languageNames.includes(entry.language.name)) {
      return;
    }

    const generation = getVersionGeneration(order);

    descriptionsByVersion.set(entry.version.name, {
      version: entry.version.name,
      generation,
      generationLabel: {
        ko: getGenerationLabel(generation, 'ko'),
        en: getGenerationLabel(generation, 'en'),
        ja: getGenerationLabel(generation, 'ja'),
      },
      versionLabel: {
        ko: getVersionLabel(entry.version.name),
        en: getVersionLabel(entry.version.name),
        ja: getVersionLabel(entry.version.name),
      },
      order,
      text: cleanText(entry.flavor_text),
    });
  });

  if (descriptionsByVersion.size === 0 && language !== 'en') {
    return buildFlavorTexts(entries, 'en');
  }

  return Array.from(descriptionsByVersion.values()).sort((a, b) => a.order - b.order);
};

const getDefaultDescriptionGeneration = (descriptions: QuizFlavorText[]) =>
  descriptions.find((description) => description.version === 'scarlet')?.generation ||
  descriptions.find((description) => description.version === 'violet')?.generation ||
  [...descriptions].sort((a, b) => b.order - a.order)[0]?.generation ||
  '';

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

const buildEvolutionChain = async (evolutionChainUrl: string, language: Language): Promise<QuizEvolutionPokemon[]> => {
  const evolutionData = await fetchJson<{ chain: EvolutionNode }>(evolutionChainUrl);
  const stages = flattenEvolutionChain(evolutionData.chain);

  return Promise.all(
    stages.map(async (stage) => {
      const [pokemonData, speciesData] = await Promise.all([
        fetchJson<{
          types: Array<{ type: { name: PokemonType } }>;
          sprites: { other?: { 'official-artwork'?: { front_default?: string } }; front_default?: string };
        }>(`${POKEAPI_BASE_URL}/pokemon/${stage.id}/`),
        fetchJson<{ names: Array<{ language: { name: string }; name: string }>; name: string }>(
          `${POKEAPI_BASE_URL}/pokemon-species/${stage.id}/`
        ),
      ]);

      return {
        id: stage.id,
        name: getLocalizedName(speciesData.names, language, speciesData.name),
        sprite: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default || '',
        types: pokemonData.types.map((entry) => entry.type.name),
        minLevel: stage.minLevel,
      };
    })
  );
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
    gender_rate: number;
    evolution_chain: { url: string };
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
    stats: Array<{ base_stat: number; stat: { name: string } }>;
  }>(defaultPokemon.url);
  const [abilities, evolutionChain] = await Promise.all([
    Promise.all(pokemon.abilities.map(async ({ ability, is_hidden }) => {
      const abilityData = await fetchJson<{
        names: Array<{ language: { name: string }; name: string }>;
        flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }>;
      }>(ability.url);

      return {
        name: getLocalizedName(abilityData.names, language, ability.name.replaceAll('-', ' ')),
        description: getLocalizedAbilityDescription(abilityData, language),
        isHidden: is_hidden,
      };
    })),
    buildEvolutionChain(species.evolution_chain.url, language),
  ]);
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
    descriptions: buildFlavorTexts(species.flavor_text_entries, language),
    abilities,
    stats: pokemon.stats.map((stat) => ({
      label: statLabels[stat.stat.name] || {
        ko: stat.stat.name,
        en: stat.stat.name,
        ja: stat.stat.name,
      },
      value: stat.base_stat,
    })),
    genderRate: species.gender_rate,
    evolutionChain,
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
  const selectedDifficulty = (['beginner', 'intermediate', 'expert', 'silhouette'].includes(difficulty)
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
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'ko';
    }

    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(savedLanguage) ? savedLanguage : 'ko';
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedDescriptionGeneration, setSelectedDescriptionGeneration] = useState('');
  const [revealedHints, setRevealedHints] = useState<HintKey[]>([]);

  const currentQuestion = questions[currentIndex];
  const isFinished = questions.length > 0 && currentIndex >= questions.length;
  const isSilhouetteOnly = selectedDifficulty === 'silhouette';

  const descriptionGroups = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return Object.values(
      currentQuestion.descriptions.reduce<Record<string, { label: string; options: QuizFlavorText[] }>>(
        (groups, description) => {
          if (!groups[description.generation]) {
            groups[description.generation] = {
              label: description.generationLabel[language],
              options: [],
            };
          }

          groups[description.generation].options.push(description);
          return groups;
        },
        {}
      )
    ).sort((a, b) => a.options[0].order - b.options[0].order);
  }, [currentQuestion, language]);

  const selectedDescriptionGroup = useMemo(
    () =>
      descriptionGroups.find((group) => group.options[0].generation === selectedDescriptionGeneration) ||
      descriptionGroups.find(
        (group) =>
          currentQuestion &&
          group.options[0].generation === getDefaultDescriptionGeneration(currentQuestion.descriptions)
      ) ||
      descriptionGroups[0] ||
      null,
    [currentQuestion, descriptionGroups, selectedDescriptionGeneration]
  );

  const isInitialHint = (hint: HintKey) => initialHintsByDifficulty[selectedDifficulty].includes(hint);
  const isHintVisible = (hint: HintKey) => answered || isInitialHint(hint) || revealedHints.includes(hint);
  const revealHint = (hint: HintKey) => {
    setRevealedHints((currentHints) => (currentHints.includes(hint) ? currentHints : [...currentHints, hint]));
  };
  const getRevealStyle = (hint: HintKey) =>
    !answered && !isInitialHint(hint) && revealedHints.includes(hint)
      ? ({ animation: 'quizHintReveal 1s ease both' } as const)
      : undefined;

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
          setSelectedDescriptionGeneration(getDefaultDescriptionGeneration(loadedQuestions[0]?.descriptions || []));
          setRevealedHints([]);
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

  const playCry = () => {
    if (!currentQuestion?.cry) {
      return;
    }

    const audio = new Audio(currentQuestion.cry);
    audio.volume = 0.7;
    audio.play().catch(() => undefined);
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
    setCurrentIndex((index) => {
      const nextIndex = index + 1;
      setSelectedDescriptionGeneration(getDefaultDescriptionGeneration(questions[nextIndex]?.descriptions || []));
      setRevealedHints([]);
      return nextIndex;
    });
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
            className={`min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#050607]/95 shadow-2xl sm:rounded-2xl ${
              inputFocused ? 'flex flex-col justify-end p-3 sm:block sm:p-0' : ''
            }`}
          >
            <div
              className={`border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5 ${
                inputFocused ? 'hidden sm:block' : 'block'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 sm:text-sm">
                    {regionName} · {difficultyLabels[selectedDifficulty]} · {currentIndex + 1}/{QUESTION_COUNT} · 점수 {score}
                  </p>
                  <h1 className="mt-1 text-xl font-black text-white sm:text-3xl">어떤 포켓몬일까요?</h1>
                </div>
                {!isSilhouetteOnly && (isHintVisible('types') ? (
                  <div className="flex shrink-0 flex-wrap justify-end gap-2" style={getRevealStyle('types')}>
                    {currentQuestion.types.map((type) => (
                      <span
                        key={type}
                        className="inline-flex min-w-12 justify-center rounded-lg px-3 py-1.5 text-sm font-bold shadow-lg"
                        style={getTypeStyle(type)}
                      >
                        {typeLabels[type][language]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => revealHint('types')}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                  >
                    타입 보기
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`min-h-0 p-3 sm:p-6 md:p-8 ${
                inputFocused ? 'p-0 sm:p-6 md:p-8' : ''
              }`}
            >
              <div
                className={`grid min-h-0 gap-4 lg:gap-8 ${
                  isSilhouetteOnly ? 'lg:grid-cols-1' : 'lg:grid-cols-[300px_minmax(0,1fr)]'
                } ${inputFocused ? 'h-auto' : 'h-full'}`}
              >
                <aside className={`space-y-3 sm:space-y-6 ${inputFocused ? 'hidden sm:block' : 'block'} ${isSilhouetteOnly ? 'mx-auto w-full max-w-sm' : ''}`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-inner sm:h-56 sm:rounded-2xl sm:p-6">
                    {answered && currentQuestion.image ? (
                      <img
                        src={currentQuestion.image}
                        alt={currentQuestion.displayName}
                        className="h-28 w-28 object-contain transition duration-300 sm:h-40 sm:w-40"
                      />
                    ) : isHintVisible('silhouette') && currentQuestion.image ? (
                      <img
                        src={currentQuestion.image}
                        alt="포켓몬 실루엣"
                        className="h-28 w-28 object-contain transition duration-300 sm:h-40 sm:w-40"
                        style={{ filter: 'brightness(0)', ...getRevealStyle('silhouette') }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => revealHint('silhouette')}
                        className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                      >
                        실루엣 보기
                      </button>
                    )}
                  </div>
                  {isSilhouetteOnly && feedback && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center">
                      <p className="font-bold text-white">{feedback}</p>
                      <p className="mt-2 text-xl font-black text-[#ce9178]">{currentQuestion.displayName}</p>
                    </div>
                  )}

                  {!isSilhouetteOnly && (isHintVisible('cry') ? (
                    <button
                      type="button"
                      onClick={playCry}
                      disabled={!currentQuestion.cry}
                      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-slate-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12"
                      style={getRevealStyle('cry')}
                    >
                      <span>🔊</span>
                      울음소리 재생
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revealHint('cry')}
                      className="flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-slate-200 transition hover:bg-white/[0.1] sm:h-12"
                    >
                      울음소리 보기
                    </button>
                  ))}

                  {!isSilhouetteOnly && (isHintVisible('stats') ? (
                    <div className="space-y-3" style={getRevealStyle('stats')}>
                      {currentQuestion.stats.map((stat) => (
                        <div
                          key={stat.label.en}
                          className="grid grid-cols-[48px_38px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[58px_42px_minmax(0,1fr)] sm:gap-3"
                        >
                          <span className="text-sm font-bold text-slate-400">{stat.label[language]}</span>
                          <span className="text-sm font-black text-white">{stat.value}</span>
                          <span className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-600"
                              style={{ width: `${Math.min((stat.value / 160) * 100, 100)}%` }}
                            />
                          </span>
                        </div>
                      ))}
                      <div className="grid grid-cols-[48px_38px_minmax(0,1fr)] items-center gap-2 border-t border-white/10 pt-3 sm:grid-cols-[58px_42px_minmax(0,1fr)] sm:gap-3">
                        <span className="text-sm font-bold text-red-300">총합</span>
                        <span className="text-sm font-black text-white">
                          {currentQuestion.stats.reduce((total, stat) => total + stat.value, 0)}
                        </span>
                        <span className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-red-400 to-red-700"
                            style={{
                              width: `${Math.min(
                                (currentQuestion.stats.reduce((total, stat) => total + stat.value, 0) / 720) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revealHint('stats')}
                      className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                    >
                      능력치 보기
                    </button>
                  ))}

                  {!isSilhouetteOnly && (isHintVisible('gender') ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3" style={getRevealStyle('gender')}>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-400">성비</p>
                        {getGenderRatio(currentQuestion.genderRate) ? (
                          <p className="text-xs font-bold text-slate-500">수컷 / 암컷</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-500">성별 없음</p>
                        )}
                      </div>
                      {(() => {
                        const genderRatio = getGenderRatio(currentQuestion.genderRate);

                        if (!genderRatio) {
                          return (
                            <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-300">
                              성별 없음
                            </div>
                          );
                        }

                        return (
                          <div>
                            <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.08]">
                              <span className="block h-full bg-sky-400" style={{ width: `${genderRatio.male}%` }} />
                              <span className="block h-full bg-pink-400" style={{ width: `${genderRatio.female}%` }} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
                              <div className="rounded-lg bg-sky-400/10 px-3 py-2 text-sky-300">
                                수컷 {formatGenderPercent(genderRatio.male)}
                              </div>
                              <div className="rounded-lg bg-pink-400/10 px-3 py-2 text-pink-300">
                                암컷 {formatGenderPercent(genderRatio.female)}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revealHint('gender')}
                      className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                    >
                      성비 보기
                    </button>
                  ))}
                </aside>

                {!isSilhouetteOnly && (
                <div className="flex min-h-0 flex-col">
                  <div className="grid min-h-0 gap-3 overflow-hidden sm:gap-5">
                    <div>
                      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-400">설명</p>
                          {selectedDescriptionGroup && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {selectedDescriptionGroup.label} ·{' '}
                              {selectedDescriptionGroup.options
                                .map((description) => description.versionLabel[language])
                                .join(' / ')}
                            </p>
                          )}
                        </div>
                        {descriptionGroups.length > 0 && (
                          <select
                            value={selectedDescriptionGroup?.options[0].generation || ''}
                            onChange={(event) => setSelectedDescriptionGeneration(event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-100 outline-none transition hover:bg-white/[0.1] focus:border-sky-400/60 sm:w-auto"
                            style={{ colorScheme: 'dark', backgroundColor: '#111318', color: '#f8fafc' }}
                          >
                            {descriptionGroups.map((group) => (
                              <option
                                key={group.options[0].generation}
                                value={group.options[0].generation}
                                style={{ backgroundColor: '#111318', color: '#f8fafc' }}
                              >
                                {group.label} (
                                {group.options.map((description) => description.versionLabel[language]).join(' / ')})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="max-h-24 overflow-hidden rounded-xl bg-white/[0.05] px-4 py-3 text-sm leading-6 text-slate-100 sm:max-h-none sm:rounded-2xl sm:px-6 sm:py-5 sm:text-base sm:leading-8">
                        {selectedDescriptionGroup
                          ? selectedDescriptionGroup.options.map((description) => (
                              <div key={description.version}>
                                <p className="mb-1 text-xs font-black text-sky-300">
                                  {description.versionLabel[language]}
                                </p>
                                <p>{description.text}</p>
                              </div>
                            ))
                          : '설명 정보가 없습니다.'}
                      </div>
                    </div>

                    {isHintVisible('abilities') ? (
                      <div style={getRevealStyle('abilities')}>
                        <p className="mb-2 text-sm font-bold text-slate-400">특성</p>
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.abilities.map((ability) => (
                            <span
                              key={`${ability.name}-${ability.isHidden}`}
                              className={`group relative cursor-help rounded-lg border px-4 py-2 text-sm font-bold ${
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => revealHint('abilities')}
                        className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                      >
                        특성 보기
                      </button>
                    )}

                    {isHintVisible('size') ? (
                      <div className="grid grid-cols-2 gap-3 sm:gap-8" style={getRevealStyle('size')}>
                        <div>
                          <p className="text-sm font-bold text-slate-400">키</p>
                          <p className="mt-1 text-xl font-black text-white sm:mt-2 sm:text-2xl">
                            {currentQuestion.height.toFixed(1)} m
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-400">몸무게</p>
                          <p className="mt-1 text-xl font-black text-white sm:mt-2 sm:text-2xl">
                            {currentQuestion.weight.toFixed(1)} kg
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revealHint('size')}
                        className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                      >
                        키 / 몸무게 보기
                      </button>
                    )}

                    {currentQuestion.evolutionChain.length > 0 && (isHintVisible('evolution') ? (
                      <div className="border-t border-white/10 pt-5" style={getRevealStyle('evolution')}>
                        <h3 className="text-xl font-black text-white">진화 계통</h3>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {currentQuestion.evolutionChain.map((stage, index) => (
                            <div key={`${stage.id}-${index}`} className="flex items-center gap-3">
                              {index > 0 && (
                                <div className="text-center text-sky-400">
                                  <p className="text-[10px] font-black">
                                    {stage.minLevel ? `Lv. ${stage.minLevel}` : ''}
                                  </p>
                                  <p className="text-xl font-black">→</p>
                                </div>
                              )}
                              <div
                                className={`w-24 rounded-xl border p-2 text-center ${
                                  stage.id === currentQuestion.id
                                    ? 'border-sky-400/70 bg-sky-500/10'
                                    : 'border-white/5 bg-white/[0.04]'
                                }`}
                              >
                                <p className="text-[10px] font-black text-sky-400">
                                  No.{stage.id.toString().padStart(3, '0')}
                                </p>
                                <div className="flex h-12 items-center justify-center">
                                  {stage.sprite && (
                                    <img
                                      src={stage.sprite}
                                      alt="진화 계통 실루엣"
                                      className="h-12 w-12 object-contain"
                                      style={{ filter: answered ? undefined : 'brightness(0)' }}
                                    />
                                  )}
                                </div>
                                <div className="flex justify-center gap-1">
                                  {stage.types.map((type) => (
                                    <span
                                      key={type}
                                      className="rounded px-1.5 py-0.5 text-[10px] font-bold leading-none"
                                      style={getTypeStyle(type)}
                                    >
                                      {typeLabels[type][language]}
                                    </span>
                                  ))}
                                </div>
                                <p className="mt-2 truncate text-xs font-black text-white">
                                  {answered ? stage.name : '???'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revealHint('evolution')}
                        className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                      >
                        진화 계통 보기
                      </button>
                    ))}
                  </div>

                {!isSilhouetteOnly && feedback && (
                  <div className="mt-2 shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 sm:mt-4 sm:px-4 sm:py-3">
                    <p className="font-bold text-white">{feedback}</p>
                  </div>
                )}
              </div>
                )}
            </div>
              <form onSubmit={submitAnswer} className="mt-4 flex w-full shrink-0 gap-2 sm:mt-7">
                <input
                  type="text"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  disabled={answered}
                  placeholder="정답 입력"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-[#858585] focus:border-[#007acc]"
                />
                <button
                  type="submit"
                  disabled={answered || !answer.trim()}
                  aria-label="정답 제출"
                  className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg bg-[#007acc] text-2xl font-black text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ↵
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
