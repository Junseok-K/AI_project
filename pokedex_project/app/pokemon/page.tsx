'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

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

interface PokemonAbility {
  name: Record<Language, string>;
  description: Record<Language, string>;
  isHidden: boolean;
}

interface PokemonStat {
  label: Record<Language, string>;
  value: number;
}

interface PokemonMoveSource {
  move: { name: string; url: string };
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: { name: string };
  }>;
}

interface PokemonFlavorText {
  version: string;
  generation: string;
  versionLabel: Record<Language, string>;
  generationLabel: Record<Language, string>;
  order: number;
  text: Record<Language, string>;
}

interface PokemonSpecies {
  name: string;
  url: string;
  generationId: number;
}

interface PokemonDetail {
  id: number;
  name: Record<Language, string>;
  genus: Record<Language, string>;
  descriptions: PokemonFlavorText[];
  types: PokemonType[];
  image: string;
  sprite: string;
  cry: string;
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  genderRate: number;
  evolutionChainUrl: string;
  moves: PokemonMoveSource[];
}

interface PokemonSearchIndexEntry {
  id: number;
  species: PokemonSpecies;
  name: Record<Language, string>;
}

interface PokemonMove {
  name: Record<Language, string>;
  description: Record<Language, string>;
  type: PokemonType | null;
  damageClass: string;
  method: string;
  level: number;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
}

interface PokemonMoveGroups {
  levelUp: PokemonMove[];
  special: PokemonMove[];
}

interface EvolutionPokemon {
  id: number;
  name: string;
  types: PokemonType[];
  sprite: string;
  minLevel?: number;
}

interface EvolutionNode {
  species: { name: string; url: string };
  evolves_to: EvolutionNode[];
  evolution_details: Array<{ min_level: number | null }>;
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const GENERATION_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const MAX_CONCURRENT_POKEMON_REQUESTS = 8;
const POKEMON_BATCH_SIZE = 25;
const LANGUAGE_STORAGE_KEY = 'pokemon-language';
const generationFilterOptions = ['all', ...GENERATION_IDS] as const;

const fetchWithTimeout = async (url: string, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const translations: Record<Language, Record<string, string>> = {
  ko: {
    back: '← 돌아가기',
    title: '포켓몬 도감',
    totalPokemon: '총',
    pokemon: '마리의 포켓몬',
    search: '포켓몬 이름이나 번호로 검색...',
    loading: '로딩 중...',
    noResults: '검색 결과가 없습니다.',
    height: '키',
    weight: '몸무게',
    abilities: '특성',
    close: '닫기',
    language: '언어',
    cry: '울음소리 듣기',
    hiddenAbility: '숨겨진 특성',
    evolution: '진화 계통',
    moves: '배울 수 있는 기술',
    descriptionVersion: '설명 버전',
    noDescription: '선택한 버전의 설명이 없습니다.',
    moveLoading: '기술 정보를 불러오는 중...',
    noMoves: '표시할 기술 정보가 없습니다.',
    level: 'Lv.',
    power: '위력',
    accuracy: '명중',
    pp: 'PP',
    category: '분류',
    gender: '성비',
    male: '수컷',
    female: '암컷',
    genderless: '성별 없음',
    allGenerations: '전체',
    generationSuffix: '세대',
    noImage: '이미지 없음',
    statTotal: '총합',
  },
  en: {
    back: '← Go back',
    title: 'Pokemon Pokedex',
    totalPokemon: 'Total',
    pokemon: 'Pokemon',
    search: 'Search by Pokemon name or number...',
    loading: 'Loading...',
    noResults: 'No results found.',
    height: 'Height',
    weight: 'Weight',
    abilities: 'Abilities',
    close: 'Close',
    language: 'Language',
    cry: 'Play cry',
    hiddenAbility: 'Hidden ability',
    evolution: 'Evolution chain',
    moves: 'Learnable moves',
    descriptionVersion: 'Description version',
    noDescription: 'No description for the selected version.',
    moveLoading: 'Loading move data...',
    noMoves: 'No move data available.',
    level: 'Lv.',
    power: 'Power',
    accuracy: 'Accuracy',
    pp: 'PP',
    category: 'Category',
    gender: 'Gender ratio',
    male: 'Male',
    female: 'Female',
    genderless: 'Genderless',
    allGenerations: 'All',
    generationSuffix: 'Gen',
    noImage: 'No Image',
    statTotal: 'Total',
  },
  ja: {
    back: '← 戻る',
    title: 'ポケモン図鑑',
    totalPokemon: '全',
    pokemon: '匹のポケモン',
    search: 'ポケモンの名前または番号で検索...',
    loading: '読み込み中...',
    noResults: '検索結果はありません。',
    height: '高さ',
    weight: '重さ',
    abilities: '特性',
    close: '閉じる',
    language: '言語',
    cry: '鳴き声を聞く',
    hiddenAbility: '隠れ特性',
    evolution: '進化系統',
    moves: '覚えられる技',
    descriptionVersion: '説明バージョン',
    noDescription: '選択したバージョンの説明はありません。',
    moveLoading: '技情報を読み込み中...',
    noMoves: '表示できる技情報がありません。',
    level: 'Lv.',
    power: '威力',
    accuracy: '命中',
    pp: 'PP',
    category: '分類',
    gender: '性比',
    male: 'オス',
    female: 'メス',
    genderless: '性別なし',
    allGenerations: 'すべて',
    generationSuffix: '世代',
    noImage: '画像なし',
    statTotal: '合計',
  },
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

const moveMethodLabels: Record<string, Record<Language, string>> = {
  'level-up': { ko: '레벨업', en: 'Level up', ja: 'レベルアップ' },
  machine: { ko: '기술머신', en: 'Machine', ja: 'わざマシン' },
  egg: { ko: '교배', en: 'Egg', ja: 'タマゴ' },
  tutor: { ko: '가르침', en: 'Tutor', ja: '教え技' },
  'stadium-surfing-pikachu': { ko: '특수', en: 'Special', ja: '特殊' },
  'light-ball-egg': { ko: '특수 교배', en: 'Light Ball egg', ja: 'でんきだまタマゴ' },
  'colosseum-purification': { ko: '정화', en: 'Purification', ja: 'リライブ' },
  xd: { ko: '특수', en: 'XD', ja: 'XD' },
  'form-change': { ko: '폼 체인지', en: 'Form change', ja: 'フォルムチェンジ' },
  'zygarde-cube': { ko: '지가르데 큐브', en: 'Zygarde Cube', ja: 'ジガルデキューブ' },
};

const moveDamageClassLabels: Record<string, Record<Language, string>> = {
  physical: { ko: '물리', en: 'Physical', ja: '物理' },
  special: { ko: '특수', en: 'Special', ja: '特殊' },
  status: { ko: '변화', en: 'Status', ja: '変化' },
};

const versionMetadata: Record<
  string,
  { versionLabel: string; generation: string; generationLabel: string; order: number }
> = {
  red: { versionLabel: '레드', generation: 'gen1', generationLabel: '1세대', order: 101 },
  blue: { versionLabel: '블루', generation: 'gen1', generationLabel: '1세대', order: 102 },
  yellow: { versionLabel: '옐로', generation: 'gen1', generationLabel: '1세대', order: 103 },
  gold: { versionLabel: '골드', generation: 'gen2', generationLabel: '2세대', order: 201 },
  silver: { versionLabel: '실버', generation: 'gen2', generationLabel: '2세대', order: 202 },
  crystal: { versionLabel: '크리스탈', generation: 'gen2', generationLabel: '2세대', order: 203 },
  ruby: { versionLabel: '루비', generation: 'gen3', generationLabel: '3세대', order: 301 },
  sapphire: { versionLabel: '사파이어', generation: 'gen3', generationLabel: '3세대', order: 302 },
  emerald: { versionLabel: '에메랄드', generation: 'gen3', generationLabel: '3세대', order: 303 },
  firered: { versionLabel: '파이어레드', generation: 'gen3', generationLabel: '3세대', order: 304 },
  leafgreen: { versionLabel: '리프그린', generation: 'gen3', generationLabel: '3세대', order: 305 },
  diamond: { versionLabel: '다이아몬드', generation: 'gen4', generationLabel: '4세대', order: 401 },
  pearl: { versionLabel: '펄', generation: 'gen4', generationLabel: '4세대', order: 402 },
  platinum: { versionLabel: '기라티나', generation: 'gen4', generationLabel: '4세대', order: 403 },
  heartgold: { versionLabel: '하트골드', generation: 'gen4', generationLabel: '4세대', order: 404 },
  soulsilver: { versionLabel: '소울실버', generation: 'gen4', generationLabel: '4세대', order: 405 },
  black: { versionLabel: '블랙', generation: 'gen5', generationLabel: '5세대', order: 501 },
  white: { versionLabel: '화이트', generation: 'gen5', generationLabel: '5세대', order: 502 },
  'black-2': { versionLabel: '블랙 2', generation: 'gen5', generationLabel: '5세대', order: 503 },
  'white-2': { versionLabel: '화이트 2', generation: 'gen5', generationLabel: '5세대', order: 504 },
  x: { versionLabel: 'X', generation: 'gen6', generationLabel: '6세대', order: 601 },
  y: { versionLabel: 'Y', generation: 'gen6', generationLabel: '6세대', order: 602 },
  'omega-ruby': { versionLabel: '오메가루비', generation: 'gen6', generationLabel: '6세대', order: 603 },
  'alpha-sapphire': { versionLabel: '알파사파이어', generation: 'gen6', generationLabel: '6세대', order: 604 },
  sun: { versionLabel: '썬', generation: 'gen7', generationLabel: '7세대', order: 701 },
  moon: { versionLabel: '문', generation: 'gen7', generationLabel: '7세대', order: 702 },
  'ultra-sun': { versionLabel: '울트라썬', generation: 'gen7', generationLabel: '7세대', order: 703 },
  'ultra-moon': { versionLabel: '울트라문', generation: 'gen7', generationLabel: '7세대', order: 704 },
  'lets-go-pikachu': { versionLabel: '레츠고! 피카츄', generation: 'gen7', generationLabel: '7세대', order: 705 },
  'lets-go-eevee': { versionLabel: '레츠고! 이브이', generation: 'gen7', generationLabel: '7세대', order: 706 },
  sword: { versionLabel: '소드', generation: 'gen8', generationLabel: '8세대', order: 801 },
  shield: { versionLabel: '실드', generation: 'gen8', generationLabel: '8세대', order: 802 },
  'brilliant-diamond': { versionLabel: '브릴리언트 다이아몬드', generation: 'gen8', generationLabel: '8세대', order: 803 },
  'shining-pearl': { versionLabel: '샤이닝 펄', generation: 'gen8', generationLabel: '8세대', order: 804 },
  'legends-arceus': { versionLabel: '레전즈 아르세우스', generation: 'gen8', generationLabel: '8세대', order: 805 },
  scarlet: { versionLabel: '스칼렛', generation: 'gen9', generationLabel: '9세대', order: 901 },
  violet: { versionLabel: '바이올렛', generation: 'gen9', generationLabel: '9세대', order: 902 },
};

const getNameByLanguage = (
  names: Array<{ language: { name: string }; name: string }>,
  language: Language,
  fallback: string
) => {
  const languageNames: Record<Language, string[]> = {
    ko: ['ko'],
    en: ['en'],
    ja: ['ja-Hrkt', 'ja'],
  };

  return names.find((entry) => languageNames[language].includes(entry.language.name))?.name || fallback;
};

const isPokemonType = (type: string): type is PokemonType => type in typeLabels;

const isLanguage = (value: string | null): value is Language =>
  value === 'ko' || value === 'en' || value === 'ja';

const getTypeLabel = (type: PokemonType, language: Language) => typeLabels[type][language];

const getTypeStyle = (type: PokemonType) => ({
  backgroundColor: typeColors[type],
  color: type === 'electric' || type === 'ice' || type === 'fairy' ? '#1f2933' : '#ffffff',
});

const getPokemonIdFromSpeciesUrl = (url: string) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) => {
  const results: R[] = [];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
};

const buildFlavorTexts = (
  entries: Array<{ flavor_text: string; language: { name: string }; version: { name: string } }>
) => {
  const descriptionsByVersion = new Map<string, PokemonFlavorText>();

  entries.forEach((entry) => {
    const version = entry.version.name;
    const metadata = versionMetadata[version];

    if (!metadata) {
      return;
    }

    const language =
      entry.language.name === 'ko' ? 'ko' : entry.language.name === 'en' ? 'en' : entry.language.name === 'ja-Hrkt' ? 'ja' : null;

    if (!language) {
      return;
    }

    const current = descriptionsByVersion.get(version) || {
      version,
      versionLabel: {
        ko: metadata.versionLabel,
        en: version.replaceAll('-', ' '),
        ja: metadata.versionLabel,
      },
      generation: metadata.generation,
      generationLabel: {
        ko: metadata.generationLabel,
        en: `Generation ${metadata.generation.replace('gen', '')}`,
        ja: `第${metadata.generation.replace('gen', '')}世代`,
      },
      order: metadata.order,
      text: {
        ko: '',
        en: '',
        ja: '',
      },
    };

    current.text[language] = entry.flavor_text.replace(/\s+/g, ' ');
    descriptionsByVersion.set(version, current);
  });

  return Array.from(descriptionsByVersion.values()).sort((a, b) => a.order - b.order);
};

const getDefaultDescriptionGeneration = (descriptions: PokemonFlavorText[]) =>
  descriptions.find((description) => description.version === 'scarlet')?.generation ||
  descriptions.find((description) => description.version === 'violet')?.generation ||
  [...descriptions].sort((a, b) => b.order - a.order)[0]?.generation ||
  '';

const getLocalizedAbilityDescription = (abilityData: {
  flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }>;
  effect_entries?: Array<{ short_effect: string; effect: string; language: { name: string } }>;
}): Record<Language, string> => ({
  ko:
    abilityData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'ko')
      ?.flavor_text.replace(/\s+/g, ' ') || '등록된 한국어 특성 설명이 없습니다.',
  en:
    abilityData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'en')
      ?.flavor_text.replace(/\s+/g, ' ') || 'No English ability description is available.',
  ja:
    abilityData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'ja-Hrkt')
      ?.flavor_text.replace(/\s+/g, ' ') || '日本語の特性説明はありません。',
});

const getMoveMethodLabel = (method: string, language: Language) =>
  moveMethodLabels[method]?.[language] || method.replaceAll('-', ' ');

const getMoveDamageClassLabel = (damageClass: string, language: Language) =>
  moveDamageClassLabels[damageClass]?.[language] || damageClass.replaceAll('-', ' ');

const getMoveDescription = (moveData: {
  flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }>;
  effect_entries?: Array<{ short_effect: string; effect: string; language: { name: string } }>;
}): Record<Language, string> => ({
  ko:
    moveData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'ko')
      ?.flavor_text.replace(/\s+/g, ' ') || '등록된 한국어 기술 설명이 없습니다.',
  en:
    moveData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'en')
      ?.flavor_text.replace(/\s+/g, ' ') || 'No English move description is available.',
  ja:
    moveData.flavor_text_entries
      ?.find((entry) => entry.language.name === 'ja-Hrkt')
      ?.flavor_text.replace(/\s+/g, ' ') || '日本語の技説明はありません。',
});

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

const flattenEvolutionChain = (node: EvolutionNode, minLevel?: number): EvolutionPokemon[] => {
  const id = getPokemonIdFromSpeciesUrl(node.species.url);
  const current = {
    id,
    name: '',
    types: [] as PokemonType[],
    sprite: '',
    minLevel,
  };

  return [
    current,
    ...node.evolves_to.flatMap((child) =>
      flattenEvolutionChain(child, child.evolution_details[0]?.min_level || undefined)
    ),
  ];
};

export default function PokemonPokedex() {
  const popupContentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const abilityCacheRef = useRef(new Map<string, Promise<Omit<PokemonAbility, 'isHidden'>>>());
  const searchIndexCacheRef = useRef<Promise<PokemonSearchIndexEntry[]> | null>(null);
  const [pokemon, setPokemon] = useState<PokemonDetail[]>([]);
  const [pokemonSpecies, setPokemonSpecies] = useState<PokemonSpecies[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [selectedDescriptionGeneration, setSelectedDescriptionGeneration] = useState('');
  const [evolutionChain, setEvolutionChain] = useState<EvolutionPokemon[]>([]);
  const [moveGroups, setMoveGroups] = useState<PokemonMoveGroups>({ levelUp: [], special: [] });
  const [movesLoading, setMovesLoading] = useState(false);
  const [expandedMoveKey, setExpandedMoveKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ko');

  const t = (key: keyof typeof translations.ko) => translations[language][key];

  useEffect(() => {
    const syncLanguage = () => {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (isLanguage(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    };

    syncLanguage();
    window.addEventListener('storage', syncLanguage);
    window.addEventListener('pokemon-language-change', syncLanguage);

    return () => {
      window.removeEventListener('storage', syncLanguage);
      window.removeEventListener('pokemon-language-change', syncLanguage);
    };
  }, []);

  const visiblePokemonSpecies = useMemo(
    () =>
      selectedGeneration === 'all'
        ? pokemonSpecies
        : pokemonSpecies.filter((species) => species.generationId === selectedGeneration),
    [pokemonSpecies, selectedGeneration]
  );

  const visiblePokemonIdSet = useMemo(
    () => new Set(visiblePokemonSpecies.map((species) => getPokemonIdFromSpeciesUrl(species.url))),
    [visiblePokemonSpecies]
  );

  const visiblePokemon = useMemo(
    () => pokemon.filter((item) => visiblePokemonIdSet.has(item.id)),
    [pokemon, visiblePokemonIdSet]
  );

  const filteredPokemon = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return visiblePokemon;
    }

    return visiblePokemon.filter(
      (p) =>
        p.name[language].toLowerCase().includes(normalizedSearch) ||
        p.id.toString().includes(normalizedSearch) ||
        p.types.some((type) => getTypeLabel(type, language).toLowerCase().includes(normalizedSearch))
    );
  }, [searchTerm, visiblePokemon, language]);

  const learnableMoves = useMemo(
    () =>
      [...moveGroups.levelUp, ...moveGroups.special].sort((a, b) => {
        if (a.method === 'level-up' && b.method === 'level-up') {
          return a.level - b.level || a.name[language].localeCompare(b.name[language], language);
        }

        if (a.method === 'level-up') {
          return -1;
        }

        if (b.method === 'level-up') {
          return 1;
        }

        return (
          getMoveMethodLabel(a.method, language).localeCompare(getMoveMethodLabel(b.method, language), language) ||
          a.name[language].localeCompare(b.name[language], language)
        );
      }),
    [moveGroups, language]
  );

  const descriptionGroups = useMemo(() => {
    if (!selectedPokemon) {
      return [];
    }

    return Object.values(
      selectedPokemon.descriptions.reduce<Record<string, { label: string; options: PokemonFlavorText[] }>>(
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
  }, [selectedPokemon, language]);

  const selectedDescriptionGroup = useMemo(() => {
    if (!selectedPokemon) {
      return null;
    }

    return (
      descriptionGroups.find((group) => group.options[0].generation === selectedDescriptionGeneration) ||
      descriptionGroups.find(
        (group) => group.options[0].generation === getDefaultDescriptionGeneration(selectedPokemon.descriptions)
      ) ||
      descriptionGroups[0] ||
      null
    );
  }, [descriptionGroups, selectedPokemon, selectedDescriptionGeneration]);

  const fetchPokemonDetail = useCallback(async (species: PokemonSpecies) => {
    const pokemonId = getPokemonIdFromSpeciesUrl(species.url);
    const res = await fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon/${pokemonId}`);
    if (!res.ok) {
      throw new Error(`Pokemon request failed: ${pokemonId}`);
    }
    const pokemonData = await res.json();

    const speciesRes = await fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon-species/${pokemonData.id}`);
    if (!speciesRes.ok) {
      throw new Error(`Pokemon species request failed: ${pokemonData.id}`);
    }
    const speciesData = await speciesRes.json();
    const descriptions = buildFlavorTexts(speciesData.flavor_text_entries);

    const abilities = await Promise.all(
      pokemonData.abilities.map(
        async (abilityItem: { ability: { name: string; url: string }; is_hidden: boolean }) => {
          if (!abilityCacheRef.current.has(abilityItem.ability.url)) {
            abilityCacheRef.current.set(
              abilityItem.ability.url,
              fetchWithTimeout(abilityItem.ability.url)
                .then((abilityRes) => {
                  if (!abilityRes.ok) {
                    throw new Error(`Ability request failed: ${abilityItem.ability.name}`);
                  }

                  return abilityRes.json();
                })
                .then((abilityData) => ({
                  name: {
                    ko: getNameByLanguage(abilityData.names, 'ko', abilityItem.ability.name.replace('-', ' ')),
                    en: getNameByLanguage(abilityData.names, 'en', abilityItem.ability.name.replace('-', ' ')),
                    ja: getNameByLanguage(abilityData.names, 'ja', abilityItem.ability.name.replace('-', ' ')),
                  },
                  description: getLocalizedAbilityDescription(abilityData),
                }))
            );
          }

          const ability = await abilityCacheRef.current.get(abilityItem.ability.url)!;

          return {
            ...ability,
            isHidden: abilityItem.is_hidden,
          };
        }
      )
    );

    return {
      id: pokemonData.id,
      name: {
        ko: getNameByLanguage(speciesData.names, 'ko', pokemonData.name),
        en: getNameByLanguage(speciesData.names, 'en', pokemonData.name),
        ja: getNameByLanguage(speciesData.names, 'ja', pokemonData.name),
      },
      genus: {
        ko: speciesData.genera.find((entry: { language: { name: string } }) => entry.language.name === 'ko')?.genus || '',
        en: speciesData.genera.find((entry: { language: { name: string } }) => entry.language.name === 'en')?.genus || '',
        ja: speciesData.genera.find((entry: { language: { name: string } }) => entry.language.name === 'ja-Hrkt')?.genus || '',
      },
      descriptions,
      types: pokemonData.types.map((type: { type: { name: string } }) => type.type.name).filter(isPokemonType),
      image:
        pokemonData.sprites.other['official-artwork'].front_default ||
        pokemonData.sprites.front_default ||
        '',
      sprite: pokemonData.sprites.front_default || '',
      cry: pokemonData.cries?.latest || pokemonData.cries?.legacy || '',
      height: pokemonData.height,
      weight: pokemonData.weight,
      abilities,
      stats: pokemonData.stats.map((stat: { base_stat: number; stat: { name: string } }) => ({
        label: statLabels[stat.stat.name] || {
          ko: stat.stat.name,
          en: stat.stat.name,
          ja: stat.stat.name,
        },
        value: stat.base_stat,
      })),
      genderRate: speciesData.gender_rate,
      evolutionChainUrl: speciesData.evolution_chain.url,
      moves: pokemonData.moves,
    };
  }, []);

  const getPokemonSearchIndex = useCallback(() => {
    if (!searchIndexCacheRef.current) {
      searchIndexCacheRef.current = mapWithConcurrency(
        pokemonSpecies,
        MAX_CONCURRENT_POKEMON_REQUESTS,
        async (species) => {
          const pokemonId = getPokemonIdFromSpeciesUrl(species.url);
          const response = await fetchWithTimeout(species.url);
          if (!response.ok) {
            throw new Error(`Species request failed: ${species.name}`);
          }
          const speciesData = await response.json();

          return {
            id: pokemonId,
            species,
            name: {
              ko: getNameByLanguage(speciesData.names, 'ko', species.name),
              en: getNameByLanguage(speciesData.names, 'en', species.name),
              ja: getNameByLanguage(speciesData.names, 'ja', species.name),
            },
          };
        }
      );
    }

    return searchIndexCacheRef.current;
  }, [pokemonSpecies]);

  const loadMorePokemon = useCallback(async () => {
    if (loadingMore) {
      return;
    }

    const loadedPokemonIds = new Set(pokemon.map((item) => item.id));
    const nextSpecies = visiblePokemonSpecies
      .filter((species) => !loadedPokemonIds.has(getPokemonIdFromSpeciesUrl(species.url)))
      .slice(0, POKEMON_BATCH_SIZE);

    if (nextSpecies.length === 0) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPokemon = (
        await mapWithConcurrency(
          nextSpecies,
          MAX_CONCURRENT_POKEMON_REQUESTS,
          async (species) => {
            try {
              return await fetchPokemonDetail(species);
            } catch (error) {
              console.error(`Pokemon detail load failed: ${species.name}`, error);
              return null;
            }
          }
        )
      ).filter((item): item is PokemonDetail => Boolean(item));

      setPokemon((currentPokemon) => {
        const pokemonById = new Map(currentPokemon.map((item) => [item.id, item]));

        nextPokemon.forEach((item) => {
          pokemonById.set(item.id, item);
        });

        return Array.from(pokemonById.values()).sort((a, b) => a.id - b.id);
      });
    } catch (error) {
      console.error('?ъ폆紐??곗씠??異붽? 濡쒕뱶 ?ㅽ뙣:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPokemonDetail, loadingMore, pokemon, visiblePokemonSpecies]);

  useEffect(() => {
    let isMounted = true;

    const fetchPokemon = async () => {
      try {
        const generationData = await Promise.all(
          GENERATION_IDS.map(async (generationId) => {
            const response = await fetchWithTimeout(`${POKEAPI_BASE_URL}/generation/${generationId}`);
            if (!response.ok) {
              throw new Error(`Generation request failed: ${generationId}`);
            }
            return response.json();
          })
        );

        const nextPokemonSpecies = Array.from(
          new Map<string, PokemonSpecies>(
            generationData.flatMap((generation, index) =>
              generation.pokemon_species.map((species: { name: string; url: string }) => [
                species.url,
                { ...species, generationId: GENERATION_IDS[index] },
              ])
            )
          ).values()
        ).sort((a, b) => getPokemonIdFromSpeciesUrl(a.url) - getPokemonIdFromSpeciesUrl(b.url));

        if (isMounted) {
          setPokemonSpecies(nextPokemonSpecies);
        }
      } catch (error) {
        console.error('포켓몬 데이터 로드 실패:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPokemon();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && visiblePokemonSpecies.length > 0 && visiblePokemon.length === 0) {
      void Promise.resolve().then(loadMorePokemon);
    }
  }, [loadMorePokemon, loading, visiblePokemon.length, visiblePokemonSpecies.length]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch || visiblePokemonSpecies.length === 0) {
      return;
    }

    let isMounted = true;

    const loadSearchResults = async () => {
      setSearchLoading(true);

      try {
        const loadedPokemonIds = new Set(pokemon.map((item) => item.id));
        let matchedSpecies = visiblePokemonSpecies.filter((species) => {
          const pokemonId = getPokemonIdFromSpeciesUrl(species.url);

          return (
            pokemonId.toString().includes(normalizedSearch) ||
            species.name.toLowerCase().includes(normalizedSearch)
          );
        });

        if (matchedSpecies.length === 0) {
          const searchIndex = await getPokemonSearchIndex();

          if (!isMounted) {
            return;
          }

          const visibleSpeciesUrls = new Set(visiblePokemonSpecies.map((species) => species.url));

          matchedSpecies = searchIndex
            .filter(
              (entry) =>
                visibleSpeciesUrls.has(entry.species.url) &&
                (entry.id.toString().includes(normalizedSearch) ||
                  Object.values(entry.name).some((name) => name.toLowerCase().includes(normalizedSearch)))
            )
            .map((entry) => entry.species);
        }

        const missingSpecies = matchedSpecies.filter(
          (species) => !loadedPokemonIds.has(getPokemonIdFromSpeciesUrl(species.url))
        );

        if (missingSpecies.length === 0) {
          return;
        }

        const searchPokemon = (
          await mapWithConcurrency(
            missingSpecies,
            MAX_CONCURRENT_POKEMON_REQUESTS,
            async (species) => {
              try {
                return await fetchPokemonDetail(species);
              } catch (error) {
                console.error(`Search detail load failed: ${species.name}`, error);
                return null;
              }
            }
          )
        ).filter((item): item is PokemonDetail => Boolean(item));

        if (!isMounted) {
          return;
        }

        setPokemon((currentPokemon) => {
          const pokemonById = new Map(currentPokemon.map((item) => [item.id, item]));

          searchPokemon.forEach((item) => {
            pokemonById.set(item.id, item);
          });

          return Array.from(pokemonById.values()).sort((a, b) => a.id - b.id);
        });
      } catch (error) {
        console.error('Search results load failed:', error);
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    };

    loadSearchResults();

    return () => {
      isMounted = false;
    };
  }, [fetchPokemonDetail, getPokemonSearchIndex, pokemon, searchTerm, visiblePokemonSpecies]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || searchTerm.trim()) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMorePokemon();
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMorePokemon, searchTerm]);

  useEffect(() => {
    let isMounted = true;

    const fetchEvolutionChain = async () => {
      if (!selectedPokemon) {
        setEvolutionChain([]);
        return;
      }

      try {
        const response = await fetch(selectedPokemon.evolutionChainUrl);
        const data = await response.json();
          const chain = flattenEvolutionChain(data.chain)
            .map((stage) => {
              const detail = pokemon.find((item) => item.id === stage.id);

            return {
              ...stage,
              name: detail?.name[language] || `No.${stage.id.toString().padStart(3, '0')}`,
              types: detail?.types || [],
                sprite: detail?.image || detail?.sprite || '',
              };
            })
          .filter((stage) => pokemonSpecies.some((species) => getPokemonIdFromSpeciesUrl(species.url) === stage.id));

        if (isMounted) {
          setEvolutionChain(chain);
        }
      } catch (error) {
        console.error('진화 계통 로드 실패:', error);
        if (isMounted) {
          setEvolutionChain([]);
        }
      }
    };

    fetchEvolutionChain();

    return () => {
      isMounted = false;
    };
  }, [selectedPokemon, pokemon, pokemonSpecies, language]);

  useEffect(() => {
    let isMounted = true;

    const fetchMoves = async () => {
      if (!selectedPokemon) {
        setMoveGroups({ levelUp: [], special: [] });
        setMovesLoading(false);
        setExpandedMoveKey(null);
        return;
      }

      setMovesLoading(true);
      setExpandedMoveKey(null);

      try {
        const moves = await Promise.all(
          selectedPokemon.moves.map(async (moveSource) => {
            const learnDetails = moveSource.version_group_details;
            const latestLearnDetail = learnDetails[learnDetails.length - 1];

            if (!latestLearnDetail) {
              return null;
            }

            const moveResponse = await fetch(moveSource.move.url);
            const moveData = await moveResponse.json();
            const moveType = moveData.type?.name;

            return {
              name: {
                ko: getNameByLanguage(moveData.names, 'ko', moveSource.move.name.replaceAll('-', ' ')),
                en: getNameByLanguage(moveData.names, 'en', moveSource.move.name.replaceAll('-', ' ')),
                ja: getNameByLanguage(moveData.names, 'ja', moveSource.move.name.replaceAll('-', ' ')),
              },
              description: getMoveDescription(moveData),
              type: isPokemonType(moveType) ? moveType : null,
              damageClass: moveData.damage_class?.name || '',
              method: latestLearnDetail.move_learn_method.name,
              level: latestLearnDetail.level_learned_at,
              power: moveData.power,
              accuracy: moveData.accuracy,
              pp: moveData.pp,
            };
          })
        );

        const visibleMoves = moves.filter((move): move is PokemonMove => Boolean(move));
        const levelUp = visibleMoves
          .filter((move) => move.method === 'level-up')
          .sort((a, b) => a.level - b.level || a.name[language].localeCompare(b.name[language], language));
        const special = visibleMoves
          .filter((move) => move.method !== 'level-up')
          .sort((a, b) =>
            getMoveMethodLabel(a.method, language).localeCompare(getMoveMethodLabel(b.method, language), language)
          );

        if (isMounted) {
          setMoveGroups({ levelUp, special });
        }
      } catch (error) {
        console.error('기술 정보 로드 실패:', error);
        if (isMounted) {
          setMoveGroups({ levelUp: [], special: [] });
        }
      } finally {
        if (isMounted) {
          setMovesLoading(false);
        }
      }
    };

    fetchMoves();

    return () => {
      isMounted = false;
    };
  }, [selectedPokemon, language]);

  const playCry = () => {
    if (!selectedPokemon?.cry) {
      return;
    }

    const audio = new Audio(selectedPokemon.cry);
    audio.play().catch(() => undefined);
  };

  const openPokemonDetail = (nextPokemon: PokemonDetail) => {
    setSelectedPokemon(nextPokemon);
    setSelectedDescriptionGeneration(getDefaultDescriptionGeneration(nextPokemon.descriptions));
  };

  const selectEvolutionPokemon = (pokemonId: number) => {
    const nextPokemon = pokemon.find((item) => item.id === pokemonId);

    if (!nextPokemon || nextPokemon.id === selectedPokemon?.id) {
      return;
    }

    openPokemonDetail(nextPokemon);
    requestAnimationFrame(() => {
      popupContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#1e1e1e' }}>
      {selectedPokemon && (
        <div
          className="fixed inset-0 z-40 bg-black/70"
          onClick={() => setSelectedPokemon(null)}
          style={{ backdropFilter: 'blur(8px)' }}
        />
      )}

      {selectedPokemon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-3 sm:px-4 sm:py-6">
          <div
            className="flex max-h-[94dvh] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050607]/95 shadow-2xl sm:max-h-[88vh] sm:rounded-2xl lg:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pokemon-detail-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
                Pokemon Detail
              </p>
              <button
                onClick={() => setSelectedPokemon(null)}
                className="text-2xl font-bold leading-none text-slate-400 transition hover:text-white"
                aria-label={t('close')}
              >
                ×
              </button>
            </div>

            <div ref={popupContentRef} className="overflow-x-hidden overflow-y-auto p-4 sm:p-5 md:p-8">
              <div className="flex min-w-0 flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-400">
                  No.{selectedPokemon.id.toString().padStart(3, '0')}
                </p>
                <h2
                  id="pokemon-detail-title"
                  className="mt-1 break-words text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl"
                >
                  {selectedPokemon.name[language]}
                </h2>
                <p className="mt-3 text-lg font-semibold text-sky-400">{selectedPokemon.genus[language]}</p>
              </div>

              <div className="flex shrink-0 items-start gap-5 self-center sm:self-start">
                <div className="mt-16 hidden flex-wrap justify-end gap-2 sm:flex">
                  {selectedPokemon.types.map((type) => (
                    <span
                      key={type}
                      className="inline-flex min-w-14 justify-center rounded-lg px-4 py-2 text-base font-bold shadow-lg"
                      style={getTypeStyle(type)}
                    >
                      {getTypeLabel(type, language)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 pt-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:pt-8">
              <div className="min-w-0">
                <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] shadow-inner sm:h-56 sm:rounded-2xl">
                  {selectedPokemon.image ? (
                    <img
                      src={selectedPokemon.image}
                      alt={selectedPokemon.name[language]}
                      className="h-32 w-32 object-contain sm:h-40 sm:w-40"
                    />
                  ) : (
                    <div className="text-sm text-slate-400">No Image</div>
                  )}
                </div>

                <button
                  onClick={playCry}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
                >
                  <span>🔊</span>
                  {t('cry')}
                </button>

                <div className="mt-6 space-y-3">
                  {selectedPokemon.stats.map((stat) => (
                    <div key={stat.label.en} className="grid grid-cols-[48px_38px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[58px_42px_minmax(0,1fr)] sm:gap-3">
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
                    <span className="text-sm font-bold text-red-300">{t('statTotal')}</span>
                    <span className="text-sm font-black text-white">
                      {selectedPokemon.stats.reduce((total, stat) => total + stat.value, 0)}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-red-400 to-red-700"
                        style={{
                          width: `${Math.min(
                            (selectedPokemon.stats.reduce((total, stat) => total + stat.value, 0) / 720) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-400">{t('gender')}</p>
                    {getGenderRatio(selectedPokemon.genderRate) ? (
                      <p className="text-xs font-bold text-slate-500">
                        {t('male')} / {t('female')}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-500">{t('genderless')}</p>
                    )}
                  </div>

                  {(() => {
                    const genderRatio = getGenderRatio(selectedPokemon.genderRate);

                    if (!genderRatio) {
                      return (
                        <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-sm font-black text-slate-200">
                          {t('genderless')}
                        </div>
                      );
                    }

                    return (
                      <div>
                        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.08]">
                          <span
                            className="block h-full bg-sky-400"
                            style={{ width: `${genderRatio.male}%` }}
                          />
                          <span
                            className="block h-full bg-pink-400"
                            style={{ width: `${genderRatio.female}%` }}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
                          <div className="rounded-lg bg-sky-400/10 px-3 py-2 text-sky-300">
                            {t('male')} {formatGenderPercent(genderRatio.male)}
                          </div>
                          <div className="rounded-lg bg-pink-400/10 px-3 py-2 text-pink-300">
                            {t('female')} {formatGenderPercent(genderRatio.female)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <div className="mb-8 flex flex-wrap gap-2 sm:hidden">
                  {selectedPokemon.types.map((type) => (
                    <span
                      key={type}
                      className="inline-flex min-w-14 justify-center rounded-lg px-4 py-2 text-base font-bold"
                      style={getTypeStyle(type)}
                    >
                      {getTypeLabel(type, language)}
                    </span>
                  ))}
                </div>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-400">{t('descriptionVersion')}</p>
                    {selectedDescriptionGroup && (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {selectedDescriptionGroup.label} ·{' '}
                        {selectedDescriptionGroup.options
                          .map((description) => description.versionLabel[language])
                          .join(' / ')}
                      </p>
                    )}
                  </div>
                  <select
                    value={selectedDescriptionGroup?.options[0].generation || ''}
                    onChange={(event) => setSelectedDescriptionGeneration(event.target.value)}
                    className="w-full max-w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-100 outline-none transition hover:bg-white/[0.1] focus:border-sky-400/60 sm:w-auto"
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
                </div>

                <div className="space-y-3 rounded-2xl bg-white/[0.05] px-6 py-5 text-base leading-8 text-slate-100">
                  {selectedDescriptionGroup ? (
                    selectedDescriptionGroup.options.map((description) => (
                      <div key={description.version}>
                        <p className="mb-1 text-xs font-black text-sky-300">
                          {description.versionLabel[language]}
                        </p>
                        <p>{description.text[language] || description.text.en || description.text.ko}</p>
                      </div>
                    ))
                  ) : (
                    <p>{t('noDescription')}</p>
                  )}
                </div>

                <div className="mt-7 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-bold text-slate-400">{t('height')}</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {(selectedPokemon.height / 10).toFixed(1)} m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">{t('weight')}</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {(selectedPokemon.weight / 10).toFixed(1)} kg
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <p className="text-sm font-bold text-slate-400">{t('abilities')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPokemon.abilities.map((ability) => (
                      <span
                        key={`${ability.name.en}-${ability.isHidden}`}
                        className={`group relative cursor-help rounded-lg border px-4 py-2 text-sm font-bold ${
                          ability.isHidden
                            ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                            : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                        }`}
                        tabIndex={0}
                        aria-label={`${ability.name[language]}: ${ability.description[language]}`}
                      >
                        {ability.name[language]}
                        {ability.isHidden && (
                          <span className="ml-2 text-xs text-violet-300/80">{t('hiddenAbility')}</span>
                        )}
                        <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-0 z-20 hidden w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-left text-xs font-medium leading-5 text-slate-100 shadow-2xl group-hover:block group-focus:block sm:left-1/2 sm:-translate-x-1/2">
                          <span className="mb-1 block text-sm font-black text-white">{ability.name[language]}</span>
                          {ability.description[language]}
                          <span className="absolute left-6 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-[#111318] sm:left-1/2 sm:-translate-x-1/2" />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-9 border-t border-white/10 pt-7">
                  <h3 className="text-2xl font-black text-white">{t('evolution')}</h3>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    {evolutionChain.map((stage, index) => (
                      <div key={`${stage.id}-${index}`} className="flex items-center gap-5">
                        {index > 0 && (
                          <div className="text-center text-sky-400">
                            <p className="text-xs font-black">
                              {stage.minLevel ? `Lv. ${stage.minLevel}` : ''}
                            </p>
                            <p className="text-2xl font-black">→</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => selectEvolutionPokemon(stage.id)}
                          disabled={!pokemon.some((item) => item.id === stage.id)}
                          className={`w-28 rounded-xl border p-3 text-center transition ${
                            stage.id === selectedPokemon.id
                              ? 'border-sky-400/70 bg-sky-500/10'
                              : 'border-white/5 bg-white/[0.04] hover:border-sky-400/50 hover:bg-sky-500/10'
                          } ${
                            pokemon.some((item) => item.id === stage.id)
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed opacity-60'
                          }`}
                          aria-label={`${stage.name} 상세 정보 보기`}
                        >
                          <p className="text-[11px] font-black text-sky-400">
                            No.{stage.id.toString().padStart(3, '0')}
                          </p>
                          <div className="flex h-12 items-center justify-center">
                            {stage.sprite && (
                              <img
                                src={stage.sprite}
                                alt={stage.name}
                                className="h-12 w-12 object-contain"
                              />
                            )}
                          </div>
                          <div className="flex justify-center gap-1">
                            {stage.types.map((type) => (
                              <span
                                key={type}
                                className="rounded px-2 py-1 text-[10px] font-bold leading-none"
                                style={getTypeStyle(type)}
                              >
                                {getTypeLabel(type, language)}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 truncate text-sm font-black text-white">{stage.name}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="mx-auto w-full max-w-[80%] max-md:max-w-full">
                <div className="flex items-end justify-between gap-4">
                  <h3 className="text-xl font-black text-white">{t('moves')}</h3>
                  {!movesLoading && learnableMoves.length > 0 && (
                    <p className="text-xs font-bold text-slate-500">{learnableMoves.length} moves</p>
                  )}
                </div>
                {movesLoading ? (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-slate-300">
                    {t('moveLoading')}
                  </div>
                ) : learnableMoves.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-slate-300">
                    {t('noMoves')}
                  </div>
                ) : (
                  <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-2">
                  {learnableMoves.map((move) => {
                    const moveKey = `${move.name.en}-${move.level}-${move.method}`;
                    const isExpanded = expandedMoveKey === moveKey;

                    return (
                      <div
                        key={moveKey}
                        className={`overflow-hidden rounded-lg border transition ${
                          isExpanded
                            ? 'border-sky-400/40 bg-sky-500/[0.08]'
                            : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedMoveKey(isExpanded ? null : moveKey)}
                          className="grid w-full min-w-0 grid-cols-1 gap-2 px-3 py-2.5 text-left sm:grid-cols-[132px_minmax(160px,1fr)_190px_24px] sm:items-center"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[11px] font-black ${
                                move.method === 'level-up'
                                  ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                                  : 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                              }`}
                            >
                              {move.method === 'level-up'
                                ? `${t('level')} ${move.level || 1}`
                                : getMoveMethodLabel(move.method, language)}
                            </span>
                            {move.type && (
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold leading-none"
                                style={getTypeStyle(move.type)}
                              >
                                {getTypeLabel(move.type, language)}
                              </span>
                            )}
                          </div>
                          <p className="min-w-0 truncate text-sm font-bold text-slate-100">{move.name[language]}</p>
                          <p className="text-xs font-semibold text-slate-500 sm:text-right">
                            {t('power')} {move.power ?? '-'} · {t('accuracy')} {move.accuracy ?? '-'} · {t('pp')}{' '}
                            {move.pp ?? '-'}
                          </p>
                          <span className="text-right text-sm font-black text-slate-500">
                            {isExpanded ? '−' : '+'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10 px-3 pb-3 pt-2">
                            <p className="text-sm leading-6 text-slate-200">{move.description[language]}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                              <span className="rounded-md bg-white/[0.06] px-2 py-1">
                                {t('category')} {getMoveDamageClassLabel(move.damageClass, language)}
                              </span>
                              <span className="rounded-md bg-white/[0.06] px-2 py-1">
                                {t('power')} {move.power ?? '-'}
                              </span>
                              <span className="rounded-md bg-white/[0.06] px-2 py-1">
                                {t('accuracy')} {move.accuracy ?? '-'}
                              </span>
                              <span className="rounded-md bg-white/[0.06] px-2 py-1">
                                {t('pp')} {move.pp ?? '-'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1760px] px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#007acc', color: '#ffffff' }}
          >
            {t('back')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{ color: '#ce9178' }}>
          {t('title')}
        </h1>
        <p className="mb-6" style={{ color: '#e0e0e0' }}>
          {visiblePokemonSpecies.length > 0 &&
            `${t('totalPokemon')} ${visiblePokemonSpecies.length}${t('pokemon')}`}
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {generationFilterOptions.map((generation) => {
            const isSelected = selectedGeneration === generation;
            const label =
              generation === 'all' ? t('allGenerations') : `${generation}${t('generationSuffix')}`;

            return (
              <button
                key={generation}
                type="button"
                onClick={() => {
                  setSelectedGeneration(generation);
                  setSearchLoading(false);
                }}
                className="min-h-9 rounded-lg border px-3 text-sm font-bold transition"
                style={{
                  backgroundColor: isSelected ? '#007acc' : '#252526',
                  borderColor: isSelected ? '#38bdf8' : '#3e3e42',
                  color: isSelected ? '#ffffff' : '#e0e0e0',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => {
            const nextSearchTerm = e.target.value;

            setSearchTerm(nextSearchTerm);

            if (!nextSearchTerm.trim()) {
              setSearchLoading(false);
            }
          }}
          className="w-full px-4 py-2 border rounded-lg mb-6"
          style={{ backgroundColor: '#252526', borderColor: '#3e3e42', color: '#e0e0e0' }}
        />

        {loading || searchLoading || (visiblePokemon.length === 0 && loadingMore) ? (
          <div className="text-center" style={{ color: '#e0e0e0' }}>
            {t('loading')}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 md:grid-cols-5 xl:grid-cols-10 xl:gap-3">
              {filteredPokemon.length > 0 ? (
                filteredPokemon.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg p-1.5 shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:p-3"
                    style={{ backgroundColor: '#252526' }}
                    onClick={() => openPokemonDetail(p)}
                  >
                    <div className="mb-1.5 flex justify-center sm:mb-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name[language]} className="h-12 w-12 sm:h-20 sm:w-20" />
                      ) : (
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded text-[10px] sm:h-20 sm:w-20 sm:text-xs"
                          style={{ backgroundColor: '#3e3e42', color: '#e0e0e0' }}
                        >
                          {t('noImage')}
                        </div>
                      )}
                    </div>
                    <h2 className="truncate text-center text-[11px] font-bold leading-tight sm:text-sm" style={{ color: '#007acc' }}>
                      {p.name[language]}
                    </h2>
                    <div className="mt-1 hidden flex-wrap justify-center gap-1 sm:flex">
                      {p.types.map((type) => (
                        <span
                          key={type}
                          className="inline-block min-w-10 px-2 py-1 rounded text-[11px] font-semibold text-center leading-none"
                          style={getTypeStyle(type)}
                        >
                          {getTypeLabel(type, language)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-center text-[10px] sm:mt-2 sm:text-xs" style={{ color: '#858585' }}>
                      No. {p.id}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center" style={{ color: '#e0e0e0' }}>
                  {t('noResults')}
                </div>
              )}
            </div>

            {!searchTerm.trim() && visiblePokemon.length < visiblePokemonSpecies.length && (
              <div ref={loadMoreRef} className="py-8 text-center text-sm font-bold" style={{ color: '#e0e0e0' }}>
                {loadingMore ? t('loading') : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
