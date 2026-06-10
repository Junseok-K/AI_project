import { searchYouTubeVideos } from './_lib/youtubeService.js'

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    sendJson(response, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: '지원하지 않는 요청 방식입니다.',
    })
    return
  }

  try {
    const result = await searchYouTubeVideos({
      query: request.query.query || '',
      dateFrom: request.query.dateFrom || '',
      dateTo: request.query.dateTo || '',
      order: request.query.order || 'relevance',
      maxResults: request.query.maxResults || '8',
      pageToken: request.query.pageToken || '',
      videoDuration: request.query.videoDuration || 'any',
      videoDefinition: request.query.videoDefinition || 'any',
      videoCaption: request.query.videoCaption || 'any',
      embeddable: request.query.embeddable || '',
      safeSearch: request.query.safeSearch || 'moderate',
      regionCode: request.query.regionCode || '',
      relevanceLanguage: request.query.relevanceLanguage || '',
      channelId: request.query.channelId || '',
      minViews: request.query.minViews || '',
      minLikes: request.query.minLikes || '',
      minSubscribers: request.query.minSubscribers || '',
    })

    sendJson(response, 200, result)
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.code || 'SERVER_ERROR',
      message: error.userMessage || 'YouTube 조회 중 오류가 발생했습니다.',
    })
  }
}
