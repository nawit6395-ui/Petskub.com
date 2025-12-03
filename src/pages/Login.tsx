import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  PawPrint,
  Sparkles,
  MailCheck,
  Clock,
  CheckCircle2,
  PhoneCall,
  Info,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { alert } from "@/lib/alerts";
import { buildAppUrl } from "@/lib/utils";
import Logo from "@/assets/Logo.png";
import PasswordInput from "@/components/PasswordInput";
import { cn } from "@/lib/utils";

const hexToRgba = (hex: string, alpha = 1) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
    fullName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

const onboardingSteps = [
  {
    title: "สมัครสมาชิก",
    description: "กรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร",
    icon: Sparkles,
  },
  {
    title: "ยืนยันอีเมล",
    description: "เปิดกล่องจดหมายและกดลิงก์ยืนยันใน 5 นาที",
    icon: MailCheck,
  },
  {
    title: "เริ่มใช้งาน",
    description: "เข้าสู่ระบบ สร้างประกาศ หรือช่วยตรวจรายงาน",
    icon: CheckCircle2,
  },
];


const tabOptions = [
  {
    label: "ฉันมีบัญชีอยู่แล้ว",
    helper: "เข้าสู่ระบบด้วยอีเมล",
    value: true,
    icon: LogIn,
  },
  {
    label: "ฉันยังไม่มีบัญชี",
    helper: "สมัครและยืนยันภายใน 1 นาที",
    value: false,
    icon: UserPlus,
  },
];

const quickConfidence = [
  {
    title: "ปกป้องบัญชี",
    description: "ระบบยืนยันอีเมลและป้องกันสแปมโดยทีมงาน",
    icon: ShieldCheck,
  },
  {
    title: "ใช้เวลาไม่ถึง 1 นาที",
    description: "สมัคร กดยืนยัน และเริ่มช่วยเหลือเคสด่วนได้ทันที",
    icon: Clock,
  },
];

const Login = () => {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const defaultModeIsLogin = !(location.pathname === "/register" || search.get("mode") === "signup");
  const [isLogin, setIsLogin] = useState<boolean>(defaultModeIsLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [participantsToday, setParticipantsToday] = useState<number | null>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const { user, signIn, signUp, syncProfileFromUser } = useAuth();

  useEffect(() => {
    const fetchParticipantsToday = async () => {
      try {
        const { data, error } = await supabase.rpc("get_daily_participant_count");
        if (error) throw error;
        setParticipantsToday(data ?? 0);
      } catch (error) {
        console.error("Failed to load login stats:", error);
        setParticipantsToday(0);
      } finally {
        setIsFetchingStats(false);
      }
    };

    fetchParticipantsToday();
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAppUrl("/"),
        },
      });

      if (error) throw error;
      await syncProfileFromUser();
    } catch (error: any) {
      alert.error("ไม่สามารถเข้าสู่ระบบด้วย Google ได้", {
        description: error.message,
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: buildAppUrl("/"),
        },
      });

      if (error) throw error;
      await syncProfileFromUser();
    } catch (error: any) {
      alert.error("ไม่สามารถเข้าสู่ระบบด้วย Facebook ได้", {
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (isLogin) {
      // LOGIN: no recaptcha
      setSignupSuccess(null);
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      try {
        await signIn(email, password);
      } catch (error) {
        console.error("Auth error:", error);
      }
      return;
    }
    // SIGNUP
    setSignupSuccess(null);
    // 1. validate form
    const result = signupSchema.safeParse({ email, password, confirmPassword, fullName });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const sanitizedEmail = email.trim();
    // 3. call signUp
    try {
      const { error } = await signUp(sanitizedEmail, password, fullName || undefined);
      if (error) {
        setSignupSuccess(null);
        const loweredMessage = error.message?.toLowerCase?.() ?? "";
        if (
          error.message === "EMAIL_ALREADY_REGISTERED" ||
          loweredMessage.includes("already registered")
        ) {
          setErrors({ email: "คุณเคยใช้อีเมลนี้สมัครแล้ว กรุณาเข้าสู่ระบบหรือใช้ฟีเจอร์ลืมรหัสผ่าน" });
          setIsLogin(true);
          return;
        }
        alert.error("สมัครสมาชิกไม่สำเร็จ", { description: error.message });
        return;
      }
      // 4. reset form, show success
      setSignupSuccess("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน");
      setIsLogin(true);
      setPassword("");
      setConfirmPassword("");
      
      setFullName("");
      setEmail("");
      setErrors({});
      // cleaned up: reCAPTCHA removed, no reset needed
    } catch (error: any) {
      setSignupSuccess(null);
      alert.error("เกิดข้อผิดพลาดขณะสมัครสมาชิก", { description: error?.message || "Unknown error" });
    }
  };

  const handleForgotPasswordClick = () => {
    setIsResetDialogOpen(true);
    setResetEmail((prev) => (prev ? prev : email));
  };

  const handleSendPasswordReset = async () => {
    const emailToReset = resetEmail.trim() || email.trim();

    const validation = z.string().email("กรุณากรอกอีเมลให้ถูกต้อง").safeParse(emailToReset);
    if (!validation.success) {
      alert.error("ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ", {
        description: "กรุณากรอกอีเมลให้ถูกต้องก่อน",
      });
      return;
    }

    try {
      setIsSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(validation.data, {
        redirectTo: buildAppUrl("/login"),
      });

      if (error) throw error;

      alert.success("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว", {
        description: "โปรดตรวจสอบกล่องจดหมายและทำตามขั้นตอนภายใน 5 นาที",
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      alert.error("ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้", {
        description: error.message,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const participantStatText = isFetchingStats
    ? "กำลังโหลด..."
    : (participantsToday ?? 0) > 0
      ? `+${(participantsToday ?? 0).toLocaleString("th-TH")} คนเข้าร่วมภารกิจ`
      : "ยังไม่มีสมาชิกใหม่วันนี้";

  const participantSubText = isFetchingStats
    ? "กำลังรวบรวมข้อมูลรายวันล่าสุด..."
    : (participantsToday ?? 0) > 0
      ? "ขอบคุณที่เป็นส่วนหนึ่งในการช่วยเหลือสัตว์จร 💚"
      : "มาเป็นคนแรกที่เข้าร่วมและช่วยให้น้อง ๆ ปลอดภัย";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row">
            <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-8 shadow-[0_40px_120px_rgba(244,162,89,0.25)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl lg:w-1/2">
              <div className="absolute inset-x-10 bottom-6 top-6 rounded-3xl bg-gradient-to-b from-amber-50/60 to-transparent blur-3xl"></div>
          <div className="relative flex h-full flex-col gap-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
                พื้นที่ปลอดภัยสำหรับอาสาและผู้รับเลี้ยง
            </div>
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Petskub logo" className="h-14 w-auto" />
              <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Petskub</p>
                <p className="text-3xl font-bold text-slate-900">ชุมชนช่วยสัตว์จร</p>
                <p className="text-sm text-slate-500">รวมพลังรายงานเคสด่วน ช่วยให้น้อง ๆ ปลอดภัย</p>
              </div>
            </div>
            <p className="text-lg leading-relaxed text-slate-600">
              สมัครง่ายครั้งเดียว — ประกาศหาบ้าน แจ้งเคส และเชื่อมต่อกับคนรักสัตว์ใกล้คุณ
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickConfidence.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3 text-emerald-700">
                      <span className="rounded-full bg-primary/5 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/80 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Info className="h-4 w-4" />
                    ขั้นตอนการใช้งานใน 3 ขั้น
                  </div>
              <div className="space-y-3">
                {onboardingSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-100/60 p-5">
                <p className="text-sm font-semibold text-primary">สถิติวันนี้</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {participantStatText}
              </p>
              <p className="text-sm text-slate-600">{participantSubText}</p>
            </div>
          </div>
        </div>

        <Card className="w-full rounded-[32px] border-none bg-white/95 p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:w-1/2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                {isLogin ? "ยินดีต้อนรับกลับ" : "เริ่มต้นการเดินทาง"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 lg:text-[2.15rem]">
                {isLogin ? "เข้าสู่ระบบ Petskub" : "สมัครสมาชิกใหม่"}
              </h1>
              <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80">
                ← กลับสู่หน้าแรก
              </Link>
            </div>
            <Sparkles className="hidden h-9 w-9 text-primary lg:block" />
          </div>

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">
              สลับโหมดการใช้งาน
            </p>
            <div className="relative flex rounded-[999px] border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
              <div
                className="pointer-events-none absolute inset-y-1 left-1 rounded-[999px] bg-white shadow-lg transition-all duration-300 ease-out"
                style={{
                  width: "calc(50% - 0.25rem)",
                  transform: isLogin ? "translateX(0%)" : "translateX(100%)",
                }}
              />
              {tabOptions.map((tab) => {
                const Icon = tab.icon;
                const isActive = isLogin === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setIsLogin(tab.value);
                      setErrors({});
                    }}
                    className={cn(
                      "relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-[999px] px-3 py-2 text-center transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                    aria-pressed={isActive}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold",
                        isActive ? "text-primary" : "text-slate-600"
                      )}
                    >
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-primary shadow-sm ring-1 ring-white/60"
                        style={{
                          color: isActive ? "#f97316" : "#0f172a",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{tab.label}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">{tab.helper}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              หรือดำเนินการต่อด้วยบัญชีโซเชียล
            </div>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-black py-3 text-white font-semibold shadow-md hover:bg-zinc-900 transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              ดำเนินการต่อด้วย Google
            </Button>

            <Button
              type="button"
              onClick={handleFacebookSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-600 py-3 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M22 12.07C22 6.55 17.52 2.07 12 2.07S2 6.55 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9v-2.9h2.54V9.64c0-2.5 1.5-3.89 3.79-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.8 8.42-4.94 8.42-9.93z" />
              </svg>
              ดำเนินการต่อด้วย Facebook
            </Button>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/30 px-4 py-3">
            <span
              className="inline-flex items-center justify-center h-8 w-8 rounded-full"
              style={{ backgroundColor: hexToRgba("#22C55E", 0.12), color: "#22C55E" }}
            >
              <MailCheck className="h-4 w-4" />
            </span>
            <div className="text-sm">
                <p className="font-semibold text-primary">ยืนยันอีเมลก่อนเข้าสู่ระบบ</p>
              <p className="text-emerald-700">
                หลังสมัคร โปรดเปิดอีเมลและกดลิงก์ยืนยันเพื่อปลดล็อกการเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
              </p>
            </div>
          </div>

          {signupSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center text-emerald-700 font-semibold font-prompt">
              {signupSuccess}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-prompt">ชื่อ-นามสกุล (ไม่บังคับ)</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="เช่น มะเหมี่ยว คนใจดี"
                  className="font-prompt"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-prompt">อีเมล</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md bg-primary/5 text-primary shadow-sm">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-12 font-prompt"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <p className="text-sm text-urgent font-prompt">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-prompt">รหัสผ่าน</Label>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-600"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                className="font-prompt"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startIcon={<Lock className="h-4 w-4" />}
              />
              {errors.password && <p className="text-sm text-urgent font-prompt">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-prompt">ยืนยันรหัสผ่าน</Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="••••••••"
                  className="font-prompt"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startIcon={<Lock className="h-4 w-4" />}
                />
                {errors.confirmPassword && <p className="text-sm text-urgent font-prompt">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button type="submit" className="w-full gap-2 rounded-2xl bg-primary px-6 py-6 text-base font-semibold text-primary-foreground">
              {isLogin ? "เข้าสู่ระบบทันที" : "สร้างบัญชี Petskub"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {/* reCAPTCHA has been removed; no widget necessary here */}
          </form>

          <Dialog
            open={isResetDialogOpen}
            onOpenChange={(open) => {
              setIsResetDialogOpen(open);
              if (!open) {
                setIsSendingReset(false);
                setResetEmail("");
              }
            }}
          >
            <DialogContent className="max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-prompt text-xl">รีเซ็ตรหัสผ่าน</DialogTitle>
                <DialogDescription className="font-prompt text-sm">
                  กรอกอีเมลที่ใช้สมัครเพื่อรับลิงก์รีเซ็ตรหัสผ่านภายในไม่กี่นาที
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="reset-email" className="font-prompt text-sm">อีเมล</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="font-prompt"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground font-prompt">
                หากไม่พบอีเมลในกล่องจดหมาย กรุณาตรวจสอบโฟลเดอร์สแปมหรืออีเมลขยะ
              </p>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="font-prompt"
                  onClick={() => setIsResetDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  className="font-prompt"
                  disabled={isSendingReset}
                  onClick={handleSendPasswordReset}
                >
                  {isSendingReset ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            การเข้าสู่ระบบถือว่ายอมรับ <Link to="/privacy" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">นโยบายความเป็นส่วนตัว</Link>
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>
              {isLogin ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"} {" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              </button>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80 transition hover:text-primary/80"
            >
              <span>←</span>
              กลับสู่หน้าแรก
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
