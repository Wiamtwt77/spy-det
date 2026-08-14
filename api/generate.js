export default async function handler(req, res) {
  // قراءة مفتاح OpenRouter المسجل باسم OP_KEY في Vercel
  const apiKey = process.env.OP_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "المتغير OP_KEY غير معرف في إعدادات Vercel Environment Variables!" 
    });
  }

  // مولد عشوائية فريد لمنع الذاكرة المؤقتة (Cache)
  const randomSeed = Math.floor(Math.random() * 1000000);

  const SYSTEM_PROMPT = `
أنت المحرك الأساسي لتوليد بيانات لعبة التخمين والاستنتاج (برا السالفة).
[معرف العشوائية: ${randomSeed}]

شروط وقواعد حازمة للتوليد (تجنب القوالب والتكرار نهائياً):

1. طبيعة الموضوع (topic):
   - يجب أن يكون الموضوع شيئاً مادياً ملموساً تقريباً (أشياء نراها، نلمسها، نستخدمها، نأكلها، نرتديها، أو نتواجد فيها في حياتنا اليومية).
   - الموضوع يمكن أن يكون أي شيء مادي في هذا العالم دون التزام بأي قالب أو صيغة محددة (اسم أداة، جهاز، طعام، أثاث، مكان ملموس، ملابس، إلخ).
   - يمنع منعاً باتاً كتابة سيناريوهات طويلة أو قصص، ويكتفى فقط بالشيء المادي الملموس.
   - اشطح في اختيار الأشياء المادية المتنوعة والغريبة واليومية وبدون أي أمثلة مسبقة.

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

المطلوب: إرجاع كائن JSON فقط بالتنسيق التالي:
{
  "category": "اسم التصنيف المادي",
  "topic": "الشيء المادي الملموس",
  "spy_hint": "تلميح الجاسوس المبسط",
  "mode": "NORMAL" | "EMOJI_ONLY" | "REVERSE_HINT",
  "has_sabotage": true | false
}
`;

  try {
    // الاتصال برابط OpenRouter المخصص
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.com",
        "X-Title": "Bra El Salfa Game"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // موديل سريع ومجاني/رخيص ممتازة كفاءته على OpenRouter
        messages: [
          { role: "system", content: SYSTEM_PROMPT }
        ],
        response_format: { type: "json_object" },
        temperature: 1.0
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "فشل الاتصال بـ OpenRouter API");
    }

    // استخراج النتيجة بصيغة OpenRouter
    const aiOutput = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(aiOutput);

  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return res.status(500).json({ error: error.message || "حدث خطأ أثناء توليد الموضوع" });
  }
}
