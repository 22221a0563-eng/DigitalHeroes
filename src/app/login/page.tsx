"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Mail,
  Lock,
  Heart,
  ArrowLeft,
  Eye,
  EyeOff,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false); // Added for password reset mode
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Helper to clear form when toggling modes
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsReset(false);
    setError(null);
    setPassword("");
  };

  const toggleResetMode = () => {
    setIsReset(!isReset);
    setIsSignUp(false);
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isReset) {
        // Password Reset Flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        });
        if (error) throw error;
        toast.info("Reset link sent! Please check your email.");
        setIsReset(false);
      } else if (isSignUp) {
        // Sign Up Flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (error) throw error;

        toast.info("Success! Check your email for the confirmation link.");
        setIsSignUp(false);
        setPassword("");
      } else {
        // Sign In Flow
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;

        // Fetch the role from the profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user?.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Route based on role
        if (profile?.role === "admin") {
          router.push("/admin");
          toast.success("Welcome to the Command Center");
        } else {
          router.push("/dashboard");
          toast.success("Welcome back, Hero!");
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F8FAF9] dark:bg-slate-950 p-4 overflow-hidden selection:bg-emerald-500/20 transition-colors duration-500">
      {/* Ambient Premium Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-200/40 dark:bg-emerald-900/20 blur-[120px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-100/50 dark:bg-teal-900/20 blur-[100px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite_reverse]" />

      {/* Floating Header (Logo Only) */}
      <div className="absolute top-8 left-8 z-20">
        <Link
          href="/"
          className="text-xl font-bold tracking-tighter text-slate-800 dark:text-white hover:opacity-70 transition-opacity"
        >
          DIGITAL
          <span className="text-emerald-600 dark:text-emerald-500">HEROES</span>
        </Link>
      </div>

      {/* Premium Soft Card */}
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800/50 relative z-10 mt-12 md:mt-0">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 mb-4 shadow-sm border border-emerald-100/50 dark:border-emerald-500/20 transition-transform hover:scale-105 duration-300">
            {isReset ? (
              <Mail className="w-6 h-6" />
            ) : isSignUp ? (
              <Heart className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            {isReset
              ? "Reset Password"
              : isSignUp
              ? "Join the Movement"
              : "Welcome Back"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isReset
              ? "Enter your email to receive a recovery link."
              : isSignUp
              ? "Track performance. Win prizes. Impact lives."
              : "Sign in to access your dashboard and impact."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Dynamically show Full Name field ONLY during Sign Up */}
          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                First Name
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-all duration-300" />
                <input
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                  placeholder="Hero"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-all duration-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {!isReset && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={toggleResetMode}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 uppercase tracking-tight transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-all duration-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isReset}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-12 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-2xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 mt-6 shadow-[0_8px_20px_rgba(5,150,105,0.2)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {loading
              ? "Processing..."
              : isReset
              ? "Send Reset Link"
              : isSignUp
              ? "Create Account"
              : "Sign In"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-5">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isReset ? (
              <button
                onClick={toggleResetMode}
                className="text-emerald-600 dark:text-emerald-500 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                Back to Sign In
              </button>
            ) : (
              <>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-emerald-600 dark:text-emerald-500 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  {isSignUp ? "Sign in instead" : "Create one now"}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
