export default async function handler(req, res) {
  // منع الكاش نهائياً
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // قراءة مفتاح Gemini من المتغير OP_KEY
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير مضاف في Vercel!",
      details: "يرجى إضافة OP_KEY في Environment Variables على Vercel ثم إعادة الرفع (Redeploy)."
    });
  }

  // بذور عشوائية لكسر التكرار
  const randomSeed = Math.floor(Math.random() * 99999999);
  const timestamp = new Date().getTime();

  const DYNAMIC_PROMPT = `
[RandomSeed: ${randomSeed}_${timestamp}]
أنت محرك توليد المواضيع للعبة "برا السالفة".

اختر موضوعاً مادياً ملموساً كلياً وعشوائياً من الحياة الواقعية (أداة، جهاز، قطعة أثاث، طعام، لباس، أداة مطبخ، إلخ).

الشروط:
1. topic: اسم الشيء المادي الملموس فقط (كلمة أو كلمتين).
2. category: تصنيف مادي مناسب لـ topic.
3. spy_hint: صفة أو كلمة واحدة مبهمة تلمح للشيء دون كشفه.
4. mode: اختر عشوائياً ("NORMAL" بنسبة 70%، "EMOJI_ONLY" بنسبة 15%، "REVERSE_HINT" بنسبة 15%).
5. has_sabotage: boolean عشوائي (true أو false).

أرجِع النتيجة بتنسيق JSON حصراً بدون أي شروحات أو Markdown:
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
        error: "خطأ في استجابة Gemini API", 
        details: data.error?.message || data 
      });
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();

    // تنظيف النتيجة إذا أُرجعت داخل أقواس Markdown
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const gameData = JSON.parse(rawText);
    return res.status(200).json(gameData);

  } catch (error) {
    return res.status(500).json({ 
      error: "خطأ معالجة السيرفر المحلي", 
      message: error.message 
    });
  }
}
