const REQUIRED_ENV_NAME = 'OPENAI_API_KEY'

export function getOpenAIConfig() {
  const apiKey = process.env[REQUIRED_ENV_NAME]

  if (!apiKey) {
    const error = new Error(`${REQUIRED_ENV_NAME} is not configured`)
    error.statusCode = 500
    error.code = 'CONFIG_MISSING'
    throw error
  }

  return {
    apiKey,
    endpoint: 'https://api.openai.com/v1/responses',
    model: process.env.OPENAI_MODEL || 'gpt-5.2',
  }
}
