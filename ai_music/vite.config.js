import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import youtubeHandler from './api/youtube.js'

function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/youtube', async (request, response) => {
        const requestUrl = new URL(request.url || '', 'http://localhost')
        const query = Object.fromEntries(requestUrl.searchParams.entries())
        const apiResponse = {
          status(statusCode) {
            response.statusCode = statusCode
            return this
          },
          json(payload) {
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(payload))
          },
        }

        await youtubeHandler(
          {
            method: request.method,
            query,
          },
          apiResponse,
        )
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.YOUTUBE_API_KEY ||= env.YOUTUBE_API_KEY

  return {
    plugins: [react(), localApiPlugin()],
  }
})
