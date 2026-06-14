import { getOpenAIConfig } from './openaiConfig.js'

function extractOutputText(data) {
  if (typeof data.output_text === 'string') {
    return data.output_text
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || '')
    .join('')
}

function parseJsonObject(text) {
  const trimmedText = text.trim()
  const jsonText = trimmedText.startsWith('{')
    ? trimmedText
    : trimmedText.match(/\{[\s\S]*\}/)?.[0]

  if (!jsonText) {
    throw new Error('No JSON object found in OpenAI response')
  }

  return JSON.parse(jsonText)
}

function normalizeTags(tags) {
  const tagText = Array.isArray(tags) ? tags.join(', ') : String(tags || '')
  const uniqueTags = tagText
    .split(',')
    .map((tag) => tag.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((tag, index, allTags) => allTags.indexOf(tag) === index)
  const limitedTags = []
  let currentLength = 0

  uniqueTags.forEach((tag) => {
    const nextLength = currentLength + tag.length + (limitedTags.length ? 2 : 0)
    if (nextLength <= 500) {
      limitedTags.push(tag)
      currentLength = nextLength
    }
  })

  return limitedTags.join(', ')
}

function removeAiReferences(value) {
  return String(value || '')
    .replace(/suno\s*ai/gi, '')
    .replace(/\bai[-\s]*(?:generated|music|song|track)?\b/gi, '')
    .replace(/AI\s*(?:음악|노래|생성|트랙)?/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,|])/g, '$1')
    .trim()
}

function validateRefinedMetadata(metadata) {
  const title = removeAiReferences(metadata.title)
  const description = removeAiReferences(metadata.description)
  const tags = removeAiReferences(normalizeTags(metadata.tags))

  if (!title || !description || !tags) {
    const error = new Error('OpenAI response did not include complete metadata')
    error.statusCode = 502
    error.code = 'INVALID_OPENAI_RESPONSE'
    throw error
  }

  return { title, description, tags }
}

function createRefinePrompt({ prompt, inputValues, metadata }) {
  return JSON.stringify({
    task: 'Rewrite YouTube metadata so it sounds natural, polished, and usable for a music video upload.',
    rules: [
      'Return JSON only with title, description, and tags.',
      'Do not mention AI, Suno AI, AI-generated, or any similar AI-production wording.',
      'Keep the title format: emoji + Korean video title + | + English video title.',
      'Keep the description structure close to the existing format, but rewrite awkward Korean and English naturally.',
      'Keep Featuring and Perfect For headings; bullet items must appear directly below each heading with no blank line.',
      'Tags must be comma-separated and the final tag string must be 500 characters or less including commas and spaces.',
      'Do not include markdown code fences.',
      'Do not invent a real artist name or copyrighted reference.',
    ],
    sourcePrompt: prompt,
    inputValues,
    draftMetadata: metadata,
  })
}

export async function refineMetadata(payload) {
  const { apiKey, endpoint, model } = getOpenAIConfig()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: 'You are a bilingual Korean-English YouTube music metadata editor. Rewrite awkward generated copy into natural, concise metadata.',
        },
        {
          role: 'user',
          content: createRefinePrompt(payload),
        },
      ],
    }),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.error?.message || 'OpenAI request failed')
    error.statusCode = response.status
    error.code = data.error?.code || 'OPENAI_API_ERROR'
    error.userMessage = '문장 검토에 실패했습니다. OpenAI API 설정을 확인해 주세요.'
    throw error
  }

  try {
    return validateRefinedMetadata(parseJsonObject(extractOutputText(data)))
  } catch (error) {
    error.statusCode = error.statusCode || 502
    error.code = error.code || 'INVALID_OPENAI_RESPONSE'
    error.userMessage = '재생성 결과를 해석하지 못했습니다. 다시 시도해 주세요.'
    throw error
  }
}
