import React, { useState, useEffect } from "react";
import { 
  Lock, Mail, User, Shield, Check, Smartphone, AlertTriangle, 
  HelpCircle, Eye, EyeOff, Sparkles, Moon, Sun, ArrowRight, BookOpen
} from "lucide-react";

import { User as UserType, SystemConfig } from "./types";
import { CountrySelector } from "./components/CountrySelector";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";

export default function App() {
  // Theme control: dark mode is default
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("refchain_token"));
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isRegisterSelected, setIsRegisterSelected] = useState<boolean>(false);
  const [isForgotPasswordSelected, setIsForgotPasswordSelected] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Registration Forms inputs
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCode, setPhoneCode] = useState<string>("+977"); // Default Nepal Code
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Config settings
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  // Load URL query referral code parameters if A -> B -> C registers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setIsRegisterSelected(true); // Direct onboarding
    }
  }, []);

  // Fetch active configurations from server
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/system/config");
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (e) {
      console.warn("Failed fetching configuration settings", e);
    }
  };

  // Check login state
  const checkTokenSession = async (userToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      } else {
        // Clear invalidate session token
        localStorage.removeItem("refchain_token");
        setToken(null);
      }
    } catch (e) {
      localStorage.removeItem("refchain_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    if (token) {
      checkTokenSession(token);
    }
  }, [token]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
      setAuthError("Email address and password parameters are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Login credentials failed review.");
      } else {
        localStorage.setItem("refchain_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (err) {
      setAuthError("Network communication issues connecting to RefChain gateway.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password session
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setForgotSuccess(null);

    if (!email || !password || !whatsappNumber) {
      setAuthError("Registered email address, desired new password, and WhatsApp contact number are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, whatsappNumber })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Failed filing password recovery request.");
      } else {
        setForgotSuccess(data.message);
        setPassword("");
      }
    } catch (err) {
      setAuthError("Failed contacting password recovery center.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Onboarding
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!fullName || !email || !phoneNumber || !whatsappNumber || !password) {
      setAuthError("Please populate all credential folders to onboard.");
      return;
    }

    if (!termsAccepted) {
      setAuthError("Agreement with regulatory disclaimers and privacy rules is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phoneCode,
          phoneNumber,
          whatsappNumber,
          password,
          referralCode: referralCode.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Onboarding review failed validation rules.");
      } else {
        localStorage.setItem("refchain_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (err) {
      setAuthError("Failed registering portfolio due to gateway communication issues.");
    } finally {
      setLoading(false);
    }
  };

  // Session Logging outflows
  const handleLogoutOutflows = () => {
    localStorage.removeItem("refchain_token");
    setToken(null);
    setCurrentUser(null);
  };

  if (loading && !currentUser) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white animate-pulse mb-4 shadow-xl font-bold">
          RC
        </div>
        <p className="text-xs font-mono tracking-widest opacity-60">VERIFYING FINANCIAL CRYPTO LEDGER...</p>
      </div>
    );
  }

  // Decrypt/Routing logged in users
  if (currentUser && systemConfig) {
    if (currentUser.role === "Admin") {
      return (
        <AdminDashboard
          adminUser={currentUser}
          onLogout={handleLogoutOutflows}
          darkMode={darkMode}
          systemConfig={systemConfig}
          onUpdateConfig={(conf) => setSystemConfig(conf)}
          token={token!}
        />
      );
    } else {
      return (
        <UserDashboard
          user={currentUser}
          onLogout={handleLogoutOutflows}
          darkMode={darkMode}
          systemConfig={systemConfig}
          token={token!}
        />
      );
    }
  }

  return (
    <div id="auth-main" className={`min-h-screen flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-850"
    }`}>
      
      {/* GLOW DECORATIONS SPLITS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* TOP HEADER CONTROLS */}
      <header className="px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-extrabold shadow-md">
            RC
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">RefChain</h1>
            <p className="text-[8px] font-mono opacity-50 tracking-widest leading-none">MUTUAL REWARDS</p>
          </div>
        </div>

        {/* Global theme controls */}
        <button
          id="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold ${
            darkMode ? "border-slate-800 hover:bg-slate-900 text-slate-300" : "border-gray-200 hover:bg-white text-gray-700"
          }`}
        >
          {darkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
          <span className="hidden sm:inline">{darkMode ? "Lightmode" : "Darkmode"}</span>
        </button>
      </header>

      {/* CENTRAL AUTH CARD LAYOUT */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center gap-6 relative z-10">
        <div className={`w-full rounded-2xl p-6 md:p-8 border shadow-2xl backdrop-blur-xl ${
          darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white/80 border-gray-200"
        }`}>
          
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold tracking-tight">
              {isForgotPasswordSelected 
                ? "Request Password Recovery" 
                : isRegisterSelected 
                ? "Onboard RefChain Portfolio" 
                : "Verify Vault Credentials"}
            </h2>
            <p className="text-xs opacity-60 mt-1">
              {isForgotPasswordSelected 
                ? "Send recovery details to Admin via WhatsApp backup" 
                : isRegisterSelected 
                ? "Register a free trust account" 
                : "Execute security login procedures"}
            </p>
          </div>

          {/* FORGOT PASSWORD SUCCESS OVERLAY */}
          {forgotSuccess && (
            <div id="forgot-success-notif" className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold text-center mb-4 leading-relaxed">
              ✓ {forgotSuccess}
            </div>
          )}

          {/* ONGOING ERROR BULLET */}
          {authError && (
            <div id="auth-error-notif" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold text-center mb-4 leading-relaxed">
              ✕ {authError}
            </div>
          )}

          {/* LOGIN FORMS */}
          {isForgotPasswordSelected ? (
            <form id="forgot-password-form-submit" onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold opacity-60 mb-1.5">Registered Email Address</label>
                <div className="relative">
                  <input
                    id="forgot-email-input"
                    type="email"
                    placeholder="name@refchain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <Mail size={14} className="absolute left-3.5 top-3.5 opacity-40 text-emerald-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold opacity-60 mb-1.5">Desired New Password</label>
                <div className="relative">
                  <input
                    id="forgot-password-input"
                    type="text" // Plain display for user convenience when noting down
                    placeholder="E.g. MySecurePass123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <Lock size={14} className="absolute left-3.5 top-3.5 opacity-40 text-emerald-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold opacity-60 mb-1.5">Your Active WhatsApp Contact Number</label>
                <div className="relative">
                  <input
                    id="forgot-whatsapp-input"
                    type="text"
                    placeholder="E.g. +9779801234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    required
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <Smartphone size={14} className="absolute left-3.5 top-3.5 opacity-40 text-emerald-400" />
                </div>
                <span className="text-[9px] opacity-50 mt-1 block">Please enter your true WhatsApp number so we can contact you and assist with login.</span>
              </div>

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-white uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Filing Request..." : "Submit Recovery Request"}
                <ArrowRight size={14} />
              </button>

              <button
                id="forgot-cancel-btn"
                type="button"
                onClick={() => {
                  setIsForgotPasswordSelected(false);
                  setAuthError(null);
                  setForgotSuccess(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold pt-1"
              >
                Cancel and Go Back
              </button>
            </form>
          ) : !isRegisterSelected ? (
            <form id="login-form-submit" onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold opacity-60 mb-1.5">Registered Email Address</label>
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    placeholder="name@refchain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <Mail size={14} className="absolute left-3.5 top-3.5 opacity-40 text-emerald-400" />
                </div>
                <span className="text-[8px] opacity-40 mt-1 block">Quick Note: Test Login as administrator using: <strong>refchain.earn@gmail.com / admin</strong></span>
              </div>

              <div>
                <label className="block text-[11px] font-bold opacity-60 mb-1.5">Secured Account Password</label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter account security keys"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full h-11 pl-10 pr-10 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                  <Lock size={14} className="absolute left-3.5 top-3.5 opacity-40 text-emerald-400" />
                  <button
                    id="toggle-show-login-pass"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-[11px] pt-1.5">
                  <span className="opacity-0">Spacer</span>
                  <button
                    id="trigger-forgot-password-view"
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordSelected(true);
                      setAuthError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-emerald-500 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-white uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Decrypting profile..." : "Enter Vault Platform"}
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            
            /* REGISTRATION ONBOARDING FORMS */
            <form id="register-form-submit" onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold opacity-65 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <input
                      id="signup-name-input"
                      type="text"
                      placeholder="Anil Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full h-10 pl-8 pr-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                    <User size={13} className="absolute left-2.5 top-3 opacity-40 text-emerald-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold opacity-65 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      id="signup-email-input"
                      type="email"
                      placeholder="anil@refchain.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full h-10 pl-8 pr-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                    <Mail size={13} className="absolute left-2.5 top-3 opacity-40 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold opacity-65 mb-1">Country</label>
                  <CountrySelector 
                    selectedCode={phoneCode} 
                    onChange={(code) => setPhoneCode(code)} 
                    darkMode={darkMode} 
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold opacity-65 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      id="signup-phone-input"
                      type="text"
                      placeholder="980XXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full h-12 pl-8 pr-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 font-mono ${
                        darkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-gray-350 text-black"
                      }`}
                    />
                    <Smartphone size={13} className="absolute left-2.5 top-4 opacity-40 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold opacity-65 mb-1">WhatsApp synced No</label>
                  <input
                    id="signup-whatsapp-input"
                    type="text"
                    placeholder="Identical or custom"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold opacity-65 mb-1">Referral Code (Optional)</label>
                  <input
                    id="signup-referral-input"
                    type="text"
                    placeholder="e.g. ANIL77"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-mono font-bold tracking-wider text-emerald-500 outline-none focus:border-emerald-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-200"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold opacity-65 mb-1">Passphrase Key</label>
                <input
                  id="signup-password-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-gray-300"
                  }`}
                />
              </div>

              {/* T&C CHECKBOX */}
              <div className="flex items-start gap-2.5 py-1">
                <input
                  id="signup-terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded text-emerald-500 bg-slate-950 focus:ring-emerald-500 focus:ring-offset-0 flex-shrink-0"
                />
                <label className="text-[9px] leading-tight opacity-75 text-amber-500">
                  I accept the Terms and Conditions which include the <strong>Disclaimer of Investment Loss Liabilities</strong>: We do not guarantee gains, dividends, or profits. All cash-outs and network splits are governed strictly by self-managed choices. I accept all risk of loss, confirm I am over 18 years old, and understand that I cannot register or continue without accepting these Terms.
                </label>
              </div>

              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 font-bold text-white uppercase text-xs tracking-wider rounded-xl transition-all"
              >
                {loading ? "Onboarding portfolio..." : "Onboard Account Portal"}
              </button>
            </form>
          )}

          {/* TOGGLE ACCESS CHANNELS BUTTON */}
          <div className="mt-6 text-center text-xs opacity-85">
            <span>{isRegisterSelected ? "Already holding premium profile?" : "New to the RefChain Platform?"}</span>
            <button
              id="auth-toggle-view"
              onClick={() => {
                setIsRegisterSelected(!isRegisterSelected);
                setAuthError(null);
              }}
              className="ml-1.5 text-emerald-500 font-bold hover:underline"
            >
              {isRegisterSelected ? "Log in instead" : "Onboard today"}
            </button>
          </div>
        </div>

        {/* PYRAMID EARNING SYSTEM INFO BOX */}
        <div className={`w-full rounded-2xl p-5 border text-left space-y-3 ${
          darkMode ? "bg-slate-900/30 border-slate-800" : "bg-emerald-50/20 border-gray-200"
        }`}>
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔺</span> Pyramid-Style Earning System
          </h3>
          <p className="text-[11px] opacity-80 leading-relaxed">
            A pyramid-style earning system works by placing early users at the top and new users below them. Each person recruits more users into the system. As the number of users increases, the people at the top receive a percentage of earnings, joining fees, or commissions from the users below them.
          </p>
          
          <div className="p-3 bg-black/15 rounded-lg border border-dashed dark:border-slate-800 border-gray-250">
            <span className="text-[9px] font-bold text-emerald-500 block uppercase">Exponential Growth Mechanics:</span>
            <ul className="text-[10px] space-y-1 mt-1 opacity-90 list-disc list-inside">
              <li>1 person recruits 3 users</li>
              <li>Those 3 recruit 3 more each = 9 users</li>
              <li>Those 9 recruit 3 more each = 27 users</li>
            </ul>
          </div>

          <p className="text-[11px] opacity-80 leading-relaxed">
            The network grows very quickly. Since the top users are connected to many lower levels, they receive increasing benefits as more people join. 
            This creates exponential growth where the top members earn more because money and activity flow upward through the structure. Early users benefit the most because they have the largest network under them.
          </p>
        </div>
      </main>

      {/* COMPLIANCE TERMS & RISK STATISTICAL PANEL */}
      <footer className={`border-t py-4 px-6 text-center text-[10px] relative z-10 ${
        darkMode ? "bg-slate-950 border-slate-900 text-slate-500" : "bg-slate-100 border-gray-200 text-gray-500"
      }`}>
        <p>
          RefChain Multi-Level referral platform. Fully compliant with security frameworks and decentralized wallet standards.
        </p>
        <p className="mt-1 font-mono text-[9px] opacity-40">
          SECURE ENCRYPTION ACCREDITED • GMT TIMESTAMPS • ALL RIGHTS RESERVED
        </p>
      </footer>

    </div>
  );
}
