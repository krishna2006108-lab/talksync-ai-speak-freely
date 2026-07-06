import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Check } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  setPersistence,
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getFirebaseAuth,
  googleProvider,
  firebaseAuthErrorMessage,
} from "@/lib/firebase";

type Mode = "signin" | "signup";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function useCapsLock() {
  const [caps, setCaps] = useState(false);
  const onKey = (e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === "function") setCaps(e.getModifierState("CapsLock"));
  };
  return { caps, onKey };
}

function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  return s;
}
const STRENGTH_COLORS = ["#990000", "#d15a00", "#c7e100", "#7a9900"];
const STRENGTH_LABELS = ["Too weak", "Weak", "Good", "Strong"];

/* ----------------------------- Sign in ----------------------------- */
const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password required").max(128),
  remember: z.boolean(),
});
type SignInValues = z.infer<typeof signInSchema>;

function SignInForm({ seat }: { seat?: number }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "google" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const { caps, onKey } = useCapsLock();
  const cardRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onForgot = async () => {
    setFormError(null);
    setNotice(null);
    const email = getValues("email").trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setFormError("Enter your email above first, then tap Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setNotice(`Password reset link sent to ${email}.`);
    } catch (err) {
      setFormError(firebaseAuthErrorMessage((err as { code?: string }).code ?? ""));
    }
  };

  const goHome = () =>
    navigate({ to: "/", search: seat != null ? { seat } : {} });

  const onSubmit = async (values: SignInValues) => {
    setFormError(null);
    setStatus("loading");
    try {
      const auth = getFirebaseAuth();
      await setPersistence(
        auth,
        values.remember ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithEmailAndPassword(auth, values.email, values.password);
      setStatus("success");
      setTimeout(goHome, 500);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(firebaseAuthErrorMessage(code));
      setStatus("idle");
      cardRef.current?.classList.remove("ts-auth-shake");
      void cardRef.current?.offsetWidth;
      cardRef.current?.classList.add("ts-auth-shake");
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setStatus("google");
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
      setStatus("success");
      setTimeout(goHome, 400);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(firebaseAuthErrorMessage(code));
      setStatus("idle");
    }
  };

  const busy = status !== "idle";

  return (
    <form ref={cardRef} className="ts-auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="ts-auth-title">Welcome back</h1>
      <p className="ts-auth-sub">Sign in to claim your founding seat.</p>

      {formError && (
        <div className="ts-auth-alert" role="alert" aria-live="polite">
          {formError}
        </div>
      )}
      {notice && (
        <div className="ts-auth-alert ts-auth-alert-info" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      <div className="ts-auth-field">
        <label className="ts-auth-label" htmlFor="si-email">Email</label>
        <div className="ts-auth-input-wrap">
          <input
            id="si-email"
            type="email"
            className="ts-auth-input"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && <span className="ts-auth-error" role="alert">{errors.email.message}</span>}
      </div>

      <div className="ts-auth-field">
        <label className="ts-auth-label" htmlFor="si-password">Password</label>
        <div className="ts-auth-input-wrap">
          <input
            id="si-password"
            type={showPw ? "text" : "password"}
            className="ts-auth-input has-toggle"
            autoComplete="current-password"
            enterKeyHint="go"
            aria-invalid={!!errors.password}
            onKeyUp={onKey}
            onKeyDown={onKey}
            {...register("password")}
          />
          {caps && <span className="ts-auth-caps">CAPS LOCK</span>}
          <button
            type="button"
            className="ts-auth-eye"
            aria-pressed={showPw}
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="sr-only">{showPw ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {errors.password && (
          <span className="ts-auth-error" role="alert">{errors.password.message}</span>
        )}
      </div>

      <div className="ts-auth-row">
        <label className="ts-auth-remember">
          <input type="checkbox" {...register("remember")} />
          Remember me
        </label>
        <button type="button" className="ts-auth-link" onClick={onForgot}>
          Forgot password?
        </button>
      </div>

      <button type="submit" className={`ts-auth-btn${status === "success" ? " ts-auth-btn-success" : ""}`} disabled={busy}>
        {status === "loading" && <span className="ts-auth-spin" aria-hidden="true" />}
        {status === "success" && <Check size={18} aria-hidden="true" />}
        {status === "loading" ? "Signing in…" : status === "success" ? "Signed in" : "Sign in"}
      </button>

      <div className="ts-auth-divider"><span>or</span></div>

      <button
        type="button"
        className="ts-auth-btn ts-auth-btn-google"
        onClick={onGoogle}
        disabled={busy}
      >
        {status === "google" ? (
          <span className="ts-auth-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        Continue with Google
      </button>

      <p className="ts-auth-footer">
        New here? <Link to="/signup" search={seat != null ? { seat } : {}}>Create an account</Link>
      </p>
    </form>
  );
}

/* ----------------------------- Sign up ----------------------------- */
const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
  terms: z.boolean().refine((v) => v === true, { message: "Please accept the terms" }),
});
type SignUpValues = z.infer<typeof signUpSchema>;

function SignUpForm({ seat }: { seat?: number }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "google" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const { caps, onKey } = useCapsLock();
  const cardRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", terms: false },
  });

  const pw = watch("password") ?? "";
  const score = scorePassword(pw);

  const goHome = () =>
    navigate({ to: "/", search: seat != null ? { seat } : {} });

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);
    setStatus("loading");
    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(cred.user, { displayName: values.name });
      setStatus("success");
      setTimeout(goHome, 500);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(firebaseAuthErrorMessage(code));
      setStatus("idle");
      cardRef.current?.classList.remove("ts-auth-shake");
      void cardRef.current?.offsetWidth;
      cardRef.current?.classList.add("ts-auth-shake");
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setStatus("google");
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
      setStatus("success");
      setTimeout(goHome, 400);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setFormError(firebaseAuthErrorMessage(code));
      setStatus("idle");
    }
  };

  const busy = status !== "idle";

  return (
    <form ref={cardRef} className="ts-auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="ts-auth-title">Create your account</h1>
      <p className="ts-auth-sub">One step before you lock in your seat.</p>

      {formError && (
        <div className="ts-auth-alert" role="alert" aria-live="polite">
          {formError}
        </div>
      )}

      <div className="ts-auth-field">
        <label className="ts-auth-label" htmlFor="su-name">Name</label>
        <div className="ts-auth-input-wrap">
          <input
            id="su-name"
            type="text"
            className="ts-auth-input"
            autoComplete="name"
            enterKeyHint="next"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </div>
        {errors.name && <span className="ts-auth-error" role="alert">{errors.name.message}</span>}
      </div>

      <div className="ts-auth-field">
        <label className="ts-auth-label" htmlFor="su-email">Email</label>
        <div className="ts-auth-input-wrap">
          <input
            id="su-email"
            type="email"
            className="ts-auth-input"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && <span className="ts-auth-error" role="alert">{errors.email.message}</span>}
      </div>

      <div className="ts-auth-field">
        <label className="ts-auth-label" htmlFor="su-password">Password</label>
        <div className="ts-auth-input-wrap">
          <input
            id="su-password"
            type={showPw ? "text" : "password"}
            className="ts-auth-input has-toggle"
            autoComplete="new-password"
            enterKeyHint="go"
            aria-invalid={!!errors.password}
            onKeyUp={onKey}
            onKeyDown={onKey}
            {...register("password")}
          />
          {caps && <span className="ts-auth-caps">CAPS LOCK</span>}
          <button
            type="button"
            className="ts-auth-eye"
            aria-pressed={showPw}
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="sr-only">{showPw ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {pw.length > 0 && (
          <>
            <div className="ts-auth-strength" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="ts-auth-strength-seg"
                  style={i < score ? { background: STRENGTH_COLORS[score - 1] } : undefined}
                />
              ))}
            </div>
            <span className="ts-auth-strength-hint">
              {score > 0 ? STRENGTH_LABELS[score - 1] : "Too weak"}
            </span>
          </>
        )}
        {errors.password && (
          <span className="ts-auth-error" role="alert">{errors.password.message}</span>
        )}
      </div>

      <div className="ts-auth-field">
        <label className="ts-auth-remember">
          <input type="checkbox" {...register("terms")} />
          I agree to the Terms and Privacy Policy
        </label>
        {errors.terms && <span className="ts-auth-error" role="alert">{errors.terms.message}</span>}
      </div>

      <button type="submit" className={`ts-auth-btn${status === "success" ? " ts-auth-btn-success" : ""}`} disabled={busy}>
        {status === "loading" && <span className="ts-auth-spin" aria-hidden="true" />}
        {status === "success" && <Check size={18} aria-hidden="true" />}
        {status === "loading" ? "Creating…" : status === "success" ? "Account created" : "Create account"}
      </button>

      <div className="ts-auth-divider"><span>or</span></div>

      <button
        type="button"
        className="ts-auth-btn ts-auth-btn-google"
        onClick={onGoogle}
        disabled={busy}
      >
        {status === "google" ? (
          <span className="ts-auth-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        Continue with Google
      </button>

      <p className="ts-auth-footer">
        Already have an account?{" "}
        <Link to="/signin" search={seat != null ? { seat } : {}}>Sign in</Link>
      </p>
    </form>
  );
}

/* ----------------------------- Shell ----------------------------- */
export function AuthView({ mode, seat }: { mode: Mode; seat?: number }) {
  const navigate = useNavigate();

  // If already signed in, skip straight to the site (and continue any claim).
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      navigate({ to: "/", search: seat != null ? { seat } : {} });
    }
  }, [navigate, seat]);

  const isSignin = mode === "signin";
  return (
    <div className="ts-auth">
      {/* Mobile banner */}
      <div className={`ts-auth-banner ${isSignin ? "ts-auth-banner-lime" : "ts-auth-banner-ink"}`}>
        <span className="ts-auth-logo">TALKSYNC AI</span>
        <span className="ts-auth-banner-tag">
          {isSignin ? "The AI meeting OS" : "Start free · No card"}
        </span>
      </div>

      <div className="ts-auth-grid">
        {/* Brand column */}
        <aside className={`ts-auth-brand ${isSignin ? "ts-auth-brand-lime" : "ts-auth-brand-ink"}`}>
          <span className="ts-auth-logo">TALKSYNC AI</span>

          {isSignin ? (
            <div className="ts-auth-brand-mid">
              <span className="ts-auth-eyebrow">The AI meeting OS</span>
              <h1>
                Speak your language. Understand{" "}
                <span className="ts-auth-hl">every language.</span>
              </h1>
              <p>Real-time voice translation for your calls. Jump back into a live translated room.</p>
            </div>
          ) : (
            <div className="ts-auth-brand-mid">
              <span className="ts-auth-eyebrow">Start free</span>
              <h1>
                A room in every language, <span className="ts-auth-hl">in one click.</span>
              </h1>
              <div className="ts-auth-caption-grid" aria-hidden="true">
                <span className="ts-auth-caption">Hola 👋</span>
                <span className="ts-auth-caption">こんにちは</span>
                <span className="ts-auth-caption">Bonjour</span>
                <span className="ts-auth-caption">Guten Tag</span>
              </div>
            </div>
          )}

          <span className="ts-auth-chip">
            {isSignin ? "Session · secure" : "No credit card required"}
          </span>

          {isSignin && (
            <>
              <span className="ts-auth-shape ts-auth-shape-1" aria-hidden="true" />
              <span className="ts-auth-shape ts-auth-shape-2" aria-hidden="true" />
              <span className="ts-auth-shape ts-auth-shape-3" aria-hidden="true" />
            </>
          )}
        </aside>

        {/* Form column */}
        <main className="ts-auth-form-col">
          {isSignin ? <SignInForm seat={seat} /> : <SignUpForm seat={seat} />}
        </main>
      </div>
    </div>
  );
}
