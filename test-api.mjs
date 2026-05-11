import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const key = env.match(/VITE_CLAUDE_API_KEY=(.+)/)?.[1]?.trim()

if (!key) { console.log('❌ API 키 없음'); process.exit(1) }
console.log('키 앞 20자:', key.slice(0, 20) + '...')

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: 50,
    messages: [{ role: 'user', content: '안녕' }]
  })
})

const text = await res.text()
console.log('HTTP 상태:', res.status)
console.log('응답:', text.slice(0, 300))
