export default async function handler(req, res) {
  // 1. إجبار المتصفح و Vercel على عدم تخزين أي نتيجة مؤقتاً (No Caching)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير معرف في Vercel! يرجى إضافته في Environment Variables ثم عمل Redeploy." 
    });
  }

  // 2. مولد عشوائية فريد + الطابع الزمني لضمان تغير الـ Prompt في كل جولة
  const randomSeed = Math.floor(Math.random() * 1000000);
  const timestamp = new Date().toISOString();

  const SYSTEM_PROMPT = `
الوقت: ${timestamp}
معرف العشوائية: ${randomSeed}

أنت المحرك الأساسي لتوليد بيانات لعبة التخمين والاستنتاج (برا السالفة).

شروط وقواعد التوليد (اختر شيئاً مائة بالمائة عشوائي ومادي):
1. topic: يجب أن يكون شيئاً مادياً ملموساً تماماً (مثل: أداة، طعام، جهاز، أثاث، ملابس، مكان ملموس، مادة، إلخ). يمكنك اختيار أي شيء مادي يخطر ببالك بدون قوالب أو أمثلة.
2. category: تصنيف مادي مناسب (أجهزة، مطبخ، أطعمة، أثاث، وسائل نقل، إلخ).
3. spy_hint: كلمة واحدة أو صفة مجردة جداً تلمح للشيء دون كشفه.
4. mode: اختر عشوائياً بين ("NORMAL" بنسبة 70%، "EMOJI_ONLY" بنسبة 15%، "REVERSE_HINT" بنسبة 15%).
5. has_sabotage: true أو false عشوائياً (25% احتمال true).

يجب أن ترجع الاستجابة فقط بتنسيق JSON صحيح بهذا الشكل ودون أي نصوص إضافية:
{
  "category": "...",
  "topic": "...",
  "spy_hint": "...",
  "mode": "NORMAL",
  "has_sabotage": false
}
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.com",
        "X-Title": "Bra El Salfa Game"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // موديل مستقر وممتاز على OpenRouter
        messages: [
          { role: "user", content: SYSTEM_PROMPT }
        ],
        temperature: 1.2 // درجة عشوائية عالية
      })
    });

    const data = await response.json();

    // 3. في حال وجود خطأ في OpenRouter (مثل مفتاح خاطئ أو عدم وجود رصيد) إظهاره بوضوح
    if (!response.ok) {
      console.error("OpenRouter Response Error:", data);
      return res.status(response.status).json({ 
        error: "فشل طلب OpenRouter", 
        details: data.error || data 
      });
    }

    let rawContent = data.choices[0].message.content.trim();
    
    // تنظيف النتيجة إذا أرجعها الموديل داخل فواصل Markdown
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const aiOutput = JSON.parse(rawContent);
    return res.status(200).json(aiOutput);

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ 
      error: "فشل السيرفر في معالجة الاستجابة", 
      message: error.message 
    });
  }
}
