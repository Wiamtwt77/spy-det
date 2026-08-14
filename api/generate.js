export default async function handler(req, res) {
  // قراءة المتغير الجديد OP_KEY من إعدادات Vercel
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير معرف في إعدادات Vercel Environment Variables!" 
    });
  }

  // مولد عشوائية فريد لمنع تكرار المواضيع بين الجولات
  const randomSeed = Math.floor(Math.random() * 1000000);

  const SYSTEM_PROMPT = `
أنت المحرك الأساسي الذكي لتوليد بيانات لعبة التخمين والاستنتاج الجماعية (برا السالفة / كاشف ضد جاسوس).
[معرف الجولة الفريد: ${randomSeed}] - يمنع منعاً باتاً تكرار المواضيع أو التلميحات التقليدية. ابحث عن الأفكار الشاطحة والجديدة تماماً!

مهمتك هي إرجاع كائن JSON مصمم بدقة وفق الضوابط التالية:

1. التصنيف (category):
   - اختر تصنيفاً غنياً وعشوائياً (أمثلة: أماكن غريبة، مواقف محرجة، أطعمة شعبية، أمثال ومقولات، مهن غير مألوفة، أجهزة وأدوات، رياضات، أفعال يومية، ألعاب ومسلسلات، شخصيات، وسائل نقل، مشاعر، إلخ).

2. الموضوع (topic):
   - كلمة سرية، جملة اسمية (طويلة أو قصيرة)، أو مواقف وافصال محددة.
   - تنوع بين اللهجة العامية الدارجة والفصحى المبسطة.

3. تلميح الجاسوس (spy_hint):
   - تلميح مجرد وفي حده الأدنى جداً؛ يعبر عن خاصية جوهرية، مكون أساسي، أو فكرة أولية.
   - يمنع منعاً باتاً ذكر اسم الموضوع أو أجزاء مباشرة منه.
   - الهدف: إعطاء مؤشر بسيط جداً للجاسوس يساعده على عدم الانكشاف فوراً.

4. نمط الجولة (mode):
   - 15% احتمال: "EMOJI_ONLY" (التلميح بالإيموجي فقط).
   - 15% احتمال: "REVERSE_HINT" (التلميح بذكر صفة عكسية ليست فيه).
   - 70% احتمال: "NORMAL" (نمط عالي الطبيعية).

5. زر التخريب (has_sabotage):
   - قيمة بولينية (true / false)، بنسبة 25% أن تكون true لتنشيط قوة التخريب اليدوي.

المطلوب: قم بإرجاع النتيجة بصيغة JSON فقط بالتنسيق التالي:
{
  "category": "اسم التصنيف",
  "topic": "الموضوع أو الكلمة السرية",
  "spy_hint": "تلميح الجاسوس المبسط",
  "mode": "NORMAL" | "EMOJI_ONLY" | "REVERSE_HINT",
  "has_sabotage": true | false
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT }] }],
        generationConfig: { 
          response_mime_type: "application/json",
          temperature: 1.0, // أقصى درجات الابتكار والعشوائية
          topP: 0.95
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "فشل الاتصال بـ API الذكاء الاصطناعي");
    }

    const aiOutput = JSON.parse(data.candidates[0].content.parts[0].text);
    return res.status(200).json(aiOutput);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ error: error.message || "حدث خطأ أثناء توليد الموضوع" });
  }
}
