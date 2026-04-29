"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  CreditCard,
  Heart,
  Trophy,
  ChevronDown,
  Search,
  LifeBuoy,
} from "lucide-react";

export default function HelpSupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const supportCategories = [
    {
      icon: <CreditCard className="w-6 h-6 text-indigo-500" />,
      title: "Billing & Subscriptions",
      description: "Manage your Pro plan, payment methods, and invoices.",
      color:
        "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
    },
    {
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      title: "Draws & Winnings",
      description: "Learn how the engine works, payouts, and rollover rules.",
      color:
        "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: "Impact & Charities",
      description:
        "Understanding your charity allocation and impact portfolio.",
      color:
        "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
    },
  ];

  const faqs = [
    {
      question: "How do I log my Stableford scores?",
      answer:
        "Log into your Dashboard and use the 'Log Score' module. Simply select the date of your round and enter your total Stableford points (1-45). The engine automatically keeps your latest 5 rolling scores.",
    },
    {
      question: "When does the monthly draw happen?",
      answer:
        "The official draw is conducted on the last day of every month. You must have exactly 5 active scores logged to qualify. Winners are notified immediately via email.",
    },
    {
      question: "How does the charity contribution work?",
      answer:
        "Depending on your plan, you can direct between 10% and 50% of your subscription fee to the impact partners of your choice. We route these funds automatically every billing cycle.",
    },
    {
      question: "What happens to the jackpot if no one wins?",
      answer:
        "If no player matches all 5 numbers in a given month, the entire 40% Tier-1 prize pool rolls over into the next month's jackpot, creating massive future payouts.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel your subscription at any time from your Profile Settings. Your access will remain active until the end of your current billing period.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#0B1120] py-12 px-4 sm:px-6 relative overflow-hidden transition-colors duration-500 flex flex-col font-sans">
      {/* Ambient Premium Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 dark:bg-blue-900/10 blur-[120px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-100/30 dark:bg-indigo-900/10 blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite_reverse]" />

      <div className="max-w-5xl w-full mx-auto relative z-10 flex-grow flex flex-col">
        {/* Navigation / Back Button */}
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-all duration-300 hover:-translate-x-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 mb-6 shadow-sm border border-blue-100 dark:border-blue-500/20">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            How can we help?
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {supportCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 ${category.color}`}
              >
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                {category.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="mb-16 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-slate-900 border ${
                    activeFaq === index
                      ? "border-blue-500/30 shadow-md"
                      : "border-slate-200 dark:border-slate-800 shadow-sm"
                  } rounded-2xl overflow-hidden transition-all duration-300`}
                >
                  <button
                    onClick={() =>
                      setActiveFaq(activeFaq === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-bold text-slate-900 dark:text-white text-base md:text-lg pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                        activeFaq === index ? "rotate-180 text-blue-500" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                      activeFaq === index
                        ? "max-h-40 pb-6 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                No articles found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Contact Block */}
        <div className="mt-auto max-w-3xl mx-auto w-full">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-center shadow-xl relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
                Still need help?
              </h2>
              <p className="text-slate-300 font-medium mb-8 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                Our support heroes are standing by to assist you with any issues
                regarding your account, the draw engine, or your impact
                portfolio.
              </p>

              <a
                href="mailto:support@digitalheroes.com"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-slate-50 active:scale-95 group"
              >
                <Mail className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                support@digitalheroes.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
