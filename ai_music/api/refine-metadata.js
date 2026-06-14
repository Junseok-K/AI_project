import { refineMetadata } from './_lib/metadataRefineService.js'

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: '지원하지 않는 요청 방식입니다.',
    })
    return
  }

  try {
    const refinedMetadata = await refineMetadata(request.body || {})
    sendJson(response, 200, refinedMetadata)
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.code || 'SERVER_ERROR',
      message: error.userMessage || '문장 검토 중 오류가 발생했습니다.',
    })
  }
}
