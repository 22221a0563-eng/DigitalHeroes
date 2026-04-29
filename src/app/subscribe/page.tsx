"use client";

import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SubscribePage() {
  const [isYearly, setIsYearly] = useState(false);
  const router = useRouter();

  const handleSubscribe = () => {
    // Store their plan preference locally so we can automatically apply it after they sign up/log in
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pendingSubscriptionPlan",
        isYearly ? "yearly" : "monthly"
      );
    }

    // Redirect to the login/signup page
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Ambient Premium Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-200/40 dark:bg-emerald-900/20 blur-[120px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-teal-100/50 dark:bg-teal-900/20 blur-[100px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite_reverse]" />

      {/* Main Content Wrapper */}
      <div className="max-w-4xl w-full mx-auto relative z-10 pt-16 md:pt-10 flex flex-col items-center">
        {/* Back Button */}
        <div className="absolute top-0 left-2 md:left-0 md:-top-4 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-300 hover:-translate-x-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>

        <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-slate-900 dark:text-white w-full text-center mt-10 md:mt-0 whitespace-normal md:whitespace-nowrap">
          Join the Draw. Make an{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
            Impact.
          </span>
        </h1>

        <p className="text-base text-slate-500 dark:text-slate-400 mb-8 font-medium max-w-lg mx-auto text-center">
          Select your plan. Direct up to 50% of your fee to your chosen
          charities.
        </p>

        {/* Custom Premium Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span
            className={`font-bold text-base transition-colors duration-300 ${
              !isYearly
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-600"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-800 relative transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            style={{ backgroundColor: isYearly ? "#10b981" : "" }}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-transform duration-300 ease-spring ${
                isYearly ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`font-bold text-base flex items-center gap-2 transition-colors duration-300 ${
              isYearly
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-600"
            }`}
          >
            Yearly
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-300 ${
                isYearly
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              Hassle Free
            </span>
          </span>
        </div>

        {/* Glassmorphism Pricing Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] w-full max-w-sm mx-auto transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)]">
          <div className="text-5xl font-black mb-1 text-slate-900 dark:text-white tracking-tighter text-center">
            ${isYearly ? "250" : "25"}
            <span className="text-lg font-bold text-slate-400 dark:text-slate-500 tracking-normal">
              /{isYearly ? "yr" : "mo"}
            </span>
          </div>

          <ul className="mt-6 space-y-3.5 text-left mb-8">
            {[
              "Access to monthly prize draws",
              "Log rolling 5 Stableford scores",
              "Direct 10% to 50% to Charity",
              "Hassle free",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base transition-all duration-300 shadow-[0_8px_20px_rgba(5,150,105,0.2)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Create Account to Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
