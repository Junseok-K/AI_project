import { useEffect, useMemo, useRef, useState } from 'react'

const fields = [
  { key: 'length', label: '길이', placeholder: '예: 3-minute' },
  { key: 'genre', label: '장르', placeholder: '예: synth-pop' },
  { key: 'mood', label: '분위기', placeholder: '예: dreamy and nostalgic' },
  { key: 'bpm', label: 'BPM', placeholder: '예: 118 BPM' },
  { key: 'instruments', label: '악기', placeholder: '예: analog synths, electric guitar' },
  { key: 'vocalStyle', label: '보컬스타일', placeholder: '예: soft female vocals' },
  { key: 'structure', label: '구성', placeholder: '예: intro, verse, chorus, bridge, outro' },
  { key: 'referenceArtist', label: '참고 아티스트', placeholder: '예: The Weeknd' },
]

const youtubeOrderOptions = [
  { value: 'relevance', label: '관련도' },
  { value: 'date', label: '최신순' },
  { value: 'viewCount', label: '조회수순' },
  { value: 'likeCount', label: '좋아요 순' },
  { value: 'subscriberCount', label: '구독자 순' },
]

const youtubeDurationOptions = [
  { value: 'any', label: '전체' },
  { value: 'short', label: '4분 미만' },
  { value: 'medium', label: '4분~20분' },
  { value: 'long', label: '20분 초과' },
]

const youtubeDefinitionOptions = [
  { value: 'any', label: '전체' },
  { value: 'high', label: 'HD' },
  { value: 'standard', label: 'SD' },
]

const youtubeCaptionOptions = [
  { value: 'any', label: '전체' },
  { value: 'closedCaption', label: '자막 있음' },
  { value: 'none', label: '자막 없음' },
]

const youtubeSafeSearchOptions = [
  { value: 'moderate', label: '보통' },
  { value: 'strict', label: '엄격' },
  { value: 'none', label: '사용 안 함' },
]

const genreGroups = [
  {
    label: 'Pop (팝)',
    subgenres: ['Pop', 'Dance Pop', 'Synth Pop', 'Dream Pop', 'Indie Pop', 'Electropop', 'K-Pop', 'J-Pop', 'Teen Pop', 'Pop Rock'],
  },
  {
    label: 'Rock (록)',
    subgenres: ['Rock', 'Classic Rock', 'Hard Rock', 'Alternative Rock', 'Indie Rock', 'Progressive Rock', 'Punk Rock', 'Garage Rock', 'Psychedelic Rock', 'Folk Rock', 'Grunge', 'Post Rock', 'Shoegaze'],
  },
  {
    label: 'Metal (메탈)',
    subgenres: ['Heavy Metal', 'Thrash Metal', 'Death Metal', 'Black Metal', 'Power Metal', 'Symphonic Metal', 'Doom Metal', 'Metalcore', 'Progressive Metal', 'Nu Metal'],
  },
  {
    label: 'Electronic (전자음악)',
    subgenres: ['Electronic', 'House', 'Deep House', 'Tropical House', 'Progressive House', 'Future House', 'Techno', 'Minimal Techno', 'Melodic Techno', 'Trance', 'Uplifting Trance', 'Psytrance', 'Drum & Bass', 'Liquid DnB', 'Neurofunk', 'Dubstep', 'Future Bass', 'Chillout', 'Downtempo', 'Ambient', 'Lo-fi', 'Synthwave', 'Vaporwave'],
  },
  {
    label: 'Jazz (재즈)',
    subgenres: ['Jazz', 'Swing', 'Bebop', 'Cool Jazz', 'Hard Bop', 'Modal Jazz', 'Smooth Jazz', 'Fusion', 'Latin Jazz', 'Jazz Funk', 'Acid Jazz', 'Contemporary Jazz', 'Jazztronica'],
  },
  {
    label: 'Blues (블루스)',
    subgenres: ['Delta Blues', 'Chicago Blues', 'Electric Blues', 'Country Blues', 'Blues Rock'],
  },
  {
    label: 'Classical (클래식)',
    subgenres: ['Baroque', 'Classical', 'Romantic', 'Modern Classical', 'Chamber Music', 'Symphony', 'Opera', 'Concerto', 'Piano Solo'],
  },
  {
    label: 'R&B / Soul',
    subgenres: ['R&B', 'Contemporary R&B', 'Neo Soul', 'Soul', 'Funk', 'Motown', 'Quiet Storm'],
  },
  {
    label: 'Hip-Hop / Rap',
    subgenres: ['Hip-Hop', 'Boom Bap', 'Trap', 'Drill', 'Lo-fi Hip-Hop', 'Jazz Rap', 'Conscious Rap', 'Old School Hip-Hop', 'Gangsta Rap', 'Alternative Hip-Hop'],
  },
  {
    label: 'World Music',
    subgenres: ['Bossa Nova', 'Samba', 'Tango', 'Flamenco', 'Reggae', 'Ska', 'Afrobeat', 'Klezmer', 'Celtic', 'Enka'],
  },
  {
    label: 'Country / Folk',
    subgenres: ['Country', 'Traditional Country', 'Country Pop', 'Country Rock', 'Bluegrass', 'Folk', 'Indie Folk', 'Contemporary Folk', 'Folk Pop'],
  },
  {
    label: 'Soundtrack / Instrumental',
    subgenres: ['Film Score', 'Game Music', 'Orchestral', 'Piano Instrumental', 'Acoustic Instrumental', 'Epic Music', 'Cinematic', 'Trailer Music'],
  },
]

const defaultStructure = 'intro, verse, chorus, bridge, outro'
const initialValues = {
  ...Object.fromEntries(fields.map(({ key }) => [key, ''])),
  structure: defaultStructure,
}
const initialGenreSelection = {
  genreGroup: '',
  subgenre: '',
  bpm: '',
  mood: '',
}
const koreanPattern = /[\u3131-\u318e\uac00-\ud7a3]/
const numberOnlyPattern = /^\d+(?:\.\d+)?$/
const initialYoutubeResultCount = 8
const additionalYoutubeResultCount = 4
const videoPlaceholderCards = Array.from({ length: 4 }, (_, index) => index)

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return ''
  }

  return `${match[1]}/${match[2]}/${match[3]}`
}

function createInitialYoutubeSearchValues() {
  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  return {
    query: '',
    dateFrom: formatDateInput(oneYearAgo),
    dateTo: formatDateInput(today),
    order: 'relevance',
    videoDuration: 'any',
    videoDefinition: 'any',
    videoCaption: 'any',
    embeddable: false,
    safeSearch: 'moderate',
    regionCode: '',
    relevanceLanguage: '',
    channelId: '',
    minViews: '',
    minLikes: '',
    minSubscribers: '',
  }
}

async function translateToEnglish(text, signal) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'en',
    dt: 't',
    q: text,
  })
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('Translation request failed')
  }

  const data = await response.json()
  return data[0].map(([translatedText]) => translatedText).join('')
}

function formatLength(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  return numberOnlyPattern.test(trimmedValue) ? `${trimmedValue}-minute` : trimmedValue
}

function normalizeValues(values) {
  return {
    ...values,
    length: formatLength(values.length),
  }
}

function getPromptValue(values, key) {
  const field = fields.find((item) => item.key === key)
  const value = values[key].trim()

  return {
    text: value || `[${field.label}]`,
    isFilled: Boolean(value),
  }
}

function createPromptParts(values) {
  const get = (key) => getPromptValue(values, key)

  return [
    { text: 'Create a ' },
    { ...get('length'), key: 'length' },
    { text: ' ' },
    { ...get('genre'), key: 'genre' },
    { text: ' song with ' },
    { ...get('mood'), key: 'mood' },
    { text: ', ' },
    { ...get('bpm'), key: 'bpm' },
    { text: ' tempo, featuring ' },
    { ...get('instruments'), key: 'instruments' },
    { text: ', ' },
    { ...get('vocalStyle'), key: 'vocalStyle' },
    { text: ', structured as ' },
    { ...get('structure'), key: 'structure' },
    { text: ', with studio-quality production and a similar emotional feeling to ' },
    { ...get('referenceArtist'), key: 'referenceArtist' },
    { text: ' while remaining completely original.' },
  ]
}

function createPrompt(values) {
  return createPromptParts(values).map(({ text }) => text).join('')
}

function getGenreName(genreGroup) {
  return genreGroup.replace(/\s*\(.+\)\s*$/, '').trim()
}

function formatBpm(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  return /\bbpm\b/i.test(trimmedValue) ? trimmedValue : `${trimmedValue} BPM`
}

function createGenrePromptParts(selection, translatedMood) {
  const genre = getGenreName(selection.genreGroup)
  const subgenre = selection.subgenre.trim()
  const bpm = formatBpm(selection.bpm)
  const mood = translatedMood.trim()
  const style = subgenre || genre

  if (!genre) {
    return [{ text: '[장르]' }]
  }

  if (!subgenre && !bpm && !mood) {
    return [{ text: genre, isFilled: true, key: 'genre' }]
  }

  if (!subgenre && bpm && !mood) {
    return [
      { text: bpm, isFilled: true, key: 'bpm' },
      { text: ' ' },
      { text: genre, isFilled: true, key: 'genre' },
    ]
  }

  if (!mood) {
    return [
      { text: 'A ' },
      { text: genre, isFilled: true, key: 'genre' },
      { text: ' track with a distinct ' },
      { text: style, isFilled: true, key: 'subgenre' },
      { text: ' character' },
      ...(bpm ? [{ text: ', ' }, { text: bpm, isFilled: true, key: 'bpm' }] : []),
      { text: ', expressive dynamics, and polished original production.' },
    ]
  }

  return [
    { text: 'A ' },
    { text: mood, isFilled: true, key: 'mood' },
    { text: ',\n' },
    ...(bpm ? [{ text: bpm, isFilled: true, key: 'bpm' }, { text: ' tempo,\n' }] : []),
    { text: 'smooth ' },
    { text: style, isFilled: true, key: 'subgenre' },
    { text: ' groove,\n' },
    { text: 'studio-quality production,\n' },
    { text: 'relaxing ' },
    { text: genre, isFilled: true, key: 'genre' },
    { text: ' atmosphere.' },
  ]
}

function createGenrePrompt(selection, translatedMood) {
  return createGenrePromptParts(selection, translatedMood).map(({ text }) => text).join('')
}

function createGenreMetadataValues(selection, translatedMood = selection.mood) {
  const genre = selection.subgenre.trim() || getGenreName(selection.genreGroup)

  return {
    ...initialValues,
    genre,
    bpm: formatBpm(selection.bpm),
    mood: translatedMood,
  }
}

function getValue(values, key, fallback) {
  return values[key].trim() || fallback
}

function getSeoValue(primaryValues, fallbackValues, key, fallback) {
  return primaryValues[key].trim() || fallbackValues[key].trim() || fallback
}

function formatKoreanLength(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return '원곡'
  }

  const minuteMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)-minute$/i)
  return minuteMatch ? `${minuteMatch[1]}분` : trimmedValue
}

function createHashtag(text, fallback) {
  const compactText = text.replace(/[^\p{L}\p{N}]/gu, '')
  return `#${compactText || fallback}`
}

function formatPublishedDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatCount(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const count = Number(value)

  if (Number.isNaN(count)) {
    return null
  }

  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count)
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === '') {
    return null
  }

  const duration = Number(seconds)

  if (Number.isNaN(duration)) {
    return null
  }

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const remainingSeconds = Math.floor(duration % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function removeAiReferences(value) {
  return value
    .replace(/suno\s*ai/gi, '')
    .replace(/\bai[-\s]*(?:generated|music|song|track)?\b/gi, '')
    .replace(/AI\s*(?:음악|노래|생성|트랙)?/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,|])/g, '$1')
    .replace(/([|,])\s*([|,])/g, '$1')
    .trim()
}

function getCleanSeoValue(primaryValues, fallbackValues, key, fallback) {
  return removeAiReferences(getSeoValue(primaryValues, fallbackValues, key, fallback)) || fallback
}

function normalizeTag(tag) {
  return removeAiReferences(tag).replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removeReferenceArtistText(text, primaryValues, fallbackValues) {
  const referenceValues = [
    primaryValues.referenceArtist.trim(),
    fallbackValues.referenceArtist.trim(),
  ].filter(Boolean)

  return referenceValues.reduce((currentText, referenceValue) => (
    currentText
      .replace(new RegExp(escapeRegExp(referenceValue), 'gi'), '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+([,|])/g, '$1')
      .replace(/([,|])\s*([,|])/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  ), text)
}

function limitTags(tags, maxLength = 500) {
  const uniqueTags = tags
    .map((tag) => normalizeTag(tag))
    .filter(Boolean)
    .filter((tag, index, allTags) => allTags.indexOf(tag) === index)
  const limitedTags = []
  let currentLength = 0

  uniqueTags.forEach((tag) => {
    const nextLength = currentLength + tag.length + (limitedTags.length ? 2 : 0)
    if (nextLength <= maxLength) {
      limitedTags.push(tag)
      currentLength = nextLength
    }
  })

  return limitedTags.join(', ')
}

function createTagPhrases(primaryValues, fallbackValues) {
  const genre = getCleanSeoValue(primaryValues, fallbackValues, 'genre', '오리지널 음악')
  const mood = getCleanSeoValue(primaryValues, fallbackValues, 'mood', '감성적인 분위기')
  const bpm = getSeoValue(primaryValues, fallbackValues, 'bpm', '')
  const instruments = getSeoValue(primaryValues, fallbackValues, 'instruments', '')
  const vocalStyle = getCleanSeoValue(primaryValues, fallbackValues, 'vocalStyle', '')
  const englishGenre = getCleanSeoValue(fallbackValues, primaryValues, 'genre', 'original music')
  const englishMood = getCleanSeoValue(fallbackValues, primaryValues, 'mood', 'original')
  const instrumentTags = instruments.split(',').map((instrument) => normalizeTag(instrument))

  return [
    '오리지널 음악',
    genre,
    mood,
    ...instrumentTags,
    vocalStyle,
    bpm,
    `${genre} 음악`,
    `${mood} 음악`,
    `${genre} 플레이리스트`,
    `${mood} 플레이리스트`,
    `${genre} bgm`,
    `${mood} bgm`,
    `${genre} 추천`,
    `${mood} 추천`,
    `${genre} 작업음악`,
    `${mood} 배경음악`,
    `${genre} instrumental`,
    `${mood} instrumental`,
    '유튜브 음악',
    '감성 음악',
    '배경음악',
    '작업 음악',
    '공부 음악',
    '집중 음악',
    '플레이리스트',
    '브이로그 음악',
    '힐링 음악',
    'new music',
    'original music',
    'instrumental music',
    'background music',
    'playlist music',
    englishGenre,
    englishMood,
    `${englishGenre} music`,
    `${englishMood} music`,
    `${englishGenre} playlist`,
    `${englishMood} playlist`,
    `${englishGenre} instrumental`,
    `${englishMood} instrumental`,
  ]
}

function cleanTitleValue(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\b\d+(?:\.\d+)?-minute\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:bpm|beats per minute)\b/gi, '')
    .replace(/[()[\]{}]/g, '')
    .trim()
}

function titleCase(value) {
  return cleanTitleValue(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function hasFinalConsonant(value) {
  const lastCharacter = [...value.trim()].pop()

  if (!lastCharacter) {
    return false
  }

  const code = lastCharacter.charCodeAt(0)

  if (code < 0xac00 || code > 0xd7a3) {
    return false
  }

  return (code - 0xac00) % 28 !== 0
}

function joinWithWaGwa(value) {
  return `${value}${hasFinalConsonant(value) ? '과' : '와'}`
}

function getTitleEmoji(promptText) {
  const lowerPrompt = promptText.toLowerCase()
  const emojiRules = [
    { emoji: '🚗', pattern: /drive|driving|car|road|highway|city pop|도시|야경|드라이브/ },
    { emoji: '🌙', pattern: /night|midnight|moon|dream|sleep|밤|새벽|달|몽환/ },
    { emoji: '🌧️', pattern: /rain|storm|lofi|sad|melancholy|비|우울|쓸쓸/ },
    { emoji: '🌊', pattern: /ocean|sea|wave|chill|calm|바다|파도|잔잔/ },
    { emoji: '🔥', pattern: /energetic|powerful|rock|trap|edm|강렬|에너지|신나는/ },
    { emoji: '🎹', pattern: /piano|keys|ballad|acoustic|피아노|발라드|어쿠스틱/ },
    { emoji: '🎸', pattern: /guitar|band|indie|기타|밴드|인디/ },
    { emoji: '✨', pattern: /synth|neon|future|bright|신스|네온|미래|반짝/ },
  ]

  return emojiRules.find(({ pattern }) => pattern.test(lowerPrompt))?.emoji || '🎵'
}

function createKoreanVideoTitle(values, fallbackValues) {
  const genre = cleanTitleValue(getCleanSeoValue(values, fallbackValues, 'genre', '오리지널 음악'))
  const mood = cleanTitleValue(getCleanSeoValue(values, fallbackValues, 'mood', '감성적인 분위기'))
  const vocalStyle = cleanTitleValue(getCleanSeoValue(values, fallbackValues, 'vocalStyle', ''))
  const focus = /instrumental|연주|무가사|보컬\s*없/i.test(`${genre} ${vocalStyle}`)
    ? 'Instrumental'
    : genre.includes('음악')
      ? genre
      : `${genre} 음악`

  return `${joinWithWaGwa(mood)} 함께하는 ${focus}`.replace('분위기와 함께하는', '분위기의')
}

function createEnglishVideoTitle(values) {
  const promptText = createPrompt(values)
  const lowerPrompt = promptText.toLowerCase()
  const genre = titleCase(removeAiReferences(getValue(values, 'genre', 'Original Music')) || 'Original Music')
  const mood = titleCase(removeAiReferences(getValue(values, 'mood', 'Original')) || 'Original')

  if (/city|urban|neon|night|midnight|drive|road|city pop/.test(lowerPrompt)) {
    return /drive|road|car/.test(lowerPrompt) ? 'Midnight Drive' : 'Midnight City Lights'
  }

  if (/dream|nostalg|retro|memory/.test(lowerPrompt)) {
    return 'Dreamy Neon Memories'
  }

  if (/rain|storm|sad|melancholy|lofi/.test(lowerPrompt)) {
    return 'Rainy Night Reflections'
  }

  if (/ocean|sea|wave|calm|chill/.test(lowerPrompt)) {
    return 'Calm Ocean Waves'
  }

  const combinedTitle = [mood, genre].filter(Boolean).join(' ')
  return combinedTitle || 'Original Music'
}

function createVideoTitle(primaryValues, fallbackValues) {
  const titlePrompt = `${createPrompt(primaryValues)} ${createPrompt(fallbackValues)}`
  const emoji = getTitleEmoji(titlePrompt)
  const koreanTitle = createKoreanVideoTitle(primaryValues, fallbackValues)
  const englishTitle = createEnglishVideoTitle(fallbackValues)

  return `${emoji} ${koreanTitle} | ${englishTitle}`
}

function getPerfectForItems(promptText) {
  const lowerPrompt = promptText.toLowerCase()

  if (/city|urban|neon|night|midnight|drive|road|city pop|도시|야경|드라이브/.test(lowerPrompt)) {
    return [
      'Night City Drive',
      'Midnight Cruise',
      'City Lights View',
      'Study & Work BGM',
      'Relaxing Time',
      'Urban Chill Moments',
    ]
  }

  if (/rain|storm|sad|melancholy|lofi|비|우울|쓸쓸/.test(lowerPrompt)) {
    return [
      'Rainy Night Listening',
      'Late Night Focus',
      'Quiet Reading',
      'Study & Work BGM',
      'Emotional Moments',
      'Relaxing Time',
    ]
  }

  if (/ocean|sea|wave|calm|chill|바다|파도|잔잔/.test(lowerPrompt)) {
    return [
      'Ocean View Relaxing',
      'Slow Morning Routine',
      'Study & Work BGM',
      'Calm Travel Moments',
      'Peaceful Break Time',
      'Chill Playlist',
    ]
  }

  if (/energetic|powerful|rock|trap|edm|강렬|에너지|신나는/.test(lowerPrompt)) {
    return [
      'Workout Playlist',
      'Driving BGM',
      'Creative Focus',
      'Gaming Sessions',
      'High Energy Moments',
      'Motivation Time',
    ]
  }

  return [
    'Study & Work BGM',
    'Relaxing Time',
    'Daily Playlist',
    'Vlog Background Music',
    'Creative Focus',
    'Chill Moments',
  ]
}

function getFeaturingItems(primaryValues, fallbackValues) {
  const genre = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'genre', 'Original Music'))
  const mood = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'mood', 'Emotional'))
  const instruments = getSeoValue(fallbackValues, primaryValues, 'instruments', 'Warm Instruments')
    .split(',')
    .map((instrument) => titleCase(removeAiReferences(instrument)))
    .filter(Boolean)
  const vocalStyle = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'vocalStyle', 'Instrumental'))
  const primaryInstrument = instruments[0] || 'Warm Instruments'
  const secondaryInstrument = instruments[1] || 'Wide Soundscape'

  return [
    `${genre} ${vocalStyle}`,
    `${mood} ${primaryInstrument} Melodies`,
    `${mood} Atmosphere`,
    `Clean Mix & ${secondaryInstrument}`,
    'Original Wide Soundscape',
  ]
}

function createDescriptionHashtags(genre, mood, fallbackValues) {
  const englishGenre = cleanTitleValue(removeAiReferences(getValue(fallbackValues, 'genre', genre)) || genre)
  const englishMood = cleanTitleValue(removeAiReferences(getValue(fallbackValues, 'mood', mood)) || mood)

  return [
    createHashtag(englishGenre, '음악'),
    createHashtag(englishMood, '감성음악'),
    createHashtag(genre, '음악'),
    createHashtag(mood, '플레이리스트'),
    '#Instrumental',
  ]
    .filter((tag, index, allTags) => allTags.indexOf(tag) === index)
    .join(' ')
}

function createYoutubeDescription(primaryValues, fallbackValues) {
  const promptText = `${createPrompt(primaryValues)} ${createPrompt(fallbackValues)}`
  const genre = getCleanSeoValue(primaryValues, fallbackValues, 'genre', '오리지널 음악')
  const mood = getCleanSeoValue(primaryValues, fallbackValues, 'mood', '감성적인 분위기')
  const englishGenre = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'genre', 'Original Music'))
  const englishMood = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'mood', 'Calm, Relaxing'))
  const featuringItems = getFeaturingItems(primaryValues, fallbackValues)
  const perfectForItems = getPerfectForItems(promptText)

  return `🎵 A ${englishMood.toLowerCase()} ${englishGenre} track shaped for a cinematic and immersive listening moment.

${mood}와 ${genre}의 결을 담아,
조용히 흘러가는 장면과 감정의 흐름을 표현한 오리지널 음악입니다.

🎻 Featuring
${featuringItems.map((item) => `• ${item}`).join('\n')}

🎧 Perfect For
${perfectForItems.map((item) => `• ${item}`).join('\n')}

${genre}의 색감과 ${mood}의 분위기를 떠올리며 제작한 트랙입니다.
작업, 공부, 드라이브, 휴식처럼 음악이 자연스럽게 배경이 되는 순간에 잘 어울립니다.

With warm textures, detailed production, and an original atmosphere, this track is perfect for listeners looking for a fresh soundtrack, relaxing BGM, or a mood-based playlist.

${createDescriptionHashtags(genre, mood, fallbackValues)}`
}

function createYoutubeMetadata(primaryValues, fallbackValues) {
  const title = createVideoTitle(primaryValues, fallbackValues)
  const description = createYoutubeDescription(primaryValues, fallbackValues)
  const tags = createTagPhrases(primaryValues, fallbackValues)

  return {
    title: removeReferenceArtistText(title, primaryValues, fallbackValues),
    description: removeReferenceArtistText(description, primaryValues, fallbackValues),
    tags: removeReferenceArtistText(limitTags(tags), primaryValues, fallbackValues),
  }
}

const copyIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2M6 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
  </svg>
)

const calendarIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
)

function App() {
  const [activeTab, setActiveTab] = useState('text')
  const [musicSettingsMode, setMusicSettingsMode] = useState('manual')
  const [genreSelection, setGenreSelection] = useState(initialGenreSelection)
  const [translatedGenreMood, setTranslatedGenreMood] = useState('')
  const [values, setValues] = useState(initialValues)
  const [translatedValues, setTranslatedValues] = useState(initialValues)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGenreMoodTranslating, setIsGenreMoodTranslating] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [youtubeSearchValues, setYoutubeSearchValues] = useState(createInitialYoutubeSearchValues)
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [youtubeSearchStatus, setYoutubeSearchStatus] = useState('idle')
  const [youtubeSearchMessage, setYoutubeSearchMessage] = useState('')
  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState('')
  const [isLoadingMoreYoutubeVideos, setIsLoadingMoreYoutubeVideos] = useState(false)
  const messageTimeout = useRef(null)
  const dateFromPickerRef = useRef(null)
  const dateToPickerRef = useRef(null)
  const normalizedInputValues = useMemo(() => normalizeValues(values), [values])
  const normalizedValues = useMemo(() => normalizeValues(translatedValues), [translatedValues])
  const genreMetadataInputValues = useMemo(
    () => createGenreMetadataValues(genreSelection),
    [genreSelection],
  )
  const genreMetadataTranslatedValues = useMemo(
    () => createGenreMetadataValues(genreSelection, translatedGenreMood),
    [genreSelection, translatedGenreMood],
  )
  const manualPromptParts = useMemo(() => createPromptParts(normalizedValues), [normalizedValues])
  const genrePromptParts = useMemo(
    () => createGenrePromptParts(genreSelection, translatedGenreMood),
    [genreSelection, translatedGenreMood],
  )
  const promptParts = musicSettingsMode === 'genre' ? genrePromptParts : manualPromptParts
  const prompt = useMemo(
    () => (musicSettingsMode === 'genre'
      ? createGenrePrompt(genreSelection, translatedGenreMood)
      : createPrompt(normalizedValues)),
    [genreSelection, musicSettingsMode, normalizedValues, translatedGenreMood],
  )
  const youtubeMetadata = useMemo(
    () => createYoutubeMetadata(
      musicSettingsMode === 'genre' ? genreMetadataInputValues : normalizedInputValues,
      musicSettingsMode === 'genre' ? genreMetadataTranslatedValues : normalizedValues,
    ),
    [
      genreMetadataInputValues,
      genreMetadataTranslatedValues,
      musicSettingsMode,
      normalizedInputValues,
      normalizedValues,
    ],
  )
  const selectedGenreGroupData = genreGroups.find(({ label }) => label === genreSelection.genreGroup)

  useEffect(() => {
    return () => clearTimeout(messageTimeout.current)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      const entries = Object.entries(values)
      const hasKoreanInput = entries.some(([, value]) => koreanPattern.test(value))

      if (!hasKoreanInput) {
        setTranslatedValues(values)
        setIsTranslating(false)
        return
      }

      setIsTranslating(true)

      try {
        const translatedEntries = await Promise.all(
          entries.map(async ([key, value]) => [
            key,
            koreanPattern.test(value)
              ? await translateToEnglish(value, controller.signal)
              : value,
          ]),
        )
        setTranslatedValues(Object.fromEntries(translatedEntries))
      } catch (error) {
        if (error.name !== 'AbortError') {
          setTranslatedValues(values)
          showMessage('Translation failed. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsTranslating(false)
        }
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [values])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      const mood = genreSelection.mood.trim()

      if (!mood) {
        setTranslatedGenreMood('')
        setIsGenreMoodTranslating(false)
        return
      }

      if (!koreanPattern.test(mood)) {
        setTranslatedGenreMood(mood)
        setIsGenreMoodTranslating(false)
        return
      }

      setIsGenreMoodTranslating(true)

      try {
        setTranslatedGenreMood(await translateToEnglish(mood, controller.signal))
      } catch (error) {
        if (error.name !== 'AbortError') {
          setTranslatedGenreMood(mood)
          showMessage('Translation failed. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsGenreMoodTranslating(false)
        }
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [genreSelection.mood])

  const handleChange = ({ target }) => {
    setValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }))
  }

  const changeMusicSettingsMode = (nextMode) => {
    setMusicSettingsMode(nextMode)
  }

  const handleGenreGroupChange = ({ target }) => {
    setGenreSelection((currentSelection) => ({
      ...currentSelection,
      genreGroup: target.value,
      subgenre: '',
    }))
  }

  const handleSubgenreChange = ({ target }) => {
    setGenreSelection((currentSelection) => ({
      ...currentSelection,
      subgenre: target.value,
    }))
  }

  const handleGenreSelectionInputChange = ({ target }) => {
    setGenreSelection((currentSelection) => ({
      ...currentSelection,
      [target.name]: target.value,
    }))
  }

  const handleYoutubeSearchChange = ({ target }) => {
    setYoutubeSearchValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }))
    setYoutubeNextPageToken('')
  }

  const openDatePicker = (pickerRef) => {
    if (pickerRef.current?.showPicker) {
      pickerRef.current.showPicker()
      return
    }

    pickerRef.current?.focus()
    pickerRef.current?.click()
  }

  const showMessage = (message) => {
    clearTimeout(messageTimeout.current)
    setCopyMessage(message)
    messageTimeout.current = setTimeout(() => setCopyMessage(''), 2200)
  }

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text)
      showMessage(successMessage)
    } catch {
      showMessage('Copy failed. Please try again.')
    }
  }

  const copyAllYoutubeMetadata = () => {
    copyText(
      `Title\n${youtubeMetadata.title}\n\nDescription\n${youtubeMetadata.description}\n\nTags\n${youtubeMetadata.tags}`,
      'YouTube metadata copied!',
    )
  }

  const resetForm = () => {
    setValues(initialValues)
    setTranslatedValues(initialValues)
    setGenreSelection(initialGenreSelection)
    setTranslatedGenreMood('')
    setCopyMessage('')
  }

  const fetchYoutubeVideos = async ({ pageToken = '', maxResults = initialYoutubeResultCount, append = false } = {}) => {
    if (!youtubeSearchValues.query.trim()) {
      setYoutubeVideos([])
      setYoutubeNextPageToken('')
      setYoutubeSearchStatus('error')
      setYoutubeSearchMessage('검색어를 입력하세요.')
      return
    }

    const params = new URLSearchParams({
      query: youtubeSearchValues.query.trim(),
      dateFrom: youtubeSearchValues.dateFrom,
      dateTo: youtubeSearchValues.dateTo,
      order: youtubeSearchValues.order,
      maxResults: String(maxResults),
      videoDuration: youtubeSearchValues.videoDuration,
      videoDefinition: youtubeSearchValues.videoDefinition,
      videoCaption: youtubeSearchValues.videoCaption,
      embeddable: String(youtubeSearchValues.embeddable),
      safeSearch: youtubeSearchValues.safeSearch,
      regionCode: youtubeSearchValues.regionCode.trim().toUpperCase(),
      relevanceLanguage: youtubeSearchValues.relevanceLanguage.trim().toLowerCase(),
      channelId: youtubeSearchValues.channelId.trim(),
      minViews: youtubeSearchValues.minViews,
      minLikes: youtubeSearchValues.minLikes,
      minSubscribers: youtubeSearchValues.minSubscribers,
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    if (append) {
      setIsLoadingMoreYoutubeVideos(true)
    } else {
      setYoutubeSearchStatus('loading')
      setYoutubeSearchMessage('')
      setYoutubeNextPageToken('')
    }

    try {
      const response = await fetch(`/api/youtube?${params}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'YouTube 영상을 불러오지 못했습니다.')
      }

      const nextItems = data.items || []
      setYoutubeVideos((currentVideos) => (append ? [...currentVideos, ...nextItems] : nextItems))
      setYoutubeNextPageToken(data.nextPageToken || '')

      if (!append && !nextItems.length) {
        setYoutubeSearchStatus('empty')
        setYoutubeSearchMessage('검색 결과가 없습니다. 검색어 또는 정렬 기준을 바꿔보세요.')
        return
      }

      setYoutubeSearchStatus('success')
      setYoutubeSearchMessage(
        append
          ? `${youtubeVideos.length + nextItems.length}개의 영상을 불러왔습니다.`
          : `${nextItems.length}개의 영상을 찾았습니다.`,
      )
    } catch (error) {
      if (!append) {
        setYoutubeVideos([])
        setYoutubeNextPageToken('')
      }
      setYoutubeSearchStatus('error')
      setYoutubeSearchMessage(error.message)
    } finally {
      setIsLoadingMoreYoutubeVideos(false)
    }
  }

  const searchYoutubeVideos = (event) => {
    event.preventDefault()
    fetchYoutubeVideos()
  }

  const loadMoreYoutubeVideos = () => {
    if (!youtubeNextPageToken || isLoadingMoreYoutubeVideos) {
      return
    }

    fetchYoutubeVideos({
      pageToken: youtubeNextPageToken,
      maxResults: additionalYoutubeResultCount,
      append: true,
    })
  }

  return (
    <main className="page-shell">
      <nav className="top-tabs" aria-label="Workspace tabs">
        <button
          className={`tab-button${activeTab === 'text' ? ' active' : ''}`}
          onClick={() => setActiveTab('text')}
          type="button"
        >
          Prompt
        </button>
        <button
          className={`tab-button${activeTab === 'image' ? ' active' : ''}`}
          onClick={() => setActiveTab('image')}
          type="button"
        >
          YouTube
        </button>
      </nav>

      {activeTab === 'text' ? (
        <>
      <section className="hero">
        <h1>Suno Prompt Generator</h1>
      </section>

      <section className="workspace" aria-label="Suno prompt generator">
        <div className="form-panel panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">STEP 01</p>
              <div className="settings-title-row">
                <h2>음악 설정</h2>
                <div className="settings-tabs" aria-label="음악 설정 방식">
                  <button
                    className={`settings-tab-button${musicSettingsMode === 'manual' ? ' active' : ''}`}
                    onClick={() => changeMusicSettingsMode('manual')}
                    type="button"
                  >
                    직접입력
                  </button>
                  <button
                    className={`settings-tab-button${musicSettingsMode === 'genre' ? ' active' : ''}`}
                    onClick={() => changeMusicSettingsMode('genre')}
                    type="button"
                  >
                    장르선택
                  </button>
                </div>
              </div>
            </div>
            <button className="button button-secondary" type="button" onClick={resetForm}>
              Reset
            </button>
          </div>

          {musicSettingsMode === 'manual' ? (
            <div className="form-grid">
              {fields.map(({ key, label, placeholder }) => (
                <label className={key === 'structure' ? 'field field-wide' : 'field'} key={key}>
                  <span>{label}</span>
                  {key === 'structure' ? (
                    <textarea
                      name={key}
                      onChange={handleChange}
                      placeholder={placeholder}
                      rows="3"
                      value={values[key]}
                    />
                  ) : (
                    <input
                      name={key}
                      onChange={handleChange}
                      placeholder={placeholder}
                      type="text"
                      value={values[key]}
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="genre-select-panel" aria-label="장르선택">
              <div className="genre-select-grid">
                <label className="field">
                  <span>장르</span>
                  <select onChange={handleGenreGroupChange} value={genreSelection.genreGroup}>
                    <option value="">장르를 선택하세요</option>
                    {genreGroups.map(({ label }) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>세부장르</span>
                  <select
                    disabled={!selectedGenreGroupData}
                    onChange={handleSubgenreChange}
                    value={genreSelection.subgenre}
                  >
                    <option value="">세부장르를 선택하세요</option>
                    {selectedGenreGroupData?.subgenres.map((subgenre) => (
                      <option key={subgenre} value={subgenre}>
                        {subgenre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>BPM</span>
                  <input
                    name="bpm"
                    onChange={handleGenreSelectionInputChange}
                    placeholder="예: 100"
                    type="text"
                    value={genreSelection.bpm}
                  />
                </label>

                <label className="field">
                  <span>분위기</span>
                  <input
                    name="mood"
                    onChange={handleGenreSelectionInputChange}
                    placeholder="예: 몽환적이고 따뜻한"
                    type="text"
                    value={genreSelection.mood}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <aside className="result-panel panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">STEP 02</p>
              <h2>생성된 프롬프트</h2>
            </div>
            <span className={`live-badge${(isTranslating || isGenreMoodTranslating) ? ' translating' : ''}`}>
              <span aria-hidden="true" />
              {(isTranslating || isGenreMoodTranslating) ? 'TRANSLATING' : 'LIVE'}
            </span>
          </div>

          <div className="prompt-box">
            <p>
              {promptParts.map(({ text, isFilled, key }, index) => (
                <span className={isFilled ? 'prompt-value' : undefined} key={`${key || 'text'}-${index}`}>
                  {text}
                </span>
              ))}
            </p>
          </div>

          <div className="result-footer">
            <p aria-live="polite" className="copy-message">
              {copyMessage}
            </p>
            <button className="button button-primary" type="button" onClick={() => copyText(prompt, 'Prompt copied!')}>
              {copyIcon}
              Copy Prompt
            </button>
          </div>
        </aside>
      </section>

      <section className="youtube-panel panel" aria-label="YouTube upload metadata">
        <div className="section-heading">
          <div>
            <p className="section-kicker">STEP 03</p>
            <h2>YouTube 업로드 정보</h2>
          </div>
          <button className="button button-secondary" type="button" onClick={copyAllYoutubeMetadata}>
            {copyIcon}
            Copy All
          </button>
        </div>

        <p className="section-description">
          SEO 키워드를 반영해 한국어 중심의 영상 제목, 본문, 태그를 자동으로 구성합니다.
        </p>

        <div className="metadata-grid">
          <article className="metadata-card">
            <div className="metadata-heading">
              <h3>영상 제목</h3>
              <button className="button button-primary metadata-copy-button" type="button" onClick={() => copyText(youtubeMetadata.title, 'Title copied!')}>
                Copy
              </button>
            </div>
            <p>{youtubeMetadata.title}</p>
          </article>

          <article className="metadata-card">
            <div className="metadata-heading">
              <h3>영상 본문</h3>
              <button className="button button-primary metadata-copy-button" type="button" onClick={() => copyText(youtubeMetadata.description, 'Description copied!')}>
                Copy
              </button>
            </div>
            <p className="metadata-description">{youtubeMetadata.description}</p>
          </article>

          <article className="metadata-card">
            <div className="metadata-heading">
              <h3>태그</h3>
              <button className="button button-primary metadata-copy-button" type="button" onClick={() => copyText(youtubeMetadata.tags, 'Tags copied!')}>
                Copy
              </button>
            </div>
            <p>{youtubeMetadata.tags}</p>
          </article>
        </div>

        <p aria-live="polite" className="copy-message metadata-copy-message">
          {copyMessage}
        </p>
      </section>
        </>
      ) : (
        <section className="youtube-search-panel panel" aria-label="YouTube video search">
          <div className="section-heading">
            <div>
              <h2>유튜브 영상 조회</h2>
            </div>
          </div>

          <form className="youtube-search-form" onSubmit={searchYoutubeVideos}>
            <label className="field search-query-field">
              <span>검색어</span>
              <input
                name="query"
                onChange={handleYoutubeSearchChange}
                placeholder="검색어를 입력하세요."
                type="text"
                value={youtubeSearchValues.query}
              />
            </label>

            <label className="field date-range-field">
              <span>기간 설정</span>
              <div className="date-range-inputs">
                <div className="date-display-field">
                  <input aria-label="검색 시작일" readOnly type="text" value={formatDisplayDate(youtubeSearchValues.dateFrom)} />
                  <button aria-label="검색 시작일 선택" className="calendar-button" onClick={() => openDatePicker(dateFromPickerRef)} type="button">
                    {calendarIcon}
                  </button>
                  <input
                    className="native-date-input"
                    name="dateFrom"
                    onChange={handleYoutubeSearchChange}
                    ref={dateFromPickerRef}
                    tabIndex={-1}
                    type="date"
                    value={youtubeSearchValues.dateFrom}
                  />
                </div>
                <span aria-hidden="true">~</span>
                <div className="date-display-field">
                  <input aria-label="검색 종료일" readOnly type="text" value={formatDisplayDate(youtubeSearchValues.dateTo)} />
                  <button aria-label="검색 종료일 선택" className="calendar-button" onClick={() => openDatePicker(dateToPickerRef)} type="button">
                    {calendarIcon}
                  </button>
                  <input
                    className="native-date-input"
                    name="dateTo"
                    onChange={handleYoutubeSearchChange}
                    ref={dateToPickerRef}
                    tabIndex={-1}
                    type="date"
                    value={youtubeSearchValues.dateTo}
                  />
                </div>
              </div>
            </label>

            <label className="field">
              <span>정렬 기준</span>
              <select name="order" onChange={handleYoutubeSearchChange} value={youtubeSearchValues.order}>
                {youtubeOrderOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button className="button button-primary youtube-search-button" disabled={youtubeSearchStatus === 'loading'} type="submit">
              {youtubeSearchStatus === 'loading' ? '조회 중...' : '조회'}
            </button>

            <details className="advanced-search">
              <summary>상세검색</summary>
              <div className="advanced-search-grid">
                <label className="field">
                  <span>영상 길이</span>
                  <select name="videoDuration" onChange={handleYoutubeSearchChange} value={youtubeSearchValues.videoDuration}>
                    {youtubeDurationOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>화질</span>
                  <select name="videoDefinition" onChange={handleYoutubeSearchChange} value={youtubeSearchValues.videoDefinition}>
                    {youtubeDefinitionOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>자막</span>
                  <select name="videoCaption" onChange={handleYoutubeSearchChange} value={youtubeSearchValues.videoCaption}>
                    {youtubeCaptionOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>안전검색</span>
                  <select name="safeSearch" onChange={handleYoutubeSearchChange} value={youtubeSearchValues.safeSearch}>
                    {youtubeSafeSearchOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>지역 코드</span>
                  <input
                    maxLength="2"
                    name="regionCode"
                    onChange={handleYoutubeSearchChange}
                    placeholder="예: KR"
                    type="text"
                    value={youtubeSearchValues.regionCode}
                  />
                </label>

                <label className="field">
                  <span>관련 언어</span>
                  <input
                    maxLength="2"
                    name="relevanceLanguage"
                    onChange={handleYoutubeSearchChange}
                    placeholder="예: ko"
                    type="text"
                    value={youtubeSearchValues.relevanceLanguage}
                  />
                </label>

                <label className="field">
                  <span>채널 ID</span>
                  <input
                    name="channelId"
                    onChange={handleYoutubeSearchChange}
                    placeholder="특정 채널만 조회"
                    type="text"
                    value={youtubeSearchValues.channelId}
                  />
                </label>

                <label className="field">
                  <span>최소 조회수</span>
                  <input
                    min="0"
                    name="minViews"
                    onChange={handleYoutubeSearchChange}
                    placeholder="예: 10000"
                    type="number"
                    value={youtubeSearchValues.minViews}
                  />
                </label>

                <label className="field">
                  <span>최소 좋아요</span>
                  <input
                    min="0"
                    name="minLikes"
                    onChange={handleYoutubeSearchChange}
                    placeholder="예: 100"
                    type="number"
                    value={youtubeSearchValues.minLikes}
                  />
                </label>

                <label className="field">
                  <span>최소 구독자</span>
                  <input
                    min="0"
                    name="minSubscribers"
                    onChange={handleYoutubeSearchChange}
                    placeholder="예: 1000"
                    type="number"
                    value={youtubeSearchValues.minSubscribers}
                  />
                </label>

                <label className="checkbox-field">
                  <input
                    checked={youtubeSearchValues.embeddable}
                    name="embeddable"
                    onChange={handleYoutubeSearchChange}
                    type="checkbox"
                  />
                  <span>임베드 가능한 영상만</span>
                </label>
              </div>
            </details>
          </form>

          <p className={`youtube-search-message ${youtubeSearchStatus}`} aria-live="polite">
            {youtubeSearchMessage}
          </p>

          <div className="video-results">
            {youtubeSearchStatus === 'idle' && youtubeVideos.length === 0
              ? videoPlaceholderCards.map((placeholderId) => (
                  <article className="video-card video-card-placeholder" key={placeholderId} aria-hidden="true">
                    <span className="video-thumbnail-placeholder" />
                    <div className="video-content">
                      <span className="video-placeholder-line title" />
                      <span className="video-placeholder-line" />
                      <span className="video-placeholder-line short" />
                    </div>
                  </article>
                ))
              : null}
            {youtubeVideos.map((video) => (
              <article className="video-card" key={video.id}>
                <a className="video-thumbnail-link" href={video.url} rel="noreferrer" target="_blank">
                  {video.thumbnail ? (
                    <img alt="" className="video-thumbnail" src={video.thumbnail} />
                  ) : (
                    <span className="video-thumbnail-placeholder" />
                  )}
                  {formatDuration(video.durationSeconds) ? (
                    <span className="video-duration">{formatDuration(video.durationSeconds)}</span>
                  ) : null}
                </a>

                <div className="video-content">
                  <a className="video-title" href={video.url} rel="noreferrer" target="_blank">
                    {video.title}
                  </a>
                  <p className="video-meta">
                    {video.channelTitle} · {formatPublishedDate(video.publishedAt)}
                  </p>
                  <div className="video-stats" aria-label="YouTube video statistics">
                    <span>길이 {formatDuration(video.durationSeconds) || '-'}</span>
                    <span>조회수 {formatCount(video.viewCount) || '-'}회</span>
                    <span>좋아요 {formatCount(video.likeCount) || '-'}</span>
                    <span>구독자 {formatCount(video.subscriberCount) || '-'}</span>
                  </div>
                  <a className="video-link" href={video.url} rel="noreferrer" target="_blank">
                    YouTube에서 보기
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="youtube-load-more">
            {youtubeSearchStatus === 'success' && youtubeNextPageToken ? (
              <button
                className="button button-primary youtube-load-more-button"
                disabled={isLoadingMoreYoutubeVideos}
                onClick={loadMoreYoutubeVideos}
                type="button"
              >
                {isLoadingMoreYoutubeVideos ? '불러오는 중...' : '더 보기'}
              </button>
            ) : null}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
