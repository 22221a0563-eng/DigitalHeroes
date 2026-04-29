"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Users,
  Gift,
  Trophy,
  ShieldCheck,
  PlayCircle,
  Heart,
  LogOut,
  Activity,
  RefreshCcw,
  Building,
  BarChart3,
  Image as ImageIcon,
  Trash2,
  Key,
  Edit3,
  Settings,
  X,
  Plus,
  AlertTriangle,
  Megaphone,
  UploadCloud,
  Wallet,
  Search,
  Calendar,
  PieChart,
  CreditCard,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "users" | "draws" | "winners" | "charities" | "media"
  >("analytics");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [charities, setCharities] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [simResults, setSimResults] = useState<any>(null);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [winnerSearch, setWinnerSearch] = useState("");
  const [winnerFilter, setWinnerFilter] = useState("all");
  const [charitySearch, setCharitySearch] = useState("");

  const [charityStats, setCharityStats] = useState<
    { name: string; amount: number }[]
  >([]);

  const [stats, setStats] = useState({
    userCount: 0,
    activeSubs: 0,
    totalRevenue: 0,
    totalImpact: 0,
    nextPrizePool: 0,
    rolloverPool: 0,
    pendingPayouts: 0,
    totalPaidOut: 0,
    topCharityName: "None",
    topCharityAmount: 0,
  });

  const [fetching, setFetching] = useState(true);
  const [drawMode, setDrawMode] = useState<"algorithm" | "random">("algorithm");

  // Editable Global Settings
  const [nextDrawDate, setNextDrawDate] = useState("");
  const [manualRollover, setManualRollover] = useState("0");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [charityDialog, setCharityDialog] = useState({
    isOpen: false,
    mode: "add",
    id: "",
    name: "",
    desc: "",
    imageUrl: "",
  });
  const [scoreDialog, setScoreDialog] = useState({
    isOpen: false,
    userId: "",
    val: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const router = useRouter();
  const supabase = createClient();

  const fetchAdminData = async () => {
    setFetching(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data: allUsers } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: settings } = await supabase
      .from("system_settings")
      .select("current_jackpot_rollover, next_draw_date")
      .eq("id", 1)
      .maybeSingle();
    const { data: winnersData } = await supabase
      .from("winners")
      .select("*, profiles(full_name, email)")
      .order("drawn_at", { ascending: false });

    if (settings) {
      if (settings.next_draw_date)
        setNextDrawDate(settings.next_draw_date.split("T")[0]);
      if (settings.current_jackpot_rollover !== undefined)
        setManualRollover(settings.current_jackpot_rollover.toString());
    }

    if (allUsers) {
      setSystemUsers(allUsers);
      let activeCount = 0;
      let dynamicImpact = 0;
      let dynamicPrizePool = 0;
      let totalRev = 0;
      const charityTotals: Record<string, number> = {};

      allUsers.forEach((u) => {
        if (u.subscription_status === "active") {
          activeCount++;

          const isYearly = u.subscription_plan === "yearly";
          const subAmount = isYearly ? 250.0 : 25.0;
          const charityPct = u.charity_percentage
            ? Number(u.charity_percentage)
            : 50.0;

          totalRev += subAmount;

          const monthlyValue = isYearly ? subAmount / 12 : subAmount;
          const impactShare = monthlyValue * (charityPct / 100);
          const prizeShare = monthlyValue - impactShare;

          dynamicImpact += impactShare;
          dynamicPrizePool += prizeShare;

          const chosenCharities = u.selected_charity
            ? u.selected_charity
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [];
          if (chosenCharities.length > 0) {
            const splitImpact = impactShare / chosenCharities.length;
            chosenCharities.forEach((cName: string) => {
              charityTotals[cName] = (charityTotals[cName] || 0) + splitImpact;
            });
          } else {
            charityTotals["Unallocated Funds"] =
              (charityTotals["Unallocated Funds"] || 0) + impactShare;
          }
        }
      });

      const currentRollover = settings?.current_jackpot_rollover || 0;
      let paidOut = 0;
      let pendingPay = 0;

      if (winnersData) {
        setWinners(winnersData);
        winnersData.forEach((w) => {
          if (w.status === "paid") paidOut += w.amount;
          if (w.status === "pending") pendingPay += w.amount;
        });
      }

      const grossPool = dynamicPrizePool + currentRollover;

      const sortedCharities = Object.entries(charityTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      setCharityStats(sortedCharities);

      setStats({
        userCount: allUsers.length,
        activeSubs: activeCount,
        totalRevenue: totalRev,
        totalImpact: dynamicImpact,
        nextPrizePool: grossPool,
        rolloverPool: currentRollover,
        pendingPayouts: pendingPay,
        totalPaidOut: paidOut,
        topCharityName:
          sortedCharities.length > 0 ? sortedCharities[0].name : "N/A",
        topCharityAmount:
          sortedCharities.length > 0 ? sortedCharities[0].amount : 0,
      });
    }

    const { data: charityData } = await supabase
      .from("charities")
      .select("*")
      .order("name", { ascending: true });
    if (charityData) setCharities(charityData);

    const { data: mediaData } = await supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (mediaData) setMediaAssets(mediaData);

    setFetching(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, [router, supabase]);

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => setConfirmDialog({ isOpen: true, title, message, onConfirm });
  const closeConfirm = () =>
    setConfirmDialog({ ...confirmDialog, isOpen: false });

  const filteredUsers = systemUsers.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter =
      userFilter === "all" || u.subscription_status === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredWinners = winners.filter((w) => {
    const matchesSearch =
      (w.profiles?.full_name || "")
        .toLowerCase()
        .includes(winnerSearch.toLowerCase()) ||
      (w.profiles?.email || "")
        .toLowerCase()
        .includes(winnerSearch.toLowerCase());
    const matchesFilter = winnerFilter === "all" || w.status === winnerFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredCharities = charities.filter((c) =>
    (c.name || "").toLowerCase().includes(charitySearch.toLowerCase())
  );

  // --- SETTINGS / ADMIN CONTROLS ---
  const saveGlobalSettings = async () => {
    setLoading(true);
    setLoadingAction("saveSettings");
    const secureDateStr = nextDrawDate ? `${nextDrawDate}T12:00:00Z` : null;
    const rolloverVal = parseFloat(manualRollover);

    const { error } = await supabase.from("system_settings").upsert({
      id: 1,
      next_draw_date: secureDateStr,
      current_jackpot_rollover: isNaN(rolloverVal) ? 0 : rolloverVal,
    });

    if (error) {
      toast.error(`DB Error: ${error.message}`);
    } else {
      toast.success("Global settings updated securely! Analytics refreshed.");
      fetchAdminData();
    }
    setLoading(false);
    setLoadingAction("");
  };

  // --- USER MANAGEMENT ---
  const updateUserStatus = async (userId: string, newStatus: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: newStatus })
      .eq("id", userId);
    if (error) toast.error(`Status Update Failed: ${error.message}`);
    else {
      toast.success(
        `User marked as ${newStatus.replace("_", " ").toUpperCase()}`
      );
      fetchAdminData();
    }
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    const newAmount = newPlan === "yearly" ? 250 : 25;
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_plan: newPlan, subscription_amount: newAmount })
      .eq("id", userId);
    if (error) toast.error(`Plan Update Failed: ${error.message}`);
    else {
      toast.success(`User forcefully upgraded to ${newPlan.toUpperCase()}`);
      fetchAdminData();
    }
  };

  const deleteUserCompletely = async (userId: string) => {
    requestConfirm(
      "Delete User",
      "WARNING: This permanently deletes the user account and all data. Proceed?",
      async () => {
        closeConfirm();
        setLoading(true);
        try {
          const res = await fetch("/api/admin/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success("User permanently deleted.");
          fetchAdminData();
        } catch (err: any) {
          toast.error(`Delete Failed: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleForcePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6)
      return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password forcibly changed!");
      setNewPassword("");
    } catch (err: any) {
      toast.error(`Password Change Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = async (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    setUserScores(scores || []);
  };
  const closeUserModal = () => {
    setSelectedUser(null);
    setUserScores([]);
  };

  const updateScore = async (scoreId: string, newValue: number) => {
    if (newValue < 1 || newValue > 45) return toast.error("Score must be 1-45");
    const { error } = await supabase
      .from("scores")
      .update({ score: newValue })
      .eq("id", scoreId);
    if (!error) {
      toast.success("Score updated");
      openUserModal(selectedUser);
    }
  };

  const deleteScore = async (scoreId: string) => {
    requestConfirm("Delete Score", "Remove this score log?", async () => {
      closeConfirm();
      await supabase.from("scores").delete().eq("id", scoreId);
      toast.success("Score deleted");
      openUserModal(selectedUser);
    });
  };

  const submitManualScore = async () => {
    const scoreVal = parseInt(scoreDialog.val);
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45)
      return toast.error("Enter a valid score (1-45)");
    const { error } = await supabase.from("scores").insert([
      {
        user_id: scoreDialog.userId,
        score: scoreVal,
        date: new Date().toISOString(),
      },
    ]);
    if (error) toast.error(`Add Score Failed: ${error.message}`);
    else {
      toast.success("Score added");
      setScoreDialog({ isOpen: false, userId: "", val: "" });
      openUserModal(selectedUser);
    }
  };

  // --- DRAW ENGINE ---
  const handleAnnounceDraw = async () => {
    requestConfirm(
      "Announce Draw",
      "Send an email to all active users announcing today is draw day?",
      async () => {
        closeConfirm();
        setLoading(true);
        setLoadingAction("announce");
        try {
          const res = await fetch("/api/admin/announce-draw", {
            method: "POST",
          });
          if (!res.ok) throw new Error(await res.text());
          toast.success("Draw announcement emails dispatched!");
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setLoading(false);
          setLoadingAction("");
        }
      }
    );
  };

  const handleSimulateDraw = async (isTest: boolean = false) => {
    setLoading(true);
    setLoadingAction(isTest ? "test" : "simulate");
    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "simulation",
          drawType: drawMode,
          isTest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSimResults({ ...data, isTest });
      toast.success(data.message || "Simulation complete!");
    } catch (error: any) {
      toast.error(`Draw Engine Error: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const handlePublishLinkedDraw = async () => {
    if (!simResults)
      return toast.error("You must run a Simulation first before publishing!");
    if (simResults.isTest)
      return toast.error("Test simulations cannot be published.");

    requestConfirm(
      "Publish Current Simulation",
      "Are you sure you want to publish the exact results shown below? This will update ledgers and send winner emails.",
      async () => {
        closeConfirm();
        setLoading(true);
        setLoadingAction("publish");
        try {
          const res = await fetch("/api/draw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "publish", simData: simResults }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setSimResults(null);
          toast.success("Draw Officially Published & Emails Sent!");
          await fetchAdminData();
        } catch (error: any) {
          toast.error(`Publish Error: ${error.message}`);
        } finally {
          setLoading(false);
          setLoadingAction("");
        }
      }
    );
  };

  // --- WINNER ACTIONS ---
  const toggleWinnerStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "paid" : "pending";
    requestConfirm(
      "Change Payment Status",
      `Mark this winner as ${newStatus.toUpperCase()}? This will immediately balance the Paid vs Pending analytics.`,
      async () => {
        closeConfirm();
        setLoading(true);
        try {
          if (newStatus === "paid") {
            const res = await fetch("/api/admin/winners/pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ winnerId: id }),
            });
            if (!res.ok) throw new Error(await res.text());
          } else {
            const { error } = await supabase
              .from("winners")
              .update({ status: "pending" })
              .eq("id", id);
            if (error) throw error;
          }
          toast.success(`Winner marked as ${newStatus}! Analytics balanced.`);
          await fetchAdminData();
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const deleteWinner = async (id: string) => {
    requestConfirm(
      "Delete Winner Record",
      "Are you sure you want to delete this record? Funds will be removed from Paid/Pending metrics.",
      async () => {
        closeConfirm();
        setLoading(true);
        try {
          const { error } = await supabase
            .from("winners")
            .delete()
            .eq("id", id);
          if (error) throw error;
          toast.success("Winner record deleted.");
          await fetchAdminData();
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // --- CHARITIES & MEDIA ---
  const uploadCharityImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `charity_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(fileName);
      setCharityDialog((prev) => ({ ...prev, imageUrl: publicUrl }));
      toast.success("Charity image uploaded!");
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCharity = async () => {
    if (!charityDialog.name) return toast.error("Charity name is required");
    if (
      charityDialog.mode === "add" &&
      charities.some(
        (c) => c.name.toLowerCase() === charityDialog.name.toLowerCase()
      )
    ) {
      return toast.error("A charity with this exact name already exists!");
    }

    const payload = {
      name: charityDialog.name,
      description: charityDialog.desc || "Official Impact Partner",
      image_url: charityDialog.imageUrl,
    };

    if (charityDialog.mode === "add") {
      const { error } = await supabase.from("charities").insert([payload]);
      if (!error) {
        toast.success("Charity added");
        fetchAdminData();
      }
    } else {
      const { error } = await supabase
        .from("charities")
        .update(payload)
        .eq("id", charityDialog.id);
      if (!error) {
        toast.success("Charity updated");
        fetchAdminData();
      }
    }
    setCharityDialog({
      isOpen: false,
      mode: "add",
      id: "",
      name: "",
      desc: "",
      imageUrl: "",
    });
  };

  const deleteCharity = async (id: string) => {
    requestConfirm(
      "Remove Charity",
      "Are you sure you want to remove this charity from the ledger?",
      async () => {
        closeConfirm();
        await supabase.from("charities").delete().eq("id", id);
        toast.success("Charity removed");
        fetchAdminData();
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(fileName);
      await supabase
        .from("media_assets")
        .insert([{ url: publicUrl, name: file.name }]);
      toast.success("Image uploaded successfully!");
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (id: string) => {
    requestConfirm(
      "Delete Media",
      "Delete this image from the database?",
      async () => {
        closeConfirm();
        await supabase.from("media_assets").delete().eq("id", id);
        fetchAdminData();
      }
    );
  };

  // Reusable Skeleton Component for the tabs
  const TabSkeleton = ({ type }: { type: string }) => {
    if (type === "analytics") {
      return (
        <div className="space-y-6 flex-1 w-full animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 sm:h-32 bg-slate-200 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="h-60 sm:h-72 bg-slate-200 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl animate-pulse lg:col-span-1" />
            <div className="h-60 sm:h-72 bg-slate-200 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl animate-pulse lg:col-span-2" />
          </div>
        </div>
      );
    }
    if (type === "table") {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200/50 shadow-sm p-4 md:p-6 w-full flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <div className="h-10 bg-slate-200 dark:bg-slate-800/50 rounded-xl animate-pulse mb-6 w-1/2 md:w-1/3 shrink-0" />
          <div className="space-y-3 md:space-y-4 flex-1 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 sm:h-16 bg-slate-200 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl animate-pulse w-full"
              />
            ))}
          </div>
        </div>
      );
    }
    if (type === "charities") {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200/50 shadow-sm p-4 md:p-8 w-full max-w-4xl flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <div className="h-10 bg-slate-200 dark:bg-slate-800/50 rounded-xl animate-pulse mb-6 md:mb-8 w-2/3 md:w-1/2 shrink-0" />
          <div className="space-y-3 md:space-y-4 flex-1 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 sm:h-28 bg-slate-200 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl animate-pulse w-full"
              />
            ))}
          </div>
        </div>
      );
    }
    if (type === "media") {
      return (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-12 md:p-16 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/50 shadow-sm w-full animate-in fade-in duration-300">
          <div className="h-10 bg-slate-200 dark:bg-slate-800/50 rounded-xl animate-pulse mb-10 w-1/2 md:w-1/3 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 sm:h-40 bg-slate-200 dark:bg-slate-800/50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col font-sans relative text-base overflow-hidden">
      {/* NAVIGATION BAR */}
      <nav className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-900 dark:bg-black text-white px-4 md:px-8 h-16 flex justify-between items-center z-30 shrink-0">
        <div className="font-black text-lg flex items-center gap-2 tracking-tighter">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="hidden sm:inline">COMMAND</span>{" "}
          <span className="text-emerald-400">CENTER</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={fetchAdminData}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <RefreshCcw
              className={`w-4 h-4 md:w-5 md:h-5 ${
                fetching ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-sm font-bold text-slate-300 hover:text-rose-400 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />{" "}
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </nav>

      {/* RESPONSIVE LAYOUT BODY */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* RESPONSIVE SIDEBAR */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl p-3 md:p-6 shrink-0 flex md:flex-col z-20 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <div className="flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-2 min-w-max md:min-w-0">
            {[
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "users", label: "User Control", icon: Users },
              { id: "draws", label: "Draw Engine", icon: Gift },
              { id: "winners", label: "Winners Hub", icon: Trophy },
              { id: "charities", label: "Charity Funds", icon: Building },
              { id: "media", label: "Media Assets", icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 md:gap-4 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 md:w-5 md:h-5 ${
                    activeTab === tab.id ? "text-white" : "text-slate-400"
                  }`}
                />
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 flex justify-center z-10 w-full relative custom-scrollbar">
          <div className="w-full max-w-7xl mx-auto flex flex-col min-h-full pb-8">
            <h1 className="text-2xl md:text-3xl font-black capitalize tracking-tight mb-6 shrink-0 flex items-center gap-2 md:gap-3">
              {activeTab.replace("-", " ")}{" "}
              <span className="text-emerald-600">Module</span>
            </h1>

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" &&
              (fetching ? (
                <TabSkeleton type="analytics" />
              ) : (
                <div className="space-y-4 md:space-y-6 flex-1 w-full animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm border-b-4 border-b-indigo-500">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2">
                        Total Revenue
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-indigo-500">
                        ${stats.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm border-b-4 border-b-rose-500">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" /> Total Impact
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-rose-500">
                        ${stats.totalImpact.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm border-b-4 border-b-emerald-500">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" /> Next Prize Pool
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                        ${stats.nextPrizePool.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm border-b-4 border-b-amber-500">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Pending Payouts
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-500">
                        ${stats.pendingPayouts.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm border-b-4 border-b-slate-800 lg:col-span-1 sm:col-span-2">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" /> Lifetime Paid Out
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                        ${stats.totalPaidOut.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-sm lg:col-span-1 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-amber-100 uppercase mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> 5-Match Rollover
                        </p>
                        <p className="text-4xl sm:text-5xl font-black mb-2">
                          ${stats.rolloverPool.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-amber-50 font-medium">
                          Rolls forward strictly when no user matches all 5
                          numbers. (Editable in Draws tab)
                        </p>
                      </div>
                      <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 md:w-40 md:h-40 opacity-20 text-white" />
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm flex flex-col max-h-64 sm:max-h-72">
                      <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
                        <h3 className="font-bold text-sm sm:text-base md:text-lg flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />{" "}
                          Active Fund Distribution
                        </h3>
                      </div>
                      <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                        {charityStats.length > 0 ? (
                          charityStats.map((charity, idx) => {
                            const maxAmount = charityStats[0].amount || 1;
                            const percentage =
                              (charity.amount / maxAmount) * 100;
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 sm:gap-4"
                              >
                                <div
                                  className="w-1/3 truncate text-[11px] sm:text-sm font-bold text-slate-600 dark:text-slate-300"
                                  title={charity.name}
                                >
                                  {charity.name}
                                </div>
                                <div className="flex-1 h-2 sm:h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="w-16 sm:w-20 text-right text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                  ${charity.amount.toFixed(2)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs sm:text-sm text-slate-400 font-medium py-4">
                            No active subscriptions currently funding charities.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* USERS TAB */}
            {activeTab === "users" &&
              (fetching ? (
                <TabSkeleton type="table" />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm flex flex-col h-[calc(100dvh-200px)] md:h-[calc(100vh-220px)] shrink-0 animate-in fade-in duration-300">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 shrink-0 rounded-t-2xl sm:rounded-t-3xl">
                    <div className="w-full lg:w-auto flex justify-between lg:block">
                      <h3 className="font-bold text-base sm:text-lg">
                        User Directory
                      </h3>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        {stats.userCount} Profiles
                      </span>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full lg:w-auto flex-col sm:flex-row">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto custom-scrollbar relative rounded-b-2xl sm:rounded-b-3xl">
                    <table className="w-full text-left text-sm relative min-w-[700px] mb-4">
                      <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm z-10 shadow-sm font-black text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">
                        <tr>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">Hero</th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">
                            Plan Override
                          </th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">Status</th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5 text-center">
                            Manage
                          </th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5 text-right">
                            Delete
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="px-4 py-3 sm:px-6 sm:py-5">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-base sm:text-lg shrink-0">
                                  {(
                                    user.full_name?.[0] ||
                                    user.email?.[0] ||
                                    "H"
                                  ).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm sm:text-base line-clamp-1">
                                    {user.full_name || "Anonymous Hero"}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-slate-400 lowercase line-clamp-1">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-5">
                              <select
                                value={user.subscription_plan || "monthly"}
                                onChange={(e) =>
                                  updateUserPlan(user.id, e.target.value)
                                }
                                className="px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all outline-none cursor-pointer"
                              >
                                <option value="monthly">Monthly ($25)</option>
                                <option value="yearly">Yearly ($250)</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-5">
                              <select
                                value={user.subscription_status || "inactive"}
                                onChange={(e) =>
                                  updateUserStatus(user.id, e.target.value)
                                }
                                className={`px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all outline-none cursor-pointer appearance-none ${
                                  user.subscription_status === "active"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : user.subscription_status === "canceled" ||
                                      user.subscription_status === "past_due"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <option value="inactive">INACTIVE</option>
                                <option value="active">ACTIVE</option>
                                <option value="canceled">CANCELED</option>
                                <option value="past_due">PAST DUE</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-5 text-center">
                              <button
                                onClick={() => openUserModal(user)}
                                className="px-3 py-1.5 sm:px-5 sm:py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-indigo-100 transition-all flex items-center gap-1 sm:gap-2 mx-auto whitespace-nowrap"
                              >
                                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                                Options
                              </button>
                            </td>
                            <td className="px-4 py-3 sm:px-6 sm:py-5 text-right">
                              <button
                                onClick={() => deleteUserCompletely(user.id)}
                                className="p-2 sm:p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-20 text-center text-slate-400 font-medium text-xs sm:text-sm"
                            >
                              No users match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

            {/* DRAWS TAB */}
            {activeTab === "draws" && (
              <div className="space-y-4 md:space-y-6 flex-1 w-full animate-in fade-in duration-300 pb-12 md:pb-20">
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm max-w-3xl">
                  <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />{" "}
                    Global System Settings
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 sm:mb-6">
                    <div className="flex-1 w-full">
                      <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 block">
                        Next Draw Date
                      </label>
                      <input
                        type="date"
                        value={nextDrawDate}
                        onChange={(e) => setNextDrawDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 block">
                        Manual Rollover Override ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualRollover}
                        onChange={(e) => setManualRollover(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:border-amber-500 text-amber-600 font-bold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveGlobalSettings}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-all hover:bg-indigo-700 flex justify-center items-center gap-2"
                  >
                    {loading && loadingAction === "saveSettings" ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : null}
                    {loading && loadingAction === "saveSettings"
                      ? "SAVING..."
                      : "Save Global Settings"}
                  </button>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
                    This will instantly update the User Dashboards and Rollover
                    Analytics.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm max-w-3xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">
                        Draw Configuration
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Select engine logic before running.
                      </p>
                    </div>
                    <button
                      onClick={handleAnnounceDraw}
                      disabled={loading}
                      className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      {loading && loadingAction === "announce" ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                      {loading && loadingAction === "announce"
                        ? "SENDING..."
                        : "Announce Draw"}
                    </button>
                  </div>

                  <div className="flex gap-2 sm:gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 sm:mb-8">
                    <button
                      onClick={() => setDrawMode("algorithm")}
                      className={`flex-1 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        drawMode === "algorithm"
                          ? "bg-white dark:bg-slate-900 shadow-sm text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      Performance
                    </button>
                    <button
                      onClick={() => setDrawMode("random")}
                      className={`flex-1 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        drawMode === "random"
                          ? "bg-white dark:bg-slate-900 shadow-sm text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      Random
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleSimulateDraw(true)}
                      disabled={loading}
                      className="flex-1 py-3 sm:py-4 border-2 border-indigo-500 text-indigo-500 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading && loadingAction === "test" ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      {loading && loadingAction === "test"
                        ? "WAIT..."
                        : "TEST RUN"}
                    </button>
                    <button
                      onClick={() => handleSimulateDraw(false)}
                      disabled={loading}
                      className="flex-1 py-3 sm:py-4 border-2 border-emerald-600 text-emerald-600 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading && loadingAction === "simulate" ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      {loading && loadingAction === "simulate"
                        ? "WAIT..."
                        : "SIMULATE DRAW"}
                    </button>
                    <button
                      onClick={handlePublishLinkedDraw}
                      disabled={loading || !simResults || simResults.isTest}
                      className={`flex-1 py-3 sm:py-4 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        simResults && !simResults.isTest
                          ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                          : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {loading && loadingAction === "publish" ? (
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                      ) : null}
                      {simResults?.isTest
                        ? "NO TEST PUBLISH"
                        : loading && loadingAction === "publish"
                        ? "WAIT..."
                        : "PUBLISH RESULT"}
                    </button>
                  </div>
                </div>

                {simResults && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-emerald-200/50 shadow-sm max-w-3xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-base sm:text-xl font-black text-emerald-800 dark:text-emerald-400 mb-4 sm:mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6" />{" "}
                      {simResults.message || "Simulation Results Preview"}
                    </h3>
                    <div className="mb-4 sm:mb-6">
                      <p className="text-[11px] sm:text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        Drawn Numbers
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {simResults.drawNumbers?.map(
                          (num: number, i: number) => (
                            <div
                              key={i}
                              className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-600 text-lg sm:text-xl shadow-sm border border-slate-200 dark:border-slate-700"
                            >
                              {num}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
                          Prize Pool Deduction
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                          ${simResults.prizePool?.totalPrizePool?.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
                          Rollover Preview
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-amber-500">
                          ${simResults.rolloverPreview?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        Projected Payouts
                      </p>
                      {simResults.payouts?.length > 0 ? (
                        <div className="space-y-2">
                          {simResults.payouts.map((p: any, i: number) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl text-xs sm:text-sm font-medium"
                            >
                              <span>
                                Hero:{" "}
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {p.userName}
                                </span>
                              </span>
                              <div className="flex justify-between sm:w-48">
                                <span>Tier: {p.tier}-Match</span>
                                <span className="font-black text-emerald-600">
                                  ${p.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-500 italic">
                          No winners in this simulation.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WINNERS TAB */}
            {activeTab === "winners" &&
              (fetching ? (
                <TabSkeleton type="table" />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm flex flex-col h-[calc(100dvh-200px)] md:h-[calc(100vh-220px)] shrink-0 animate-in fade-in duration-300">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 shrink-0 rounded-t-2xl sm:rounded-t-3xl">
                    <div className="w-full lg:w-auto flex justify-between lg:block">
                      <h3 className="font-bold text-base sm:text-lg">
                        Winners Ledger
                      </h3>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        Historical Draw Results
                      </span>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full lg:w-auto flex-col sm:flex-row">
                      <div className="relative w-full lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search winners..."
                          value={winnerSearch}
                          onChange={(e) => setWinnerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <select
                        value={winnerFilter}
                        onChange={(e) => setWinnerFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto custom-scrollbar relative rounded-b-2xl sm:rounded-b-3xl">
                    <table className="w-full text-left text-sm relative min-w-[700px] mb-4">
                      <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm z-10 shadow-sm font-black text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">
                        <tr>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">
                            Winner Details
                          </th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">
                            Prize Distributed
                          </th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">
                            Draw Date
                          </th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5">Status</th>
                          <th className="px-4 py-3 sm:px-6 sm:py-5 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredWinners.length > 0 ? (
                          filteredWinners.map((winner) => (
                            <tr
                              key={winner.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                            >
                              <td className="px-4 py-3 sm:px-6 sm:py-5">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 text-lg shrink-0">
                                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm sm:text-base line-clamp-1">
                                      {winner.profiles?.full_name || "Hero"}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 lowercase line-clamp-1">
                                      {winner.profiles?.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 sm:px-6 sm:py-5 font-black text-emerald-600">
                                ${winner.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 sm:px-6 sm:py-5 text-slate-500 text-xs sm:text-sm">
                                {new Date(winner.drawn_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 sm:px-6 sm:py-5">
                                {winner.status === "pending" ? (
                                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-100 text-amber-700 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black uppercase">
                                    Pending
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-100 text-emerald-700 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black uppercase">
                                    Paid
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 sm:px-6 sm:py-5 text-right">
                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                  <button
                                    onClick={() =>
                                      toggleWinnerStatus(
                                        winner.id,
                                        winner.status
                                      )
                                    }
                                    className="p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                    title="Toggle Payment Status"
                                  >
                                    <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteWinner(winner.id)}
                                    className="p-2 sm:p-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                                    title="Delete Winner Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-20 text-center text-slate-400 font-medium text-xs sm:text-sm"
                            >
                              No winners match your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

            {/* CHARITIES TAB */}
            {activeTab === "charities" &&
              (fetching ? (
                <TabSkeleton type="charities" />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm flex flex-col h-[calc(100dvh-200px)] md:h-[calc(100vh-220px)] max-w-4xl shrink-0 animate-in fade-in duration-300">
                  <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 shrink-0 rounded-t-2xl sm:rounded-t-3xl">
                    <h3 className="font-bold text-base sm:text-xl">
                      Charity Ledger
                    </h3>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search charities..."
                          value={charitySearch}
                          onChange={(e) => setCharitySearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setCharityDialog({
                            isOpen: true,
                            mode: "add",
                            id: "",
                            name: "",
                            desc: "",
                            imageUrl: "",
                          })
                        }
                        className="px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 rounded-b-2xl sm:rounded-b-3xl">
                    {filteredCharities.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {filteredCharities.map((charity) => (
                          <div
                            key={charity.id}
                            className="flex flex-col sm:flex-row justify-between sm:items-center p-4 sm:p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 group gap-3 sm:gap-4"
                          >
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                {charity.image_url ? (
                                  <img
                                    src={charity.image_url}
                                    alt={charity.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1">
                                  {charity.name}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500 max-w-md line-clamp-2">
                                  {charity.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto border-t sm:border-none border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                              <button
                                onClick={() =>
                                  setCharityDialog({
                                    isOpen: true,
                                    mode: "edit",
                                    id: charity.id,
                                    name: charity.name,
                                    desc: charity.description || "",
                                    imageUrl: charity.image_url || "",
                                  })
                                }
                                className="text-indigo-500 hover:text-indigo-600 p-2 sm:p-3 bg-white dark:bg-slate-900 sm:bg-transparent rounded-lg sm:rounded-none"
                              >
                                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => deleteCharity(charity.id)}
                                className="text-rose-500 hover:text-rose-600 p-2 sm:p-3 bg-white dark:bg-slate-900 sm:bg-transparent rounded-lg sm:rounded-none"
                              >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 sm:py-16 text-slate-400">
                        <Building className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 opacity-50" />
                        <p className="font-bold text-xs sm:text-base uppercase tracking-widest">
                          No Charities Match
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* MEDIA TAB */}
            {activeTab === "media" &&
              (fetching ? (
                <TabSkeleton type="media" />
              ) : (
                <div className="bg-white dark:bg-slate-900 p-10 sm:p-15 md:p-4 rounded-2xl md:rounded-[2.5rem] border border-slate-200/50 shadow-sm text-center flex flex-col items-center animate-in fade-in duration-300 h-[calc(100dvh-220px)] md:h-[calc(100vh-240px)] shrink-0 overflow-hidden">
                  <div className="shrink-0 flex flex-col items-center w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 sm:mb-8">
                      <ImageIcon className="w-8 h-10 sm:w-10 sm:h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                      Media Assets
                    </h3>
                    <p className="text-xs sm:text-base text-slate-500 max-w-lg mx-auto font-medium mb-8 sm:mb-10 px-4">
                      Upload images securely to your Supabase storage bucket.
                    </p>

                    <input
                      type="file"
                      id="media-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={loading}
                      accept="image/*"
                    />
                    <label
                      htmlFor="media-upload"
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mb-6"
                    >
                      {loading ? (
                        <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : null}
                      {loading ? "Uploading..." : "+ Upload Image"}
                    </label>
                  </div>

                  {mediaAssets.length > 0 && (
                    <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
                        {mediaAssets.map((file) => (
                          <div
                            key={file.id}
                            className="bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group relative"
                          >
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-28 sm:h-40 object-cover"
                            />
                            <div className="p-2.5 sm:p-3 text-[10px] sm:text-xs font-medium truncate">
                              {file.name}
                            </div>
                            <button
                              onClick={() => deleteMedia(file.id)}
                              className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-rose-500 text-white rounded-lg sm:rounded-xl md:opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </main>
      </div>

      {/* --- OVERLAY UI MODALS --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-[95%] max-w-md border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center overflow-y-auto max-h-[85dvh] custom-scrollbar">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shrink-0">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <h3 className="font-black text-lg sm:text-xl mb-2 sm:mb-3">
              {confirmDialog.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={closeConfirm}
                className="flex-1 py-2.5 sm:py-3 text-slate-500 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 sm:py-3 bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-rose-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {charityDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-[95%] max-w-lg border border-slate-200 dark:border-slate-800 p-6 md:p-10 overflow-y-auto max-h-[85dvh] custom-scrollbar">
            <h3 className="font-black text-xl sm:text-2xl mb-2 sm:mb-3">
              {charityDialog.mode === "add" ? "New Charity" : "Edit Charity"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Manage organization details for the impact ledger.
            </p>

            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                {charityDialog.imageUrl ? (
                  <img
                    src={charityDialog.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <input
                  type="file"
                  id="charity-image"
                  className="hidden"
                  onChange={uploadCharityImage}
                  disabled={loading}
                  accept="image/*"
                />
                <label
                  htmlFor="charity-image"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />{" "}
                  {loading ? "Uploading..." : "Upload Cover Image"}
                </label>
              </div>
            </div>

            <input
              type="text"
              placeholder="Charity Name"
              value={charityDialog.name}
              onChange={(e) =>
                setCharityDialog({ ...charityDialog, name: e.target.value })
              }
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-sm sm:text-base focus:outline-none focus:border-emerald-500 mb-4 sm:mb-5 font-medium"
            />
            <textarea
              placeholder="Description (Required)"
              value={charityDialog.desc}
              onChange={(e) =>
                setCharityDialog({ ...charityDialog, desc: e.target.value })
              }
              rows={3}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-sm sm:text-base focus:outline-none focus:border-emerald-500 mb-6 sm:mb-8 font-medium resize-none"
            />

            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() =>
                  setCharityDialog({ ...charityDialog, isOpen: false })
                }
                className="flex-1 py-3 sm:py-4 text-slate-500 font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCharity}
                disabled={loading}
                className="flex-1 py-3 sm:py-4 bg-emerald-600 text-white font-bold text-sm sm:text-base rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                Save Charity
              </button>
            </div>
          </div>
        </div>
      )}

      {scoreDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-[95%] max-w-md border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center overflow-y-auto max-h-[85dvh] custom-scrollbar">
            <h3 className="font-black text-lg sm:text-xl mb-2 sm:mb-3">
              Log Score
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">
              Enter a Stableford score (1-45).
            </p>
            <input
              type="number"
              autoFocus
              value={scoreDialog.val}
              onChange={(e) =>
                setScoreDialog({ ...scoreDialog, val: e.target.value })
              }
              className="w-24 sm:w-32 text-center px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-xl sm:text-2xl font-black focus:outline-none focus:border-emerald-500 mb-6 sm:mb-8 mx-auto block"
            />
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() =>
                  setScoreDialog({ ...scoreDialog, isOpen: false })
                }
                className="flex-1 py-2.5 sm:py-3 text-slate-500 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitManualScore}
                className="flex-1 py-2.5 sm:py-3 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-700 transition-all"
              >
                Add Score
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-[95%] max-w-3xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh]">
            <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-[2rem] sm:rounded-t-[2.5rem] shrink-0">
              <div>
                <h3 className="font-black text-lg sm:text-xl md:text-2xl mb-0.5 sm:mb-1 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                  {selectedUser.full_name || "Anonymous Hero"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                  {selectedUser.email}
                </p>
              </div>
              <button
                onClick={closeUserModal}
                className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 md:space-y-8 flex-grow custom-scrollbar rounded-b-[2rem] sm:rounded-b-[2.5rem]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Plan
                    </p>
                  </div>
                  <p className="text-lg sm:text-xl font-black capitalize text-slate-800 dark:text-white">
                    {selectedUser.subscription_plan || "Monthly"}{" "}
                    <span className="text-xs sm:text-sm text-emerald-600 ml-0.5 sm:ml-1">
                      (${selectedUser.subscription_plan === "yearly" ? 250 : 25}
                      )
                    </span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">
                    Status:{" "}
                    <span
                      className={
                        selectedUser.subscription_status === "active"
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }
                    >
                      {selectedUser.subscription_status?.toUpperCase() ||
                        "INACTIVE"}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Charity
                    </p>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mb-1">
                    {selectedUser.charity_percentage || 50}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate">
                    {selectedUser.selected_charity
                      ? selectedUser.selected_charity.split(",").join(", ")
                      : "Unallocated Fund"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> Force
                  Password
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleForcePasswordChange}
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-rose-700 transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />{" "}
                    Engine Scores
                  </h4>
                  <button
                    onClick={() =>
                      setScoreDialog({
                        isOpen: true,
                        userId: selectedUser.id,
                        val: "",
                      })
                    }
                    className="text-[10px] sm:text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 sm:gap-2 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {userScores.length > 0 ? (
                    userScores.map((score) => (
                      <div
                        key={score.id}
                        className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm gap-2"
                      >
                        <div className="flex items-center gap-3 sm:gap-6">
                          <span className="text-[11px] sm:text-sm text-slate-400 font-medium whitespace-nowrap">
                            {new Date(score.date).toLocaleDateString()}
                          </span>
                          <input
                            type="number"
                            defaultValue={score.score}
                            onBlur={(e) =>
                              updateScore(score.id, parseInt(e.target.value))
                            }
                            className="w-14 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-black text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg sm:rounded-xl outline-none text-sm sm:text-lg"
                          />
                        </div>
                        <button
                          onClick={() => deleteScore(score.id)}
                          className="text-rose-400 hover:text-rose-600 p-1.5 sm:p-2 shrink-0"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest text-center py-5 sm:py-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      No scores logged
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Custom Sleek Scrollbars */}
      <style>
        {`
          /* Hide scrollbar for side tab menu on mobile */
          .hide-scrollbar::-webkit-scrollbar {
             display: none;
          }
          .hide-scrollbar {
             -ms-overflow-style: none;
             scrollbar-width: none;
          }

          /* Custom sleek scrollbars for inner containers */
          .custom-scrollbar::-webkit-scrollbar { 
            height: 6px; 
            width: 6px; 
          }
          .custom-scrollbar::-webkit-scrollbar-track { 
            background: transparent; 
            margin: 8px; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background-color: #cbd5e1; 
            border-radius: 10px; 
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { 
            background-color: #334155; 
          }
          
          /* Prevent iOS input zoom issues */
          @media screen and (max-width: 768px) {
            input, select, textarea {
              font-size: 16px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
