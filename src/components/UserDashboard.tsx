import React, { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownLeft, Share2, Copy, Check, 
  HelpCircle, AlertTriangle, Send, Loader2, Landmark, Smartphone, Coins, Bell, Clock, LogOut, ChevronRight, MessageSquare
} from "lucide-react";

import { User, Deposit, Withdrawal, Transaction, SupportTicket, SystemConfig, Announcement } from "../types";

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  systemConfig: SystemConfig;
  token: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user: initialUser, 
  onLogout, 
  darkMode, 
  systemConfig, 
  token 
}) => {
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<"overview" | "deposit" | "withdraw" | "referrals" | "history" | "support">("overview");
  
  // State variables for fetching
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refSummary, setRefSummary] = useState<any>({ level1: [], level2: [], commissions: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<"Bank Transfer" | "eSewa" | "Khalti" | "Binance / Crypto">("eSewa");
  const [depositTrxId, setDepositTrxId] = useState<string>("");
  const [depositProof, setDepositProof] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"Bank Transfer" | "eSewa" | "Khalti" | "Binance / Crypto">("eSewa");
  const [withdrawDetails, setWithdrawDetails] = useState<string>("");

  const [ticketSubject, setTicketSubject] = useState<string>("");
  const [ticketCategory, setTicketCategory] = useState<"Deposit Issue" | "Withdrawal Delay" | "Referral Mission" | "Account Support" | "Other">("Deposit Issue");
  const [ticketPriority, setTicketPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [ticketMsg, setTicketMsg] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState<string>("");
  const [ticketPhoto, setTicketPhoto] = useState<string>("");
  const [ticketReplyPhoto, setTicketReplyPhoto] = useState<string>("");

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const triggerNotif = (type: "success" | "error", msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  const fetchProfile = async () => {
    try {
      const r = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (r.ok) {
        const u = await r.json();
        setUser(u);
      }
    } catch(e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [depRes, withRes, txRes, tktRes, annRes, refRes] = await Promise.all([
        fetch("/api/deposits/me", { headers }),
        fetch("/api/withdrawals/me", { headers }),
        fetch("/api/transactions/logs", { headers }),
        fetch("/api/tickets", { headers }),
        fetch("/api/announcements"),
        fetch("/api/referrals/summary", { headers })
      ]);

      if (depRes.ok) setDeposits(await depRes.json());
      if (withRes.ok) setWithdrawals(await withRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (tktRes.ok) setTickets(await tktRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (refRes.ok) setRefSummary(await refRes.json());
    } catch (e) {
      triggerNotif("error", "Failed to retrieve fresh balance stream.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchData();
  }, [activeTab]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositProof(reader.result as string);
        setUploading(false);
      };
      reader.onerror = () => {
         triggerNotif("error", "Failed to convert payment snapshot.");
         setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);
    if (!depositAmount || isNaN(amountNum) || amountNum < systemConfig.minDeposit) {
      triggerNotif("error", `Minimum deposit amount allowed is NPR ${systemConfig.minDeposit}`);
      return;
    }
    if (!depositTrxId) {
      triggerNotif("error", "Valid transaction trace ID is required for bank matching.");
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          method: depositMethod,
          transactionId: depositTrxId,
          screenshot: depositProof
        })
      });

      const data = await r.json();
      if (!r.ok) {
        triggerNotif("error", data.error || "Failed to catalog deposit.");
      } else {
        triggerNotif("success", "Deposit proof successfully logged. Custom accounting verifying.");
        setDepositAmount("");
        setDepositTrxId("");
        setDepositProof("");
        setActiveTab("history");
      }
    } catch (err) {
      triggerNotif("error", "Network issue during deposit submission.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amountNum) || amountNum < systemConfig.minWithdrawal) {
      triggerNotif("error", `Minimum cash out limit is NPR ${systemConfig.minWithdrawal}`);
      return;
    }
    if (amountNum > user.walletBalance) {
      triggerNotif("error", "Insufficient available funds in your RefChain wallet.");
      return;
    }
    if (!withdrawDetails) {
      triggerNotif("error", "Please write valid account details.");
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          method: withdrawMethod,
          walletDetails: withdrawDetails
        })
      });

      const data = await r.json();
      if (!r.ok) {
        triggerNotif("error", data.error || "Failed to submit request.");
      } else {
        triggerNotif("success", "Withdrawal submitted to verifying pipeline successfully.");
        setWithdrawAmount("");
        setWithdrawDetails("");
        fetchProfile();
        setActiveTab("history");
      }
    } catch(e) {
      triggerNotif("error", "Network issues submitting withdrawal query.");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplyPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketReplyPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) {
      triggerNotif("error", "Please fulfill subject & descriptive questions.");
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          priority: ticketPriority,
          message: ticketMsg,
          photo: ticketPhoto || undefined
        })
      });

      const data = await r.json();
      if (!r.ok) {
        triggerNotif("error", data.error || "Support pipeline failure.");
      } else {
        triggerNotif("success", "Help desk ticket queued! Live reply enabled.");
        setTicketSubject("");
        setTicketMsg("");
        setTicketPhoto("");
        fetchData();
      }
    } catch (e) {
      triggerNotif("error", "Failed to lodge ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg || !selectedTicket) return;

    try {
      const r = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: replyMsg,
          photo: ticketReplyPhoto || undefined
        })
      });

      if (r.ok) {
        const updatedTicket = await r.json();
        setSelectedTicket(updatedTicket);
        setReplyMsg("");
        setTicketReplyPhoto("");
        fetchData();
      } else {
        triggerNotif("error", "Failed to dispatch chat reply.");
      }
    } catch (e) {
      triggerNotif("error", "Error dispatching dialogue.");
    }
  };

  const copyRefLink = () => {
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyRefCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Render QR Codes visually
  const getMethodQR = () => {
    switch (depositMethod) {
      case "eSewa": return systemConfig.qrImages.esewaQr;
      case "Khalti": return systemConfig.qrImages.khaltiQr;
      case "Binance / Crypto": return systemConfig.qrImages.binanceQr;
      case "Bank Transfer": return systemConfig.qrImages.bankQr;
      default: return "";
    }
  };

  const getMethodInstructions = () => {
    switch (depositMethod) {
      case "eSewa":
        return {
          header: "Unified eSewa Merchant Transfer",
          text: `Beneficiary Name: ${systemConfig.esewaDetails.name}\nMerchant Phone: ${systemConfig.esewaDetails.phone}`,
          accent: "text-emerald-500"
        };
      case "Khalti":
        return {
          header: "Unified Khalti Merchant Transfer",
          text: `Beneficiary Name: ${systemConfig.khaltiDetails.name}\nMerchant Phone: ${systemConfig.khaltiDetails.phone}`,
          accent: "text-indigo-500"
        };
      case "Binance / Crypto":
        return {
          header: "USDT Corporate Crypto Wallet",
          text: `Receiver Wallet Address: ${systemConfig.binanceDetails.walletAddress}\nRequired Network: ${systemConfig.binanceDetails.network}`,
          accent: "text-amber-500"
        };
      case "Bank Transfer":
        default:
        return {
          header: "National Clearing Banking Gateway",
          text: `Bank Name: ${systemConfig.bankDetails.bankName}\nAccount Name: ${systemConfig.bankDetails.accountName}\nAccount Number: ${systemConfig.bankDetails.accountNumber}\nBranch Office: ${systemConfig.bankDetails.branch}`,
          accent: "text-teal-400"
        };
    }
  };

  const detailInstr = getMethodInstructions();

  return (
    <div id="user-layout" className={`min-h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Toast Notification */}
      {notif && (
        <div 
          id="system-notification"
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform scale-105 ${
            notif.type === "success" 
              ? "bg-emerald-900/90 border border-emerald-500 text-emerald-200" 
              : "bg-rose-950/90 border border-rose-500 text-rose-200"
          }`}
        >
          {notif.type === "success" ? <Check size={20} /> : <AlertTriangle size={20} />}
          <div className="text-xs font-semibold">{notif.msg}</div>
        </div>
      )}

      {/* TOP DECK BANNER COMPLIANCE WARNING */}
      <div className={`p-3 text-[11px] font-medium tracking-wide text-center border-b flex justify-center items-center gap-2 ${
        darkMode ? "bg-slate-900/90 border-slate-800 text-slate-400" : "bg-emerald-50/90 border-gray-200 text-emerald-800"
      }`}>
        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
        <span>
          <strong>Anti-Fraud Compliance Rule:</strong> The platform does not guarantee profits and users participate at their own financial risk. Please audit credentials thoroughly.
        </span>
      </div>

      <header className={`border-b sticky top-0 z-30 backdrop-blur-md ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-gray-250"}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold tracking-tight shadow-md">
              RC
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">RefChain</h1>
              <p className="text-[10px] opacity-60 font-mono">FINTECH PLATFORM</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold">{user.fullName}</p>
              <p className="text-[10px] opacity-60 font-mono">{user.email}</p>
            </div>
            <button
              id="user-logout-btn"
              onClick={onLogout}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs transition-colors ${
                darkMode 
                  ? "border-slate-800 hover:bg-slate-900 text-slate-300" 
                  : "border-gray-200 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* NAVIGATION SIDEBAR */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl p-4 border sticky top-24 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"}`}>
              <div className="mb-6 pb-4 border-b border-dashed dark:border-slate-800 border-gray-200">
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-40">Wallet Account Balance</span>
                <p className="text-2xl font-black font-mono mt-1 text-emerald-500">NPR {user.walletBalance.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] opacity-60">
                  <TrendingUp size={12} className="text-emerald-400" />
                  <span>Total Earned: NPR {user.totalEarnings.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { id: "overview", label: "Dashboard Overview", icon: Wallet },
                  { id: "deposit", label: "Deposit Funds", icon: ArrowUpRight },
                  { id: "withdraw", label: "Request Cashout", icon: ArrowDownLeft },
                  { id: "referrals", label: "My Network & Tree", icon: Users },
                  { id: "history", label: "Statements Ledger", icon: Clock },
                  { id: "support", label: "Customer Helpdesk", icon: HelpCircle }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      id={`nav-${item.id}`}
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setSelectedTicket(null); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all ${
                        activeTab === item.id
                          ? darkMode 
                            ? "bg-slate-800 text-white font-bold translate-x-1" 
                            : "bg-emerald-50 text-emerald-800 font-bold translate-x-1"
                          : darkMode
                            ? "text-slate-400 hover:text-white hover:bg-slate-900"
                            : "text-gray-600 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={activeTab === item.id ? "text-emerald-500" : "opacity-60"} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={12} className="opacity-40" />
                    </button>
                  );
                })}
              </div>

              {/* LIVE CHAT SUPPORT HELPRIL BUTTON */}
              <div className="mt-8 pt-4 border-t dark:border-slate-800 border-gray-200">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-[11px] font-semibold text-emerald-500">Need Immediate Help?</p>
                  <a 
                    href={systemConfig.supportContact.whatsapp} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-transform hover:scale-105"
                  >
                    <Smartphone size={12} />
                    WhatsApp Operator
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN COLUMN WORKSPACE */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* IN-APP BROADCAST ANNOUNCEMENT AREA */}
            {announcements.length > 0 && (
              <div className={`p-4 rounded-2xl border flex gap-3 ${
                darkMode ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-300" : "bg-emerald-50 border-emerald-250 text-emerald-800"
              }`}>
                <Bell size={18} className="text-emerald-400 flex-shrink-0 animate-bounce mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Announcement: {announcements[0].title}</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{announcements[0].content}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
                <span className="text-xs font-mono ml-3 opacity-60">Synchronizing system balances...</span>
              </div>
            )}

            {/* TAB OVERVIEW */}
            {activeTab === "overview" && !loading && (
              <div className="space-y-6">
                
                {/* METRICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900/35 border-slate-800" : "bg-white border-gray-100"}`}>
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-wider">Referral Reward Funds</span>
                    <h3 className="text-2xl font-mono font-black mt-2 text-emerald-500">NPR {user.totalEarnings.toLocaleString()}</h3>
                    <p className="text-[10px] opacity-60 mt-1">Sum of direct & indirect commissions</p>
                  </div>

                  <div className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900/35 border-slate-800" : "bg-white border-gray-100"}`}>
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-wider">Personal Invites</span>
                    <h3 className="text-2xl font-mono font-black mt-2 text-emerald-500">{user.directReferralsCount} Users</h3>
                    <p className="text-[10px] opacity-60 mt-1">Tier 1 Direct recruiter commission pipeline</p>
                  </div>

                  <div className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900/35 border-slate-800" : "bg-white border-gray-100"}`}>
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-wider">Indirect Invites</span>
                    <h3 className="text-2xl font-mono font-black mt-2 text-indigo-400">{user.indirectReferralsCount} Users</h3>
                    <p className="text-[10px] opacity-60 mt-1">Tier 2 Indirect recruiter pipeline</p>
                  </div>
                </div>

                {/* REFERRAL PORTAL SHARE HUB */}
                <div className={`rounded-2xl p-6 border relative overflow-hidden ${darkMode ? "bg-gradient-to-r from-slate-90s via-slate-900 to-slate-950 border-slate-800" : "bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white border-gray-200"}`}>
                  <div className="relative z-10">
                    <h3 className="text-base font-bold">Invite Associates & Receive Multi-tier Rewards</h3>
                    <p className="text-xs opacity-75 mt-1 max-w-xl">
                      Deliver your personalized invite codes. Earn {systemConfig.directCommissionPercent}% commission instantly from your Tier 1 friends' deposits, and {systemConfig.indirectCommissionPercent}% from their Tier 2 network activities!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      
                      {/* Code element */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-gray-250"}`}>
                        <div>
                          <span className="text-[9px] uppercase font-bold opacity-50">Your Invitation Code</span>
                          <p className="text-lg font-black tracking-widest font-mono text-emerald-500 uppercase">{user.referralCode}</p>
                        </div>
                        <button
                          id="btn-copy-code"
                          onClick={copyRefCode}
                          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all"
                        >
                          {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Link element */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-gray-250"}`}>
                        <div>
                          <span className="text-[9px] uppercase font-bold opacity-50">Referral Verification Link</span>
                          <p className="text-xs truncate font-mono mt-1 opacity-75">{`${window.location.origin}/?ref=${user.referralCode}`}</p>
                        </div>
                        <button
                          id="btn-copy-link"
                          onClick={copyRefLink}
                          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all"
                        >
                          {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* GENERAL LEDGER QUICK TRACE */}
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider">Dynamic Balance Flows (Ledger)</h3>
                    <button id="view-ledger-tab-btn" onClick={() => setActiveTab("history")} className="text-xs text-emerald-500 hover:underline">
                      See full ledger
                    </button>
                  </div>

                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((t) => {
                      const isAddition = t.type.includes("Deposit") || t.type.includes("Commission") || (t.type === "Manual Adjustment" && t.amount > 0);
                      return (
                        <div id={`tx-item-${t.id}`} key={t.id} className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          darkMode ? "bg-slate-950/80 border-slate-850 hover:bg-slate-950" : "bg-slate-50 border-gray-105 hover:bg-white"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isAddition ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                              {isAddition ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div>
                              <p className="font-semibold text-xs">{t.description}</p>
                              <span className="text-[10px] font-mono opacity-50">ID: {t.id} • {new Date(t.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div>
                            <span className={`font-mono font-black ${isAddition ? "text-emerald-500" : "text-rose-500"}`}>
                              {isAddition ? "+" : "-"}{Math.abs(t.amount).toLocaleString()} NPR
                            </span>
                            <span className="block text-[8px] opacity-40 text-right uppercase tracking-wider">{t.status}</span>
                          </div>
                        </div>
                      );
                    })}
                    {transactions.length === 0 && (
                      <div className="p-8 text-center text-xs opacity-50 border border-dashed dark:border-slate-800 border-gray-200 rounded-xl">
                        No financial events recorded yet. Fund your account to start.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB DEPOSIT */}
            {activeTab === "deposit" && !loading && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* FORM COLUMN */}
                <form id="deposit-claim-form" onSubmit={handleDepositSubmit} className="lg:col-span-3 space-y-4">
                  <div className={`rounded-2xl p-6 border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-250"}`}>
                    <h3 className="text-base font-bold text-emerald-500">Fund RefChain Balance Gateway</h3>
                    
                    <div>
                      <label className="block text-xs font-semibold opacity-70 mb-2">Select Deposit Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "eSewa", label: "eSewa Direct", icon: Smartphone },
                          { id: "Khalti", label: "Khalti Direct", icon: Coins },
                          { id: "Bank Transfer", label: "Bank Transfer", icon: Landmark },
                          { id: "Binance / Crypto", label: "Binance (USDT)", icon: TrendingUp }
                        ].map((m) => {
                          const Icon = m.icon;
                          return (
                            <button
                              id={`dep-method-${m.id.replace(' / ', '-').toLowerCase()}`}
                              key={m.id}
                              type="button"
                              onClick={() => setDepositMethod(m.id as any)}
                              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                                depositMethod === m.id
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 scale-[1.02]"
                                  : darkMode
                                    ? "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900"
                                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <Icon size={14} />
                              <span>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold opacity-70 mb-2">Deposit Amount (NPR)</label>
                      <div className="relative">
                        <input
                          id="deposit-amount-input"
                          type="number"
                          placeholder={`Min: NPR ${systemConfig.minDeposit}`}
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className={`w-full h-12 px-4 rounded-xl border font-mono text-sm focus:outline-none focus:border-emerald-500 ${
                            darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                          }`}
                        />
                        <span className="absolute right-4 top-3.5 text-xs font-semibold opacity-40">NPR</span>
                      </div>
                      <p className="text-[10px] opacity-50 mt-1">Rates are converted 1:1 for balance transactions.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold opacity-70 mb-2">Vendor / Gateway Transaction Trx ID</label>
                      <input
                        id="deposit-trx-id"
                        type="text"
                        placeholder="UFT-883712-A / Gateway Ref Code"
                        value={depositTrxId}
                        onChange={(e) => setDepositTrxId(e.target.value)}
                        className={`w-full h-12 px-4 rounded-xl border font-mono text-sm focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label id="upload-screenshot-label" className="block text-xs font-semibold opacity-70 mb-2">Upload Transfer Screenshot Proof</label>
                      <div className={`p-4 rounded-xl border text-center relative ${
                        darkMode ? "bg-slate-950/80 border-slate-800 hover:border-slate-700" : "bg-gray-50 border-gray-250 hover:bg-gray-100"
                      }`}>
                        <input
                          id="deposit-screenshot-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {depositProof ? (
                          <div className="space-y-2">
                            <span className="text-emerald-500 text-xs font-bold block">✓ Attachment Loaded</span>
                            <img src={depositProof} alt="Screenshot preview" className="h-16 mx-auto rounded border border-gray-300" />
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-semibold">Click to select or Drop Screenshot files</p>
                            <span className="text-[9px] opacity-40 block mt-1">Formats: JPEG PNG PNG (under 10MB)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      id="deposit-submit-btn"
                      type="submit"
                      disabled={uploading}
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-bold text-xs tracking-wider uppercase transition-colors"
                    >
                      {uploading ? "Rendering receipt..." : "Submit Manual Audit Claim"}
                    </button>
                  </div>
                </form>

                {/* PAYMENT INFO COLUMN */}
                <div className="lg:col-span-2 space-y-4">
                  <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-805" : "bg-white border-gray-250"}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Official Merchant Details</h4>
                    
                    <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10 text-center">
                      <span className="text-[10px] font-bold block opacity-60">Verification Gateway QR</span>
                      <img 
                        src={getMethodQR()} 
                        alt="Merchant QR" 
                        referrerPolicy="no-referrer"
                        className="w-36 h-36 object-contain mx-auto mt-2 rounded-lg border border-dashed border-emerald-500/30" 
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold leading-5">{detailInstr.header}</p>
                      <pre className={`text-[11px] leading-relaxed p-3 rounded-lg font-mono tracking-tight text-wrap max-width w-full ${
                        darkMode ? "bg-slate-950 text-emerald-400" : "bg-slate-50 text-emerald-800"
                      }`}>{detailInstr.text}</pre>
                    </div>

                    <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Important Instruction
                      </p>
                      <p className="text-[9px] opacity-75 mt-1 leading-relaxed">
                        Audit names and match beneficiary tags correctly before executing the payment. Double uploads of identical screenshots automatically freeze profiles.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB WITHDRAW */}
            {activeTab === "withdraw" && !loading && (
              <div className="max-w-xl mx-auto space-y-6">
                
                <form id="withdraw-claim-form" onSubmit={handleWithdrawSubmit} className={`rounded-2xl p-6 border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-250"}`}>
                  <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                    <ArrowDownLeft size={18} />
                    Submit Cash-out Request
                  </h3>

                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <p className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Investment Warning & Risks Disclosures
                    </p>
                    <p className="text-[10px] mt-1 opacity-80 leading-relaxed">
                      All audit reports are subject to rigorous automated checks. Multi-accounts trigger automatic freezes. Minimum standard payout delay may depend on chosen payment gateway.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold opacity-70 mb-2">Select Withdrawal Destination</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "eSewa", label: "eSewa App" },
                        { id: "Khalti", label: "Khalti App" },
                        { id: "Bank Transfer", label: "Direct Bank Transfer" },
                        { id: "Binance / Crypto", label: "Crypto BEP20 USDT" }
                      ].map((m) => (
                        <button
                          id={`w-method-${m.id.replace(' / ', '-').toLowerCase()}`}
                          key={m.id}
                          type="button"
                          onClick={() => setWithdrawMethod(m.id as any)}
                          className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                            withdrawMethod === m.id
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 scale-[1.02]"
                              : darkMode
                                ? "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900"
                                : "border-gray-200 bg-gray-50 text-gray-750 hover:bg-gray-100"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold opacity-70 mb-2">Withdrawal Amount (NPR)</label>
                    <div className="relative">
                      <input
                        id="withdraw-amount-input"
                        type="number"
                        placeholder={`Min limit: NPR ${systemConfig.minWithdrawal}`}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className={`w-full h-12 px-4 rounded-xl border font-mono text-sm focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                        }`}
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-semibold opacity-40">NPR</span>
                    </div>
                    <span className="text-[10px] opacity-50 block mt-1">Available balance: NPR {user.walletBalance.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold opacity-70 mb-2">Credentials Details & Wallet Addresses</label>
                    <textarea
                      id="withdraw-details-input"
                      rows={3}
                      placeholder="eSewa Registered Phone No, Banking Routing Numbers, Branch name or BEP20 network address"
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      className={`w-full p-4 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                      }`}
                    />
                  </div>

                  <button
                    id="withdraw-submit-btn"
                    type="submit"
                    className="w-full h-12 rounded-xl bg-rose-650 hover:bg-rose-700 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase transition-colors"
                  >
                    Initiate Audit Payout
                  </button>
                </form>

              </div>
            )}

            {/* TAB REFERRALS (NETWORK TREE GRAPHS) */}
            {activeTab === "referrals" && !loading && (
              <div className="space-y-6">

                {/* PYRAMID EARNING MECHANISM EXPLAINER */}
                <div className={`rounded-2xl p-6 border relative overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-emerald-50/10 border-gray-200 text-slate-800"}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none font-sans font-black text-6xl">🔺</div>
                  <h3 className="text-base font-bold text-amber-500 flex items-center gap-2">
                    <span>🔺</span> Multi-Level Pyramid Earning System
                  </h3>
                  <p className="text-xs opacity-85 mt-2 leading-relaxed">
                    A pyramid-style earning system works by placing early users at the top and new users below them. Each person recruits more users into the system. As the number of users increases, the people at the top receive a percentage of earnings, joining fees, or commissions from the users below them.
                  </p>

                  <div className="mt-4 p-4 rounded-xl border dark:bg-slate-950/40 bg-slate-100/50 border-emerald-500/10">
                    <span className="block text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-2">Simulated Exponential Growth Example:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-black/20 rounded-lg text-center">
                        <span className="block text-[10px] opacity-50 font-bold uppercase">Root Recruiter</span>
                        <p className="text-xs font-bold mt-1 text-emerald-400">1 Recruiter</p>
                        <p className="text-[10px] opacity-60 mt-0.5">Places early users at top</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg text-center">
                        <span className="block text-[10px] opacity-50 font-bold uppercase">Tier 1 Network</span>
                        <p className="text-xs font-bold mt-1 text-emerald-400">3 Users</p>
                        <p className="text-[10px] opacity-60 mt-0.5">Earns direct percentage</p>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg text-center">
                        <span className="block text-[10px] opacity-50 font-bold uppercase">Tier 2 Network</span>
                        <p className="text-xs font-bold mt-1 text-emerald-400">9 Users → 27 Users</p>
                        <p className="text-[10px] opacity-60 mt-0.5">Commissions flow upward</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs opacity-85 mt-4 leading-relaxed">
                    The network grows very quickly. Since the top users are connected to many lower levels, they receive increasing benefits as more people join. This creates exponential growth where the top members earn more because money and activity flow upward through the structure. Early users benefit the most because they have the largest network under them.
                  </p>
                </div>
                
                {/* TREE RECONSTRUCTIONS */}
                <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                  <h3 className="text-base font-bold text-emerald-500">Visual Multi-Level Network Tree</h3>
                  <p className="text-xs opacity-70 mt-1">RefChain structural representations of Level 1 (Direct 40%) and Level 2 (Indirect 10%) pipelines.</p>

                  <div className="p-6 border border-dashed rounded-2xl dark:border-slate-800 border-gray-200 bg-slate-500/5 mt-6 relative">
                    
                    {/* Visual graph engine */}
                    <div className="flex flex-col items-center">
                      
                      {/* HEAD ROOT USER */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          👑
                        </div>
                        <span className="text-[10px] font-bold mt-1">YOU ({user.fullName})</span>
                        <span className="text-[9px] font-mono opacity-50">{user.referralCode}</span>
                        <div className="w-0.5 h-8 bg-slate-400 dark:bg-slate-800 my-1" />
                      </div>

                      {/* TIER 1 SPLITS */}
                      <div className="w-full flex justify-around flex-wrap gap-4 mt-2">
                        {refSummary.level1.map((l1: any, iIndex: number) => {
                          const subReferrals = refSummary.level2.filter((l2: any) => l2.referredBy === l1.id || l2.referredBy === l1.referralCode || l2.refCode === l1.refCode);
                          return (
                            <div key={l1.id} className="flex flex-col items-center text-center max-w-[200px]">
                              
                              {/* Direct Recruits Node */}
                              <div className={`p-2.5 rounded-xl border flex flex-col items-center ${
                                darkMode ? "bg-slate-900 border-emerald-900/60" : "bg-emerald-50/20 border-emerald-100"
                              }`}>
                                <Users size={14} className="text-emerald-500" />
                                <p className="text-[10px] font-bold mt-1 truncate max-w-[120px]">{l1.fullName}</p>
                                <span className="text-[8px] font-mono opacity-50">Lvl 1 (Direct)</span>
                              </div>

                              {/* Indirect connector if level 2 exists */}
                              <div className="w-0.5 h-6 bg-slate-400 dark:bg-slate-805 my-1" />

                              {/* Level 2 Sub-leaves */}
                              <div className="space-y-1.5 flex flex-col items-center">
                                {refSummary.level2.map((l2: any) => {
                                  return (
                                    <div key={l2.id} className={`p-1.5 px-3 rounded-lg border text-center text-[10px] ${
                                      darkMode ? "bg-slate-950 border-slate-850" : "bg-gray-50 border-gray-250"
                                    }`}>
                                      <span className="block font-medium truncate max-w-[100px]">{l2.fullName}</span>
                                      <span className="text-[8px] font-mono text-indigo-400">Lvl 2 (Indirect)</span>
                                    </div>
                                  );
                                })}
                                {refSummary.level2.length === 0 && (
                                  <span className="text-[8px] opacity-40 italic">No Level 2 Network</span>
                                )}
                              </div>

                            </div>
                          );
                        })}
                        {refSummary.level1.length === 0 && (
                          <div className="text-center py-6">
                            <Users size={20} className="mx-auto opacity-30 text-rose-500" />
                            <p className="text-[10px] opacity-40 mt-1 italic">No network nodes found yet. Send your invite code to link accounts.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                {/* HISTORIC COMMISSION SPLITS LISTING */}
                <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Referrals Commissions History</h3>
                  <div className="space-y-3">
                    {refSummary.commissions.map((c: any) => (
                      <div id={`ref-comm-${c.id}`} key={c.id} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-gray-200"
                      }`}>
                        <div>
                          <p className="font-semibold">{c.description}</p>
                          <span className="text-[9px] font-mono opacity-50">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-500">+{c.amount} NPR</span>
                      </div>
                    ))}
                    {refSummary.commissions.length === 0 && (
                      <div className="p-6 text-center text-xs opacity-50 border border-dashed dark:border-slate-800 border-gray-200 rounded-xl">
                        No commissions generated yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB LEDGER STATEMENTS HISTORY */}
            {activeTab === "history" && !loading && (
              <div className="space-y-6">
                
                {/* DEPOSIT QUEUE SEGMENTS */}
                <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Self Deposits Verification Logs</h3>
                  <div className="space-y-3">
                    {deposits.map((d) => (
                      <div id={`dep-log-${d.id}`} key={d.id} className={`p-4 rounded-xl border text-xs flex justify-between items-center ${
                        darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-gray-250"
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-emerald-500">NPR {d.amount.toLocaleString()}</span>
                            <span className={`text-[9px] font-sans px-2 py-0.5 rounded-full font-bold uppercase ${
                              d.status === "Approved" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                              d.status === "Rejected" ? "bg-rose-950 text-rose-400 border border-rose-800" :
                              "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}>{d.status}</span>
                          </div>
                          <p className="text-[10px] opacity-60 mt-1">Transaction Ref: {d.transactionId} via {d.method}</p>
                          {d.reviewComment && (
                            <p className="text-[10px] mt-1 text-rose-400 font-medium">Rejection Comment: {d.reviewComment}</p>
                          )}
                        </div>
                        <span className="text-[10px] opacity-40">{new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {deposits.length === 0 && (
                      <div className="p-8 text-center text-xs opacity-50">No deposits recorded on account.</div>
                    )}
                  </div>
                </div>

                {/* WITHDRAWAL QUEUE SEGMENTS */}
                <div className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-805" : "bg-white border-gray-200"}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Self Cashout Verification Logs</h3>
                  <div className="space-y-3">
                    {withdrawals.map((w) => (
                      <div id={`with-log-${w.id}`} key={w.id} className={`p-4 rounded-xl border text-xs flex justify-between items-center ${
                        darkMode ? "bg-slate-950 border-slate-850" : "bg-white border-gray-250"
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-rose-500">NPR {w.amount.toLocaleString()}</span>
                            <span className={`text-[9px] font-sans px-2 py-0.5 rounded-full font-bold uppercase ${
                              w.status === "Completed" || w.status === "Approved" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                              w.status === "Rejected" ? "bg-rose-950 text-rose-400 border border-rose-800" :
                              "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}>{w.status}</span>
                          </div>
                          <p className="text-[10px] opacity-60 mt-1">Method: {w.method} ({w.walletDetails})</p>
                        </div>
                        <span className="text-[10px] opacity-40">{new Date(w.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {withdrawals.length === 0 && (
                      <div className="p-8 text-center text-xs opacity-50">No withdrawals requests submitted for review yet.</div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CUSTOMER HELPDESK & CHAT TICKETS */}
            {activeTab === "support" && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* NEW TICKET FORM COLUMN */}
                <div className="md:col-span-2">
                  <form id="new-support-ticket-form" onSubmit={handleCreateTicket} className={`rounded-2xl p-5 border space-y-4 ${
                    darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-205"
                  }`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Open Fresh Support Query</h4>
                    
                    <div>
                      <label className="block text-xs opacity-70 mb-1">Subject</label>
                      <input
                        id="ticket-subject"
                        type="text"
                        placeholder="e.g. Deposit missing on eSewa app"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className={`w-full h-10 px-3 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs opacity-70 mb-1">Issue Category</label>
                        <select
                          id="ticket-category"
                          value={ticketCategory}
                          onChange={(e: any) => setTicketCategory(e.target.value)}
                          className={`w-full h-10 px-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                            darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-gray-300 text-black"
                          }`}
                        >
                          <option value="Deposit Issue">Deposit Issue</option>
                          <option value="Withdrawal Delay">Withdrawal Delay</option>
                          <option value="Referral Mission">Referral Mission</option>
                          <option value="Account Support">Account Support</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs opacity-70 mb-1">Priority</label>
                        <select
                          id="ticket-priority"
                          value={ticketPriority}
                          onChange={(e: any) => setTicketPriority(e.target.value)}
                          className={`w-full h-10 px-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                            darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-gray-300 text-black"
                          }`}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs opacity-70 mb-1">Description Message</label>
                      <textarea
                        id="ticket-message"
                        rows={4}
                        placeholder="Write descriptive concerns or match gateway parameters accurately."
                        value={ticketMsg}
                        onChange={(e) => setTicketMsg(e.target.value)}
                        className={`w-full p-3 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs opacity-70 mb-1 font-semibold flex items-center gap-1.5 text-amber-500">
                        <span>📸 Attach Photo Screenshot (Optional)</span>
                      </label>
                      <input
                        id="ticket-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleTicketPhotoChange}
                        className={`w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold ${
                          darkMode 
                            ? "text-slate-400 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700" 
                            : "text-gray-600 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-205"
                        }`}
                      />
                      {ticketPhoto && (
                        <div className="mt-2 relative inline-block">
                          <img 
                            src={ticketPhoto} 
                            alt="Ticket preview" 
                            className="w-16 h-16 object-cover rounded-lg border border-emerald-505" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={() => setTicketPhoto("")} 
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      id="ticket-submit-btn"
                      type="submit"
                      className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase"
                    >
                      Lodge Service Ticket
                    </button>
                  </form>
                </div>

                {/* TICKETS DIRECTORIES LIST & CHAT OPERATING LAYOUT */}
                <div id="tickets-chat-area" className="md:col-span-3 space-y-4">
                  {selectedTicket ? (
                    
                    /* CHAT LAYOUT DIALOGS */
                    <div className={`rounded-2xl border flex flex-col h-[400px] overflow-hidden ${
                      darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-gray-250"
                    }`}>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase font-mono">{selectedTicket.id}</span>
                          <h4 className="text-xs font-bold leading-tight">{selectedTicket.subject}</h4>
                        </div>
                        <button 
                          id="chat-close-btn"
                          onClick={() => setSelectedTicket(null)} 
                          className="text-xs font-bold opacity-60 hover:opacity-100"
                        >
                          ✕ Close
                        </button>
                      </div>

                      {/* Msg Area scrollable */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-500/5">
                        {selectedTicket.messages.map((m, mIndex) => {
                          const isAdminSender = m.sender === "Admin";
                          return (
                            <div key={mIndex} className={`flex ${isAdminSender ? "justify-start" : "justify-end"}`}>
                              <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed shadow-sm ${
                                isAdminSender 
                                  ? darkMode 
                                    ? "bg-slate-900 border border-slate-805 text-emerald-300" 
                                    : "bg-emerald-50 text-emerald-905"
                                  : "bg-emerald-500 text-white"
                              }`}>
                                <span className="block text-[8px] font-bold uppercase tracking-wider mb-1 opacity-65">
                                  {isAdminSender ? "RC Support Specialist" : "You (Client)"}
                                </span>
                                <p className="whitespace-pre-line">{m.message}</p>
                                
                                {m.photo && (
                                  <div className="mt-2 rounded-lg overflow-hidden border border-emerald-500/20 max-w-[180px] bg-slate-950">
                                    <img 
                                      src={m.photo} 
                                      alt="Screenshot proof" 
                                      className="w-full object-cover max-h-[120px] hover:opacity-90 transition-opacity cursor-pointer"
                                      referrerPolicy="no-referrer"
                                      onClick={() => {
                                        const w = window.open();
                                        if (w) {
                                          w.document.write(`<img src="${m.photo}" style="max-width:100%;" />`);
                                        }
                                      }}
                                    />
                                    <span className="text-[8px] opacity-40 p-1 block text-center bg-black/40">Launch in new window</span>
                                  </div>
                                )}

                                <span className="block text-[8px] opacity-40 text-right mt-1">{new Date(m.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply input tray */}
                      <form id="chat-reply-form" onSubmit={handleSendReply} className="p-3 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            id="chat-input-message"
                            type="text"
                            placeholder="Type dialogue message..."
                            value={replyMsg}
                            onChange={(e) => setReplyMsg(e.target.value)}
                            className={`flex-1 h-10 px-3 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                              darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300 text-black"
                            }`}
                          />
                          <button
                            id="chat-reply-submit-btn"
                            type="submit"
                            className="px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
                          >
                            <Send size={14} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer text-[10px] text-amber-500 hover:underline font-semibold flex items-center gap-1 bg-slate-500/5 p-1 px-2 rounded-md border dark:border-slate-805">
                              <span>📸 Attach image</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleReplyPhotoChange} 
                                className="hidden" 
                              />
                            </label>
                            {ticketReplyPhoto && (
                              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 p-1 px-2 rounded font-sans text-[10px] text-emerald-400">
                                <span>Image Loaded ✓</span>
                                <button type="button" onClick={() => setTicketReplyPhoto("")} className="text-red-500 hover:text-red-400 font-bold">✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </form>

                    </div>
                  ) : (
                    
                    /* TICKET DIRECTORY SECTORS */
                    <div className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-202"}`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-emerald-505">Opened Support Dialogs</h4>
                      <div className="space-y-2">
                        {tickets.map((t) => (
                          <button
                            id={`ticket-card-${t.id}`}
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${
                              darkMode ? "bg-slate-950 border-slate-850 hover:bg-slate-900" : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-400 font-mono">{t.id}</span>
                                <span className={`text-[8px] tracking-wide font-bold uppercase px-1.5 py-0.5 rounded ${
                                  t.status === "Open" ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"
                                }`}>{t.status}</span>
                              </div>
                              <p className="font-semibold text-xs mt-1 truncate max-w-sm">{t.subject}</p>
                              <span className="text-[9px] opacity-40">Priority: {t.priority} • Category: {t.category}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-60">
                              <MessageSquare size={13} />
                              <span className="font-mono">{t.messages.length}</span>
                            </div>
                          </button>
                        ))}
                        {tickets.length === 0 && (
                          <div className="p-8 text-center text-xs opacity-50 border border-dashed rounded-xl dark:border-slate-800 border-gray-200">
                            No opened dialogues found. Open a ticket to contact system operators.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
