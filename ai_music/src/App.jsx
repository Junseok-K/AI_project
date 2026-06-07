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
]

const defaultStructure = 'intro, verse, chorus, bridge, outro'
const initialValues = {
  ...Object.fromEntries(fields.map(({ key }) => [key, ''])),
  structure: defaultStructure,
}
const initialYoutubeSearchValues = {
  query: '',
  order: 'relevance',
  maxResults: '8',
}
const koreanPattern = /[\u3131-\u318e\uac00-\ud7a3]/
const numberOnlyPattern = /^\d+(?:\.\d+)?$/

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

  return `${mood}와 함께하는 ${focus}`.replace('분위기와 함께하는', '분위기의')
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
  const referenceArtist = cleanTitleValue(getCleanSeoValue(primaryValues, fallbackValues, 'referenceArtist', ''))
  const primaryInstrument = instruments[0] || 'Warm Instruments'
  const secondaryInstrument = instruments[1] || 'Wide Soundscape'
  const atmosphere = referenceArtist
    ? `${referenceArtist} Inspired Atmosphere`
    : `${mood} Atmosphere`

  return [
    `${genre} ${vocalStyle}`,
    `${mood} ${primaryInstrument} Melodies`,
    atmosphere,
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
  const emoji = getTitleEmoji(promptText)
  const genre = getCleanSeoValue(primaryValues, fallbackValues, 'genre', '오리지널 음악')
  const mood = getCleanSeoValue(primaryValues, fallbackValues, 'mood', '감성적인 분위기')
  const referenceArtist = getCleanSeoValue(primaryValues, fallbackValues, 'referenceArtist', '')
  const englishGenre = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'genre', 'Original Music'))
  const englishMood = titleCase(getCleanSeoValue(fallbackValues, primaryValues, 'mood', 'Calm, Relaxing'))
  const featuringItems = getFeaturingItems(primaryValues, fallbackValues)
  const perfectForItems = getPerfectForItems(promptText)
  const referenceLine = referenceArtist
    ? `\n${referenceArtist}의 감성을 참고하되, 멜로디와 분위기는 완전히 새롭게 구성한 오리지널 트랙입니다.\n`
    : ''

  return `${emoji} A ${englishMood.toLowerCase()} ${englishGenre} track shaped for a cinematic and immersive listening moment.

${mood}와 ${genre}의 결을 담아,
조용히 흘러가는 장면과 감정의 흐름을 표현한 오리지널 음악입니다.
${referenceLine}
${emoji} Featuring
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

  return { title, description, tags: limitTags(tags) }
}

const copyIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2M6 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
  </svg>
)

function App() {
  const [activeTab, setActiveTab] = useState('text')
  const [values, setValues] = useState(initialValues)
  const [translatedValues, setTranslatedValues] = useState(initialValues)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [youtubeSearchValues, setYoutubeSearchValues] = useState(initialYoutubeSearchValues)
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [youtubeSearchStatus, setYoutubeSearchStatus] = useState('idle')
  const [youtubeSearchMessage, setYoutubeSearchMessage] = useState('')
  const messageTimeout = useRef(null)
  const normalizedInputValues = useMemo(() => normalizeValues(values), [values])
  const normalizedValues = useMemo(() => normalizeValues(translatedValues), [translatedValues])
  const promptParts = useMemo(() => createPromptParts(normalizedValues), [normalizedValues])
  const prompt = useMemo(() => createPrompt(normalizedValues), [normalizedValues])
  const youtubeMetadata = useMemo(
    () => createYoutubeMetadata(normalizedInputValues, normalizedValues),
    [normalizedInputValues, normalizedValues],
  )

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

  const handleChange = ({ target }) => {
    setValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }))
  }

  const handleYoutubeSearchChange = ({ target }) => {
    setYoutubeSearchValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }))
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
    setCopyMessage('')
  }

  const searchYoutubeVideos = async (event) => {
    event.preventDefault()

    if (!youtubeSearchValues.query.trim()) {
      setYoutubeVideos([])
      setYoutubeSearchStatus('error')
      setYoutubeSearchMessage('검색어를 입력해 주세요.')
      return
    }

    const params = new URLSearchParams({
      query: youtubeSearchValues.query.trim(),
      order: youtubeSearchValues.order,
      maxResults: youtubeSearchValues.maxResults,
    })

    setYoutubeSearchStatus('loading')
    setYoutubeSearchMessage('')

    try {
      const response = await fetch(`/api/youtube?${params}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'YouTube 영상을 불러오지 못했습니다.')
      }

      setYoutubeVideos(data.items || [])

      if (!data.items?.length) {
        setYoutubeSearchStatus('empty')
        setYoutubeSearchMessage('검색 결과가 없습니다. 검색어 또는 정렬 기준을 바꿔보세요.')
        return
      }

      setYoutubeSearchStatus('success')
      setYoutubeSearchMessage(`${data.items.length}개의 영상을 찾았습니다.`)
    } catch (error) {
      setYoutubeVideos([])
      setYoutubeSearchStatus('error')
      setYoutubeSearchMessage(error.message)
    }
  }

  return (
    <main className="page-shell">
      <nav className="top-tabs" aria-label="Workspace tabs">
        <button
          className={`tab-button${activeTab === 'text' ? ' active' : ''}`}
          onClick={() => setActiveTab('text')}
          type="button"
        >
          TEXT
        </button>
        <button
          className={`tab-button${activeTab === 'image' ? ' active' : ''}`}
          onClick={() => setActiveTab('image')}
          type="button"
        >
          IMAGE
        </button>
      </nav>

      {activeTab === 'text' ? (
        <>
      <section className="hero">
        <p className="eyebrow">AI MUSIC WORKSPACE</p>
        <h1>Suno Prompt Generator</h1>
        <p className="hero-copy">원하는 음악의 요소를 입력하면 Suno AI에 바로 사용할 수 있는 프롬프트를 실시간으로 만들어 드립니다.</p>
      </section>

      <section className="workspace" aria-label="Suno prompt generator">
        <div className="form-panel panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">STEP 01</p>
              <h2>음악 설정</h2>
            </div>
            <button className="button button-secondary" type="button" onClick={resetForm}>
              Reset
            </button>
          </div>

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
        </div>

        <aside className="result-panel panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">STEP 02</p>
              <h2>생성된 프롬프트</h2>
            </div>
            <span className={`live-badge${isTranslating ? ' translating' : ''}`}>
              <span aria-hidden="true" />
              {isTranslating ? 'TRANSLATING' : 'LIVE'}
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
              <h3>태그</h3>
              <button className="button button-primary metadata-copy-button" type="button" onClick={() => copyText(youtubeMetadata.tags, 'Tags copied!')}>
                Copy
              </button>
            </div>
            <p>{youtubeMetadata.tags}</p>
          </article>

          <article className="metadata-card metadata-card-wide">
            <div className="metadata-heading">
              <h3>영상 본문</h3>
              <button className="button button-primary metadata-copy-button" type="button" onClick={() => copyText(youtubeMetadata.description, 'Description copied!')}>
                Copy
              </button>
            </div>
            <p className="metadata-description">{youtubeMetadata.description}</p>
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
              <p className="section-kicker">IMAGE SEARCH</p>
              <h2>유튜브 영상 조회</h2>
            </div>
          </div>

          <form className="youtube-search-form" onSubmit={searchYoutubeVideos}>
            <label className="field search-query-field">
              <span>검색어</span>
              <input
                name="query"
                onChange={handleYoutubeSearchChange}
                placeholder="예: city pop night drive"
                type="text"
                value={youtubeSearchValues.query}
              />
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

            <label className="field">
              <span>최대 조회 개수</span>
              <input
                max="50"
                min="1"
                name="maxResults"
                onChange={handleYoutubeSearchChange}
                type="number"
                value={youtubeSearchValues.maxResults}
              />
            </label>

            <button className="button button-primary youtube-search-button" disabled={youtubeSearchStatus === 'loading'} type="submit">
              {youtubeSearchStatus === 'loading' ? 'Searching...' : 'Search Videos'}
            </button>
          </form>

          <p className={`youtube-search-message ${youtubeSearchStatus}`} aria-live="polite">
            {youtubeSearchMessage}
          </p>

          <div className="video-results">
            {youtubeVideos.map((video) => (
              <article className="video-card" key={video.id}>
                <a className="video-thumbnail-link" href={video.url} rel="noreferrer" target="_blank">
                  {video.thumbnail ? (
                    <img alt="" className="video-thumbnail" src={video.thumbnail} />
                  ) : (
                    <span className="video-thumbnail-placeholder" />
                  )}
                </a>

                <div className="video-content">
                  <a className="video-title" href={video.url} rel="noreferrer" target="_blank">
                    {video.title}
                  </a>
                  <p className="video-meta">
                    {video.channelTitle} · {formatPublishedDate(video.publishedAt)}
                  </p>
                  <p className="video-description">{video.description || '설명 없음'}</p>
                  <a className="video-link" href={video.url} rel="noreferrer" target="_blank">
                    YouTube에서 보기
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
