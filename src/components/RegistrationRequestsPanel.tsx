import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { auth } from '../lib/firebase';

type RequestStatus = 'pending' | 'approved' | 'rejected';
interface RegistrationRequest {
  id: string;
  name?: string;
  email?: string;
  studentPhone?: string;
  parentPhone?: string;
  gradeLevel?: string;
  subjects?: string[];
  learningGoal?: string;
  status: RequestStatus;
  adminNote?: string;
  createdAt?: { seconds?: number; _seconds?: number } | string;
  createdStudentUid?: string;
}

const statusLabel: Record<RequestStatus, string> = {
  pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض',
};
const dateLabel = (value: RegistrationRequest['createdAt']) => {
  if (!value) return '—';
  const seconds = typeof value === 'object' ? value.seconds ?? value._seconds : undefined;
  const date = new Date(typeof value === 'string' ? value : seconds ? seconds * 1000 : NaN);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export const RegistrationRequestsPanel: React.FC = () => {
  const [items, setItems] = useState<RegistrationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordLink, setPasswordLink] = useState('');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const current = auth.currentUser;
      if (!current) throw new Error('انتهت الجلسة؛ سجّل الدخول مرة أخرى.');
      const token = await current.getIdToken();
      const response = await fetch(`/api/registration-requests?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'تعذر تحميل الطلبات.');
      setItems(Array.isArray(body.items) ? body.items as RegistrationRequest[] : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل الطلبات.'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const review = async (item: RegistrationRequest, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'الموافقة على الطلب وإنشاء حساب للطالب' : 'رفض الطلب';
    if (!window.confirm(`هل تريد ${action}؟`)) return;
    setBusyId(item.id); setError(''); setNotice(''); setPasswordLink('');
    try {
      const current = auth.currentUser;
      if (!current) throw new Error('انتهت الجلسة؛ سجّل الدخول مرة أخرى.');
      const token = await current.getIdToken();
      const response = await fetch(`/api/registration-requests/${encodeURIComponent(item.id)}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: adminNotes[item.id] || '' }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'تعذر تحديث الطلب.');
      if (status === 'approved') {
        setNotice(`تمت الموافقة وإنشاء حساب للطالب ${item.name || ''}. انسخ رابط تعيين كلمة المرور وأرسله للطالب بشكل خاص.`);
        setPasswordLink(typeof body.passwordSetupLink === 'string' ? body.passwordSetupLink : '');
      } else setNotice(`تم رفض طلب ${item.name || 'الطالب'}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحديث الطلب.'); }
    finally { setBusyId(''); }
  };

  return <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#091B2F] p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-black text-white">طلبات التسجيل</h2><p className="mt-1 text-xs leading-5 text-slate-400">الموافقة تنشئ حساب طالب. رابط تعيين كلمة المرور يظهر للإدارة فقط بعد نجاح الإنشاء.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs text-slate-200 hover:border-emerald-500/50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث</button>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="تصفية الطلبات">
      {(['pending','approved','rejected','all'] as const).map(value => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-2 text-xs ${filter === value ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200' : 'border-slate-700 text-slate-400'}`}>{value === 'all' ? 'الكل' : statusLabel[value]}</button>)}
    </div>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200"><ShieldAlert className="h-4 w-4 shrink-0" />{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-100">{notice}</div>}
    {passwordLink && <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3"><p className="text-sm font-bold text-amber-100">رابط تعيين كلمة المرور — أرسله للطالب بشكل خاص ولا تنشره علنًا.</p><input readOnly value={passwordLink} aria-label="رابط تعيين كلمة المرور" className="w-full rounded-lg border border-slate-700 bg-[#061426] p-2 text-xs text-white" dir="ltr" /><button type="button" onClick={() => { void navigator.clipboard.writeText(passwordLink).then(() => setNotice('تم نسخ الرابط. أرسله للطالب عبر قناة خاصة.')).catch(() => setError('تعذر النسخ تلقائيًا؛ حدّد الرابط وانسخه يدويًا.')); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white"><Copy className="h-4 w-4" /> نسخ الرابط</button></div>}
    {loading ? <p className="py-8 text-center text-sm text-slate-400">جارٍ تحميل الطلبات…</p> : items.length === 0 ? <p className="rounded-xl border border-slate-800 p-6 text-center text-sm text-slate-400">لا توجد طلبات في هذا القسم.</p> : <div className="space-y-3">{items.map(item => <article key={item.id} className="space-y-3 rounded-xl border border-slate-800 bg-[#061426] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-white">{item.name || 'بدون اسم'}</h3><p className="mt-1 text-xs text-slate-400">{item.email || 'بدون بريد إلكتروني'}</p></div><span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{statusLabel[item.status] || item.status}</span></div>
      <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2"><p>هاتف الطالب: <span dir="ltr">{item.studentPhone || '—'}</span></p><p>هاتف ولي الأمر: <span dir="ltr">{item.parentPhone || '—'}</span></p><p>الصف: {item.gradeLevel || '—'}</p><p>تاريخ الطلب: {dateLabel(item.createdAt)}</p></div>
      {!!item.subjects?.length && <p className="text-sm text-slate-300">المواد: {item.subjects.join('، ')}</p>}{item.learningGoal && <p className="text-sm leading-6 text-slate-400">الهدف: {item.learningGoal}</p>}{item.adminNote && <p className="text-sm text-slate-400">ملاحظة الإدارة: {item.adminNote}</p>}
      {item.status === 'pending' && <><label className="block text-xs text-slate-400">ملاحظة للإدارة (اختياري)<textarea value={adminNotes[item.id] || ''} onChange={e => setAdminNotes(prev => ({ ...prev, [item.id]: e.target.value }))} maxLength={500} rows={2} className="mt-1 w-full rounded-lg border border-slate-700 bg-[#08182B] p-3 text-sm text-white outline-none focus:border-emerald-500" /></label><div className="flex flex-wrap gap-2"><button type="button" disabled={!!busyId} onClick={() => void review(item, 'approved')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{busyId === item.id ? 'جارٍ التنفيذ…' : 'موافقة وإنشاء حساب'}</button><button type="button" disabled={!!busyId} onClick={() => void review(item, 'rejected')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-500/30 px-4 text-xs font-bold text-rose-200 disabled:opacity-50"><X className="h-4 w-4" />رفض الطلب</button></div></>}
    </article>)}</div>}
  </section>;
};
