const express = require('express')
const router = express.Router()

/**
 * POST /api/ai/analyze
 * Analyzes complaint text using Groq API (llama-3.3-70b-versatile).
 * Falls back to heuristics if GROQ_API_KEY is not set or API call fails.
 */
router.post('/analyze', async (req, res) => {
  const { text } = req.body || {}
  const input = String(text || '').trim()

  if (!input) {
    return res.status(400).json({ error: 'text is required' })
  }

  const GROQ_KEY = process.env.GROQ_API_KEY

  if (GROQ_KEY) {
    try {
      const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a smart complaint management AI. When given complaint text, respond ONLY with a valid JSON object (no markdown, no extra text) with exactly these keys:
{
  "priority": "High" | "Medium" | "Low",
  "department": "<short department name>",
  "summary": "<1-2 sentence summary>",
  "autoResponse": "<a polite, helpful message addressed to the citizen>"
}
Base priority on urgency: High = safety/emergency, Medium = important disruption, Low = minor inconvenience.`
          },
          { role: 'user', content: input }
        ],
        max_tokens: 400,
        temperature: 0.3
      }

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify(body)
      })

      const json = await resp.json()
      const textResp = json?.choices?.[0]?.message?.content || ''

      // Try direct JSON parse
      try {
        const parsed = JSON.parse(textResp)
        return res.json({ source: 'groq', result: parsed })
      } catch (_) {}

      // Try extracting JSON from code fences
      const codeMatch = textResp.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      if (codeMatch) {
        try {
          return res.json({ source: 'groq', result: JSON.parse(codeMatch[1]) })
        } catch (_) {}
      }

      // Try extracting bare { ... }
      const braceMatch = textResp.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        try {
          return res.json({ source: 'groq', result: JSON.parse(braceMatch[0]) })
        } catch (_) {}
      }

      // Groq responded but couldn't be parsed — use heuristics + show raw
      console.warn('Groq response could not be parsed as JSON:', textResp)
      return res.json({ source: 'groq_raw', raw: textResp, result: heuristic(input) })

    } catch (err) {
      console.error('Groq API call failed:', err)
      // Fall through to heuristics
    }
  }

  // Pure heuristic fallback
  return res.json({ source: 'heuristic', result: heuristic(input) })
})

/**
 * Heuristic analysis when AI is unavailable.
 */
function heuristic(input) {
  const lower = input.toLowerCase()

  // Priority
  let priority = 'Low'
  if (/leak|fire|electr|power|flood|sewage|collapse|danger|emergency|urgent/.test(lower)) priority = 'High'
  else if (/delay|not working|broken|damage|block|miss|slow|fail/.test(lower)) priority = 'Medium'

  // Department
  let department = 'General Administration'
  if (/water|leak|pipeline|pipe|tap/.test(lower))          department = 'Water Supply'
  else if (/electric|power|light|transformer|voltage/.test(lower)) department = 'Electricity'
  else if (/garbage|trash|waste|sanitation|sewage|drain/.test(lower)) department = 'Sanitation'
  else if (/road|pothole|traffic|street|bridge/.test(lower)) department = 'Roads & Infrastructure'
  else if (/police|crime|safety|theft|noise/.test(lower))   department = 'Public Safety'

  // Summary (first two sentences)
  const sentences = input.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
  const summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '')

  const autoResponse = `Dear citizen, thank you for registering your complaint. We have classified it as ${priority} priority and forwarded it to the ${department} department. Our team will review and address your concern at the earliest. We appreciate your patience.`

  return { priority, department, summary, autoResponse }
}

module.exports = router
