
const GROQ_API_KEY = 'API_KEY';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function callGroq(messages, maxTokens = 1024) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  let text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');

  // Strip markdown fences
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Extract JSON object
  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Could not parse response. Please try again.');
  }
}

export async function analyzeIngredientsAndGetRecipes(base64Image, mimeType = 'image/jpeg') {
  const prompt = `You are a professional chef. Analyze this food photo carefully.

Return ONLY raw JSON, no markdown, no explanation:
{
  "ingredients": ["egg", "tomato"],
  "recipes": [
    {
      "id": "1",
      "title": "Recipe Name",
      "emoji": "🍳",
      "difficulty": "Easy",
      "time": "20 min",
      "description": "One sentence description."
    }
  ]
}

Create exactly 6 diverse recipe ideas. difficulty = Easy, Medium, or Hard. Raw JSON only.`;

  return callGroq([{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      { type: 'text', text: prompt },
    ],
  }]);
}

export async function getFullRecipe(title, ingredients) {
  const prompt = `You are a professional chef. Write a complete recipe for "${title}".
Available ingredients: ${ingredients.join(', ')}

Return ONLY raw JSON, no markdown, no explanation:
{
  "title": "${title}",
  "emoji": "🍽️",
  "servings": 2,
  "prepTime": "10 min",
  "cookTime": "20 min",
  "difficulty": "Easy",
  "description": "Short enticing description.",
  "ingredients": [
    { "amount": "2", "unit": "cups", "item": "flour" }
  ],
  "steps": [
    { "number": 1, "instruction": "Detailed step here." }
  ],
  "tips": ["Chef tip 1", "Chef tip 2"],
  "nutrition": {
    "calories": 350,
    "protein": "15g",
    "carbs": "40g",
    "fat": "12g"
  }
}

6-10 steps, 2-3 tips. Raw JSON only.`;

  return callGroq([{ role: 'user', content: prompt }], 2048);
}
