"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { Plane, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    // If Firebase API key is still demo or unconfigured, allow Abbas local demo pass
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-api-key") {
      router.push("/");
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email || user.email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
        await auth.signOut();
        setError(`Access Denied: Only Abbas Saifee (${ALLOWED_EMAIL}) is authorized to access JobPilot.`);
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Failed to complete Google Sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Plane className="h-6 w-6 transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">JobPilot</h1>
          <p className="text-xs text-slate-400">Single-User Autonomous Outreach Engine for Abbas Saifee</p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Strict Single-User Security Lockdown</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            This deployment is private and hardened. Only Abbas Saifee (<span className="font-mono text-slate-200">{ALLOWED_EMAIL}</span>)
            can authenticate.
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? "Authenticating..." : "Sign in with Abbas's Google Account"}</span>
        </button>
      </div>
    </div>
  );
}
