export default async function handler(req, res) {
  // 1. إجبار Vercel والمتصفح على عدم تخزين الاستجابة مؤقتاً نهائياً (No Caching)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 2. قراءة مفتاح Gemini من المتغير OP_KEY
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير معرف في Vercel! يرجى إضافته في Environment Variables ثم عمل Redeploy." 
    });
  }

  // 3. مولد عشوائية فريد + طابع زمني دقيق لضمان كسر الذاكرة وتنوع النتائج 100%
  const randomSeed = Math.floor(Math.random() * 100000000);
  const timestamp = new Date().toISOString();

  const SYSTEM_PROMPT = `
[معرف العشوائية الفريد: ${randomSeed}]
[الطابع الزمني: ${timestamp}]

أنت المحرك الذكي المباشر لتوليد جولات لعبة "برا السالفة" الجماعية.
مهمتك: توليد جولة جديدة تماماً وبشكل عشوائي -حرفياً ورياضياً- وبدون السير على أي قالب أو نمط مكرر نهائياً!

قواعد التوليد العشوائي المطلق:

1. topic (الموضوع):
   - يجب أن يكون شيئاً مادياً ملموساً تماماً من عالمنا (أداة، أثاث، جهاز، طعام، لباس، أداة غريبة، وسيلة نقل، أداة مطبخ، قطعة في المنزل، إلخ).
   - اختر الموضوع بعشوائية شاطحة وقمّة في التنوع والتفرد، ويمنع تماماً كتابة أي قصص أو سيناريوهات (اسم الشيء فقط).

2. category (التصنيف):
   - حدد التصنيف المادي المناسب للشيء المادي المختار.

3. spy_hint (تلميح الجاسوس):
   - كلمة واحدة أو صفة مجردة جداً تلمح للشيء المادي دون كشف اسمه.

4. mode (نمط الجولة):
   - اختر عشوائياً كلياً إحدى القيم التالية: ("NORMAL" بنسبة 70%، "EMOJI_ONLY" بنسبة 15%، "REVERSE_HINT" بنسبة 15%).

5. has_sabotage (زر التخريب):
   - قيمة بولينية عشوائية تماماً (true أو false).

المطلوب: إرجاع كائن JSON فقط بدون أي نصوص أو شروحات إضافية، بالصيغة التالية:
{
  "category": "اسم التصنيف المادي",
  "topic": "الشيء المادي",
  "spy_hint": "تلميح الجاسوس",
  "mode": "NORMAL",
  "has_sabotage": true
}
`;

  try {
    // الاتصال برابط Google Gemini 1.5 Flash المباشر بواسطة مفتاح OP_KEY
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT }] }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 1.0, // أقصى درجة عشوائية وابتكار مسموح بها في Gemini API
          topP: 0.95
        }
      })
    });

    const data = await response.json();

    // في حال وجود خطأ في المفتاح أو الخدمة
    if (!response.ok) {
      console.error("Gemini API Error Response:", data);
      return res.status(response.status).json({ 
        error: "فشل طلب Gemini API", 
        details: data.error?.message || data 
      });
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();

    // تنظيف النص إذا تم إرجاعه داخل markdown
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const aiOutput = JSON.parse(rawText);
    return res.status(200).json(aiOutput);

  } catch (error) {
    console.error("Gemini Backend Handler Error:", error);
    return res.status(500).json({ 
      error: "حدث خطأ أثناء معالجة استجابة الذكاء الاصطناعي", 
      message: error.message 
    });
  }
}
