const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Send a prompt to Groq and return the text response.
 */
async function claudeChat(systemPrompt, userPrompt) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Groq request timed out after 30s')), 30000)
  );
  const request = client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  const completion = await Promise.race([request, timeout]);
  return completion.choices[0].message.content;
}

/**
 * Parse JSON out of the response, stripping markdown code fences if present.
 */
function parseClaudeJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { claudeChat, parseClaudeJSON };
