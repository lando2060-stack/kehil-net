import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user announcements to learn from their style
    const announcements = await base44.entities.Announcement.list('-created_date', 50);

    // Build context from user's announcements
    const samples = announcements.slice(0, 10).map(a => ({
      title: a.title,
      textElements: a.text_elements?.map(el => ({
        role: 'title/subtitle/body',
        content: el.content,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        color: el.color,
        fontWeight: el.fontWeight,
      })) || [],
    })).filter(s => s.textElements.length > 0);

    // Create prompt that learns from user's style
    const prompt = `אתה מומחה בכתיבת מודעות דתיות בסגנון פרטי. 
    
כאן דוגמאות של מודעות שכתב משתמש זה - לאחר השקר מה סגנון הכתיבה, רמת הפורמליות, אורך הטקסט והנושאים:

${samples.length > 0 ? samples.map((s, i) => `דוגמה ${i + 1}:
כותרת: "${s.textElements.find(el => el.fontSize > 30)?.content || s.title}"
תוכן: "${s.textElements.find(el => el.fontSize < 25)?.content || ''}"
`).join('\n') : 'אין מודעות קודמות'}

כעת, כתוב נוסח חדש למודעה בדתות/בית כנסת בסגנון דומה לדוגמאות (או סגנון קלסי אם אין דוגמאות).
החזר תשובה בפורמט JSON עם שדות:
- title: כותרת קצרה וחזקה
- subtitle: כותרת משנה קטנה
- body: תוכן המודעה (1-3 שורות)

החזר רק את ה-JSON ללא טקסט נוסף.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['title', 'body'],
      },
    });

    // Build text elements with style from user's existing announcements
    const primaryAnnouncement = announcements.find(a => a.text_elements?.length > 0);
    const sampleColors = primaryAnnouncement?.text_elements?.map(el => el.color) || ['#1a365d', '#2c5282', '#4a5568'];
    
    const textElements = [
      {
        id: 'title',
        content: response.title || 'כותרת המודעה',
        x: 147,
        y: 120,
        width: 300,
        fontSize: 36,
        fontFamily: 'Frank Ruhl Libre',
        fontWeight: '700',
        color: sampleColors[0] || '#1a365d',
        textAlign: 'center',
        lineHeight: 1.3,
      },
      {
        id: 'subtitle',
        content: response.subtitle || 'כותרת משנה',
        x: 147,
        y: 200,
        width: 300,
        fontSize: 20,
        fontFamily: 'Heebo',
        fontWeight: '500',
        color: sampleColors[1] || '#2c5282',
        textAlign: 'center',
        lineHeight: 1.4,
      },
      {
        id: 'body',
        content: response.body || 'תוכן המודעה',
        x: 80,
        y: 300,
        width: 440,
        fontSize: 16,
        fontFamily: 'Heebo',
        fontWeight: '400',
        color: sampleColors[2] || '#4a5568',
        textAlign: 'center',
        lineHeight: 1.6,
      },
    ];

    return Response.json({
      title: response.title || 'מודעה חדשה',
      textElements,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});