"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Activity,
  Gift,
  Trophy,
  Heart,
  TrendingUp,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
      title: "1. Subscribe & Support",
      description:
        "Choose a Monthly ($25) or Yearly ($250) plan. Build your Impact Portfolio by directing 10% to 50% of your fee to the charities you choose.",
    },
    {
      icon: <Activity className="w-5 h-5 text-teal-500" />,
      title: "2. Log Your Latest 5",
      description:
        "Log your Stableford scores (1-45). The engine automatically keeps only your latest 5 rounds. You need exactly 5 active scores to qualify for the draw.",
    },
    {
      icon: <Gift className="w-5 h-5 text-indigo-500" />,
      title: "3. The Prize Pool",
      description:
        "The remaining subscription revenue generates the monthly prize pool. This pool is divided into strict tiers: 40% for 5-Matches, 35% for 4-Matches, and 25% for 3-Matches.",
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      title: "4. Match & Win",
      description:
        "The monthly draw generates 5 winning numbers. If your active scores match 3, 4, or 5 numbers, you win an equal split of that tier's prize pool.",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-rose-500" />,
      title: "5. The Jackpot Rollover",
      description:
        "If no one successfully matches all 5 numbers in a given month, that entire 40% tier rolls forward, creating a massive jackpot for the next draw.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 py-16 px-6 relative overflow-hidden transition-colors duration-500 flex justify-center">
      {/* Ambient Premium Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-100/30 dark:bg-teal-900/20 blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse]" />

      <div className="max-w-3xl w-full relative z-10">
        {/* Navigation / Back Button */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-sm transition-all duration-300 hover:-translate-x-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            How The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              Engine
            </span>{" "}
            Works
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Everything you need to know about qualifying, funding your
            charities, and claiming the rollover jackpot.
          </p>
        </div>

        {/* Steps Container */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col sm:flex-row gap-5 items-start"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/login" // Or "/login" depending on your exact auth routing setup
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base transition-all duration-300 shadow-[0_8px_20px_rgba(5,150,105,0.2)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
