"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  Activity,
  Heart,
  Trophy,
  CreditCard,
  LogOut,
  Calendar,
  ShieldCheck,
  Trash2,
  Edit3,
  Check,
  X,
  Lock,
  Gift,
  Coins,
  Sparkles,
  CheckCircle2,
  Info,
  Building,
  User,
  Crown,
} from "lucide-react";

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [charities, setCharities] = useState<any[]>([]);
  const [winnings, setWinnings] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [systemNextDraw, setSystemNextDraw] = useState<string | null>(null);

  const [charityPercentage, setCharityPercentage] = useState(50);
  const [subAmount, setSubAmount] = useState(25);
  const [infoCharity, setInfoCharity] = useState<any>(null);

  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState("");

  // Modals
  const [editDialog, setEditDialog] = useState({
    isOpen: false,
    id: "",
    score: "",
    date: "",
  });
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [profileDialog, setProfileDialog] = useState({
    isOpen: false,
    name: "",
  });

  // 5-Second Promo
  const [showPromo, setShowPromo] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const sessionId = searchParams.get("session_id");
    const isSuccess = searchParams.get("success") === "true";

    if (isSuccess && sessionId) {
      setShowCongrats(true);
      fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }).then(async () => {
        // --- CRITICAL FIX: FORCE THE DB TO UPDATE THE CORRECT PLAN ON SUCCESS ---
        // This ensures that even if the backend misses the plan type, the frontend secures it.
        const pendingPlan = localStorage.getItem("pendingSubscriptionPlan");
        if (pendingPlan) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const properAmount = pendingPlan === "yearly" ? 250 : 25;
            await supabase
              .from("profiles")
              .update({
                subscription_plan: pendingPlan,
                subscription_amount: properAmount,
                subscription_status: "active",
              })
              .eq("id", user.id);
          }
          localStorage.removeItem("pendingSubscriptionPlan"); // clear it after saving
        }
        fetchData();
      });
    } else {
      fetchData();
    }
  }, [router, supabase, searchParams]);

  const fetchData = async () => {
    setFetching(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const isJustSubscribed = searchParams.get("success") === "true";
    const currentStatus = isJustSubscribed
      ? "active"
      : profile?.subscription_status || "inactive";

    setCharityPercentage(profile?.charity_percentage || 50);

    // Strict Plan Check
    const isYearlyPlan = profile?.subscription_plan === "yearly";
    setSubAmount(isYearlyPlan ? 250 : 25);

    const fullProfile = {
      ...(profile || {}),
      email: user.email,
      name:
        profile?.full_name?.split(" ")[0] ||
        user.user_metadata?.full_name?.split(" ")[0] ||
        "Hero",
      full_name: profile?.full_name || user.user_metadata?.full_name || "",
      subscription_status: currentStatus,
      subscription_plan: profile?.subscription_plan || "monthly", // Fallback to monthly if null
      selected_charities: profile?.selected_charity
        ? profile.selected_charity.split(",")
        : [],
    };

    setUserProfile(fullProfile);

    // 5-Second Promo Logic for inactive users logging in
    if (currentStatus !== "active" && !sessionStorage.getItem("promoShown")) {
      setShowPromo(true);
      sessionStorage.setItem("promoShown", "true");
      setTimeout(() => {
        setShowPromo(false);
      }, 5000);
    }

    const { data: scoreData } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    setScores(scoreData || []);

    const { data: charityData } = await supabase
      .from("charities")
      .select("*")
      .order("name", { ascending: true });
    setCharities(charityData || []);

    const { data: winningsData } = await supabase
      .from("winners")
      .select("*")
      .eq("user_id", user.id)
      .order("drawn_at", { ascending: false });
    setWinnings(winningsData || []);

    const { data: settings } = await supabase
      .from("system_settings")
      .select("next_draw_date")
      .eq("id", 1)
      .maybeSingle();
    if (settings?.next_draw_date) setSystemNextDraw(settings.next_draw_date);

    setFetching(false);
  };

  const isActive = userProfile?.subscription_status === "active";
  const today = mounted ? new Date().toISOString().split("T")[0] : "";

  const triggerCheckout = async (planType: "monthly" | "yearly") => {
    setLoading(true);
    // Memorize the plan so we can force update the database when Stripe redirects back!
    localStorage.setItem("pendingSubscriptionPlan", planType);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error);
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) return toast.error("Active subscription required.");

    const scoreVal = parseInt(newScore);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45)
      return toast.error("Enter a valid score between 1 and 45.");
    if (new Date(newDate) > new Date())
      return toast.error("Cannot log scores for future dates.");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const tempId = `temp-${Date.now()}`;
      const tempScore = {
        id: tempId,
        user_id: user?.id,
        date: newDate,
        score: scoreVal,
      };
      const updatedScores = [...scores, tempScore].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (updatedScores.length > 5) setScores(updatedScores.slice(0, 5));
      else setScores(updatedScores);

      const { error: insertError } = await supabase
        .from("scores")
        .insert([{ user_id: user?.id, date: newDate, score: scoreVal }]);
      if (insertError) throw insertError;

      const { data: dbScores } = await supabase
        .from("scores")
        .select("id")
        .eq("user_id", user?.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (dbScores && dbScores.length > 5) {
        const idsToDelete = dbScores.slice(5).map((s) => s.id);
        await supabase.from("scores").delete().in("id", idsToDelete);
        toast.success("Score logged! Oldest score automatically replaced.");
      } else {
        toast.success("Score logged! Engine updated.");
      }

      setNewScore("");
      setNewDate("");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save score");
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const deleteScore = async (id: string) => {
    if (!isActive) return toast.error("Active subscription required.");
    if (!window.confirm("Are you sure you want to delete this score?")) return;
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (error) toast.error("Failed to delete score");
    else {
      toast.success("Score deleted");
      fetchData();
    }
  };

  const updateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) return toast.error("Active subscription required.");
    const scoreVal = parseInt(editDialog.score);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45)
      return toast.error("Enter a valid score between 1 and 45.");
    if (new Date(editDialog.date) > new Date())
      return toast.error("Cannot log scores for future dates.");

    setLoading(true);
    const { error } = await supabase
      .from("scores")
      .update({ score: scoreVal, date: editDialog.date })
      .eq("id", editDialog.id);
    if (error) toast.error("Failed to update score");
    else {
      toast.success("Score updated");
      setEditDialog({ isOpen: false, id: "", score: "", date: "" });
      fetchData();
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDialog.name.trim()) return toast.error("Name cannot be empty.");
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication error");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: profileDialog.name })
        .eq("id", user.id);
      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: profileDialog.name },
      });

      toast.success("Profile updated successfully!");
      setUserProfile({
        ...userProfile,
        name: profileDialog.name.split(" ")[0],
        full_name: profileDialog.name,
      });
      setProfileDialog({ isOpen: false, name: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCharityToggle = async (charityName: string) => {
    if (!isActive) return toast.error("Active subscription required.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let currentSelected = [...(userProfile.selected_charities || [])];
    if (currentSelected.includes(charityName))
      currentSelected = currentSelected.filter((c) => c !== charityName);
    else currentSelected.push(charityName);

    const newCharityString = currentSelected.join(",");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ selected_charity: newCharityString })
        .eq("id", user.id);
      if (error) throw error;
      setUserProfile({ ...userProfile, selected_charities: currentSelected });
      toast.success("Impact portfolio updated!");
    } catch (err: any) {
      toast.error("Failed to update charities.");
    }
  };

  const savePercentageChange = async (newVal: number) => {
    setCharityPercentage(newVal);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ charity_percentage: newVal })
      .eq("id", user.id);
    if (error) toast.error("Failed to save percentage.");
    else toast.success(`Contribution updated to ${newVal}%`);
  };

  const rollingAvg =
    scores.length > 0
      ? (
          scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length
        ).toFixed(1)
      : "0.0";
  const isQualified = scores.length >= 5 && isActive;
  const bestScore =
    scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : null;
  const bestRound =
    bestScore !== null ? scores.find((s) => s.score === bestScore) : null;
  const bestScoreInfo = {
    score: bestScore,
    dateStr: bestRound
      ? new Date(bestRound.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };

  const totalWon = winnings.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingWinnings = winnings.filter((w) => w.status === "pending");

  const getNextDrawDate = () => {
    if (systemNextDraw)
      return new Date(systemNextDraw).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );
  };

  const getRenewalDate = () => {
    if (userProfile?.current_period_end) {
      return `Renews ${new Date(
        userProfile.current_period_end
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    const d = new Date();
    if (userProfile?.subscription_plan === "yearly") {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return `Renews ${d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f4fcf7] dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 transition-colors duration-500 relative flex flex-col font-sans">
      {/* 5-SECOND PROMO MODAL */}
      {showPromo && (
        <div className="fixed inset-x-0 top-24 z-[100] flex justify-center px-4 animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-none">
          <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl shadow-emerald-900/20 rounded-2xl p-4 flex items-center gap-4 max-w-md pointer-events-auto">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full text-white shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                Unlock the Engine
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Subscribe now to log scores, support charities, and enter the
                jackpot.
              </p>
            </div>
            <button
              onClick={() => {
                setShowPromo(false);
                setUpgradeDialog(true);
              }}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition-transform"
            >
              Upgrade
            </button>
            <button
              onClick={() => setShowPromo(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="border-b border-emerald-900/5 dark:border-slate-800/50 bg-white/60 dark:bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-40 h-16 flex items-center px-6 md:px-12 justify-between">
        <Link href="/" className="text-xl font-black tracking-tighter">
          DIGITAL<span className="text-emerald-600">HEROES</span>
        </Link>
        <div className="flex items-center gap-6">
          <button
            onClick={() =>
              setProfileDialog({
                isOpen: true,
                name: userProfile?.full_name || "",
              })
            }
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          {userProfile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-200/50 hover:bg-emerald-100 transition-all uppercase tracking-widest shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Command Center
            </Link>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-sm font-bold text-rose-600 bg-white dark:bg-rose-500/10 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-rose-50 border border-rose-100 dark:border-rose-900 shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex-grow w-full z-10 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                {userProfile?.name}
              </span>
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              {isQualified ? (
                <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
                  ✅ Qualified for Next Draw
                </span>
              ) : (
                <span className="text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg">
                  {!isActive
                    ? "❌ Inactive Subscription"
                    : `❌ Needs ${Math.max(0, 5 - scores.length)} more scores`}
                </span>
              )}
            </p>
          </div>
          {/* Mobile Profile Setting Trigger */}
          <button
            onClick={() =>
              setProfileDialog({
                isOpen: true,
                name: userProfile?.full_name || "",
              })
            }
            className="sm:hidden p-2 text-slate-400 hover:text-emerald-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase tracking-widest">
                  Subscription
                </h3>
              </div>
              {isActive && (
                <span className="text-xs text-slate-400 font-medium">
                  {getRenewalDate()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-2xl lg:text-3xl font-black capitalize flex items-center gap-3 text-slate-800 dark:text-white">
                <span
                  className={`h-3 w-3 rounded-full shrink-0 ${
                    isActive
                      ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                ></span>
                {userProfile?.subscription_plan === "yearly"
                  ? "Yearly"
                  : "Monthly"}{" "}
                Plan
              </div>
              <div className="text-sm font-bold text-slate-500">
                Status:{" "}
                <span
                  className={isActive ? "text-emerald-600" : "text-rose-500"}
                >
                  {userProfile?.subscription_status?.replace("_", " ") ||
                    "Inactive"}
                </span>
              </div>
              {!isActive && (
                <button
                  onClick={() => setUpgradeDialog(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Coins className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-widest">
                Lifetime Winnings
              </h3>
            </div>
            <div className="text-4xl font-black text-amber-500 mb-2">
              ${totalWon.toFixed(2)}
            </div>
            <p className="text-sm font-bold text-slate-500">
              {pendingWinnings.length > 0 ? (
                <span className="text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md text-xs uppercase tracking-wider">
                  $
                  {pendingWinnings.reduce((a, c) => a + c.amount, 0).toFixed(2)}{" "}
                  Pending Payout
                </span>
              ) : (
                "All payouts settled"
              )}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 text-indigo-500">
              <Gift className="w-5 h-5" />
              <h3 className="font-bold text-xs uppercase tracking-widest">
                Draw Summary
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 font-medium">
                  Draws Entered
                </span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {winnings.length + (isQualified ? 1 : 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">
                  Next Draw
                </span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {getNextDrawDate()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden min-h-[320px]">
            {!isActive && (
              <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/70 dark:bg-[#0B1120]/80 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="font-black text-2xl mb-2 text-slate-900 dark:text-white">
                  Pro Feature Locked
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-sm">
                  Activate your subscription to direct up to 50% of your fee to
                  the charities of your choice.
                </p>
                <button
                  onClick={() => setUpgradeDialog(true)}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/20 hover:scale-105"
                >
                  Upgrade Now
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2 text-rose-500">
                <Heart className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase tracking-widest">
                  Your Impact Portfolio
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-500">
                  Contribution Rate:
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={charityPercentage}
                    onChange={(e) =>
                      setCharityPercentage(parseInt(e.target.value))
                    }
                    onMouseUp={(e) =>
                      savePercentageChange(
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    onTouchEnd={(e) =>
                      savePercentageChange(
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    className="w-24 accent-rose-500"
                  />
                  <span className="font-black text-rose-500 w-10 text-right">
                    {charityPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-6 font-medium">
              Select the organizations you wish to support. You are currently
              directing{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                $
                {(
                  ((userProfile?.subscription_plan === "yearly"
                    ? subAmount / 12
                    : subAmount) *
                    charityPercentage) /
                  100
                ).toFixed(2)}
                /mo
              </strong>{" "}
              to impact. (Max 50%)
            </p>

            {charities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {charities.map((c) => {
                  const isSelected = userProfile?.selected_charities?.includes(
                    c.name
                  );
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleCharityToggle(c.name)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all hover:-translate-y-0.5 ${
                        isSelected
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 shadow-sm"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <span
                          className={`font-bold text-sm line-clamp-1 ${
                            isSelected
                              ? "text-rose-700 dark:text-rose-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {c.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoCharity(c);
                          }}
                          className="p-1.5 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 transition-all"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "bg-rose-500 border-rose-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm font-bold text-slate-400 p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                Awaiting Admin Charities
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                <Trophy className="w-5 h-5" />
                <h3 className="font-bold text-xs uppercase tracking-widest">
                  Golf Engine Stats
                </h3>
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <div className="text-5xl font-black text-slate-800 dark:text-white">
                  {rollingAvg}
                </div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Rolling Avg
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Best Stableford
              </div>
              {bestScoreInfo.score ? (
                <>
                  <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    {bestScoreInfo.score} pts
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {bestScoreInfo.dateStr}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-slate-400 dark:text-white">
                  —
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm h-fit relative overflow-hidden min-h-[320px]">
            {!isActive && (
              <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/70 dark:bg-[#0B1120]/80 flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem]">
                <div className="p-3 bg-emerald-500/10 rounded-full mb-3">
                  <Lock className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-black text-xl mb-2 text-slate-900 dark:text-white">
                  Engine Locked
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 max-w-[200px]">
                  Activate to log scores and enter draws.
                </p>
                <button
                  onClick={() => setUpgradeDialog(true)}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all hover:scale-105"
                >
                  Upgrade
                </button>
              </div>
            )}

            <h3 className="font-black text-xl mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" /> Log Score
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Stableford format. Once 5 entries are reached, new scores
              automatically replace the oldest.
            </p>
            <form onSubmit={handleScoreSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Date of Round
                </label>
                <input
                  type="date"
                  required
                  max={today}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Stableford Score
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="e.g., 32"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !isActive}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] mt-2"
              >
                {loading ? "Calculating..." : "Submit Score"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col min-h-[400px]">
            <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white">
              Engine Feed (Rolling 5)
            </h3>

            {fetching ? (
              <div className="flex-grow flex items-center justify-center animate-pulse text-emerald-600/50 font-bold uppercase tracking-widest">
                Syncing Engine...
              </div>
            ) : scores.length > 0 ? (
              <div className="space-y-4">
                {scores.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl transition-all hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                        {new Date(s.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {isActive && (
                        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4 border-r border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() =>
                              setEditDialog({
                                isOpen: true,
                                id: s.id,
                                score: s.score.toString(),
                                date: s.date,
                              })
                            }
                            className="text-indigo-400 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteScore(s.id)}
                            className="text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 w-24 justify-end">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest">
                          SCORE
                        </span>
                        <span className="text-3xl font-black text-emerald-600">
                          {s.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  No rounds logged yet
                </p>
                <p className="text-sm mt-2 text-slate-500 font-medium">
                  {isActive
                    ? "Log your first score to activate the engine."
                    : "Subscribe to start logging scores."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}

      {/* Profile Settings Modal */}
      {profileDialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-8 relative">
            <button
              onClick={() =>
                setProfileDialog({ ...profileDialog, isOpen: false })
              }
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-2xl mb-2 text-slate-800 dark:text-white">
              Profile Settings
            </h3>
            <p className="text-sm text-slate-500 mb-8">
              Update your display name across the platform.
            </p>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileDialog.name}
                  onChange={(e) =>
                    setProfileDialog({ ...profileDialog, name: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all mt-4"
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {infoCharity && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative">
            <button
              onClick={() => setInfoCharity(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 relative w-full">
              {infoCharity.image_url ? (
                <img
                  src={infoCharity.image_url}
                  alt={infoCharity.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex w-full h-full items-center justify-center">
                  <Building className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
            </div>
            <div className="p-8 pt-0 relative z-10">
              <h3 className="font-black text-3xl mb-4 text-slate-800 dark:text-white">
                {infoCharity.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 font-medium leading-relaxed max-h-48 overflow-y-auto pr-2">
                {infoCharity.description || "No description provided."}
              </p>
              <button
                onClick={() => {
                  handleCharityToggle(infoCharity.name);
                  setInfoCharity(null);
                }}
                className={`w-full font-bold rounded-xl py-4 text-sm transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${
                  userProfile?.selected_charities?.includes(infoCharity.name)
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 shadow-none border border-rose-200 dark:border-rose-500/30"
                    : "bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600"
                }`}
              >
                {userProfile?.selected_charities?.includes(infoCharity.name)
                  ? "Remove from Portfolio"
                  : "Add to Impact Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCongrats && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-emerald-300 dark:border-emerald-800 p-10 relative text-center">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-5 rounded-full inline-block mb-6 shadow-md shadow-emerald-900/20">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="font-black text-3xl mb-4 text-slate-800 dark:text-white">
              Congratulations!
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-8 font-medium leading-relaxed">
              Your Pro subscription is now active. You are officially part of
              the golf engine. Together, we're making a real impact on our
              chosen charities. 🌍 Thank you! Click OKAY to explore your
              unlocked dashboard.
            </p>
            <button
              onClick={() => {
                setShowCongrats(false);
                router.replace("/dashboard");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-4 text-sm transition-all hover:scale-[1.02] shadow-xl shadow-emerald-900/30 active:scale-95"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {upgradeDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 p-8 relative flex flex-col">
            <button
              onClick={() => setUpgradeDialog(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-black text-3xl mb-3 text-slate-800 dark:text-white">
                Upgrade to Pro
              </h3>
              <p className="text-slate-500">
                Join the engine. Direct your impact. Win the draw.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div
                onClick={() => setSelectedPlan("monthly")}
                className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col ${
                  selectedPlan === "monthly"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 shadow-md"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg">Monthly</h4>
                  {selectedPlan === "monthly" && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-black">$25</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-3 flex-grow text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Enter monthly
                    draws
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Direct up to
                    50% ($12.50) to Charity
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Log and track
                    scores
                  </li>
                </ul>
              </div>
              <div
                onClick={() => setSelectedPlan("yearly")}
                className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col ${
                  selectedPlan === "yearly"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 shadow-md"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
                }`}
              >
                <div className="absolute -top-3.5 right-6 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Hassle-Free Annual
                </div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg">Yearly</h4>
                  {selectedPlan === "yearly" && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-black">$250</span>
                  <span className="text-slate-500">/yr</span>
                </div>
                <ul className="space-y-3 flex-grow text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> All Monthly
                    Features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Direct up to
                    $125 to Charity
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Hassle-free
                    uninterrupted access
                  </li>
                </ul>
              </div>
            </div>
            <button
              disabled={loading}
              onClick={() => triggerCheckout(selectedPlan)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-4 text-lg font-bold shadow-xl hover:scale-[1.02] transition-transform active:scale-95"
            >
              {loading
                ? "Preparing Checkout..."
                : `Subscribe ${
                    selectedPlan === "monthly" ? "Monthly" : "Yearly"
                  }`}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secure payment powered by Stripe
            </p>
          </div>
        </div>
      )}

      {editDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-8 relative">
            <button
              onClick={() => setEditDialog({ ...editDialog, isOpen: false })}
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-2xl mb-2 text-slate-800 dark:text-white">
              Edit Score
            </h3>
            <p className="text-sm text-slate-500 mb-8">
              Update your historical round data.
            </p>
            <form onSubmit={updateScore} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Date of Round
                </label>
                <input
                  type="date"
                  required
                  max={today}
                  value={editDialog.date}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, date: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-base focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Stableford Score
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  value={editDialog.score}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, score: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-base focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all mt-4"
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          ::-webkit-scrollbar { height: 6px; width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
          .dark ::-webkit-scrollbar-thumb { background-color: #334155; }
        `}
      </style>
    </div>
  );
}
