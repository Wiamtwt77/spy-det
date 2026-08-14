export default async function handler(req, res) {
  // 1. منع التخزين المؤقت بالكامل
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 2. قراءة مفتاح OpenRouter من المتغير OP_KEY
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير مضاف في Vercel!",
      details: "يرجى الانتقال إلى Settings -> Environment Variables وإضافة OP_KEY بداخلها ثم إعادة الرفع (Redeploy)."
    });
  }

  // 3. كسر الذاكرة وتوليد بذور عشوائية فريدة لكل جولة
  const randomSeed = Math.floor(Math.random() * 99999999);
  const now = new Date().getTime();

  const DYNAMIC_SYSTEM_PROMPT = `
[معرف العشوائية الفريد: ${randomSeed}_${now}]
أنت المحرك التوليدي للعبة "برا السالفة" الجماعية.

مهمتك: توليد موضوع مادي ملموس جداً من الحياة الواقعية بشكل عشوائي تماماً وغير متكرر نهائياً.

الشروط والصياغة:
1. topic: اسم الشيء المادي الملموس فقط (مثل: أداة، لباس، أثاث، جهاز، طعام، وسيلة نقل، أداة مطبخ، إلخ) بدون قصص.
2. category: تصنيف مادي يصف هذا الشيء.
3. spy_hint: كلمة واحدة أو صفة مجردة جداً تلمح للشيء دون كشف اسمه.
4. mode: اختر عشوائياً بين ("NORMAL" بنسبة 70%، "EMOJI_ONLY" بنسبة 15%، "REVERSE_HINT" بنسبة 15%).
5. has_sabotage: قيمة بولينية عشوائية (true بنسبة 25%، وإلا false).

يجب ألا ترجع أي نص أو شروحات إضافية، فقط كائن JSON خالص بالصيغة التالية:
{
  "category": "...",
  "topic": "...",
  "spy_hint": "...",
  "mode": "NORMAL",
  "has_sabotage": false
}
`;

  try {
    // الاتصال بـ OpenRouter API باستخدام OP_KEY
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.com",
        "X-Title": "Bra El Salfa Game"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // موديل سريع للغاية ومستقر على OpenRouter
        messages: [
          { role: "system", content: "أنت نظام إخراج JSON فقط." },
          { role: "user", content: DYNAMIC_SYSTEM_PROMPT }
        ],
        temperature: 1.2
      })
    });

    const data = await response.json();

    // التعامل مع أخطاء OpenRouter (مثل انتهى الرصيد أو مفتاح خاطئ)
    if (!response.ok) {
      console.error("OpenRouter API Error:", data);
      return res.status(response.status).json({ 
        error: "فشل الاتصال بـ OpenRouter API", 
        details: data.error?.message || data.error || data 
      });
    }

    let rawText = data.choices[0].message.content.trim();

    // تنظيف استجابة Markdown إذا أرجعت داخل ```json
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const gameData = JSON.parse(rawText);
    return res.status(200).json(gameData);

  } catch (error) {
    console.error("Serverless Handler Error:", error);
    return res.status(500).json({ 
      error: "حدث خطأ في معالجة السيرفر", 
      message: error.message 
    });
  }
}
