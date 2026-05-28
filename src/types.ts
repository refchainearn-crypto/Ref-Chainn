export interface SystemConfig {
  minDeposit: number;
  minWithdrawal: number;
  directCommissionPercent: number; // e.g. 40
  indirectCommissionPercent: number; // e.g. 10
  adminBalance: number;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  esewaDetails: {
    phone: string;
    name: string;
  };
  khaltiDetails: {
    phone: string;
    name: string;
  };
  binanceDetails: {
    walletAddress: string;
    network: string;
    name: string;
  };
  supportContact: {
    whatsapp: string;
    email: string;
    phone: string;
  };
  qrImages: {
    esewaQr: string; // Base64 or image URL
    khaltiQr: string;
    bankQr: string;
    binanceQr: string;
  };
}

export type DepositStatus = "Pending" | "Under Review" | "Approved" | "Rejected";
export type WithdrawalStatus = "Pending" | "Processing" | "Approved" | "Rejected" | "Completed";
export type AccountStatus = "Active" | "Suspended" | "Flagged";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneCode: string; // e.g., "+977"
  phoneNumber: string;
  whatsappNumber: string;
  referralCode: string; // Own referral code
  referredBy?: string; // Referral code of the recruiter
  role: "User" | "Admin";
  walletBalance: number;
  totalEarnings: number;
  directReferralsCount: number;
  indirectReferralsCount: number;
  accountStatus: AccountStatus;
  createdAt: string;
  consentTracked: boolean;
}

export interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: "Bank Transfer" | "eSewa" | "Khalti" | "Binance / Crypto";
  transactionId: string;
  screenshot: string; // Base64 data-URL
  status: DepositStatus;
  createdAt: string;
  updatedAt?: string;
  reviewComment?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: "Bank Transfer" | "eSewa" | "Khalti" | "Binance / Crypto";
  walletDetails: string; // e.g., "Account Number: ... / Phone: ..."
  status: WithdrawalStatus;
  riskScore: number; // 0 to 100 calculated by basic duplicate heuristics
  createdAt: string;
  updatedAt?: string;
}

export interface ReferralRel {
  referrerId: string; // Parent
  refereeId: string; // Child
  level: 1 | 2; // 1 = Direct, 2 = Indirect
  commissionEarned: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "Deposit" | "Withdrawal" | "Direct Referral Commission" | "Indirect Referral Commission" | "Manual Adjustment";
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  description: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: "Deposit Issue" | "Withdrawal Delay" | "Referral Mission" | "Account Support" | "Other";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  messages: Array<{
    id: string;
    sender: "User" | "Admin";
    message: string;
    photo?: string; // Base64 formatted photo attachment
    createdAt: string;
  }>;
}

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  type: "Fake Referral Duplicate IP" | "Suspicious Velocity" | "Duplicate Phone Number" | "Multiple Account Login";
  severity: "Low" | "Medium" | "High";
  details: string;
  status: "Active" | "Dismissed" | "Resolved";
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
