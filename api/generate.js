export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  let apiKey = process.env.OP_KEY || "";
  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير مضاف في Vercel!",
      details: "يرجى إضافة OP_KEY في Environment Variables على Vercel ثم عمل Redeploy."
    });
  }

  const randomSeed = Math.floor(Math.random() * 99999999);
  const now = new Date().getTime();

  const DYNAMIC_SYSTEM_PROMPT = `
[معرف العشوائية الفريد: ${randomSeed}_${now}]
أنت محرك اللعبة الفوضوي العبقري لـ "برا السالفة".

مهمتك: توليد موضوع جديد كلياً، متنوع للغاية، وغير متوقع بتاتاً.

قواعد تنوع المواضيع:
1. التصنيفات: اختر عشوائياً من بين أكثر من 14 تصنيفاً مختلفاً (أمثلة: طعام ووجبات، أدوات منزلية، أفعال وأنشطة اليومية، مصطلحات عامية مشهورة، أجهزة وتكنولوجيا، أماكن ومعالم، مواقف محرجّة، مقتنيات شخصية، حيوانات ومخلوقات، أمثال شعبية، دراما ومسلسلات، ألعاب ورياضة، مهن ووظائف، عادات وتقاليد).
2. صيغة الموضوع (topic): يمكن أن يكون كلمة واحدة، اسم، فعل، أو حتى جملة اسمية أو فعلية كاملة (مثال: "شاهي جمر"، "التسليك في عزيمة"، "يركض ورا الباص"، "شاحن متنقل"، "طاولة كوتشينة").
3. لغة الموضوع: متنوعة بين العامية الخليجية/الدارجة وبين الفصحى البسيطة المفهمومة.

بيانات الجاسوس واللعبة:
1. category: التصنيف العام للموضوع.
2. topic: الموضوع الأساسي للسالفة.
3. spy_hint: تلميح ذكي وبعيد جداً يساعد الجاسوس على الحوم حول المعنى دون كشف السالفة (كلمة أو صفة مجردة).
4. rule: اختر عشوائياً بين نصوص القواعد الحصرية فقط: ("NONE" بنسبة 60%، "EMOJI_ONLY" بنسبة 20%، "REVERSE_HINT" بنسبة 20%).
5. has_eggplant_button: Boolean عشوائي (true بنسبة 20% فقط، وإلا false).

يجب ألا ترجع أي نص أو شروحات إضافية، فقط كائن JSON خالص بالصيغة التالية:
{
  "category": "...",
  "topic": "...",
  "spy_hint": "...",
  "rule": "NONE",
  "has_eggplant_button": false
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
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "أنت نظام إخراج JSON فقط." },
          { role: "user", content: DYNAMIC_SYSTEM_PROMPT }
        ],
        temperature: 1.25
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "فشل الاتصال بـ OpenRouter", 
        details: data.error?.message || data.error || data 
      });
    }

    let rawText = data.choices[0].message.content.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const gameData = JSON.parse(rawText);
    return res.status(200).json(gameData);

  } catch (error) {
    return res.status(500).json({ 
      error: "حدث خطأ في معالجة السيرفر", 
      message: error.message 
    });
  }
}
