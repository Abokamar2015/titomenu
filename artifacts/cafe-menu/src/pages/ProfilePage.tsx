// Profile page for all authenticated users (owner / manager / staff / super admin).
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  UserCircle, KeyRound, Loader2, ArrowRight, Camera, ShieldCheck,
  Store, CalendarDays, Clock, Mail, LogOut, History, Smartphone,
} from 'lucide-react';
import {
  getCurrentUser, getCurrentMembership, isAuthenticated, refreshSessionUser,
  updateProfile, uploadAvatar, changePassword, logout,
  type SessionUser, type MembershipInfo,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك',
  manager: 'مدير',
  staff: 'موظف',
};

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<SessionUser | null>(getCurrentUser());
  const [membership] = useState<MembershipInfo | null>(getCurrentMembership());
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Password form
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin');
      return;
    }
    // Refresh from server so created_at / last_login_at are up to date.
    refreshSessionUser().then(u => {
      if (u) { setUser(u); setName(u.name); setEmail(u.email); }
    });
  }, [navigate]);

  if (!user) return null;

  const role = user.is_super_admin
    ? 'مدير المنصة'
    : membership
      ? (ROLE_LABELS[membership.role] ?? membership.role)
      : '—';
  const backTarget = user.is_super_admin && !membership ? '/sa' : '/admin';
  const emailChanged = email.trim().toLowerCase() !== user.email;
  const dirtyProfile = name.trim() !== user.name || emailChanged;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('الاسم مطلوب'); return; }
    const updates: { name?: string; email?: string; current_password?: string } = {};
    if (name.trim() !== user.name) updates.name = name.trim();
    if (emailChanged) {
      if (!emailPassword) { toast.error('أدخل كلمة المرور الحالية لتغيير البريد الإلكتروني'); return; }
      updates.email = email.trim().toLowerCase();
      updates.current_password = emailPassword;
    }
    setSavingProfile(true);
    const result = await updateProfile(updates);
    setSavingProfile(false);
    if (typeof result === 'string') { toast.error(result); return; }
    setUser(result);
    setEmailPassword('');
    toast.success('تم حفظ الملف الشخصي ✓');
  };

  const handleAvatar = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      const result = await updateProfile({ avatar_url: url });
      if (typeof result === 'string') { toast.error(result); return; }
      setUser(result);
      toast.success('تم تحديث الصورة الشخصية ✓');
    } catch {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'); return; }
    if (next !== confirm) { toast.error('تأكيد كلمة المرور غير مطابق'); return; }
    setSavingPassword(true);
    const err = await changePassword(current, next);
    setSavingPassword(false);
    if (err) { toast.error(err); return; }
    setCurrent(''); setNext(''); setConfirm('');
    toast.success('تم تغيير كلمة المرور بنجاح ✓');
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">الملف الشخصي</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => navigate(backTarget)}>
              <ArrowRight className="w-4 h-4" />رجوع
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5"
              onClick={() => { logout(); navigate(backTarget); }}>
              <LogOut className="w-4 h-4" />خروج
            </Button>
          </div>
        </div>

        {/* Avatar + account info card */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/60 bg-muted flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-primary">{user.name.charAt(0) || '؟'}</span>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex-1 w-full space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">الدور:</span>
                <span className="font-bold">{role}</span>
              </div>
              {membership && (
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">المطعم:</span>
                  <span className="font-bold">{membership.name_ar}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">تاريخ إنشاء الحساب:</span>
                <span className="font-medium">{fmtDate(user.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">آخر تسجيل دخول:</span>
                <span className="font-medium">{fmtDate(user.last_login_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit profile card */}
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-border bg-card p-6 mb-5 space-y-4">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2"><Mail className="w-4 h-4" />البيانات الأساسية</h2>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الاسم الكامل</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" required />
            <p className="text-[11px] text-muted-foreground">سيُستخدم البريد الجديد لتسجيل الدخول القادم</p>
          </div>
          {emailChanged && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">كلمة المرور الحالية (مطلوبة لتأكيد تغيير البريد)</Label>
              <Input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} dir="ltr" autoComplete="current-password" />
            </div>
          )}
          <Button type="submit" disabled={savingProfile || !dirtyProfile}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات'}
          </Button>
        </form>

        {/* Change password card */}
        <form onSubmit={handleChangePassword} className="rounded-2xl border border-border bg-card p-6 mb-5 space-y-4">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2"><KeyRound className="w-4 h-4" />تغيير كلمة المرور</h2>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">كلمة المرور الحالية</Label>
            <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} dir="ltr" autoComplete="current-password" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">كلمة المرور الجديدة (8+ أحرف)</Label>
              <Input type="password" value={next} onChange={e => setNext(e.target.value)} dir="ltr" autoComplete="new-password" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">تأكيد كلمة المرور</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} dir="ltr" autoComplete="new-password" required />
            </div>
          </div>
          <Button type="submit" disabled={savingPassword}
            className="bg-primary text-primary-foreground hover:bg-primary/90">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تغيير كلمة المرور'}
          </Button>
        </form>

        {/* Coming soon */}
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-3">قريبًا</h2>
          <ul className="space-y-2 text-sm text-muted-foreground/70">
            <li className="flex items-center gap-2"><LogOut className="w-4 h-4" />تسجيل الخروج من جميع الأجهزة</li>
            <li className="flex items-center gap-2"><History className="w-4 h-4" />سجل تسجيلات الدخول</li>
            <li className="flex items-center gap-2"><Smartphone className="w-4 h-4" />التحقق بخطوتين (2FA)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
