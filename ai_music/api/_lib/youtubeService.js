import { getYouTubeConfig } from './youtubeConfig.js'

const ORDER_VALUES = new Set(['relevance', 'date', 'viewCount'])

function clampMaxResults(value) {
  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return 10
  }

  return Math.min(Math.max(parsedValue, 1), 50)
}

function parseYouTubeError(data, statusCode) {
  const reason = data?.error?.errors?.[0]?.reason || data?.error?.status || 'UNKNOWN'
  const message = data?.error?.message || 'YouTube API request failed'
  const error = new Error(message)
  error.statusCode = statusCode

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    error.code = 'QUOTA_EXCEEDED'
    error.userMessage = 'YouTube API 할당량이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
    return error
  }

  if (statusCode === 403) {
    error.code = 'ACCESS_DENIED'
    error.userMessage = 'YouTube API 접근 권한을 확인해 주세요.'
    return error
  }

  error.code = 'YOUTUBE_API_ERROR'
  error.userMessage = 'YouTube 영상을 불러오지 못했습니다. 조건을 바꿔 다시 시도해 주세요.'
  return error
}

export async function searchYouTubeVideos({ query, order = 'relevance', maxResults = 10 }) {
  const normalizedQuery = query.trim()
  const normalizedOrder = ORDER_VALUES.has(order) ? order : 'relevance'
  const normalizedMaxResults = clampMaxResults(maxResults)

  if (!normalizedQuery) {
    const error = new Error('Search query is required')
    error.statusCode = 400
    error.code = 'QUERY_REQUIRED'
    error.userMessage = '검색어를 입력해 주세요.'
    throw error
  }

  const { apiKey, endpoint } = getYouTubeConfig()
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: normalizedQuery,
    order: normalizedOrder,
    maxResults: String(normalizedMaxResults),
    key: apiKey,
  })

  const response = await fetch(`${endpoint}?${params}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw parseYouTubeError(data, response.status)
  }

  return {
    items: (data.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        '',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    })),
  }
}
