
import React, { useState } from 'react';
import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { SUBJECT_DISCIPLINES } from '../data/siteData';

interface RegistrationFormProps {
  onBackToLogin: () => void;
  onSuccessRegistration: (name: string, email: string) => void;
}

const grades = [
  'الصف الثالث الثانوي',
  'الصف الثاني الثانوي',
  'الصف الأول الثانوي',
  'المرحلة الإعدادية',
];

const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const validPhone = (value: string) =>
  /^[+0-9()\s-]{8,20}$/.test(value.trim());

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onBackToLogin,
  onSuccessRegistration,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState(grades[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : current.length < 12
          ? [...current, subject]
          : current,
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (
      !fullName.trim() ||
      !parentName.trim() ||
      !validEmail(email) ||
      !validEmail(parentEmail) ||
      !validPhone(studentPhone) ||
      !validPhone(parentPhone) ||
      !gradeLevel
    ) {
      setErrorMessage(
        'راجع البيانات المطلوبة: الاسم والبريد الإلكتروني ورقم الموبايل للطالب وولي الأمر.',
      );
      return;
    }

    if (email.trim().toLowerCase() === parentEmail.trim().toLowerCase()) {
      setErrorMessage('يجب إدخال بريد إلكتروني مختلف للطالب وولي الأمر.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          studentPhone: studentPhone.trim(),
          parentName: parentName.trim(),
          parentEmail: parentEmail.trim().toLowerCase(),
          parentPhone: parentPhone.trim(),
          gradeLevel,
          subjects: selectedSubjects,
          learningGoal: learningGoal.trim(),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;

      if (!response.ok || result?.ok !== true) {
        throw new Error(
          typeof result?.error === 'string'
            ? result.error
            : 'تعذر إرسال الطلب. تأكد من تشغيل خدمة التسجيل ثم حاول مرة أخرى.',
        );
      }

      setSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال الطلب.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-700 bg-[#08182B] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-300';

  const inputField = (
    id: string,
    label: string,
    value: string,
    setter: (value: string) => void,
    type: 'text' | 'email' | 'tel',
    placeholder: string,
  ) => (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label} *
      </label>
      <input
        id={id}
        className={fieldClass}
        type={type}
        required
        maxLength={type === 'email' ? 160 : 120}
        autoComplete={
          id === 'student-name' ? 'name' :
          id === 'student-email' ? 'email' :
          id === 'student-phone' ? 'tel' :
          id === 'parent-name' ? 'name' :
          id === 'parent-email' ? 'email' : 'tel'
        }
        value={value}
        onChange={(event) => setter(event.target.value)}
        placeholder={placeholder}
        dir={type === 'text' ? 'rtl' : 'ltr'}
      />
    </div>
  );

  return (
    <section className="w-full" dir="rtl">
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-5 text-sm font-medium text-emerald-300 hover:text-emerald-200"
      >
        العودة لتسجيل الدخول
      </button>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-emerald-300">
          <GraduationCap className="h-5 w-5" />
          <span className="text-xs font-semibold">طلب تسجيل جديد</span>
        </div>
        <h1 className="text-2xl font-black text-white">بيانات الطالب وولي الأمر</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          املأ بيانات الطالب وولي الأمر. سيصل الطلب إلى إدارة المركز للمراجعة،
          ولن يتم تفعيل الحسابات إلا بعد موافقة المدرس.
        </p>
      </div>

      {submitted ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-6"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="font-bold text-white">تم إرسال طلب التسجيل</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            طلبك قيد المراجعة. انتظر قرار إدارة المركز؛ إرسال الطلب لا يعني
            قبول التسجيل أو إنشاء الحسابات بعد.
          </p>
          <button
            type="button"
            onClick={() => onSuccessRegistration(fullName.trim(), email.trim())}
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200"
            >
              {errorMessage}
            </div>
          )}

          <fieldset className="space-y-4 rounded-xl border border-slate-700 p-4">
            <legend className="px-2 font-bold text-emerald-300">بيانات الطالب</legend>
            {inputField(
              'student-name', 'اسم الطالب', fullName, setFullName,
              'text', 'الاسم الكامل',
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {inputField(
                'student-email', 'البريد الإلكتروني للطالب', email, setEmail,
                'email', 'student@example.com',
              )}
              {inputField(
                'student-phone', 'رقم موبايل الطالب', studentPhone, setStudentPhone,
                'tel', '+20xxxxxxxxxx',
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="registration-grade">
                الصف الدراسي *
              </label>
              <select
                id="registration-grade"
                className={fieldClass}
                required
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-slate-700 p-4">
            <legend className="px-2 font-bold text-emerald-300">بيانات ولي الأمر</legend>
            {inputField(
              'parent-name', 'اسم ولي الأمر', parentName, setParentName,
              'text', 'الاسم الكامل لولي الأمر',
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {inputField(
                'parent-email', 'البريد الإلكتروني لولي الأمر', parentEmail, setParentEmail,
                'email', 'parent@example.com',
              )}
              {inputField(
                'parent-phone', 'رقم موبايل ولي الأمر', parentPhone, setParentPhone,
                'tel', '+20xxxxxxxxxx',
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>المواد المطلوبة (اختياري)</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SUBJECT_DISCIPLINES.map((subject) => {
                const selected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSubject(subject)}
                    className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-right text-sm ${
                      selected
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-700 bg-[#08182B] text-slate-300'
                    }`}
                  >
                    {subject}
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">يمكن اختيار 12 مادة كحد أقصى.</p>
          </fieldset>

          <div>
            <label className={labelClass} htmlFor="registration-goal">
              ملاحظة أو هدف دراسي (اختياري)
            </label>
            <textarea
              id="registration-goal"
              className={fieldClass}
              rows={3}
              maxLength={500}
              value={learningGoal}
              onChange={(event) => setLearningGoal(event.target.value)}
              placeholder="اكتب أي تفاصيل إضافية هنا"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسجيل'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            الطلب للمراجعة فقط. الحسابات والإشعارات لن تُفعّل قبل إعدادها في الخادم.
          </p>
        </form>
      )}
    </section>
  );
};
