export default async function handler(req, res) {
  const apiKey = process.env.KEEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير KEEY غير معرف في إعدادات Vercel!" 
    });
  }

  // إضافة محفز عشوائي فريد لمنع التكرار
  const randomSeed = Math.floor(Math.random() * 100000);

  const SYSTEM_PROMPT = `
أنت المحرك الأساسي لتوليد بيانات لعبة التخمين والاستنتاج الجماعية.
[معرف الجولة العشوائي: ${randomSeed}] - يمنع منعاً باتاً تكرار المواضيع السابقة! اخرج عن المألوف ابتكر مواضيع جديدة تماماً.

مهمتك هي إرجاع كائن JSON يحتوي على موضوع اللعبة وتلميح مبسط للجاسوس بناءً على الضوابط التالية:

1. التصنيف (category):
   - اختر تصنيفاً عشوائياً نادراً من بين أكثر من 14 تصنيفاً متنوعاً (أطعمة شعبية، أماكن غريبة، مواقف محرجة جداً، أمثال، أدوات قديمة/حديثة، مهن غير مألوفة، رياضات، أفعال غريبة، مصطلحات عامية، ألعاب وأفلام، شخصيات، وسائل نقل، موضة، مشاعر).

2. الموضوع (topic):
   - ابتكر موضوعاً جديداً كلياً (كلمة، جملة اسمية طويلة/قصيرة، أو جملة فعلية).
   - تنوع بين العامية الدارجة والكلمات الفصيحة الممتعة.

3. تلميح الجاسوس (spy_hint):
   - تلميح مجرد جداً وفي حدوده الأدنى (صفة مادية، خاصية جوهرية، أو مكون أساسي) دون شرح أو ذكر اسم الموضوع أو أجزاء منه.

4. نمط الجولة (mode):
   - 15% احتمال: "EMOJI_ONLY" (التلميح بإيموجي فقط).
   - 15% احتمال: "REVERSE_HINT" (التلميح بذكر صفة عكسية).
   - 70% احتمال: "NORMAL" (نمط عادي).

5. زر التخريب (has_sabotage):
   - قيمة بولينية (true / false)، بنسبة احتمال 25% أن تكون true.

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
          temperature: 1.0, // أعلى نسبة عشوائية وابتكار
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
