const REQUIRED_ENV_NAME = 'YOUTUBE_API_KEY'

export function getYouTubeConfig() {
  const apiKey = process.env[REQUIRED_ENV_NAME]

  if (!apiKey) {
    const error = new Error(`${REQUIRED_ENV_NAME} is not configured`)
    error.statusCode = 500
    error.code = 'CONFIG_MISSING'
    throw error
  }

  return {
    apiKey,
    endpoint: 'https://www.googleapis.com/youtube/v3/search',
  }
}
