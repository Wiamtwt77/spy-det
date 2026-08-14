export default async function handler(req, res) {
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير معرف في إعدادات Vercel Environment Variables!" 
    });
  }

  // توليد رقم عشوائي فريد لكسر الذاكرة المؤقتة وضمان تنوع الاستجابة
  const randomSeed = Math.floor(Math.random() * 1000000);

  const SYSTEM_PROMPT = `
أنت المحرك الأساسي لتوليد بيانات لعبة التخمين والاستنتاج (برا السالفة).
[معرف العشوائية: ${randomSeed}]

شروط وقواعد حازمة للتوليد (تجنب القوالب والتكرار نهائياً):

1. طبيعة الموضوع (topic):
   - يجب أن يكون الموضوع شيئاً مادياً ملموساً تقريباً (أشياء نراها، نلمسها، نستخدمها، نأكلها، نرتديها، أو نتواجد فيها في حياتنا اليومية).
   - الموضوع يمكن أن يكون أي شيء مادي في هذا العالم دون التزام بأي قالب أو صيغة محددة (قد يكون اسم شيء، أداة، طعام، جهاز، عنصر، مكان ملموس، إلخ).
   - يمنع منعاً باتاً كتابة سيناريوهات طويلة أو قصص، ويكتفى فقط بالشيء المادي الملموس.
   - ابتعد تماماً عن النمطية والتكرار واشطح في اختيار الأشياء المادية.

2. التصنيف (category):
   - حدد تصنيفاً ملموساً مناسباً للشيء المادي (مثل: أجهزة، أدوات مطبخ، أطعمة ومشروبات، أثاث، ملابس وإكسسوارات، وسائل نقل، معالم وأماكن، إلخ).

3. تلميح الجاسوس (spy_hint):
   - كلمة واحدة أو صفة مجردة جداً تعبر عن عنصر أولي في الشيء دون شرحه أو كشف اسمه نهائياً.

4. نمط الجولة (mode):
   - "NORMAL" (بنسبة 70%).
   - "EMOJI_ONLY" (بنسبة 15%).
   - "REVERSE_HINT" (بنسبة 15%).

5. زر التخريب (has_sabotage):
   - قيمة بولينية (true / false) بنسبة عشوائية 25% للـ true.

المطلوب: إرجاع كائن JSON فقط بدون أي مقدمات أو شروحات إضافية بالتنسيق التالي:
{
  "category": "اسم التصنيف المادي",
  "topic": "الشيء المادي الملموس",
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
          temperature: 1.0, // أقصى درجة تنوع وعشوائية
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
