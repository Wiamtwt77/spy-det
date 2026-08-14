export default async function handler(req, res) {
  // منع التخزين المؤقت نهائياً لضمان عدم تكرار النتيجة
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // قراءة مفتاح Gemini المعتمد حديثاً
  const apiKey = process.env.GEMINI_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير GEMINI_KEY غير مضاف في Vercel!",
      solution: "اذهب إلى إعدادات Vercel -> Environment Variables وأضف GEMINI_KEY بمفتاحك الخاص ثم أعد الرفع (Redeploy)."
    });
  }

  // بذور عشوائية مع طابع زمني دقيق بالملي ثانية
  const randomSeed = Math.floor(Math.random() * 99999999);
  const now = new Date().getTime();

  const DYNAMIC_PROMPT = `
[Nonce: ${randomSeed}_${now}]
أنت المحرك لتوليد جولة جديدة في لعبة "برا السالفة".

مهمتك: اختر شيئاً مادياً ملموساً كلياً من العالم الواقعي بشكل عشوائي شاطح وغير متوقع.

الشروط:
1. topic: اسم شيء مادي ملموس فقط (مثل: أداة، لباس، أثاث، جهاز، طعام، قطعة في منزل، وسيلة نقل، أداة مطبخ، مادة ملموسة، إلخ). لا تقم بتوليد سيناريوهات أو قصة.
2. category: تصنيف مادي يناسب الشيء.
3. spy_hint: صفة أو كلمة واحدة مبهمة جداً تلمح للشيء دون كشفه.
4. mode: اختر عشوائياً ("NORMAL" بنسبة 70%، "EMOJI_ONLY" بنسبة 15%، "REVERSE_HINT" بنسبة 15%).
5. has_sabotage: قيمة بولينية عشوائية (true بنسبة 25%، وإلا false).

أرجِع النتيجة بتنسيق JSON حصراً بهذا الشكل:
{
  "category": "...",
  "topic": "...",
  "spy_hint": "...",
  "mode": "NORMAL",
  "has_sabotage": false
}
`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: DYNAMIC_PROMPT }] }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 1.0,
          topP: 0.95
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "فشل الاتصال بـ Gemini API", 
        details: data.error?.message || data 
      });
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();

    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const gameData = JSON.parse(rawText);
    return res.status(200).json(gameData);

  } catch (error) {
    return res.status(500).json({ 
      error: "خطأ معالجة في السيرفر", 
      message: error.message 
    });
  }
}
