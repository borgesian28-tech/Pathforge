export const maxDuration = 60;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(request) {
  try {
    var body = await request.json();
    var messages = body.messages || [];
    var context = body.context || '';

    var apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'No key' }, { status: 500 });

    // Build Gemini conversation format
    var contents = [];

    // System context as first user message
    contents.push({
      role: 'user',
      parts: [{ text: 'SYSTEM CONTEXT (do not repeat this to the user):\n' + context + '\n\nNow respond to the student\'s questions as their AI career advisor. Be specific, actionable, and encouraging. Reference their actual school, major, and career path in your answers. Keep responses concise.' }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I\'m ready to help as their personalized career advisor.' }]
    });

    // Add conversation history
    for (var i = 0; i < messages.length; i++) {
      contents.push({
        role: messages[i].role === 'user' ? 'user' : 'model',
        parts: [{ text: messages[i].content }]
      });
    }

    var response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Chat API error:', response.status, errText);
      return Response.json({ reply: 'I\'m having trouble connecting right now. Please try again in a moment.' });
    }

    var data = await response.json();
    var reply = '';
    var candidates = data.candidates || [];
    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (var j = 0; j < candidates[0].content.parts.length; j++) {
        if (candidates[0].content.parts[j].text) {
          reply += candidates[0].content.parts[j].text;
        }
      }
    }

    return Response.json({ reply: reply || 'I couldn\'t generate a response. Please try rephrasing your question.' });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ reply: 'Something went wrong on my end. Please try again.' });
  }
}
