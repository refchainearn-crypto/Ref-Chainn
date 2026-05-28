import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { 
  User, Deposit, Withdrawal, Transaction, SupportTicket, 
  FraudAlert, SystemConfig, Announcement, AccountStatus 
} from "./src/types";

// Setup constants
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db_data.json");

// Helper to hash simplified passport-like codes or store session secrets
const JWT_SECRET = "RefChain-Fintech-Super-Secure-Secret-2026";

// Initial Config (Default system settings)
const DEFAULT_CONFIG: SystemConfig = {
  minDeposit: 500,
  minWithdrawal: 750,
  directCommissionPercent: 40,
  indirectCommissionPercent: 10,
  adminBalance: 1250000,
  bankDetails: {
    bankName: "Everest Bank Limited",
    accountName: "RefChain Tech Nepal Solutions",
    accountNumber: "00110022334455",
    branch: "New Baneshwor, Kathmandu"
  },
  esewaDetails: {
    phone: "9801234567",
    name: "RefChain Merchant eSewa"
  },
  khaltiDetails: {
    phone: "9851234567",
    name: "RefChain Merchant Khalti"
  },
  binanceDetails: {
    walletAddress: "0x7a69bE1700681CD7BEfDCe832Aca414b4344CEe9",
    network: "Binance Smart Chain (BEP20)",
    name: "RefChain Corporate Wallet"
  },
  supportContact: {
    whatsapp: "https://wa.me/9779800000000",
    email: "support@refchain.io",
    phone: "+977-1-4433221"
  },
  qrImages: {
    esewaQr: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=260&auto=format&fit=crop",
    khaltiQr: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=260&auto=format&fit=crop",
    bankQr: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=260&auto=format&fit=crop",
    binanceQr: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=260&auto=format&fit=crop"
  }
};

// Initial database state to seed if db doesn't exist
const getSeededData = () => {
  const admin: User = {
    id: "admin-user",
    fullName: "RefChain Master Admin",
    email: "refchain.earn@gmail.com",
    phoneCode: "+977",
    phoneNumber: "9812345678",
    whatsappNumber: "9812345678",
    referralCode: "ADMINREF",
    role: "Admin",
    walletBalance: 0,
    totalEarnings: 0,
    directReferralsCount: 0,
    indirectReferralsCount: 0,
    accountStatus: "Active",
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    consentTracked: true
  };

  const userA: User = {
    id: "user-a",
    fullName: "Anil Sharma",
    email: "anil@refchain.io",
    phoneCode: "+977",
    phoneNumber: "9801111111",
    whatsappNumber: "9801111111",
    referralCode: "ANIL77",
    referredBy: "ADMINREF",
    role: "User",
    walletBalance: 0,
    totalEarnings: 0,
    directReferralsCount: 1,
    indirectReferralsCount: 1,
    accountStatus: "Active",
    createdAt: new Date("2026-05-10T12:00:00Z").toISOString(),
    consentTracked: true
  };

  const userB: User = {
    id: "user-b",
    fullName: "Binod Karki",
    email: "binod@refchain.io",
    phoneCode: "+977",
    phoneNumber: "9802222222",
    whatsappNumber: "9802222222",
    referralCode: "BINOD22",
    referredBy: "ANIL77",
    role: "User",
    walletBalance: 0,
    totalEarnings: 0,
    directReferralsCount: 1,
    indirectReferralsCount: 0,
    accountStatus: "Active",
    createdAt: new Date("2026-05-15T09:30:00Z").toISOString(),
    consentTracked: true
  };

  const userC: User = {
    id: "user-c",
    fullName: "Chetana Thapa",
    email: "chetana@refchain.io",
    phoneCode: "+977",
    phoneNumber: "9803333333",
    whatsappNumber: "9803333333",
    referralCode: "CHETANA33",
    referredBy: "BINOD22",
    role: "User",
    walletBalance: 0,
    totalEarnings: 0,
    directReferralsCount: 0,
    indirectReferralsCount: 0,
    accountStatus: "Active",
    createdAt: new Date("2026-05-20T15:45:00Z").toISOString(),
    consentTracked: true
  };

  const deposits: Deposit[] = [
    {
      id: "DEP-101",
      userId: "user-a",
      userName: "Anil Sharma",
      amount: 50000,
      method: "Bank Transfer",
      transactionId: "TRX-EBL-993821",
      screenshot: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
      status: "Approved",
      createdAt: new Date("2026-05-11T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-05-11T10:30:00Z").toISOString()
    },
    {
      id: "DEP-102",
      userId: "user-b",
      userName: "Binod Karki",
      amount: 100000,
      method: "eSewa",
      transactionId: "TRX-ESEWA-877215",
      screenshot: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
      status: "Approved",
      createdAt: new Date("2026-05-16T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-05-16T11:15:00Z").toISOString()
    },
    {
      id: "DEP-103",
      userId: "user-c",
      userName: "Chetana Thapa",
      amount: 30000,
      method: "Khalti",
      transactionId: "TRX-KHALTI-112204",
      screenshot: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
      status: "Approved",
      createdAt: new Date("2026-05-21T08:00:00Z").toISOString(),
      updatedAt: new Date("2026-05-21T08:20:00Z").toISOString()
    }
  ];

  const withdrawals: Withdrawal[] = [
    {
      id: "WITH-201",
      userId: "user-b",
      userName: "Binod Karki",
      amount: 16000,
      method: "eSewa",
      walletDetails: "eSewa ID Details: 9802222222",
      status: "Completed",
      riskScore: 5,
      createdAt: new Date("2026-05-18T14:00:00Z").toISOString(),
      updatedAt: new Date("2026-05-18T15:00:00Z").toISOString()
    },
    {
      id: "WITH-202",
      userId: "user-c",
      userName: "Chetana Thapa",
      amount: 3000,
      method: "Binance / Crypto",
      walletDetails: "USDT BEP20 Wallet Address: 0x99238127391abc812fde",
      status: "Pending",
      riskScore: 12,
      createdAt: new Date("2026-05-27T10:00:00Z").toISOString()
    }
  ];

  const transactions: Transaction[] = [
    {
      id: "TX-001",
      userId: "user-a",
      userName: "Anil Sharma",
      type: "Deposit",
      amount: 50000,
      status: "Completed",
      description: "NPR 50000 Bank Deposit Approved",
      createdAt: new Date("2026-05-11T10:30:00Z").toISOString()
    },
    {
      id: "TX-002",
      userId: "user-b",
      userName: "Binod Karki",
      type: "Deposit",
      amount: 100000,
      status: "Completed",
      description: "NPR 100000 eSewa Deposit Approved",
      createdAt: new Date("2026-05-16T11:15:00Z").toISOString()
    },
    {
      id: "TX-003",
      userId: "user-a",
      userName: "Anil Sharma",
      type: "Direct Referral Commission",
      amount: 40000, // 40% of B's 100k
      status: "Completed",
      description: "40% Direct Commission from Binod Karki (DEP-102)",
      createdAt: new Date("2026-05-16T11:15:00Z").toISOString()
    },
    {
      id: "TX-004",
      userId: "user-c",
      userName: "Chetana Thapa",
      type: "Deposit",
      amount: 30000,
      status: "Completed",
      description: "NPR 30000 Khalti Deposit Approved",
      createdAt: new Date("2026-05-21T08:20:00Z").toISOString()
    },
    {
      id: "TX-005",
      userId: "user-b",
      userName: "Binod Karki",
      type: "Direct Referral Commission",
      amount: 12000, // 40% of C's 30k
      status: "Completed",
      description: "40% Direct Commission from Chetana Thapa (DEP-103)",
      createdAt: new Date("2026-05-21T08:20:00Z").toISOString()
    },
    {
      id: "TX-006",
      userId: "user-a",
      userName: "Anil Sharma",
      type: "Indirect Referral Commission",
      amount: 3000, // 10% of C's 30k (indirect since C was recruited by B, recruited by A)
      status: "Completed",
      description: "10% Indirect Commission from Chetana Thapa through Binod (DEP-103)",
      createdAt: new Date("2026-05-21T08:20:00Z").toISOString()
    }
  ];

  const tickets: SupportTicket[] = [
    {
      id: "TKT-501",
      userId: "user-c",
      userName: "Chetana Thapa",
      subject: "Referral Commission Questions",
      category: "Referral Mission",
      priority: "Medium",
      status: "Open",
      createdAt: new Date("2026-05-26T09:00:00Z").toISOString(),
      messages: [
        {
          id: "msg-1",
          sender: "User",
          message: "How long does indirect referral take to register in the dashboard balances?",
          createdAt: new Date("2026-05-26T09:00:00Z").toISOString()
        }
      ]
    }
  ];

  const alerts: FraudAlert[] = [
    {
      id: "ALD-901",
      userId: "user-b",
      userName: "Binod Karki",
      type: "Duplicate Phone Number",
      severity: "Medium",
      details: "User has a whatsapp number matching within registered system range or similar structures.",
      status: "Active",
      createdAt: new Date("2026-05-15T09:40:00Z").toISOString()
    }
  ];

  const announcements: Announcement[] = [
    {
      id: "ANN-301",
      title: "eSewa QR Code Updated",
      content: "Please check the updated eSewa QR code for deposit security. All deposits require the verified official merchant proof upload.",
      createdAt: "2026-05-25T14:20:00Z"
    }
  ];

  // Store password mappings safely (In real, bcrypt-equivalent SHA-256 for simple offline sandbox)
  const passwordHashes: Record<string, string> = {
    "refchain.earn@gmail.com": crypto.createHash("sha256").update("admin").digest("hex"),
    "anil@refchain.io": crypto.createHash("sha256").update("passwordA").digest("hex"),
    "binod@refchain.io": crypto.createHash("sha256").update("passwordB").digest("hex"),
    "chetana@refchain.io": crypto.createHash("sha256").update("passwordC").digest("hex")
  };

  return {
    config: DEFAULT_CONFIG,
    users: [admin, userA, userB, userC],
    deposits,
    withdrawals,
    transactions,
    tickets,
    alerts,
    announcements,
    passwordHashes,
    passwordRecoveries: [] as any[]
  };
};

// Initialize DB file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(getSeededData(), null, 2));
}

// Read database helper
function getDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    if (!db.passwordRecoveries) {
      db.passwordRecoveries = [];
    }
    return db;
  } catch (err) {
    const seeded = getSeededData();
    seeded.passwordRecoveries = [];
    return seeded;
  }
}

// Write database helper
function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Multi-Level Recursive Pyramid Commission Processor
function distributePyramidCommission(db: any, depositor: User, depositAmount: number, depositId: string, isBulk: boolean = false) {
  let currentUplineReferralCode = depositor.referredBy;
  let level = 1;

  const directPercent = db.config.directCommissionPercent || 40;
  const initialIndirectPercent = db.config.indirectCommissionPercent || 10;
  const visited = new Set<string>();

  while (currentUplineReferralCode) {
    if (visited.has(currentUplineReferralCode)) {
      break; // Cycle break
    }
    visited.add(currentUplineReferralCode);

    const referrer = db.users.find((u: User) => u.referralCode === currentUplineReferralCode);
    if (!referrer) {
      break;
    }

    let commissionPercent = 0;
    let typeLabel = "";
    let descriptionText = "";

    if (level === 1) {
      // Direct referral commission
      commissionPercent = directPercent;
      typeLabel = "Direct Referral Commission";
      descriptionText = `${isBulk ? 'Bulk ' : ''}${directPercent}% Direct Commission from ${depositor.fullName} for Deposit ID: ${depositId}`;
    } else {
      // Indirect MLM Commissions which decreases as it goes higher
      // Level 2 behaves at initialIndirectPercent (e.g. 10%)
      // Level 3 decreases to half of Leve 2 (e.g. 5%)
      // Level 4 decreases to 2.5%, etc.
      commissionPercent = initialIndirectPercent * Math.pow(0.5, level - 2);
      commissionPercent = Math.round(commissionPercent * 100) / 100;

      if (commissionPercent < 0.01) {
        break; // Stop when negligibly small commission percentages are reached
      }

      typeLabel = "Indirect Referral Commission";
      descriptionText = `${isBulk ? 'Bulk ' : ''}${commissionPercent}% Indirect MLM Commission (Level ${level}) from ${depositor.fullName} via direct recruiter ${depositor.referredBy} (Deposit ID: ${depositId})`;
    }

    const commissionValue = Math.round(depositAmount * (commissionPercent / 100));
    if (commissionValue > 0) {
      referrer.walletBalance += commissionValue;
      referrer.totalEarnings += commissionValue;

      const txPrefix = isBulk ? "TX-Q-MLM-" : "TX-MLM-";
      const txId = txPrefix + Math.floor(10000 + Math.random() * 90000);
      db.transactions.push({
        id: txId,
        userId: referrer.id,
        userName: referrer.fullName,
        type: typeLabel,
        amount: commissionValue,
        status: "Completed",
        description: descriptionText,
        createdAt: new Date().toISOString()
      });
    }

    currentUplineReferralCode = referrer.referredBy;
    level++;
  }
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper middleware for auth
  const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token missing" });
    }

    try {
      // Decode simulated token: userEmail:userId
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [email, id] = decoded.split(":");
      
      const db = getDB();
      const user = db.users.find((u: User) => u.id === id && u.email === email);
      
      if (!user) {
        return res.status(403).json({ error: "Invalid auth token" });
      }

      if (user.accountStatus === "Suspended") {
        return res.status(403).json({ error: "This account is suspended. Contact Support." });
      }

      req.user = user;
      next();
    } catch (e) {
      return res.status(403).json({ error: "Failed to authenticate token" });
    }
  };

  // Auth endpoints
  app.post("/api/auth/register", (req, res) => {
    try {
      const { fullName, email, phoneCode, phoneNumber, whatsappNumber, password, referralCode } = req.body;
      
      if (!fullName || !email || !phoneCode || !phoneNumber || !whatsappNumber || !password) {
        return res.status(400).json({ error: "Missing required registration details" });
      }

      const db = getDB();
      // Check duplicate email
      const existingEmail = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check duplicate phone
      const existingPhone = db.users.find((u: User) => u.phoneNumber === phoneNumber);
      
      const userId = "usr-" + Math.random().toString(36).substr(2, 9);
      const generatedReferralCode = fullName.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

      const newUser: User = {
        id: userId,
        fullName,
        email,
        phoneCode,
        phoneNumber,
        whatsappNumber,
        referralCode: generatedReferralCode,
        role: "User",
        walletBalance: 0,
        totalEarnings: 0,
        directReferralsCount: 0,
        indirectReferralsCount: 0,
        accountStatus: "Active",
        createdAt: new Date().toISOString(),
        consentTracked: true
      };

      // Check for referredBy code, matching against live db
      if (referralCode) {
        const inviter = db.users.find((u: User) => u.referralCode === referralCode.trim().toUpperCase());
        if (inviter) {
          if (inviter.id === userId) {
            return res.status(400).json({ error: "Self-referral is forbidden" });
          }
          newUser.referredBy = inviter.referralCode;
          
          // Increment direct refers count
          inviter.directReferralsCount += 1;

          // Increment indirect refers count for invite's invite if any
          if (inviter.referredBy) {
            const grandInviter = db.users.find((u: User) => u.referralCode === inviter.referredBy);
            if (grandInviter) {
              grandInviter.indirectReferralsCount += 1;
            }
          }
        } else {
          return res.status(400).json({ error: "Invalid referral code specified" });
        }
      }

      // Record passwords
      db.passwordHashes[email] = crypto.createHash("sha256").update(password).digest("hex");

      // Fraud checks: Duplicate device detection or sharing phone number triggers alert
      if (existingPhone) {
        const alertId = "FRD-" + Math.random().toString(36).substr(2, 5).toUpperCase();
        const fakeReferralAlert: FraudAlert = {
          id: alertId,
          userId: newUser.id,
          userName: newUser.fullName,
          type: "Duplicate Phone Number",
          severity: "High",
          details: `User registered with existing phone ${phoneCode} ${phoneNumber}. Recurrent profile linking suspected.`,
          status: "Active",
          createdAt: new Date().toISOString()
        };
        db.alerts.push(fakeReferralAlert);
        newUser.accountStatus = "Flagged";
      }

      // Add to database
      db.users.push(newUser);
      writeDB(db);

      // Generate simulation token: base64 of email:userId
      const token = Buffer.from(`${email}:${userId}`).toString("base64");

      res.status(201).json({
        message: "Registration successful",
        token,
        user: newUser
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const db = getDB();
      const user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials specified" });
      }

      if (user.accountStatus === "Suspended") {
        return res.status(403).json({ error: "Your account is currently suspended due to anti-fraud compliance rules." });
      }

      const submittedHash = crypto.createHash("sha256").update(password).digest("hex");
      const storedHash = db.passwordHashes[email];

      if (submittedHash !== storedHash) {
        return res.status(401).json({ error: "Invalid credentials specified" });
      }

      const token = Buffer.from(`${user.email}:${user.id}`).toString("base64");

      res.json({
        token,
        user
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    try {
      const { email, password, whatsappNumber } = req.body;
      if (!email || !password || !whatsappNumber) {
        return res.status(400).json({ error: "Email address, desired password, and WhatsApp details are required." });
      }

      const db = getDB();
      db.passwordRecoveries = db.passwordRecoveries || [];

      // Look up existing user if possible to trace legal name & account ID
      const user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());

      const recoveryId = "REC-" + Math.floor(1000 + Math.random() * 9000);
      const newRecovery = {
        id: recoveryId,
        email: email.toLowerCase(),
        userId: user ? user.id : "NOT_FOUND",
        fullName: user ? user.fullName : "Ghost Account",
        desiredPassword: password,
        whatsappNumber,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      db.passwordRecoveries.push(newRecovery);
      writeDB(db);

      res.status(201).json({
        message: "Your forgot password recovery request has been submitted to the admin panel. Our team will contact you on WhatsApp soon to assist you.",
        request: newRecovery
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Client Deposits: get personal deposits (or all deposits for Admin) or create
  app.get("/api/deposits/me", authenticateToken, (req: any, res) => {
    const db = getDB();
    if (req.user.role === "Admin") {
      return res.json(db.deposits);
    }
    const userDeps = db.deposits.filter((d: Deposit) => d.userId === req.user.id);
    res.json(userDeps);
  });

  app.post("/api/deposits", authenticateToken, (req: any, res) => {
    try {
      const { amount, method, transactionId, screenshot } = req.body;
      const db = getDB();

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < db.config.minDeposit) {
        return res.status(400).json({ error: `Minimum deposit allowed is NPR ${db.config.minDeposit}` });
      }

      if (!method || !transactionId) {
        return res.status(400).json({ error: "Payment method and screenshot transaction ID are required." });
      }

      // Check transaction ID duplication to prevent double claims
      const duplicateTx = db.deposits.find(
        (d: Deposit) => d.transactionId.trim().toUpperCase() === transactionId.trim().toUpperCase() && d.status !== "Rejected"
      );
      if (duplicateTx) {
        return res.status(400).json({ error: "This transaction ID has already been uploaded." });
      }

      const depositId = "DEP-" + Math.floor(1000 + Math.random() * 9000);
      const newDeposit: Deposit = {
        id: depositId,
        userId: req.user.id,
        userName: req.user.fullName,
        amount: numAmount,
        method,
        transactionId,
        screenshot: screenshot || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      db.deposits.push(newDeposit);
      writeDB(db);

      res.status(201).json({
        message: "Deposit requested successfully. Under manual verification by accounting.",
        deposit: newDeposit
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Client Withdrawals: get personal withdrawals (or all withdrawals for Admin) or request
  app.get("/api/withdrawals/me", authenticateToken, (req: any, res) => {
    const db = getDB();
    if (req.user.role === "Admin") {
      return res.json(db.withdrawals);
    }
    const userWiths = db.withdrawals.filter((w: Withdrawal) => w.userId === req.user.id);
    res.json(userWiths);
  });

  app.post("/api/withdrawals", authenticateToken, (req: any, res) => {
    try {
      const { amount, method, walletDetails } = req.body;
      const db = getDB();

      // Dynamic checks
      const user = db.users.find((u: User) => u.id === req.user.id);
      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount < db.config.minWithdrawal) {
        return res.status(400).json({ error: `Minimum withdrawal is NPR ${db.config.minWithdrawal}` });
      }

      if (user.walletBalance - 500 < numAmount) {
        return res.status(400).json({ error: `The first NPR 500 deposited/invested is locked in the pyramid system and cannot be withdrawn. Your maximum withdrawable balance is NPR ${Math.max(0, user.walletBalance - 500).toLocaleString()}.` });
      }

      if (!walletDetails) {
        return res.status(400).json({ error: "Please enter your withdrawal account/wallet details." });
      }

      // Check ongoing pending withdrawal
      const activePending = db.withdrawals.find((w: Withdrawal) => w.userId === user.id && (w.status === "Pending" || w.status === "Processing"));
      if (activePending) {
        return res.status(400).json({ error: "You already have a pending withdrawal in progress." });
      }

      // Calculate simple Fraud risk score (if user has direct referral with matching IP/IP velocity triggers can be modeled, here duplicate details)
      let riskScore = 5;
      const sameWallet = db.withdrawals.find((w: Withdrawal) => w.walletDetails === walletDetails && w.userId !== user.id);
      if (sameWallet) {
        riskScore += 45; // Huge flag if wallet belongs to another account
      }

      // Check if user is flagged
      if (user.accountStatus === "Flagged") {
        riskScore += 20;
      }

      // Deduct client balance instantly to secure withdrawal funds on hold
      user.walletBalance -= numAmount;

      const withdrawId = "WITH-" + Math.floor(1000 + Math.random() * 9000);
      const newWithdrawal: Withdrawal = {
        id: withdrawId,
        userId: user.id,
        userName: user.fullName,
        amount: numAmount,
        method,
        walletDetails,
        status: "Pending",
        riskScore,
        createdAt: new Date().toISOString()
      };

      db.withdrawals.push(newWithdrawal);

      // Create transaction for hold representation
      const txId = "TX-" + Math.floor(10000 + Math.random() * 90000);
      const newTx: Transaction = {
        id: txId,
        userId: user.id,
        userName: user.fullName,
        type: "Withdrawal",
        amount: numAmount,
        status: "Pending",
        description: `Withdrawal request submitted (Hold ${numAmount} NPR)`,
        createdAt: new Date().toISOString()
      };
      db.transactions.push(newTx);

      // Record extreme risk as fraud alarm
      if (riskScore >= 50) {
        const fraudId = "FRD-" + Math.floor(1000 + Math.random() * 9000);
        db.alerts.push({
          id: fraudId,
          userId: user.id,
          userName: user.fullName,
          type: "Abnormal withdrawal alerts" as any,
          severity: "High",
          details: `Withdrawal request WITH-${withdrawId} requested with a wallet account registered by other users.`,
          status: "Active",
          createdAt: new Date().toISOString()
        });
      }

      writeDB(db);

      res.status(201).json({
        message: "Withdrawal request placed in auditing pipeline queue.",
        withdrawal: newWithdrawal
      });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Client referral tree & metrics
  app.get("/api/referrals/summary", authenticateToken, (req: any, res) => {
    const db = getDB();
    const user = db.users.find((u: User) => u.id === req.user.id);
    
    // Level 1: Users referred directly by current user
    const level1 = db.users.filter((u: User) => u.referredBy === user.referralCode);
    const level1Codes = level1.map((u: User) => u.referralCode);

    // Level 2: Users referred by Level 1 recruiters
    const level2 = db.users.filter((u: User) => u.referredBy && level1Codes.includes(u.referredBy));

    // Gather corresponding commission transactions
    const commissionTxs = db.transactions.filter(
      (t: Transaction) => t.userId === user.id && (t.type === "Direct Referral Commission" || t.type === "Indirect Referral Commission")
    );

    res.json({
      referralCode: user.referralCode,
      level1: level1.map((l: any) => ({
        id: l.id,
        fullName: l.fullName,
        email: l.email,
        createdAt: l.createdAt,
        walletBalance: l.walletBalance
      })),
      level2: level2.map((l: any) => ({
        id: l.id,
        fullName: l.fullName,
        email: l.email,
        referredBy: l.referredBy,
        createdAt: l.createdAt,
        walletBalance: l.walletBalance
      })),
      commissions: commissionTxs
    });
  });

  // Helpdesk Tickets (Client & Admin side)
  app.get("/api/tickets", authenticateToken, (req: any, res) => {
    const db = getDB();
    if (req.user.role === "Admin") {
      res.json(db.tickets);
    } else {
      res.json(db.tickets.filter((t: SupportTicket) => t.userId === req.user.id));
    }
  });

  app.post("/api/tickets", authenticateToken, (req: any, res) => {
    try {
      const { subject, category, priority, message } = req.body;
      if (!subject || !category || !priority || !message) {
        return res.status(400).json({ error: "Please populate all ticket parameters and initial message." });
      }

      const db = getDB();
      const ticketId = "TKT-" + Math.floor(100 + Math.random() * 900);
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: req.user.id,
        userName: req.user.fullName,
        subject,
        category,
        priority,
        status: "Open",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: "msg-" + Math.floor(1000 + Math.random() * 9000),
            sender: "User",
            message: message,
            photo: req.body.photo || undefined,
            createdAt: new Date().toISOString()
          }
        ]
      };

      db.tickets.push(newTicket);
      writeDB(db);

      res.status(201).json({
        message: "Support ticket opened successfully.",
        ticket: newTicket
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reply to ticket (user or admin)
  app.post("/api/tickets/:id/reply", authenticateToken, (req: any, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Empty message body" });
      }

      const db = getDB();
      const ticket = db.tickets.find((t: SupportTicket) => t.id === id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check permissions
      if (req.user.role !== "Admin" && ticket.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden access to support ticket" });
      }

      const isAgent = req.user.role === "Admin";
      const newMsg = {
        id: "msg-" + Math.floor(1000 + Math.random() * 9000),
        sender: isAgent ? "Admin" as const : "User" as const,
        message,
        photo: req.body.photo || undefined,
        createdAt: new Date().toISOString()
      };

      ticket.messages.push(newMsg);
      ticket.status = isAgent ? "In Progress" : "Open";
      writeDB(db);

      res.json(ticket);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public announcements
  app.get("/api/announcements", (req, res) => {
    const db = getDB();
    res.json(db.announcements);
  });

  // Transactions logs (Client only gets their own logs, Admin gets everything)
  app.get("/api/transactions/logs", authenticateToken, (req: any, res) => {
    const db = getDB();
    if (req.user.role === "Admin") {
      res.json(db.transactions);
    } else {
      res.json(db.transactions.filter((t: Transaction) => t.userId === req.user.id));
    }
  });

  // Get active system config settings
  app.get("/api/system/config", (req, res) => {
    const db = getDB();
    res.json(db.config);
  });


  // ========================================================
  // ADMIN AUTH & MANAGEMENT API ENDPOINTS
  // ========================================================
  const requireAdmin = (req: any, res: express.Response, next: express.NextFunction) => {
    if (req.user && req.user.role === "Admin") {
      next();
    } else {
      res.status(403).json({ error: "Action requires system administrative rights." });
    }
  };

  // Get all forgot password recovery requests
  app.get("/api/admin/forgot-passwords", authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    db.passwordRecoveries = db.passwordRecoveries || [];
    res.json(db.passwordRecoveries);
  });

  // Resolve a forgot password recovery request (and optionally apply the requested password)
  app.put("/api/admin/forgot-passwords/:id/resolve", authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // "apply" to update the pass, or anything else to just mark solved
      const db = getDB();
      db.passwordRecoveries = db.passwordRecoveries || [];

      const request = db.passwordRecoveries.find((r: any) => r.id === id);
      if (!request) {
        return res.status(404).json({ error: "Password recovery request not found" });
      }

      if (action === "apply") {
        // Find matching user and update password
        const user = db.users.find((u: User) => u.email.toLowerCase() === request.email.toLowerCase());
        if (user) {
          db.passwordHashes[request.email.toLowerCase()] = crypto.createHash("sha256").update(request.desiredPassword).digest("hex");
          
          // Add system transaction or log audit detail
          db.transactions.push({
            id: "TX-PW-" + Math.floor(10000 + Math.random() * 90000),
            userId: user.id,
            userName: user.fullName,
            type: "Manual Adjustment",
            status: "Completed",
            amount: 0,
            description: `Super Admin approved password recovery request. Password reset to: ${request.desiredPassword}`,
            createdAt: new Date().toISOString()
          });
        } else {
          return res.status(404).json({ error: "User on account no longer exists." });
        }
      }

      request.status = "Resolved";
      writeDB(db);

      res.json({ message: "Password recovery request processed successfully.", request });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Full users retrieval + stats for admin
  app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    res.json(db.users);
  });

  // Edit User details & Wallet (manual adjustments)
  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { walletBalance, accountStatus } = req.body;
    
    const db = getDB();
    const user = db.users.find((u: User) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (walletBalance !== undefined) {
      const oldBal = user.walletBalance;
      const newBal = Number(walletBalance);
      if (!isNaN(newBal)) {
        user.walletBalance = newBal;
        
        // Log manual balance modification as transaction audit trail
        const txId = "TX-ADJ-" + Math.floor(10000 + Math.random() * 90000);
        db.transactions.push({
          id: txId,
          userId: user.id,
          userName: user.fullName,
          type: "Manual Adjustment",
          amount: newBal - oldBal,
          status: "Completed",
          description: `Admin manual balance adjustment from NPR ${oldBal} to NPR ${newBal}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (accountStatus !== undefined) {
      user.accountStatus = accountStatus as AccountStatus;
    }

    writeDB(db);
    res.json({ message: "User profile updated successfully.", user });
  });

  // Support Ticket Quick Status Update
  app.put("/api/admin/tickets/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();
    const ticket = db.tickets.find((t: SupportTicket) => t.id === id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.status = status;
    writeDB(db);
    res.json(ticket);
  });

  // Approve / Reject / Pending deposits with manual multi-level commission processing
  app.put("/api/admin/deposits/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, reviewComment } = req.body; // Approved, Rejected, Pending
    
    const db = getDB();
    const depositIndex = db.deposits.findIndex((d: Deposit) => d.id === id);
    if (depositIndex === -1) {
      return res.status(404).json({ error: "Deposit request not found." });
    }

    const deposit = db.deposits[depositIndex];
    const previousStatus = deposit.status;
    
    if (previousStatus === status) {
      return res.json({ message: `Deposit is already marked as ${status}.`, deposit });
    }

    deposit.status = status;
    deposit.updatedAt = new Date().toISOString();
    if (reviewComment) {
      deposit.reviewComment = reviewComment;
    }

    // A. REVERSE PREVIOUS ACTIONS IF PREVIOUSLY APPROVED
    if (previousStatus === "Approved") {
      const depositor = db.users.find((u: User) => u.id === deposit.userId);
      if (depositor) {
        depositor.walletBalance -= deposit.amount;
        depositor.totalEarnings -= deposit.amount;
      }
      
      // Mark matching Deposit Tx completed to Failed / Reversed
      const mainTx = db.transactions.find((tx: any) => 
        tx.userId === deposit.userId && 
        tx.type === "Deposit" && 
        tx.amount === deposit.amount && 
        tx.status === "Completed" && 
        tx.description.includes(deposit.transactionId)
      );
      if (mainTx) {
        mainTx.status = "Failed";
        mainTx.description = `[REVERSED] Deposit of NPR ${deposit.amount} via ${deposit.method} (ID: ${deposit.transactionId})`;
      }

      // Revert MLM commission payments recursively upwards
      const commissionTxs = db.transactions.filter((tx: any) => 
        (tx.type === "Direct Referral Commission" || tx.type === "Indirect Referral Commission") && 
        tx.description.includes(deposit.id) &&
        tx.status !== "Failed"
      );

      for (const tx of commissionTxs) {
        const beneficiary = db.users.find((u: User) => u.id === tx.userId);
        if (beneficiary) {
          beneficiary.walletBalance -= tx.amount;
          beneficiary.totalEarnings -= tx.amount;
        }
        tx.status = "Failed";
        tx.description = `[REVERSED] ${tx.description}`;
      }
    }

    // B. APPLY TARGET ACTIONS IF SETTING TO APPROVED
    if (status === "Approved") {
      const depositor = db.users.find((u: User) => u.id === deposit.userId);
      if (depositor) {
        depositor.walletBalance += deposit.amount;
        depositor.totalEarnings += deposit.amount;

        const depTxId = "TX-" + Math.floor(10000 + Math.random() * 90000);
        db.transactions.push({
          id: depTxId,
          userId: depositor.id,
          userName: depositor.fullName,
          type: "Deposit",
          amount: deposit.amount,
          status: "Completed",
          description: `Manual approval: Deposit of NPR ${deposit.amount} via ${deposit.method} (ID: ${deposit.transactionId})`,
          createdAt: new Date().toISOString()
        });

        // Compute MLM Commissions recursively upwards
        distributePyramidCommission(db, depositor, deposit.amount, deposit.id, false);
      }
    }

    writeDB(db);
    res.json({ message: `Deposit request status successfully modified to ${status}. Wallet balances updated.`, deposit });
  });

  // Approve / Reject / Complete / Pending withdrawals admin queue
  app.put("/api/admin/withdrawals/:id", authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // Pending, Approved, Completed, Rejected
      const db = getDB();

      const index = db.withdrawals.findIndex((w: Withdrawal) => w.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Withdrawal session not found." });
      }

      const withdrawal = db.withdrawals[index];
      const previousStatus = withdrawal.status;

      if (previousStatus === status) {
        return res.json({ message: `Withdrawal is already in status ${status}.`, withdrawal });
      }

      const user = db.users.find((u: User) => u.id === withdrawal.userId);

      // A. REVERSE PREVIOUS ACTIONS IF CHANGING AWAY FROM REJECTED
      if (previousStatus === "Rejected") {
        // Funds were refunded back to user wallet initially inside Rejected state.
        // Transitioning away from Rejected means we re-deduct those funds to secure withdrawal on hold.
        if (user) {
          user.walletBalance -= withdrawal.amount;
        }
      }

      // B. APPLY TARGET STATE ACTIONS
      withdrawal.status = status;
      withdrawal.updatedAt = new Date().toISOString();

      if (status === "Rejected") {
        // Return funds back to user wallet on rejection
        if (user) {
          user.walletBalance += withdrawal.amount;
        }

        const txId = "TX-" + Math.floor(10000 + Math.random() * 90000);
        db.transactions.push({
          id: txId,
          userId: withdrawal.userId,
          userName: withdrawal.userName,
          type: "Withdrawal",
          amount: withdrawal.amount,
          status: "Failed",
          description: `Withdrawal ${withdrawal.id} marked as Rejected. NPR ${withdrawal.amount} refunded back to wallet.`,
          createdAt: new Date().toISOString()
        });
      } else if (status === "Completed" || status === "Approved") {
        const txId = "TX-" + Math.floor(10000 + Math.random() * 90000);
        db.transactions.push({
          id: txId,
          userId: withdrawal.userId,
          userName: withdrawal.userName,
          type: "Withdrawal",
          amount: withdrawal.amount,
          status: "Completed",
          description: `Withdrawal successfully paid to client account (${withdrawal.method}) - Set to ${status}`,
          createdAt: new Date().toISOString()
        });
      }

      writeDB(db);
      res.json({ message: `Withdrawal request status updated to ${status}. Wallet balances processed.`, withdrawal });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Modify entire system configs setting (QR codes + limits + commissions + support contact details)
  app.post("/api/admin/system/config", authenticateToken, requireAdmin, (req, res) => {
    try {
      const { 
        minDeposit, minWithdrawal, directCommissionPercent, 
        indirectCommissionPercent, adminBalance, bankDetails, 
        esewaDetails, khaltiDetails, binanceDetails, supportContact, qrImages 
      } = req.body;

      const db = getDB();
      if (minDeposit !== undefined) db.config.minDeposit = Number(minDeposit);
      if (minWithdrawal !== undefined) db.config.minWithdrawal = Number(minWithdrawal);
      if (directCommissionPercent !== undefined) db.config.directCommissionPercent = Number(directCommissionPercent);
      if (indirectCommissionPercent !== undefined) db.config.indirectCommissionPercent = Number(indirectCommissionPercent);
      if (adminBalance !== undefined) db.config.adminBalance = Number(adminBalance);

      if (bankDetails) db.config.bankDetails = { ...db.config.bankDetails, ...bankDetails };
      if (esewaDetails) db.config.esewaDetails = { ...db.config.esewaDetails, ...esewaDetails };
      if (khaltiDetails) db.config.khaltiDetails = { ...db.config.khaltiDetails, ...khaltiDetails };
      if (binanceDetails) db.config.binanceDetails = { ...db.config.binanceDetails, ...binanceDetails };
      if (supportContact) db.config.supportContact = { ...db.config.supportContact, ...supportContact };
      if (qrImages) db.config.qrImages = { ...db.config.qrImages, ...qrImages };

      writeDB(db);
      res.json({ message: "System configuration updated.", config: db.config });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get active fraud & security warnings
  app.get("/api/admin/alerts", authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    res.json(db.alerts);
  });

  app.put("/api/admin/alerts/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();
    const alert = db.alerts.find((a: FraudAlert) => a.id === id);
    if (alert) {
      alert.status = status;
      writeDB(db);
    }
    res.json({ message: "Fraud alert updated.", alert });
  });

  // Quick action: freeze suspicious account
  app.post("/api/admin/fraud/freeze", authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.body;
    const db = getDB();
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.accountStatus = "Suspended";
    
    // Add transaction audit logs
    db.transactions.push({
      id: "TX-FRZ-" + Math.floor(10000 + Math.random() * 90000),
      userId: user.id,
      userName: user.fullName,
      type: "Manual Adjustment",
      amount: 0,
      status: "Failed",
      description: "Account completely suspended/frozen via AML Anti-Fraud dashboard",
      createdAt: new Date().toISOString()
    });

    writeDB(db);
    res.json({ message: `Successfully suspended user ${user.fullName}. Security locks activated.` });
  });

  // Quick action: Approve all pending deposits
  app.post("/api/admin/quick/approve-deposits", authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    const pendings = db.deposits.filter((d: Deposit) => d.status === "Pending");
    let count = 0;

    for (const deposit of pendings) {
      deposit.status = "Approved";
      deposit.updatedAt = new Date().toISOString();
      const depositor = db.users.find((u: User) => u.id === deposit.userId);
      if (depositor) {
        depositor.walletBalance += deposit.amount;
        depositor.totalEarnings += deposit.amount;

        db.transactions.push({
          id: "TX-Q-" + Math.floor(10000 + Math.random() * 90000),
          userId: depositor.id,
          userName: depositor.fullName,
          type: "Deposit",
          amount: deposit.amount,
          status: "Completed",
          description: `Bulk Approval: Deposit of NPR ${deposit.amount} via ${deposit.method}`,
          createdAt: new Date().toISOString()
        });

        // Try MLM commission payments recursively upwards
        distributePyramidCommission(db, depositor, deposit.amount, deposit.id, true);
      }
      count++;
    }

    writeDB(db);
    res.json({ message: `Successfully approved ${count} pending deposit requests.` });
  });

  // Quick action: Approve all pending withdrawals
  app.post("/api/admin/quick/approve-withdrawals", authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    const pendings = db.withdrawals.filter((w: Withdrawal) => w.status === "Pending" || w.status === "Processing");
    let count = 0;

    for (const withdrawal of pendings) {
      withdrawal.status = "Completed";
      withdrawal.updatedAt = new Date().toISOString();

      db.transactions.push({
        id: "TX-QW-" + Math.floor(10000 + Math.random() * 90000),
        userId: withdrawal.userId,
        userName: withdrawal.userName,
        type: "Withdrawal",
        amount: withdrawal.amount,
        status: "Completed",
        description: `Bulk Action Completed: Paid out NPR ${withdrawal.amount} via ${withdrawal.method}`,
        createdAt: new Date().toISOString()
      });
      count++;
    }

    writeDB(db);
    res.json({ message: `Successfully processed and approved ${count} pending withdrawals.` });
  });

  // Broadcast announcements
  app.post("/api/admin/announcements", authenticateToken, requireAdmin, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Missing announcement content" });
    }
    const db = getDB();
    const ann: Announcement = {
      id: "ANN-" + Math.floor(100 + Math.random() * 900),
      title,
      content,
      createdAt: new Date().toISOString()
    };
    db.announcements.unshift(ann);
    writeDB(db);
    res.json(ann);
  });


  // ========================================================
  // EXCEL / CSV REPORT GENERATOR
  // ========================================================
  app.get("/api/reports/export", authenticateToken, requireAdmin, (req: any, res) => {
    const { type } = req.query; // "users" | "deposits" | "withdrawals" | "referrals" | "transactions"
    const db = getDB();

    let csvContent = "";
    let filename = `RefChain_Report_${Date.now()}.csv`;

    if (type === "users") {
      filename = `RefChain_Customers_Audit_${Date.now()}.csv`;
      csvContent = "User ID,Name,Email,Country Code,Phone Number,WhatsApp,Wallet Balance (NPR),Total Revenue (NPR),Direct Ref Count,Indirect Ref Count,Status,Created At\n";
      db.users.forEach((u: User) => {
        csvContent += `"${u.id}","${u.fullName}","${u.email}","${u.phoneCode}","${u.phoneNumber}","${u.whatsappNumber}",${u.walletBalance},${u.totalEarnings},${u.directReferralsCount},${u.indirectReferralsCount},"${u.accountStatus}","${u.createdAt}"\n`;
      });
    } else if (type === "deposits") {
      filename = `RefChain_Deposits_Audit_${Date.now()}.csv`;
      csvContent = "Deposit Session,User ID,User Name,Amount (NPR),Method,Gateway Trx ID,Status,Created Timestamp\n";
      db.deposits.forEach((d: Deposit) => {
        csvContent += `"${d.id}","${d.userId}","${d.userName}",${d.amount},"${d.method}","${d.transactionId}","${d.status}","${d.createdAt}"\n`;
      });
    } else if (type === "withdrawals") {
      filename = `RefChain_Withdraw_Pipe_${Date.now()}.csv`;
      csvContent = "Withdraw Session,User ID,User Name,Amount (NPR),Method,Wallet/Account Info,Risk Analysis Score,Status,Created Timestamp\n";
      db.withdrawals.forEach((w: Withdrawal) => {
        csvContent += `"${w.id}","${w.userId}","${w.userName}",${w.amount},"${w.method}","${w.walletDetails.replace(/"/g, '""')}",${w.riskScore},"${w.status}","${w.createdAt}"\n`;
      });
    } else if (type === "transactions") {
      filename = `RefChain_Ledger_Balance_${Date.now()}.csv`;
      csvContent = "Transaction ledger,User ID,User Name,Activity,Amount (NPR),Audit,Created Timestamp\n";
      db.transactions.forEach((t: Transaction) => {
        csvContent += `"${t.id}","${t.userId}","${t.userName}","${t.type}",${t.amount},"${t.description.replace(/"/g, '""')}","${t.createdAt}"\n`;
      });
    } else {
      // Default summary report
      filename = `RefChain_Daily_Audit_Sheets_${Date.now()}.csv`;
      csvContent = "Key Parameter,Values,Currency,Meta Metrics\n" +
        `Total Registered Customers,${db.users.length},Accounts,${db.users.filter((ui: any) => ui.accountStatus === 'Active').length} Active\n` +
        `Total Wallet Deposits,${db.deposits.reduce((acc: any, curr: any) => acc + (curr.status === "Approved" ? curr.amount : 0), 0)},NPR,Approved Manual Pipeline\n` +
        `Total Customer Withdrawals,${db.withdrawals.reduce((acc: any, curr: any) => acc + (curr.status === "Completed" ? curr.amount : 0), 0)},NPR,Paid Out Vault\n` +
        `Total System Commission paid,${db.transactions.filter((ti: any) => ti.type.includes("Referral")).reduce((acc: any, curr: any) => acc + curr.amount, 0)},NPR,Direct and Indirect split\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  });

  // Serve static files and handle SPA fallback for production mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS-SERVER] RefChain server actively hosted on: http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Critical crash booting up RefChain API engine:", e);
});
