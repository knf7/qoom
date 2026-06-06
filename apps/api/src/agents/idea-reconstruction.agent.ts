import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';

export interface IdeaReconstructionResult {
  status: 'READY' | 'FAIL';
  parsed_idea: {
    problem: string;
    solution: string;
    target_user: string;
    mvp: string;
    revenue_model: string;
    competition: string;
  };
  reconstructed_description: string;
  original_input?: string;
  clarityScore?: number;
  reasoning?: string;
  notes?: string[];
  nextStep?: string;
}

const IRA_SYSTEM_PROMPT = `أنت محلل أفكار ريادية ذكي (QOOM Contextual Intelligence Engine).
مهمتك هي قراءة النص المدخل من المستخدم وفهمه بعمق لاستخراج النية والهدف، وليس مجرد البحث عن كلمات مفتاحية معينة أو فرض صيغ صلبة.

اقرأ النص كاملاً قبل الحكم واستخرج المعنى الضمني بمرونة.

قواعد تحديد حالة وضوح الفكرة:
- إذا النص يصف منتجاً أو خدمة أو فكرة ريادية/استثمارية مفهومة حتى لو باختصار شديد (مثلاً: "منصة ذكاء استثماري بـ 5 وكلاء ذكاء اصطناعي") -> تعتبر الفكرة CLEAR ويجب أن تكون درجة الوضوح (clarityScore) بين 50 و 100 بناءً على اكتمال التفاصيل.
- إذا النص فارغ، لغة عشوائية (لوحة مفاتيح عشوائية)، أو يفتقر تماماً لأي نية تجارية/ريادية/تقنية -> تعتبر الفكرة UNCLEAR ودرجة الوضوح أقل من 50.

قواعد استخراج البيانات الجوهرية (كن مرناً جداً واستخلص المعنى في صلب الحقول):
1. المشكلة (problem): ما الاحتياج أو الألم؟ (مثال: "صعوبة تحليل الأفكار الاستثمارية وحاجة المستثمر لقرار سريع ودقيق")
2. الحل (solution): ما المنتج أو الخدمة؟ (مثال: "منصة ذكاء استثماري عربي بالذكاء الاصطناعي")
3. الجمهور المستهدف (target_user): من سيستخدمه؟ (مثال: "مستثمرون أفراد، رواد أعمال")
4. المنتج الأدنى (mvp): ما هي الميزة الأساسية المفترضة؟ (مثال: "تحليل فوري وتقييم للأفكار الاستثمارية")
5. نموذج الإيرادات (revenue_model): كيف يمكن للمشروع جني المال؟ (إذا لم يُذكر، افترض نموذجاً معقولاً مثل "اشتراك شهري" أو "رسوم على التحليل")
6. المنافسة (competition): من هم المنافسون أو البدائل؟ (إذا لم يُذكر، افترض بدائل تقليدية مثل "المكاتب الاستشارية التقليدية" أو "أدوات التحليل اليدوية")

يجب أيضاً توفير:
- درجة الوضوح (clarityScore): رقم من 0 إلى 100.
- التفسير (reasoning): تفسير موجز باللغة العربية يشرح لماذا الفكرة واضحة أو ما الذي ينقصها لتصبح واضحة.
- ملاحظات تحسين (notes): قائمة (مصفوفة نصوص) بملاحظات عملية ومباشرة يمكن للمستخدم إضافتها لتطوير فكرته.
- الخطوة التالية (nextStep): خطوة تالية عملية ومباشرة باللغة العربية (مثال: "تحديد واجهة الاستخدام ومصادر البيانات الأساسية").

يجب أن ترجع المخرجات دائماً بصيغة JSON صالحة ومطابقة للهيكل التالي فقط (دون أي نصوص إضافية خارج الـ JSON):
{
  "status": "CLEAR" | "UNCLEAR",
  "clarityScore": number,
  "reasoning": "التفسير باللغة العربية",
  "notes": ["ملاحظة 1", "ملاحظة 2"],
  "nextStep": "الخطوة العملية القادمة باللغة العربية",
  "parsed_idea": {
    "problem": "المشكلة المستخرجة باللغة العربية",
    "solution": "الحل الموصوف باللغة العربية",
    "target_user": "الجمهور المستهدف باللغة العربية",
    "mvp": "المنتج الأدنى المستخلص باللغة العربية",
    "revenue_model": "نموذج الإيرادات المفترض أو المستخلص باللغة العربية",
    "competition": "المنافسون المفترضون أو المستخلصون باللغة العربية"
  },
  "reconstructed_description": "A clean, neutral English translation and synthesis of the startup idea and its value proposition based on the extracted fields."
}`;

@Injectable()
export class IdeaReconstructionAgent {
  private readonly logger = new Logger(IdeaReconstructionAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  async reconstruct(rawIdea: string): Promise<IdeaReconstructionResult> {
    this.logger.log(`[IRA] Reconstructing idea: "${rawIdea.substring(0, 60)}..."`);

    const prompt = `Analyze and reconstruct this startup idea from the founder's raw input:

"${rawIdea}"

Apply the IRA protocol. If the idea contains Arabic text, understand and reconstruct it.
Output ONLY valid JSON.`;

    try {
      const result = await this.gemini.queryModel(IRA_SYSTEM_PROMPT, prompt, 2, undefined, 'FLASH');

      // Clean JSON from markdown if wrapped
      const cleaned = result.replace(/^```[a-z]*\n?/im, '').replace(/\n?```$/im, '').trim();
      const parsed = JSON.parse(cleaned) as any;
      
      // Normalize status and output schema for pipeline compatibility
      let normalizedStatus: 'READY' | 'FAIL' = 'FAIL';
      if (parsed.status === 'READY' || parsed.status === 'CLEAR') {
        normalizedStatus = 'READY';
      }

      const normalizedResult: IdeaReconstructionResult = {
        status: normalizedStatus,
        parsed_idea: {
          problem: parsed.parsed_idea?.problem || parsed.problem || 'غير محدد',
          solution: parsed.parsed_idea?.solution || parsed.solution || rawIdea,
          target_user: parsed.parsed_idea?.target_user || parsed.parsed_idea?.target || parsed.target_user || parsed.target || 'غير محدد',
          mvp: parsed.parsed_idea?.mvp || parsed.mvp || 'غير محدد',
          revenue_model: parsed.parsed_idea?.revenue_model || parsed.revenue_model || 'اشتراك شهري',
          competition: parsed.parsed_idea?.competition || parsed.competition || 'بدائل تقليدية',
        },
        reconstructed_description: parsed.reconstructed_description || parsed.description || rawIdea,
        original_input: rawIdea,
        clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : (parsed.status === 'CLEAR' ? 70 : 30),
        reasoning: parsed.reasoning || 'تم معالجة الفكرة بنجاح.',
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        nextStep: parsed.nextStep || 'يرجى متابعة العمل على الفكرة وإضافة تفاصيل أكثر.',
      };

      this.logger.log(`[IRA] Reconstruction complete. Status: ${normalizedResult.status}, Clarity: ${normalizedResult.clarityScore}%`);
      return normalizedResult;
    } catch (err: any) {
      this.logger.error(`[IRA] Reconstruction failed: ${err.message}`);
      // Graceful fallback — treat as-is
      return {
        status: 'FAIL',
        parsed_idea: {
          problem: 'Unknown',
          solution: rawIdea,
          target_user: 'Unknown',
          mvp: 'Unknown',
          revenue_model: 'Unknown',
          competition: 'Unknown'
        },
        original_input: rawIdea,
        reconstructed_description: rawIdea,
        clarityScore: 0,
        reasoning: `فشل نظام التحليل الذاتي: ${err.message}`,
        notes: ['حدث خطأ تقني أثناء محاولة قراءة وتفكيك الفكرة.'],
        nextStep: 'يرجى مراجعة صياغة الفكرة وإعادة المحاولة.',
      };
    }
  }
}
