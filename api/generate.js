export default async function handler(req, res) {
  // قراءة المتغير KEEY المسجل في إعدادات Vercel
  const apiKey = process.env.KEEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير KEEY غير معرف في إعدادات Vercel Environment Variables!" 
    });
  }

  const SYSTEM_PROMPT = `
أنت المحرك الأساسي لتوليد بيانات لعبة التخمين والاستنتاج الجماعية.
مهمتك هي إرجاع كائن JSON يحتوي على موضوع اللعبة وتلميح مبسط للجاسوس بناءً على الضوابط التالية:

1. التصنيف (category):
   - اختر تصنيفاً عشوائياً من بين أكثر من 14 تصنيفاً متنوعاً (أطعمة، أماكن، مواقف، أمثال، أدوات، مهن، رياضة، أفعال، مصطلحات عامية، ألعاب وأفلام، شخصيات، وسائل نقل، موضة، مشاعر، إلخ).

2. الموضوع (topic):
   - يمكن أن يكون كلمة واحدة، جملة اسمية (طويلة أو قصيرة)، أو جملة فعلية.
   - يتنوع بين العامية الدارجة والفصحى المبسطة.

3. تلميح الجاسوس (spy_hint):
   - يجب أن يكون التلميح في حدوده الأدنى جداً؛ يعبر عن خاصية جوهرية، مكون أساسي، صفة مجردة، أو عنصر أولي مرتبط بالموضوع.
   - يمكن أن يكون كلمة واحدة، صفة، أو كلمات منفصلة.
   - الهدف: إعطاء قاعدة بسيطة جداً لا تشرح الموضوع ولا تصفه بالتفصيل، بل تعطي مؤشراً أولياً فقط.
   - يمنع منعاً باتاً ذكر اسم الموضوع أو أجزاء مباشرة منه.

4. نمط الجولة (mode):
   - هناك احتمال 15% أن يكون النمط: "EMOJI_ONLY" (التلميح بإيموجي فقط).
   - هناك احتمال 15% أن يكون النمط: "REVERSE_HINT" (التلميح بذكر صفة ليست موجودة في الشيء).
   - 70% أن يكون النمط عادياً: "NORMAL".

5. زر التخريب (has_sabotage):
   - قيمة بولينية (true / false)، حيث توجد نسبة 20% فقط أن تكون القيمة true.

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
        generationConfig: { response_mime_type: "application/json" }
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
