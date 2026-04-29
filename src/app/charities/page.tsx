"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Heart,
  ArrowUpRight,
  Building,
  Sparkles,
  Globe,
  HandHeart,
} from "lucide-react";

export default function CharitiesPage() {
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharities = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("charities")
        .select("*")
        .order("name", { ascending: true });

      if (data) setCharities(data);
      // Adding a tiny artificial delay just to allow the beautiful loader to be seen smoothly
      setTimeout(() => setLoading(false), 800);
    };

    fetchCharities();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#0B1120] py-12 px-6 relative overflow-hidden transition-colors duration-500 flex justify-center font-sans">
      {/* Ambient Premium Emotional Glows - Rose (Compassion) and Indigo (Trust) */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-rose-200/30 dark:bg-rose-900/20 blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100/40 dark:bg-indigo-900/20 blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse]" />

      <div className="max-w-6xl w-full relative z-10 flex flex-col">
        {/* Navigation / Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition-all duration-300 hover:-translate-x-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-sm text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
        </div>

        {/* Emotional Header Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto mt-4 md:mt-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 text-rose-500 mb-6 shadow-lg shadow-rose-500/10 border border-white dark:border-rose-500/20 relative">
            <div className="absolute inset-0 rounded-3xl bg-rose-400/20 animate-ping" />
            <Heart className="w-8 h-8 fill-rose-500/20 animate-[pulse_2s_ease-in-out_infinite]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
            Every round you play <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-indigo-500">
              changes a life.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8">
            You aren't just competing for the jackpot. By joining Digital
            Heroes, you are pledging up to{" "}
            <strong className="text-rose-600 dark:text-rose-400 font-black">
              50% of your subscription
            </strong>{" "}
            to front-line causes. Real impact, automatically funded by your
            passion.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <Globe className="w-4 h-4 text-indigo-500" /> Global Reach
            </span>
            <span className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <Sparkles className="w-4 h-4 text-amber-500" /> Direct Funding
            </span>
            <span className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <HandHeart className="w-4 h-4 text-rose-500" /> 100% Transparent
            </span>
          </div>
        </div>

        {/* Charity Directory Grid */}
        {loading ? (
          /* High-End Dark/Light Mode Skeletons */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm animate-pulse flex flex-col"
              >
                <div className="h-56 bg-slate-200/50 dark:bg-slate-800/50 w-full" />
                <div className="p-8 flex flex-col flex-grow">
                  <div className="h-4 bg-slate-200/70 dark:bg-slate-800/70 w-1/3 rounded-md mb-4" />
                  <div className="h-8 bg-slate-200/70 dark:bg-slate-800/70 w-3/4 rounded-lg mb-6" />
                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-full rounded-md" />
                    <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-full rounded-md" />
                    <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-4/5 rounded-md" />
                  </div>
                  <div className="h-14 bg-slate-200/70 dark:bg-slate-800/70 w-full rounded-xl mt-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : charities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charities.map((charity) => (
              <div
                key={charity.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(225,29,72,0.08)] dark:hover:shadow-[0_20px_40px_rgb(225,29,72,0.15)] flex flex-col h-full group overflow-hidden"
              >
                {/* Image Header */}
                <div className="h-56 bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
                  {charity.image_url ? (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <Building className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />

                  {/* Impact Tag overlayed on image */}
                  <div className="absolute bottom-4 left-6">
                    <span className="text-[10px] font-black text-white bg-rose-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-rose-900/20">
                      Impact Partner
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-8 flex flex-col flex-grow relative">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                    {charity.name}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 flex-grow">
                    {charity.description}
                  </p>

                  <Link
                    href="/login"
                    className="w-full py-4 bg-slate-900 hover:bg-rose-600 dark:bg-white dark:hover:bg-rose-500 text-white dark:text-slate-900 dark:hover:text-white rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg hover:shadow-rose-500/25 active:scale-95"
                  >
                    Be Their Hero
                    <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <Building className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Pledges Opening Soon
            </h3>
            <p className="text-base text-slate-500 font-medium max-w-md mx-auto">
              Our administrative team is currently onboarding our verified
              impact partners. Check back shortly to choose your cause.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
