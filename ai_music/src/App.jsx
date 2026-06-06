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

const defaultStructure = 'intro, verse, chorus, bridge, outro'
const initialValues = {
  ...Object.fromEntries(fields.map(({ key }) => [key, ''])),
  structure: defaultStructure,
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

function limitTags(tags, maxLength = 480) {
  const uniqueTags = tags
    .map((tag) => tag.trim())
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

function createYoutubeMetadata(primaryValues, fallbackValues) {
  const genre = getSeoValue(primaryValues, fallbackValues, 'genre', '오리지널 음악')
  const mood = getSeoValue(primaryValues, fallbackValues, 'mood', '감성적인 분위기')
  const length = formatKoreanLength(getSeoValue(primaryValues, fallbackValues, 'length', ''))
  const bpm = getSeoValue(primaryValues, fallbackValues, 'bpm', '자연스러운')
  const instruments = getSeoValue(primaryValues, fallbackValues, 'instruments', '다채로운 악기')
  const vocalStyle = getSeoValue(primaryValues, fallbackValues, 'vocalStyle', '매력적인 보컬')
  const referenceArtist = getSeoValue(primaryValues, fallbackValues, 'referenceArtist', '')
  const referenceLine = referenceArtist
    ? `참고 감성: ${referenceArtist}의 정서를 떠올리게 하지만, 멜로디와 분위기는 완전히 새롭게 구성했습니다.\n`
    : ''
  const title = `Suno AI 음악 | ${mood} ${genre} (${length})`
  const genreHashtag = createHashtag(genre, '음악')
  const moodHashtag = createHashtag(mood, '감성음악')
  const description = `${mood}이 돋보이는 ${genre} 스타일의 Suno AI 음악입니다. ${length} 길이, ${bpm} 템포, ${instruments}, ${vocalStyle}을 중심으로 감성적인 분위기를 만들었습니다.

이 영상은 AI 음악, Suno AI 음악 생성, ${genre}, ${mood} 음악을 찾는 분들을 위해 제작한 오리지널 트랙입니다.
${referenceLine}
감상 포인트:
- 분위기: ${mood}
- 장르: ${genre}
- 악기: ${instruments}
- 보컬 스타일: ${vocalStyle}
- 템포: ${bpm}

좋았다면 구독과 좋아요로 더 많은 AI 음악을 만나보세요.

#SunoAI #AI음악 ${genreHashtag} ${moodHashtag}`
  const tags = [
    'Suno AI',
    'Suno AI 음악',
    'AI 음악',
    'AI 음악 생성',
    'AI 노래',
    '오리지널 음악',
    genre,
    mood,
    ...instruments.split(','),
    vocalStyle,
    bpm,
    `${genre} 음악`,
    `${mood} 음악`,
    `${genre} 플레이리스트`,
    '유튜브 음악',
    '감성 음악',
    '배경음악',
    'new music',
    'original music',
    'AI music',
  ]

  return { title, description, tags: limitTags(tags) }
}

const copyIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2M6 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
  </svg>
)

function App() {
  const [values, setValues] = useState(initialValues)
  const [translatedValues, setTranslatedValues] = useState(initialValues)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
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

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">AI MUSIC WORKSPACE</p>
        <h1>Suno Prompt Generator</h1>
        <p className="hero-copy">
          원하는 음악의 요소를 입력하면 Suno AI에 바로 사용할 수 있는
          프롬프트를 실시간으로 만들어 드립니다.
        </p>
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
              <button type="button" onClick={() => copyText(youtubeMetadata.title, 'Title copied!')}>
                Copy
              </button>
            </div>
            <p>{youtubeMetadata.title}</p>
          </article>

          <article className="metadata-card">
            <div className="metadata-heading">
              <h3>태그</h3>
              <button type="button" onClick={() => copyText(youtubeMetadata.tags, 'Tags copied!')}>
                Copy
              </button>
            </div>
            <p>{youtubeMetadata.tags}</p>
          </article>

          <article className="metadata-card metadata-card-wide">
            <div className="metadata-heading">
              <h3>영상 본문</h3>
              <button type="button" onClick={() => copyText(youtubeMetadata.description, 'Description copied!')}>
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
    </main>
  )
}

export default App
