import { getYouTubeConfig } from './youtubeConfig.js'

const ORDER_VALUES = new Set(['relevance', 'date', 'viewCount', 'likeCount', 'subscriberCount'])
const YOUTUBE_SEARCH_ORDER_VALUES = new Set(['relevance', 'date', 'viewCount'])

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

function parseDateInput(value, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return null
  }

  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'
  const date = new Date(`${value}${suffix}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function toNumber(value) {
  const number = Number(value)
  return Number.isNaN(number) ? 0 : number
}

function sortVideos(items, order) {
  if (order === 'date') {
    return [...items].sort((firstItem, secondItem) => new Date(secondItem.publishedAt) - new Date(firstItem.publishedAt))
  }

  if (order === 'viewCount') {
    return [...items].sort((firstItem, secondItem) => toNumber(secondItem.viewCount) - toNumber(firstItem.viewCount))
  }

  if (order === 'likeCount') {
    return [...items].sort((firstItem, secondItem) => toNumber(secondItem.likeCount) - toNumber(firstItem.likeCount))
  }

  if (order === 'subscriberCount') {
    return [...items].sort((firstItem, secondItem) => toNumber(secondItem.subscriberCount) - toNumber(firstItem.subscriberCount))
  }

  return items
}

export async function searchYouTubeVideos({
  query,
  order = 'relevance',
  maxResults = 10,
  dateFrom = '',
  dateTo = '',
  pageToken = '',
}) {
  const normalizedQuery = query.trim()
  const normalizedOrder = ORDER_VALUES.has(order) ? order : 'relevance'
  const youtubeSearchOrder = YOUTUBE_SEARCH_ORDER_VALUES.has(normalizedOrder) ? normalizedOrder : 'relevance'
  const normalizedMaxResults = clampMaxResults(maxResults)
  const publishedAfter = parseDateInput(dateFrom)
  const publishedBefore = parseDateInput(dateTo, true)

  if (!normalizedQuery) {
    const error = new Error('Search query is required')
    error.statusCode = 400
    error.code = 'QUERY_REQUIRED'
    error.userMessage = '검색어를 입력하세요.'
    throw error
  }

  const { apiKey, endpoint } = getYouTubeConfig()
  const youtubeApiBaseUrl = endpoint.replace(/\/search$/, '')
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: normalizedQuery,
    order: youtubeSearchOrder,
    maxResults: String(normalizedMaxResults),
    key: apiKey,
  })

  if (pageToken) {
    params.set('pageToken', pageToken)
  }

  if (publishedAfter) {
    params.set('publishedAfter', publishedAfter)
  }

  if (publishedBefore) {
    params.set('publishedBefore', publishedBefore)
  }

  const response = await fetch(`${endpoint}?${params}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw parseYouTubeError(data, response.status)
  }

  const searchItems = data.items || []
  const videoIds = searchItems.map((item) => item.id.videoId).filter(Boolean)
  const channelIds = [...new Set(searchItems.map((item) => item.snippet.channelId).filter(Boolean))]
  const [videoStatistics, channelStatistics] = await Promise.all([
    fetchVideoStatistics({ apiKey, baseUrl: youtubeApiBaseUrl, videoIds }),
    fetchChannelStatistics({ apiKey, baseUrl: youtubeApiBaseUrl, channelIds }),
  ])

  const items = searchItems.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url ||
      '',
    viewCount: videoStatistics.get(item.id.videoId)?.viewCount || null,
    likeCount: videoStatistics.get(item.id.videoId)?.likeCount || null,
    subscriberCount: channelStatistics.get(item.snippet.channelId)?.subscriberCount || null,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }))

  return {
    nextPageToken: data.nextPageToken || '',
    items: sortVideos(items, normalizedOrder),
  }
}

async function fetchVideoStatistics({ apiKey, baseUrl, videoIds }) {
  if (!videoIds.length) {
    return new Map()
  }

  const params = new URLSearchParams({
    part: 'statistics',
    id: videoIds.join(','),
    key: apiKey,
  })
  const response = await fetch(`${baseUrl}/videos?${params}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw parseYouTubeError(data, response.status)
  }

  return new Map(
    (data.items || []).map((item) => [
      item.id,
      {
        viewCount: item.statistics?.viewCount || null,
        likeCount: item.statistics?.likeCount || null,
      },
    ]),
  )
}

async function fetchChannelStatistics({ apiKey, baseUrl, channelIds }) {
  if (!channelIds.length) {
    return new Map()
  }

  const params = new URLSearchParams({
    part: 'statistics',
    id: channelIds.join(','),
    key: apiKey,
  })
  const response = await fetch(`${baseUrl}/channels?${params}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw parseYouTubeError(data, response.status)
  }

  return new Map(
    (data.items || []).map((item) => [
      item.id,
      {
        subscriberCount: item.statistics?.hiddenSubscriberCount
          ? null
          : item.statistics?.subscriberCount || null,
      },
    ]),
  )
}
