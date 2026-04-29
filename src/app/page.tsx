"use client";

import Link from "next/link";
import {
  Heart,
  Trophy,
  Activity,
  ArrowRight,
  Building,
  Sparkles,
  HandHeart,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [charities, setCharities] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch public data and handle hydration
  useEffect(() => {
    setMounted(true);

    const fetchPublicData = async () => {
      const supabase = createClient();

      try {
        // Fetch active charities
        const { data: charityData } = await supabase
          .from("charities")
          .select("*")
          .order("name", { ascending: true })
          .limit(3); // Just show top 3 on the homepage

        if (charityData) setCharities(charityData);

        // Fetch public media assets
        const { data: mediaData } = await supabase
          .from("media_assets")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4); // Limit to 4 for the gallery preview

        if (mediaData) setMediaAssets(mediaData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // Artificial delay for smooth skeleton demonstration (optional, can be removed)
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchPublicData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-500/20 relative overflow-hidden transition-colors duration-500 flex flex-col">
      {/* Ambient Premium Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite] hidden md:block" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-100/40 dark:bg-teal-900/20 blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse] hidden md:block" />

      {/* Navigation */}
      <nav className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
            DIGITAL
            <span className="text-emerald-600 dark:text-emerald-500">
              HEROES
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/charities"
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Impact
            </Link>

            <Link
              href="/login"
              className="text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-5 sm:px-6 py-2.5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 flex-grow flex flex-col items-center justify-center text-center relative z-10 pt-16 pb-24 w-full">
        <div
          className={`transition-all duration-1000 transform ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold mb-8 border border-emerald-100 dark:border-emerald-500/20 shadow-sm transition-transform hover:scale-105 duration-300 cursor-default">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Monthly Draw Now Active
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.05] text-slate-900 dark:text-white max-w-4xl mx-auto">
            Play Your Game. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              Change The World.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-2">
            The first performance-tracking platform where your latest scores
            unlock massive monthly prize pools—while directly funding the
            charities you care about.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link
              href="/subscribe"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_8px_20px_rgba(5,150,105,0.2)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Start Subscription
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-900 dark:text-white rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </main>

      {/* Premium Mechanics Section */}
      <section className="relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)] transition-all duration-500 md:animate-[float_6s_ease-in-out_infinite]">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all duration-500">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">
                Track Performance
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Log your last 5 Stableford scores. We keep it simple—your
                rolling performance is your ticket to the draw.
              </p>
            </div>

            <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)] transition-all duration-500 md:animate-[float_6s_ease-in-out_infinite_1s]">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-all duration-500">
                <Trophy className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">
                Win the Pool
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Match 3, 4, or 5 numbers in our monthly draw. Hit the 5-match to
                claim the massive rollover jackpot.
              </p>
            </div>

            <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)] transition-all duration-500 md:animate-[float_6s_ease-in-out_infinite_2s] sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-all duration-500">
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">
                Direct Impact
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Up to 50% of your subscription goes directly to your chosen
                charities. Real impact, automatically funded by your passion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Charities Section (Emotional & Modern) */}
      <section className="relative z-10 py-20 sm:py-28 bg-[#F8FAF9] dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50">
        {/* Subtle Background Glow for Emotional Impact */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-rose-200/20 dark:bg-rose-900/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 mb-4 border border-rose-100 dark:border-rose-500/20 shadow-sm">
              <HandHeart className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
              Causes You{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
                Champion
              </span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium">
              The heroes behind the scenes. We're proud to route your
              contributions directly to these world-changing organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              /* High-End Skeletons */
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm animate-pulse flex flex-col h-[400px]"
                >
                  <div className="h-48 bg-slate-200/50 dark:bg-slate-800/50 w-full shrink-0" />
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="h-6 bg-slate-200/70 dark:bg-slate-800/70 w-3/4 rounded-lg mb-4" />
                    <div className="space-y-3 mb-6">
                      <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-full rounded-md" />
                      <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-full rounded-md" />
                      <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 w-2/3 rounded-md" />
                    </div>
                  </div>
                </div>
              ))
            ) : charities.length > 0 ? (
              /* Real Data */
              charities.map((charity) => (
                <Link
                  href="/charities"
                  key={charity.id}
                  className="block group"
                >
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgb(225,29,72,0.08)] dark:hover:shadow-[0_16px_40px_rgb(225,29,72,0.15)] flex flex-col h-full cursor-pointer">
                    <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
                      {charity.image_url ? (
                        <img
                          src={charity.image_url}
                          alt={charity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <Building className="w-full h-full p-16 text-slate-300 dark:text-slate-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-80" />
                      <div className="absolute bottom-4 left-6">
                        <span className="text-[10px] font-black text-white bg-rose-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-rose-900/20">
                          Impact Partner
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow relative bg-white dark:bg-slate-900">
                      <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {charity.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                        {charity.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Pledges Opening Soon
                </h3>
                <p className="text-sm text-slate-500">
                  Our administrative team is currently onboarding verified
                  impact partners.
                </p>
              </div>
            )}
          </div>

          {!loading && charities.length > 0 && (
            <div className="mt-12 text-center">
              <Link
                href="/charities"
                className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
              >
                View all causes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Media/Gallery Section */}
      <section className="relative z-10 py-20 sm:py-28 bg-white/40 dark:bg-slate-900/20 border-t border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
              Faces of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                Impact
              </span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium">
              The real heroes—our community, our partners, and the moments that
              make it all worth it.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {loading ? (
              /* Media Skeletons */
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl animate-pulse flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50"
                >
                  <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 opacity-50" />
                </div>
              ))
            ) : mediaAssets.length > 0 ? (
              mediaAssets.map((media) => (
                <div
                  key={media.id}
                  className="rounded-3xl overflow-hidden aspect-square border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 group hover:scale-[1.02] bg-slate-100 dark:bg-slate-800"
                >
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 font-medium text-sm">
                More moments coming soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Simple & Elegant Footer */}
      <footer className="relative z-10 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50 py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
            DIGITAL
            <span className="text-emerald-600 dark:text-emerald-500">
              HEROES
            </span>
          </div>

          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            Created with{" "}
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 mx-0.5" /> in
            2026
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/help"
              className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Help & Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
