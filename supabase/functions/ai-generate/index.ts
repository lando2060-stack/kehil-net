import Anthropic from 'npm:@anthropic-ai/sdk@0.27.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, file_urls, response_json_schema } = await req.json();

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const content: Anthropic.ContentBlockParam[] = [];

    // Add images if provided
    if (file_urls?.length) {
      for (const url of file_urls) {
        content.push({ type: 'image', source: { type: 'url', url } });
      }
    }

    const schemaStr = response_json_schema
      ? `\n\nReturn ONLY valid JSON matching this schema:\n${JSON.stringify(response_json_schema, null, 2)}`
      : '';

    content.push({ type: 'text', text: prompt + schemaStr });

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    if (response_json_schema) {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match?.[0] ?? text);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ raw: text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
