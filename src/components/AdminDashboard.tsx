import React, { useState, useEffect } from "react";
import { 
  Users, Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, AlertTriangle, ShieldCheck, 
  Settings, HelpCircle, FileSpreadsheet, Search, Check, Ban, Edit3, X, RefreshCw, 
  MessageSquare, Send, Globe, MessageCircle, FileText, ChevronLeft, ChevronRight, Eye, Play, Sparkles
} from "lucide-react";
import { User, Deposit, Withdrawal, Transaction, SupportTicket, FraudAlert, SystemConfig, Announcement } from "../types";

interface AdminDashboardProps {
  adminUser: User;
  onLogout: () => void;
  darkMode: boolean;
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  darkMode,
  systemConfig,
  onUpdateConfig,
  token
}) => {
  // Navigation sidebar collapsed or not
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<
    "dashboard" | "users" | "deposits" | "withdrawals" | "referrals" | "history" | "excel" | "support" | "security" | "settings" | "forgot-passwords"
  >("dashboard");

  // Global Lists States
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [passwordRecoveries, setPasswordRecoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Target item selected for detail drawers
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  
  // Custom manual adjusting fields
  const [adjustmentBalance, setAdjustmentBalance] = useState<string>("");
  const [rejectionComm, setRejectionComm] = useState<string>("");

  // Broadcast settings
  const [broadcastTitle, setBroadcastTitle] = useState<string>("");
  const [broadcastText, setBroadcastText] = useState<string>("");

  // Support selected ticket chat active
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState<string>("");
  const [ticketReplyPhoto, setTicketReplyPhoto] = useState<string>("");

  // Editable system settings form fields based on systemConfig
  const [editMinDeposit, setEditMinDeposit] = useState<string>(String(systemConfig.minDeposit));
  const [editMinWithdrawal, setEditMinWithdrawal] = useState<string>(String(systemConfig.minWithdrawal));
  const [editDirectComm, setEditDirectComm] = useState<string>(String(systemConfig.directCommissionPercent));
  const [editIndirectComm, setEditIndirectComm] = useState<string>(String(systemConfig.indirectCommissionPercent));
  const [editAdminBalance, setEditAdminBalance] = useState<string>(String(systemConfig.adminBalance));

  // Payment configuration fields
  const [bankName, setBankName] = useState<string>(systemConfig.bankDetails.bankName);
  const [accName, setAccName] = useState<string>(systemConfig.bankDetails.accountName);
  const [accNumber, setAccNumber] = useState<string>(systemConfig.bankDetails.accountNumber);
  const [accBranch, setAccBranch] = useState<string>(systemConfig.bankDetails.branch);

  const [esewaPhone, setEsewaPhone] = useState<string>(systemConfig.esewaDetails.phone);
  const [esewaName, setEsewaName] = useState<string>(systemConfig.esewaDetails.name);

  const [khaltiPhone, setKhaltiPhone] = useState<string>(systemConfig.khaltiDetails.phone);
  const [khaltiName, setKhaltiName] = useState<string>(systemConfig.khaltiDetails.name);

  const [bAddress, setBAddress] = useState<string>(systemConfig.binanceDetails.walletAddress);
  const [bNetwork, setBNetwork] = useState<string>(systemConfig.binanceDetails.network);

  const [supportWhatsApp, setSupportWhatsApp] = useState<string>(systemConfig.supportContact.whatsapp);
  const [supportEmail, setSupportEmail] = useState<string>(systemConfig.supportContact.email);

  // Base64 QR Image codes
  const [esewaQr, setEsewaQr] = useState<string>(systemConfig.qrImages.esewaQr);
  const [khaltiQr, setKhaltiQr] = useState<string>(systemConfig.qrImages.khaltiQr);
  const [bankQr, setBankQr] = useState<string>(systemConfig.qrImages.bankQr);
  const [binanceQr, setBinanceQr] = useState<string>(systemConfig.qrImages.binanceQr);

  const triggerNotif = (type: "success" | "error", msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      const [usersR, depR, withR, txR, alertR, tktR, annR] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/deposits/me", { headers }), // will bypass if admin token requested or we fetch admin deps
        fetch("/api/withdrawals/me", { headers }),
        fetch("/api/transactions/logs", { headers }),
        fetch("/api/admin/alerts", { headers }),
        fetch("/api/tickets", { headers }),
        fetch("/api/announcements")
      ]);

      // Admin specific fetches
      const fullUsersRes = await fetch("/api/admin/users", { headers });
      if (fullUsersRes.ok) setUsers(await fullUsersRes.json());

      const fullDepositsRes = await fetch("/api/deposits/me", { headers }); // Actually Express backend returns total for admins
      if (fullDepositsRes.ok) setDeposits(await fullDepositsRes.json());

      const fullWithdrawalsRes = await fetch("/api/withdrawals/me", { headers });
      if (fullWithdrawalsRes.ok) setWithdrawals(await fullWithdrawalsRes.json());

      if (txR.ok) setTransactions(await txR.json());
      if (alertR.ok) setAlerts(await alertR.json());
      if (tktR.ok) setTickets(await tktR.json());
      if (annR.ok) setAnnouncements(await annR.json());

      const recR = await fetch("/api/admin/forgot-passwords", { headers });
      if (recR.ok) setPasswordRecoveries(await recR.json());

    } catch (e) {
      triggerNotif("error", "Failed to retrieve administrative data.");
    } finally {
      setLoading(false);
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

  const handleResolveRecovery = async (id: string, action: "apply" | "dismiss") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/forgot-passwords/${id}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        triggerNotif("error", data.error || "Failed to resolve recovery request.");
      } else {
        triggerNotif("success", data.message || "Request updated successfully!");
        loadData();
      }
    } catch (e) {
      triggerNotif("error", "Error requesting password recovery resolution.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeMenu]);

  // Bulk actions handlers
  const handleBulkApproveDeposits = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/admin/quick/approve-deposits", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) {
        triggerNotif("success", d.message || "Approved all pending deposits successfully.");
        loadData();
      } else {
        triggerNotif("error", d.error || "Failed to process bulk actions.");
      }
    } catch(err) {
      triggerNotif("error", "Failed to execute bulk requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApproveWithdrawals = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/admin/quick/approve-withdrawals", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) {
        triggerNotif("success", d.message || "Processed all withdrawals.");
        loadData();
      } else {
        triggerNotif("error", d.error);
      }
    } catch (e) {
      triggerNotif("error", "Bulk withdrawal error.");
    } finally {
      setLoading(false);
    }
  };

  // User manual modifications
  const handleModifyUser = async (uId: string, action: "Active" | "Suspended" | "Flagged" | "balance") => {
    try {
      setLoading(true);
      const params: any = {};
      if (action === "balance") {
        const valNum = Number(adjustmentBalance);
        if (isNaN(valNum)) {
          triggerNotif("error", "Please write a valid ledger balance numeric amount.");
          return;
        }
        params.walletBalance = valNum;
      } else {
        params.accountStatus = action;
      }

      const r = await fetch(`/api/admin/users/${uId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      const data = await r.json();
      if (r.ok) {
        triggerNotif("success", "User portfolio adjusted successfully.");
        setAdjustmentBalance("");
        setSelectedUser(null);
        loadData();
      } else {
        triggerNotif("error", data.error);
      }
    } catch (err) {
      triggerNotif("error", "Portfolio mutation error.");
    } finally {
      setLoading(false);
    }
  };

  // Approve single deposit proof manually
  const handleProcessDeposit = async (dId: string, action: "Approved" | "Rejected" | "Pending" | "Processing") => {
    try {
      setLoading(true);
      const r = await fetch(`/api/admin/deposits/${dId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: action,
          reviewComment: action === "Rejected" ? rejectionComm : undefined
        })
      });

      const d = await r.json();
      if (r.ok) {
        triggerNotif("success", `Deposit status updated to ${action} successfully.`);
        setRejectionComm("");
        setSelectedDeposit(null);
        loadData();
      } else {
        triggerNotif("error", d.error || "Error adjusting deposit.");
      }
    } catch (err) {
      triggerNotif("error", "Failed processing manual proof.");
    } finally {
      setLoading(false);
    }
  };

  // Complete single cashout request
  const handleProcessWithdrawal = async (wId: string, action: "Approved" | "Rejected" | "Completed" | "Processing" | "Pending") => {
    try {
      setLoading(true);
      const r = await fetch(`/api/admin/withdrawals/${wId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      const d = await r.json();
      if (r.ok) {
        triggerNotif("success", `Withdrawal session set to ${action}.`);
        loadData();
      } else {
        triggerNotif("error", d.error || "Failed updating withdrawal.");
      }
    } catch (e) {
      triggerNotif("error", "Failed updating cashout states.");
    } finally {
      setLoading(false);
    }
  };

  // Broadcast settings
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastText) {
      triggerNotif("error", "Subject and text are required.");
      return;
    }

    try {
      setLoading(true);
      const r = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: broadcastTitle, content: broadcastText })
      });

      if (r.ok) {
        triggerNotif("success", "System-wide broadcast published.");
        setBroadcastTitle("");
        setBroadcastText("");
        loadData();
      } else {
        triggerNotif("error", "Broadcast failed.");
      }
    } catch (e) {
      triggerNotif("error", "Announcement failed.");
    } finally {
      setLoading(false);
    }
  };

  // Helpdesk Ticket Dialog reply
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
        const updated = await r.json();
        setSelectedTicket(updated);
        setReplyMsg("");
        setTicketReplyPhoto("");
        loadData();
      } else {
        triggerNotif("error", "Dialogue reply transmission failed.");
      }
    } catch (err) {
      triggerNotif("error", "Network dispatch issue.");
    }
  };

  // Update complete system configurator
  const handleUpdateConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedConf: SystemConfig = {
        minDeposit: Number(editMinDeposit),
        minWithdrawal: Number(editMinWithdrawal),
        directCommissionPercent: Number(editDirectComm),
        indirectCommissionPercent: Number(editIndirectComm),
        adminBalance: Number(editAdminBalance),
        bankDetails: {
          bankName,
          accountName: accName,
          accountNumber: accNumber,
          branch: accBranch
        },
        esewaDetails: {
          phone: esewaPhone,
          name: esewaName
        },
        khaltiDetails: {
          phone: khaltiPhone,
          name: khaltiName
        },
        binanceDetails: {
          walletAddress: bAddress,
          network: bNetwork,
          name: "RefChain Binance Ledger"
        },
        supportContact: {
          whatsapp: supportWhatsApp,
          email: supportEmail,
          phone: "+977-1-4433221"
        },
        qrImages: {
          esewaQr,
          khaltiQr,
          bankQr,
          binanceQr
        }
      };

      const r = await fetch("/api/admin/system/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedConf)
      });

      if (r.ok) {
        triggerNotif("success", "System credentials updated safely.");
        onUpdateConfig(updatedConf);
        loadData();
      } else {
        triggerNotif("error", "Failed compiling config changes.");
      }
    } catch(err) {
      triggerNotif("error", "Error setting configuration params.");
    } finally {
      setLoading(false);
    }
  };

  // Convert files helper for QR Code customized modifications
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, gateway: "esewa" | "khalti" | "bank" | "binance") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (gateway === "esewa") setEsewaQr(base64);
        if (gateway === "khalti") setKhaltiQr(base64);
        if (gateway === "bank") setBankQr(base64);
        if (gateway === "binance") setBinanceQr(base64);
        triggerNotif("success", `Loaded QR configuration for ${gateway.toUpperCase()}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Excel direct csv downloader matching exact reports specs
  const triggerExcelDownload = (type: string) => {
    const downloadUrl = `/api/reports/export?type=${type}&token=${token}`;
    
    // Download using standard iframe/anchor method to verify file headers are pristine
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.style.display = "none";
    // Header authentications
    fetch(downloadUrl, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const bUrl = window.URL.createObjectURL(blob);
      anchor.href = bUrl;
      anchor.download = `RefChain_${type}_Ledger_${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(bUrl);
      document.body.removeChild(anchor);
      triggerNotif("success", `Excel ${type.toUpperCase()} Report generated.`);
    })
    .catch(() => {
      triggerNotif("error", "Excel compilation failed.");
    });
  };

  // Filter lists dynamically based on search query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phoneNumber.includes(query) ||
      u.id.toLowerCase().includes(query)
    );
  });

  const filteredDeposits = deposits.filter((d) => {
    const query = searchQuery.toLowerCase();
    return (
      d.id.toLowerCase().includes(query) ||
      d.userName.toLowerCase().includes(query) ||
      d.transactionId.toLowerCase().includes(query) ||
      d.userId.toLowerCase().includes(query)
    );
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const query = searchQuery.toLowerCase();
    return (
      w.id.toLowerCase().includes(query) ||
      w.userName.toLowerCase().includes(query) ||
      w.userId.toLowerCase().includes(query) ||
      w.walletDetails.toLowerCase().includes(query)
    );
  });

  // KPI Calculations
  const totalUsers = users.length;
  const totalApprovedDeposits = deposits
    .filter((d) => d.status === "Approved")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalCompletedWithdrawals = withdrawals
    .filter((w) => w.status === "Completed")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingDepositsCount = deposits.filter((d) => d.status === "Pending").length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "Pending" || w.status === "Processing").length;
  const activeFraudCount = alerts.filter((a) => a.status === "Active").length;
  const totalCommissionPaid = transactions
    .filter((t) => t.type.includes("Commission"))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div id="admin-layout" className={`min-h-screen font-sans flex ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* SIDEBAR CONTAINER */}
      <aside 
        id="admin-sidebar"
        className={`border-r shrink-0 transition-all duration-300 flex flex-col justify-between ${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-250"}`}
      >
        <div>
          {/* Logo element */}
          <div className="p-5 flex items-center gap-3 border-b dark:border-slate-805 border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black hover:scale-105 duration-200 shadow-md">
              RC
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h2 className="text-sm font-black tracking-tight flex items-center gap-1">
                  <span>RefChain</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-1 py-0.5 rounded border border-emerald-500/10 uppercase">Admin</span>
                </h2>
                <p className="text-[9px] opacity-40 font-mono">FINTECH LEDGER</p>
              </div>
            )}
          </div>

          {/* Menus List */}
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: Globe },
              { id: "users", label: "Users Management", icon: Users },
              { id: "deposits", label: "Deposits Queue", icon: ArrowUpRight, count: pendingDepositsCount },
              { id: "withdrawals", label: "Withdrawals Queue", icon: ArrowDownLeft, count: pendingWithdrawalsCount },
              { id: "history", label: "Ledgers ledger", icon: FileText },
              { id: "excel", label: "Excel Export Center", icon: FileSpreadsheet },
              { id: "support", label: "Tickets Helpdesk", icon: HelpCircle, count: tickets.filter((t) => t.status === "Open").length },
              { id: "forgot-passwords", label: "Password Recoveries", icon: ShieldCheck, count: passwordRecoveries.filter((r: any) => r.status === "Pending").length },
              { id: "security", label: "Fraud & Alerts", icon: AlertTriangle, count: activeFraudCount },
              { id: "settings", label: "System settings", icon: Settings }
            ].map((m) => {
              const Icon = m.icon;
              const isActive = activeMenu === m.id;
              return (
                <button
                  id={`side-menu-${m.id}`}
                  key={m.id}
                  onClick={() => { setActiveMenu(m.id as any); setSelectedUser(null); setSelectedDeposit(null); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 font-bold shadow-sm border border-slate-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? "text-emerald-500" : "opacity-60"} />
                    {!sidebarCollapsed && <span>{m.label}</span>}
                  </div>
                  {!sidebarCollapsed && m.count !== undefined && m.count > 0 && (
                    <span className="bg-emerald-900 border border-emerald-500 text-emerald-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      {m.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Foot collapse action button */}
        <div className="p-4 border-t dark:border-slate-800 border-gray-200">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-10 border border-slate-800 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP MAIN GLOBAL NAVIGATION PANEL */}
        <header className={`border-b shrink-0 h-16 flex items-center justify-between px-6 ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center gap-4">
            <h2 className="text-emerald-500 font-bold text-sm tracking-widest uppercase font-mono">
              / {activeMenu.toUpperCase()}
            </h2>
            
            {/* GLOBAL QUERY SEARCH FILTER BOX */}
            <div className="relative w-64 hidden sm:block">
              <input
                id="global-admin-search-input"
                type="text"
                placeholder="Search Account ID / Trx Hash / Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-9 pl-9 pr-4 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 transition-colors ${
                  darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-gray-50 border-gray-300"
                }`}
              />
              <Search size={13} className="absolute left-3 top-3 opacity-40 text-emerald-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicators */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] text-emerald-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PORTAL SECURE LIVE
            </div>

            <div className="text-right text-xs">
              <p className="font-bold">{adminUser.fullName}</p>
              <button onClick={onLogout} className="text-[10px] font-bold text-rose-405 hover:underline text-rose-400">
                Exit Session
              </button>
            </div>
          </div>
        </header>

        {/* INNER DYNAMIC SCROLL CONTAINER */}
        <div id="admin-workspace" className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* TOAST SYSTEM ALERTS */}
          {notif && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 bg-slate-950/95 text-emerald-300 text-xs font-semibold`}>
              <Check size={16} />
              <span>{notif.msg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW PANEL WITH HIGH-TECH GRAPHICS */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6 animate-fade-in">

              {/* QUICK ACTIONS RIBBONS */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${
                darkMode ? "bg-slate-900/35 border-slate-800" : "bg-white border-gray-200"
              }`}>
                <div>
                  <h4 className="text-xs font-bold leading-none text-emerald-500 flex items-center gap-1">
                    <Sparkles size={14} />
                    Audit Operators Control
                  </h4>
                  <p className="text-[10px] opacity-60 mt-1">Execute systemic mass balance validations and quick reporting functions.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    id="bulk-approve-dep-btn"
                    onClick={handleBulkApproveDeposits}
                    className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-[10px] uppercase text-white rounded-lg transition-transform hover:scale-105"
                  >
                    Approve All Deposits
                  </button>
                  <button 
                    id="bulk-approve-with-btn"
                    onClick={handleBulkApproveWithdrawals}
                    className="h-9 px-3 bg-indigo-500 hover:bg-indigo-600 font-bold text-[10px] uppercase text-white rounded-lg transition-transform hover:scale-105"
                  >
                    Approve All Cashouts
                  </button>
                  <button 
                    id="quick-excel-btn"
                    onClick={() => triggerExcelDownload("summary")}
                    className="h-9 px-3 border border-slate-800 hover:bg-slate-800 font-mono font-semibold text-[10px] rounded-lg text-white"
                  >
                    CSV Audit Extract
                  </button>
                </div>
              </div>
              
              {/* COGNITIVE KPI BAR CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "REGISTERED CUSTOMERS", value: totalUsers, icon: Users, sub: `${users.filter(u=>u.accountStatus === 'Active').length} active pipeline`, trend: "+12%" },
                  { label: "APPROVED SYSTEM DEPOSITS", value: `NPR ${totalApprovedDeposits.toLocaleString()}`, icon: ArrowUpRight, sub: `${deposits.filter(d=>d.status==='Pending').length} pending review`, trend: "Secure" },
                  { label: "CASH-OUT PAYOUTS (VAL)", value: `NPR ${totalCompletedWithdrawals.toLocaleString()}`, icon: ArrowDownLeft, sub: `${withdrawals.filter(w=>w.status==='Pending').length} pending queue`, trend: "Standard" },
                  { label: "TOTAL SYSTEM COMMISSIONS", value: `NPR ${totalCommissionPaid.toLocaleString()}`, icon: ShieldCheck, sub: "Direct (40%) and Indirect (10%) splits", trend: "Processed" }
                ].map((k, idx) => {
                  const Icon = k.icon;
                  return (
                    <div id={`kpi-card-${idx}`} key={idx} className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-150"}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black tracking-wider uppercase opacity-40">{k.label}</span>
                        <div className="p-1 px-2 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 rounded font-mono font-bold">
                          {k.trend}
                        </div>
                      </div>
                      <h3 className="text-xl font-black font-mono mt-2">{k.value}</h3>
                      <p className="text-[10px] opacity-50 mt-1 flex items-center gap-1">
                        <Icon size={12} className="text-emerald-500" />
                        {k.sub}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* DYNAMIC SVG CHART AREA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SVG PLOTTED GROWTH TREND CHART */}
                <div className={`lg:col-span-2 rounded-2xl p-6 border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-emerald-500">RefChain Ledger Growth trends (Deposits Over Time)</h4>
                  <p className="text-[10px] opacity-50 mb-6">Visual mapped statistics representing growth cycles of deposits approvals.</p>
                  
                  {/* Custom crafted layout SVG chart */}
                  <div className="w-full h-52 relative border-b border-l border-slate-800 flex items-center justify-center p-2">
                    <svg className="w-full h-full" viewBox="0 0 500 200">
                      {/* Grid Lines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#102a3a" strokeDasharray="3" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#102a3a" strokeDasharray="3" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#102a3a" strokeDasharray="3" />
                      
                      {/* Gradient Flow */}
                      <defs>
                        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area Path */}
                      <path 
                        d="M0,180 L80,140 L160,160 L240,90 L320,110 L400,40 L480,20 L500,20 L500,200 L0,200 Z" 
                        fill="url(#chartGrad)" 
                      />

                      {/* Line Path */}
                      <path 
                        d="M0,180 L80,140 L160,160 L240,90 L320,110 L400,40 L480,20" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="3.5" 
                      />

                      {/* Control Node points */}
                      <circle cx="80" cy="140" r="4" fill="#059669" />
                      <circle cx="240" cy="90" r="4" fill="#059669" />
                      <circle cx="400" cy="40" r="4" fill="#059669" />
                      <circle cx="480" cy="20" r="4" fill="#059669" />
                    </svg>

                    {/* Chart legends */}
                    <div className="absolute bottom-2 left-2 flex gap-4 text-[9px] font-mono opacity-50">
                      <span>May 10</span>
                      <span>May 15</span>
                      <span>May 20</span>
                      <span>May 28 (Now)</span>
                    </div>
                  </div>
                </div>

                {/* BROADCAST NEWS ANNOUNCEMENTS PUBLISHERS */}
                <div className={`rounded-xl p-5 border ${darkMode ? "bg-slate-900/20 border-slate-805" : "bg-white border-gray-200"}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-emerald-500">Publish Broadcast Alerts</h4>
                  <form id="broadcast-form" onSubmit={handlePublishAnnouncement} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-10">Broadcast Subject Headline</label>
                      <input
                        id="broadcast-title"
                        type="text"
                        placeholder="e.g. eSewa merchant accounts updated."
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className={`w-full h-8 px-2.5 rounded border text-xs focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-gray-250"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-1">Announcement Body Description</label>
                      <textarea
                        id="broadcast-content"
                        rows={3}
                        placeholder="Please write exact compliance notices or change details here."
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        className={`w-full p-2.5 rounded border text-[11px] focus:outline-none focus:border-emerald-500 ${
                          darkMode ? "bg-slate-950 border-slate-850 text-white" : "bg-white border-gray-250"
                        }`}
                      />
                    </div>

                    <button
                      id="publish-broadcast-btn"
                      type="submit"
                      className="w-full h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase rounded"
                    >
                      Broadcast Announcement
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SYSTEM CUSTOMERS DIRECTORY */}
          {activeMenu === "users" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-sm font-bold uppercase text-emerald-500">Users Directory Listings</h3>
                <span className="text-xs opacity-60 font-mono">Found {filteredUsers.length} matched users</span>
              </div>

              {/* CONTROLS LIST */}
              <div className={`overflow-x-auto rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b dark:border-slate-800 border-gray-250 opacity-40 text-[10px] font-black uppercase ${
                      darkMode ? "bg-slate-950" : "bg-gray-100"
                    }`}>
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Name / email</th>
                      <th className="p-4">Phone Numbers</th>
                      <th className="p-4">Wallet Balance</th>
                      <th className="p-4">Referrals Count</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-center">Actions / Modify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr id={`user-row-${u.id}`} key={u.id} className="border-b dark:border-slate-805 border-gray-200 hover:dark:bg-slate-900/10 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-400">{u.id}</td>
                        <td className="p-4">
                          <p className="font-bold">{u.fullName}</p>
                          <span className="text-[10px] font-mono opacity-50">{u.email}</span>
                        </td>
                        <td className="p-4 font-mono">{u.phoneCode} {u.phoneNumber}</td>
                        <td className="p-4 font-mono font-bold text-emerald-500">NPR {u.walletBalance.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-semibold">D: {u.directReferralsCount} / I: {u.indirectReferralsCount}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            u.accountStatus === "Active" ? "bg-emerald-950 border-emerald-800 text-emerald-400" :
                            u.accountStatus === "Suspended" ? "bg-rose-955 border-rose-800 text-rose-400" :
                            "bg-amber-950 border-amber-800 text-amber-400"
                          }`}>{u.accountStatus}</span>
                        </td>
                        <td className="p-4 flex gap-1.5 justify-center">
                          <button
                            id={`user-edit-${u.id}`}
                            onClick={() => setSelectedUser(u)}
                            className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded text-[10px] font-bold transition-all"
                          >
                            Modify Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DRAWER MODAL FOR SELECTED USER ACCOUNT MODIFICATION */}
              {selectedUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
                  <div 
                    id="user-drawer-backdrop"
                    className="absolute inset-0" 
                    onClick={() => setSelectedUser(null)} 
                  />
                  <div className={`relative w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto ${
                    darkMode ? "bg-slate-950 border-l border-slate-800" : "bg-white border-l border-gray-300"
                  }`}>
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                      <div>
                        <span className="text-xs text-emerald-500 font-bold font-mono">{selectedUser.id}</span>
                        <h4 className="text-sm font-black text-white">{selectedUser.fullName}</h4>
                      </div>
                      <button id="close-user-drawer-btn" onClick={() => setSelectedUser(null)} className="p-2 border rounded-full hover:bg-slate-800 text-slate-400">
                        <X size={15} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      
                      {/* USER DETAILS GRID */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block opacity-40">Country Code</span>
                          <p className="font-bold mt-0.5">{selectedUser.phoneCode}</p>
                        </div>
                        <div>
                          <span className="block opacity-40">Contact Phone</span>
                          <p className="font-bold mt-0.5">{selectedUser.phoneNumber}</p>
                        </div>
                        <div>
                          <span className="block opacity-40">WhatsApp Sync No</span>
                          <p className="font-bold mt-0.5">{selectedUser.whatsappNumber}</p>
                        </div>
                        <div>
                          <span className="block opacity-40">Account Joined At</span>
                          <p className="font-mono mt-0.5">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* MANUAL BALANCE MUTATION */}
                      <div className="p-4 bg-slate-900 border border-slate-805 rounded-xl space-y-3.5">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">Set Manual Balance adjustment</span>
                        <div className="flex gap-2">
                          <input
                            id="audit-manual-bal-input"
                            type="number"
                            placeholder="Write target wallet balance NPR amount"
                            value={adjustmentBalance}
                            onChange={(e) => setAdjustmentBalance(e.target.value)}
                            className="flex-1 h-9 bg-slate-950 border border-slate-800 outline-none focus:border-emerald-500 text-slate-100 rounded text-xs px-3"
                          />
                          <button
                            id="save-manual-bal-btn"
                            onClick={() => handleModifyUser(selectedUser.id, "balance")}
                            className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-xs"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      {/* AML STATUS ACTIONS */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-wider opacity-60 uppercase">Suspend, Freeze or flag Account status</span>
                        <div className="flex gap-2">
                          <button
                            id="status-active-btn"
                            onClick={() => handleModifyUser(selectedUser.id, "Active")}
                            className="flex-1 h-9 bg-emerald-500 border border-emerald-600 text-white text-xs font-bold rounded"
                          >
                            Restore Account
                          </button>
                          <button
                            id="status-flagged-btn"
                            onClick={() => handleModifyUser(selectedUser.id, "Flagged")}
                            className="flex-1 h-9 bg-amber-500 border border-amber-600 text-white text-xs font-bold rounded"
                          >
                            Flag Portfolio
                          </button>
                          <button
                            id="status-suspended-btn"
                            onClick={() => handleModifyUser(selectedUser.id, "Suspended")}
                            className="flex-1 h-9 bg-rose-500 border border-rose-600 text-white text-xs font-bold rounded"
                          >
                            Suspend Lock
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEPOSITS VERIFY QUEUE */}
          {activeMenu === "deposits" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-emerald-500">Manual Deposits auditing backlog</h3>

              <div className={`overflow-x-auto rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b dark:border-slate-800 border-gray-250 opacity-40 text-[10px] font-black uppercase ${
                      darkMode ? "bg-slate-950" : "bg-gray-100"
                    }`}>
                      <th className="p-4">Deposit ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Gateway Trace ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Proof preview</th>
                      <th className="p-4 text-center">Processing Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposits.map((d) => (
                      <tr id={`dep-row-${d.id}`} key={d.id} className="border-b dark:border-slate-805 border-gray-200 hover:dark:bg-slate-905/10 hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-emerald-400">{d.id}</td>
                        <td className="p-4">
                          <p className="font-semibold">{d.userName}</p>
                          <span className="text-[10px] opacity-40">UID: {d.userId}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-500">NPR {d.amount.toLocaleString()}</td>
                        <td className="p-4 font-mono text-xs">{d.method}</td>
                        <td className="p-4 font-mono text-[11px] truncate max-w-[120px]" title={d.transactionId}>{d.transactionId}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                            d.status === "Approved" ? "bg-emerald-950 border-emerald-800 text-emerald-400" :
                            d.status === "Rejected" ? "bg-rose-950 border-rose-800 text-rose-400" :
                            "bg-amber-950 border-amber-800 text-amber-400"
                          }`}>{d.status}</span>
                        </td>
                        <td className="p-4">
                          {d.screenshot && (
                            <button id={`btn-view-proof-${d.id}`} onClick={() => setSelectedDeposit(d)} className="text-indigo-400 hover:underline flex items-center gap-1">
                              <Eye size={12} />
                              View Proof
                            </button>
                          )}
                        </td>
                        <td className="p-4 flex gap-1 justify-center flex-wrap">
                          <button
                            id={`dep-pending-${d.id}`}
                            onClick={() => handleProcessDeposit(d.id, "Pending")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              d.status === "Pending"
                                ? "bg-amber-500 text-white cursor-default"
                                : "bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400"
                            }`}
                            title="Set deposit status as Pending"
                          >
                            Pending
                          </button>
                          <button
                            id={`dep-processing-${d.id}`}
                            onClick={() => handleProcessDeposit(d.id, "Processing")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              d.status === "Processing"
                                ? "bg-indigo-500 text-white cursor-default"
                                : "bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400"
                            }`}
                            title="Set deposit status as Processing"
                          >
                            Processing
                          </button>
                          <button
                            id={`dep-approve-${d.id}`}
                            onClick={() => handleProcessDeposit(d.id, "Approved")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              d.status === "Approved"
                                ? "bg-emerald-500 text-white cursor-default"
                                : "bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400"
                            }`}
                            title="Approve deposit and allocate MLM commission payouts"
                          >
                            Approve
                          </button>
                          <button
                            id={`dep-reject-${d.id}`}
                            onClick={() => handleProcessDeposit(d.id, "Rejected")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              d.status === "Rejected"
                                ? "bg-rose-500 text-white cursor-default"
                                : "bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400"
                            }`}
                            title="Reject deposit and cancel allocation"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PREVIEW IMAGE DRAWER */}
              {selectedDeposit && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                  <div className={`relative max-w-lg w-full rounded-2xl p-6 text-xs overflow-hidden shadow-2xl ${
                    darkMode ? "bg-slate-900 border border-slate-800" : "bg-white border text-black"
                  }`}>
                    <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800 mb-4">
                      <h4 className="font-bold text-emerald-500">Verify Deposit Screenshot & Gateway Details</h4>
                      <button id="close-screenshot-preview-btn" onClick={() => setSelectedDeposit(null)} className="p-1 text-slate-400 hover:text-white">✕</button>
                    </div>

                    <img 
                      src={selectedDeposit.screenshot} 
                      alt="Verification Deposit proof" 
                      className="w-full max-h-80 object-contain rounded-xl border dark:border-slate-800 mb-4 bg-slate-950" 
                    />

                    <div className="space-y-3 font-mono text-[11px] mb-4">
                      <p>Customer Profile: <span className="font-bold">{selectedDeposit.userName} ({selectedDeposit.userId})</span></p>
                      <p>Verification Amount: <span className="font-bold text-emerald-400">NPR {selectedDeposit.amount}</span></p>
                      <p>Gateway Method: <span className="font-bold">{selectedDeposit.method}</span></p>
                      <p>Uploaded Tracer Hash ID: <span className="font-bold text-indigo-400">{selectedDeposit.transactionId}</span></p>
                    </div>

                    {selectedDeposit.status === "Pending" && (
                      <div className="space-y-3 border-t dark:border-slate-800 pt-4">
                        <textarea
                          id="deposit-reject-comment"
                          placeholder="If rejecting, write rejection comments..."
                          value={rejectionComm}
                          onChange={(e) => setRejectionComm(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            id="drawer-approve-dep-btn"
                            onClick={() => handleProcessDeposit(selectedDeposit.id, "Approved")}
                            className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded"
                          >
                            Verify & Approve deposit
                          </button>
                          <button
                            id="drawer-reject-dep-btn"
                            onClick={() => handleProcessDeposit(selectedDeposit.id, "Rejected")}
                            className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded"
                          >
                            Reject Claim
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WITHDRAWALS QUEUE */}
          {activeMenu === "withdrawals" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-emerald-505">Manual Withdrawals Cashout Pipeline</h3>

              <div className={`overflow-x-auto rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-200"}`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b dark:border-slate-805 border-gray-250 opacity-40 text-[10px] font-black uppercase ${
                      darkMode ? "bg-slate-950" : "bg-gray-100"
                    }`}>
                      <th className="p-4">Withdrawal ID</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Method Details</th>
                      <th className="p-4">Risk scoring</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Auditing Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((w) => (
                      <tr id={`with-row-${w.id}`} key={w.id} className="border-b dark:border-slate-805 border-gray-200 hover:dark:bg-slate-905/10 hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-emerald-400">{w.id}</td>
                        <td className="p-4">
                          <p className="font-semibold">{w.userName}</p>
                          <span className="text-[10px] opacity-40">User ID: {w.userId}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-rose-500">NPR {w.amount.toLocaleString()}</td>
                        <td className="p-4 font-mono text-xs">{w.method} • <span className="opacity-60">{w.walletDetails}</span></td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            w.riskScore >= 50 ? "bg-rose-950 text-rose-400 animate-pulse border border-rose-800" : "bg-emerald-950 text-emerald-450 border border-emerald-900"
                          }`}>{w.riskScore}/100</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                            w.status === "Completed" ? "bg-emerald-950 border-emerald-800 text-emerald-400" :
                            w.status === "Rejected" ? "bg-rose-950 border-rose-800 text-rose-400" :
                            "bg-amber-955 border-amber-805 text-amber-400"
                          }`}>{w.status}</span>
                        </td>
                        <td className="p-4 flex gap-1 justify-center flex-wrap">
                          <button
                            id={`with-pending-${w.id}`}
                            onClick={() => handleProcessWithdrawal(w.id, "Pending")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              w.status === "Pending"
                                ? "bg-amber-500 text-white cursor-default"
                                : "bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400"
                            }`}
                            title="Set withdrawal status to Pending"
                          >
                            Pending
                          </button>
                          <button
                            id={`with-processing-${w.id}`}
                            onClick={() => handleProcessWithdrawal(w.id, "Processing")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              w.status === "Processing"
                                ? "bg-indigo-500 text-white cursor-default"
                                : "bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400"
                            }`}
                            title="Set withdrawal status to Processing"
                          >
                            Processing
                          </button>
                          <button
                            id={`with-completed-${w.id}`}
                            onClick={() => handleProcessWithdrawal(w.id, "Completed")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              w.status === "Completed" || w.status === "Approved"
                                ? "bg-emerald-500 text-white cursor-default"
                                : "bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400"
                            }`}
                            title="Set withdrawal status as Approved & Completed"
                          >
                            Approve
                          </button>
                          <button
                            id={`with-rejected-${w.id}`}
                            onClick={() => handleProcessWithdrawal(w.id, "Rejected")}
                            className={`p-1 px-2 rounded text-[10px] font-bold transition-all ${
                              w.status === "Rejected"
                                ? "bg-rose-500 text-white cursor-default"
                                : "bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400"
                            }`}
                            title="Set withdrawal status as Rejected and return funds to client"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LEDGERS LEDGER TRACKER */}
          {activeMenu === "history" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-emerald-500">Primal Balance Auditing Ledger</h3>
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div id={`ledger-flow-${t.id}`} key={t.id} className={`p-4 rounded-xl border text-xs flex justify-between items-center ${
                    darkMode ? "bg-slate-900/35 border-slate-805" : "bg-white border-gray-250"
                  }`}>
                    <div>
                      <p className="font-bold">{t.description}</p>
                      <span className="text-[10px] opacity-40 font-mono">User: {t.userName} ({t.userId}) • Tracer ID: {t.id}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm block ${
                        t.type.includes("Commission") || t.type === "Deposit" ? "text-emerald-500" : "text-rose-500"
                      }`}>{t.amount >= 0 ? "+" : ""}{t.amount} NPR</span>
                      <span className="text-[8px] uppercase tracking-widest opacity-40">{t.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT CHAT HELPDESK OPERATORS */}
          {activeMenu === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
              
              {/* TICKETS DIRECTORIES BAR */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Unresolved Tickets queues</h4>
                {tickets.map((t) => (
                  <button
                    id={`admin-ticket-card-${t.id}`}
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${
                      selectedTicket?.id === t.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : darkMode ? "bg-slate-900/20 border-slate-808 hover:bg-slate-900" : "bg-white border-gray-200"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">{t.id}</span>
                      <p className="font-bold mt-1 max-w-xs truncate">{t.subject}</p>
                      <span className="text-[10px] opacity-60 block mt-0.5">Category: {t.category} • Client: {t.userName}</span>
                    </div>
                    <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                      t.status === "Open" ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400 animate-pulse"
                    }`}>{t.status}</span>
                  </button>
                ))}
                {tickets.length === 0 && (
                  <div className="p-8 text-center text-xs opacity-50 border border-dashed rounded-xl border-slate-800">No active customer tickets.</div>
                )}
              </div>

              {/* ACTIVE DIALOGUE WINDOWS */}
              <div className="lg:col-span-3">
                {selectedTicket ? (
                  <div className={`rounded-2xl border flex flex-col h-[460px] overflow-hidden ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-gray-250"
                  }`}>
                    <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono text-emerald-500 uppercase">{selectedTicket.id} • CLIENT: {selectedTicket.userName}</span>
                        <h4 className="text-xs font-bold text-white">{selectedTicket.subject}</h4>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400">Category: {selectedTicket.category}</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-500/5">
                      {selectedTicket.messages.map((m, mIndex) => {
                        const isAgent = m.sender === "Admin";
                        return (
                          <div key={mIndex} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                            <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed ${
                              isAgent 
                                ? "bg-emerald-500 text-white" 
                                : darkMode 
                                  ? "bg-slate-950 text-emerald-300 border border-slate-850" 
                                  : "bg-emerald-50 text-emerald-900"
                            }`}>
                              <span className="block text-[8px] font-bold uppercase tracking-wider mb-1 opacity-65">
                                {isAgent ? "You (Admin)" : "Client Helpline Query"}
                              </span>
                              <p className="whitespace-pre-line">{m.message}</p>
                              
                              {m.photo && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-emerald-500/20 max-w-[180px] bg-slate-950">
                                  <img 
                                    src={m.photo} 
                                    alt="Screenshot Reference" 
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

                    <form id="admin-chat-form" onSubmit={handleSendReply} className="p-3 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          id="admin-chat-input"
                          type="text"
                          placeholder="Type executive support answers..."
                          value={replyMsg}
                          onChange={(e) => setReplyMsg(e.target.value)}
                          className={`flex-1 h-10 px-3 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                            darkMode ? "bg-slate-950 border-slate-808 text-white" : "bg-white border-gray-300"
                          }`}
                        />
                        <button
                          id="admin-chat-send-btn"
                          type="submit"
                          className="px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
                        >
                          <Send size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-[10px] text-amber-500 hover:underline font-semibold flex items-center gap-1 bg-slate-500/5 p-1 px-2 rounded-md border dark:border-slate-805">
                            <span>📸 Attach visual reply</span>
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
                  <div className="h-[460px] flex items-center justify-center border border-dashed rounded-2xl border-slate-800 opacity-40 text-xs text-center p-8">
                    Select an executive customer ticket from left queues to open active text dialogue modules.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6.5: FORGOT PASSWORD RECOVERY MANAGEMENT */}
          {activeMenu === "forgot-passwords" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-6 border rounded-2xl ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"}`}>
                <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                  <ShieldCheck size={18} />
                  Client Password Recovery Requests Pipeline
                </h3>
                <p className="text-xs opacity-70 mt-1">
                  When users request a password change via "Forgot Password," their requests are sent directly and separately to this panel. You can contact them on WhatsApp to verify identity or immediately approve and apply their requested password.
                </p>
              </div>

              <div className="space-y-4">
                {passwordRecoveries.map((rec) => {
                  const reqUser = users.find((u) => u.id === rec.userId) || { fullName: "Unregistered Candidate", phoneNumber: "" };
                  const isPending = rec.status === "Pending";
                  const waNumber = rec.whatsappContact || reqUser.phoneNumber || "";
                  const waLink = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}`;
                  
                  return (
                    <div 
                      key={rec.id} 
                      id={`recovery-card-${rec.id}`}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
                        isPending 
                          ? darkMode 
                            ? "bg-slate-900 border-amber-900/60" 
                            : "bg-amber-50/10 border-amber-205"
                          : darkMode 
                            ? "bg-slate-950 border-slate-900 opacity-60" 
                            : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] uppercase text-emerald-400 bg-emerald-500/10 p-0.5 px-2 rounded-md">
                            {rec.id}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isPending ? "bg-amber-955 text-amber-500 bg-amber-900/40" : "bg-emerald-955 bg-emerald-990/40 text-emerald-500"
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold">{reqUser.fullName}</h4>
                        <p className="text-xs font-mono opacity-85">Account User ID: {rec.userId || "N/A"}</p>
                        <p className="text-xs font-mono opacity-80">Email: {rec.email}</p>
                        <p className="text-xs">
                          Requested Desired Password: <span className="font-mono bg-black/40 p-1 px-2 rounded font-bold text-amber-400">{rec.desiredPassword}</span>
                        </p>
                        {rec.whatsappContact && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-mono">
                            <span className="opacity-60">WhatsApp Contact:</span>
                            <a href={waLink} target="_blank" referrerPolicy="no-referrer" className="underline hover:text-emerald-300 flex items-center gap-1 font-semibold">
                              <span>{rec.whatsappContact}</span>
                              <MessageCircle size={12} />
                            </a>
                          </div>
                        )}
                        <p className="text-[10px] opacity-40">Submitted: {new Date(rec.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct WhatsApp link to chat */}
                        {waNumber && (
                          <a 
                            href={`https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(reqUser.fullName)}%2C%20this%20is%20RefChain%20Executive%20Support.%20I%20received%20your%20password%20recovery%20request%20for%20email%20${encodeURIComponent(rec.email)}.`}
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-transform hover:scale-105"
                          >
                            <MessageCircle size={14} />
                            Contact Whatsapp
                          </a>
                        )}

                        {isPending && (
                          <>
                            <button
                              id={`approve-recovery-${rec.id}`}
                              onClick={() => handleResolveRecovery(rec.id, "apply")}
                              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Approve & Update
                            </button>
                            <button
                              id={`dismiss-recovery-${rec.id}`}
                              onClick={() => handleResolveRecovery(rec.id, "dismiss")}
                              className="h-10 px-4 border border-slate-705 hover:bg-rose-950/20 hover:text-rose-450 text-slate-400 text-xs font-bold rounded-xl transition-all"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {passwordRecoveries.length === 0 && (
                  <div className="p-12 text-center text-xs opacity-55 border border-dashed rounded-2xl dark:border-slate-800 border-gray-200">
                    No password recovery requests lodged.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: EXCEL REPORT DIRECT DOWNLOADS */}
          {activeMenu === "excel" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl max-w-2xl">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <FileSpreadsheet size={18} />
                  Excel Export & Auditing reporting center
                </h3>
                <p className="text-xs opacity-80 mt-2 leading-relaxed">
                  Export financial logs, customer databases, deposit statements, and wallets commissions data matching exactly standard banking criteria. Download is structured natively in highly clean CSV schemas, ensuring 100% compatibility with MS Excel, LibreOffice, and Google Sheets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {[
                  { label: "USER PROFILES SCHEMAS", desc: "Downloads complete registered customer details, phone numbers, total earned metrics, and current statuses.", key: "users" },
                  { label: "DEPOSITS ARCHIVES SHEET", desc: "Pulls manual receipts deposits history logs including transfer screenshots, references, and outcomes.", key: "deposits" },
                  { label: "PAYOUTS CASHOUT PIPELINE", desc: "Downloads audit list of withdrawal ledger logs, risk indicator ratings, and execution dates.", key: "withdrawals" },
                  { label: "LEDGERS TRANSACTION LEDGER", desc: "Acquires unified ledger logs tracking exact flows of commissions and deposit events.", key: "transactions" }
                ].map((item, idx) => (
                  <div id={`excel-card-${idx}`} key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    darkMode ? "bg-slate-900/10 border-slate-800" : "bg-white border-gray-250"
                  }`}>
                    <div>
                      <h4 className="text-xs font-black tracking-wider text-emerald-500">{item.label}</h4>
                      <p className="text-[11px] opacity-60 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      id={`btn-export-${item.key}`}
                      onClick={() => triggerExcelDownload(item.key)}
                      className="mt-6 h-9 w-full bg-slate-800 hover:bg-slate-750 text-white font-bold text-[10px] uppercase rounded-lg tracking-wider"
                    >
                      Export CSV / Excel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: FRAUD & ALERTS INTERCEPTOR MONITOR */}
          {activeMenu === "security" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-emerald-500">Antifraud & Duplicates warnings logs</h3>
              <div className="space-y-3">
                {alerts.map((a) => (
                  <div id={`alert-item-${a.id}`} key={a.id} className={`p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 text-xs flex justify-between items-center`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-450 font-mono">{a.id}</span>
                        <span className="bg-rose-950 border border-rose-800 text-rose-400 font-bold px-1 rounded uppercase tracking-wider text-[8px]">
                          {a.severity} RISK ALERT
                        </span>
                      </div>
                      <p className="font-bold mt-1.5 text-slate-100">{a.details}</p>
                      <span className="text-[10px] opacity-40 font-mono block mt-1">Client: {a.userName} (ID: {a.userId}) • Detected At: {new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <button
                        id={`btn-freeze-user-${a.userId}`}
                        onClick={() => {
                          fetch("/api/admin/fraud/freeze", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ userId: a.userId })
                          })
                          .then(res => res.json())
                          .then((data) => {
                            triggerNotif("success", data.message || "User portfolio frozen.");
                            loadData();
                          });
                        }}
                        className="px-3 h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px]"
                      >
                        Freeze Portfolio
                      </button>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="p-8 text-center text-xs opacity-50 border border-dashed rounded-xl border-slate-805">
                    AML shield active. No suspicious duplications or logins detected recently.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: SYSTEM CONFIGURATOR */}
          {activeMenu === "settings" && (
            <form id="system-config-form" onSubmit={handleUpdateConfigSubmit} className="space-y-6 max-w-4xl animate-fade-in">
              <h3 className="text-sm font-bold uppercase text-emerald-500">System Gateway Credentials & Configurations</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FINANCIAL PARAMETERS */}
                <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-250"}`}>
                  <h4 className="text-xs font-bold text-emerald-500 uppercase">1. Multi-level referral Commissions & Limit Adjustments</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-1">Minimum Deposit Amount (NPR)</label>
                      <input
                        id="conf-min-dep"
                        type="number"
                        value={editMinDeposit}
                        onChange={(e) => setEditMinDeposit(e.target.value)}
                        className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-1">Minimum Cash-out limit (NPR)</label>
                      <input
                        id="conf-min-with"
                        type="number"
                        value={editMinWithdrawal}
                        onChange={(e) => setEditMinWithdrawal(e.target.value)}
                        className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-1">Direct Commission (Tier 1 %)</label>
                      <input
                        id="conf-dir-comm"
                        type="number"
                        value={editDirectComm}
                        onChange={(e) => setEditDirectComm(e.target.value)}
                        className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold opacity-60 mb-1">Indirect Commission (Tier 2 %)</label>
                      <input
                        id="conf-ind-comm"
                        type="number"
                        value={editIndirectComm}
                        onChange={(e) => setEditIndirectComm(e.target.value)}
                        className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold opacity-60 mb-1">Administrative Cash balance customization (NPR)</label>
                    <input
                      id="conf-admin-bal"
                      type="number"
                      value={editAdminBalance}
                      onChange={(e) => setEditAdminBalance(e.target.value)}
                      className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                    />
                  </div>
                </div>

                {/* HELPDESK OPERATOR CONTACT LINKS */}
                <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-gray-250"}`}>
                  <h4 className="text-xs font-bold text-emerald-500 uppercase">2. Helpline Operator endpoints</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold opacity-60 mb-1">WhatsApp operator Link</label>
                    <input
                      id="conf-whatsapp-link"
                      type="text"
                      value={supportWhatsApp}
                      onChange={(e) => setSupportWhatsApp(e.target.value)}
                      className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold opacity-60 mb-1">Helpline support Email</label>
                    <input
                      id="conf-support-email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full h-9 bg-slate-950 border border-slate-850 rounded text-xs px-2.5"
                    />
                  </div>
                </div>

              </div>

              {/* PAYMENT QR CODE ATTACHMENTS PLACED BY THE ADMIN */}
              <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-808" : "bg-white border-gray-250"}`}>
                <h4 className="text-xs font-bold text-emerald-500 uppercase">3. Upload Gateway Merchant QR screenshots</h4>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "eSewa Direct QR", key: "esewa", value: esewaQr },
                    { label: "Khalti Direct QR", key: "khalti", value: khaltiQr },
                    { label: "Nepal Bank Transfer QR", key: "bank", value: bankQr },
                    { label: "Binance Wallet QR", key: "binance", value: binanceQr }
                  ].map((item) => (
                    <div key={item.key} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center space-y-2">
                      <span className="block text-[10px] font-bold opacity-50">{item.label}</span>
                      {item.value && (
                        <img 
                          src={item.value} 
                          alt="Merchant custom QR code screenshot proof" 
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-contain mx-auto rounded border border-gray-600 bg-black" 
                        />
                      )}
                      
                      <div className="relative">
                        <input
                          id={`qr-[${item.key}]`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQrUpload(e, item.key as any)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-[10px] block py-1 border border-dashed border-emerald-500/30 text-emerald-400 hover:border-emerald-500 cursor-pointer rounded-lg font-bold">
                          Upload Custom QR
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT CONFIGURATOR TEXT VARIABLES */}
              <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? "bg-slate-900/20 border-slate-805" : "bg-white border-gray-250"}`}>
                <h4 className="text-xs font-bold text-emerald-500 uppercase font-mono">4. Gateway Text Parameters details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                    <span className="block text-[10px] font-bold opacity-60">Nepal Clear Direct Bank Details</span>
                    <input type="text" placeholder="Bank Name" value={bankName} onChange={(e)=>setBankName(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                    <input type="text" placeholder="Account Name" value={accName} onChange={(e)=>setAccName(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                    <input type="text" placeholder="Account Number" value={accNumber} onChange={(e)=>setAccNumber(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                    <input type="text" placeholder="Branch Name" value={accBranch} onChange={(e)=>setAccBranch(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                    <span className="block text-[10px] font-bold opacity-60">Merchant Mobile Payments Detail</span>
                    <label className="text-[9px] opacity-40">eSewa Mobile Details</label>
                    <input type="text" placeholder="eSewa Phone" value={esewaPhone} onChange={(e)=>setEsewaPhone(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                    <input type="text" placeholder="eSewa Name" value={esewaName} onChange={(e)=>setEsewaName(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />

                    <label className="text-[9px] opacity-40">Khalti Mobile Details</label>
                    <input type="text" placeholder="Khalti Phone" value={khaltiPhone} onChange={(e)=>setKhaltiPhone(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                    <input type="text" placeholder="Khalti Name" value={khaltiName} onChange={(e)=>setKhaltiName(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                  <span className="block text-[10px] font-bold opacity-60">Corporate Binance USDT Wallet parameters</span>
                  <input type="text" placeholder="USDT Wallet Address" value={bAddress} onChange={(e)=>setBAddress(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                  <input type="text" placeholder="Wallet Decrypted Network (BEP20 / TRC20)" value={bNetwork} onChange={(e)=>setBNetwork(e.target.value)} className="w-full h-8 border border-slate-800 rounded bg-slate-950 text-xs px-2" />
                </div>
              </div>

              <button
                id="save-system-config-btn"
                type="submit"
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 font-black text-white text-xs uppercase tracking-wider rounded-xl hover:scale-[1.01] duration-150"
              >
                Apply entire Administrative credentials updates
              </button>
            </form>
          )}

        </div>

      </main>

    </div>
  );
};
