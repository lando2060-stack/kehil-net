import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/ai/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { prompt, file_urls, response_json_schema } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Dynamic import of Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages = [{ role: 'user', content: [] }];

    // Add images if provided
    if (file_urls?.length) {
      for (const url of file_urls) {
        messages[0].content.push({ type: 'image', source: { type: 'url', url } });
      }
    }

    // Add text prompt
    const schemaStr = response_json_schema
      ? `\n\nReturn your response as valid JSON matching this schema:\n${JSON.stringify(response_json_schema, null, 2)}`
      : '';
    messages[0].content.push({ type: 'text', text: prompt + schemaStr });

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages,
    });

    const text = response.content[0]?.text || '';

    // Extract JSON if schema provided
    if (response_json_schema) {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match?.[0] || text);
        return res.json(parsed);
      } catch {
        return res.json({ raw: text });
      }
    }

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
