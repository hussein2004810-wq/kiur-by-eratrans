# دليل دمج واجهة Google Stitch داخل منصة KIUR الطبية 🩺🎨✨

تم تجهيز البنية التحتية لمنصة **KIUR** بالكامل لاستقبال تصاميم ومكونات **Google Stitch** وتفعيلها كواجهة أساسية ورئيسية، مع الاستغناء التدريجي عن الواجهة القديمة دون المساس بسلامة الـ Backend وقواعد البيانات والامتحانات السريرية.

---

## 📁 هيكلية مجلد Google Stitch (`src/stitch/`):

- **`StitchContext.tsx`**: المزود المركزي للبيانات (Context & Hook `useStitch()`) الذي يربط أي مكون تصممه في ستيج بكل بيانات المنصة (المستخدم، المواد، الاختبارات، النتائج، المراجعة الذكية، الإشعارات) تلقائياً.
- **`stitch.css`**: ملف التنسيقات والمتغيرات التصميمية (`--stitch-*`) المخصص لاستقبال أكواد CSS و Tailwind ومحددات ستيج.
- **`StitchApp.tsx`**: الهيكل الرئيسي الموحد للواجهة (Application Shell) الذي يدير الصفحات والتنقل.
- **`components/`**: المجلد المخصص لاستقبال مكوناتك المصدرة من Google Stitch:
  - `StitchSidebar.tsx`: الشريط الجانبي الذكي.
  - `StitchTopbar.tsx`: شريط التنقل العلوي والبحث العام `⌘K` والثيم النهاري/الليلي.
  - `StitchHero.tsx`: بطاقة الترحيب والبيانات الأكاديمية والسريرية للطالب.

---

## 🚀 كيفية لصق تصميم Google Stitch الجديد:

### 1. إذا كان التصدير عبارة عن كود CSS أو Design Tokens:
قم بلصقه مباشرة داخل [`src/stitch/stitch.css`](./stitch.css). ستجد المتغيرات جاهزة لاستقبال الألوان والخطوط والحواف:
```css
:root {
  --stitch-primary: #...;       /* لون البراند الأساسي */
  --stitch-secondary: #...;     /* اللون الثانوي */
  --stitch-accent: #...;        /* لون التمييز الطبي */
  --stitch-bg: #...;            /* خلفية المنصة */
  --stitch-bg-surface: #...;    /* خلفية البطاقات */
}
```

### 2. إذا كان التصدير عبارة عن مكونات React / JSX:
ضع المكون داخل [`src/stitch/components/`](./components/)، واستدعِ البيانات بنقرة واحدة عبر الـ Hook الجاهز:
```tsx
import { useStitch } from '../StitchContext';

export function MyStitchComponent() {
  const { user, tests, startExam, history, openSmartReview } = useStitch();

  return (
    <div className="my-stitch-card">
      <h3>مرحباً، {user.name}</h3>
      <p>عدد الاختبارات المتاحة: {tests.length}</p>
      <button onClick={() => startExam(tests[0].id)}>ابدأ الاختبار</button>
    </div>
  );
}
```

---

## 🔄 التبديل والاعتماد الأساسي (Primary Switch):

المنصة أصبحت مهيأة ومفصولة تماماً، وتستطيع الآن استبدال أي جزء دون أي خطأ في الـ Build أو اختبارات الأمان.
