// src/data/featureSuggestions.js
// AI-curated feature ideas surfaced to the user when they pick "Existing
// project" in the Requirements phase. The Requirements Assistant uses these
// to inspire what feature to add — clicking a chip seeds the BRD textarea
// with a starter prompt that the AI then expands into structured requirements.
//
// Lookups happen in this order:
//   1) BIZ_APP_SUGGESTIONS[bizApp]  — most specific
//   2) LOB_SUGGESTIONS[lob]         — domain-level
//   3) DEFAULT_SUGGESTIONS          — generic banking ideas
// Whichever bucket wins, results are capped at MAX_SUGGESTIONS.

const MAX_SUGGESTIONS = 8;

const LOB_SUGGESTIONS = {
  'LOB-PAYMENTS': [
    { icon: 'ti-arrows-exchange', title: 'Instant P2P transfers',     prompt: 'Add instant peer-to-peer transfers with contact-book lookup, payee verification, and a 5-second cancel window before settlement.' },
    { icon: 'ti-receipt',         title: 'Payment receipts (PDF)',    prompt: 'Generate a downloadable PDF receipt for every successful payment, including reference number, beneficiary, and a verification QR code.' },
    { icon: 'ti-calendar-event',  title: 'Standing instructions',     prompt: 'Let customers schedule recurring payments (weekly/monthly) with pause, resume, and end-date controls.' },
    { icon: 'ti-shield-lock',     title: 'Step-up auth on high value',prompt: 'Trigger step-up authentication (OTP + biometric) for any payment above a configurable threshold.' },
    { icon: 'ti-currency-dollar', title: 'FX rate lock',              prompt: 'Allow customers to lock a foreign-exchange rate for up to 24 hours before sending an international payment.' },
    { icon: 'ti-alert-circle',    title: 'Fraud-suspect hold',        prompt: 'Hold any payment flagged by the fraud engine for manual review, notify the customer, and auto-release after 30 minutes if cleared.' },
  ],
  'LOB-RETAIL-BANK': [
    { icon: 'ti-file-download',   title: 'Statement download',        prompt: 'Let customers download monthly account statements as PDF or CSV with date-range filters and a 24-month history.' },
    { icon: 'ti-pig-money',       title: 'Goal-based savings',        prompt: 'Add a goal-based savings module where customers set targets, automate transfers, and visualise progress.' },
    { icon: 'ti-arrows-transfer-up', title: 'Standing instructions',  prompt: 'Schedule recurring intra-bank transfers with weekly/monthly cadence, balance-aware skip, and audit trail.' },
    { icon: 'ti-bell',            title: 'Balance alerts',            prompt: 'Configurable push/SMS alerts for low balance, large debits, and salary credit detection.' },
    { icon: 'ti-rotate',          title: 'Cheque book request',       prompt: 'Order a new cheque book in-app with delivery address selection, status tracking, and digital signature confirmation.' },
    { icon: 'ti-id',              title: 'Update KYC online',         prompt: 'Allow customers to refresh KYC documents in-app with OCR-based field extraction and video-KYC fallback.' },
    { icon: 'ti-coin',            title: 'Round-up savings',          prompt: 'Round every card purchase to the nearest whole and sweep the difference into a linked savings goal.' },
  ],
  'LOB-CARDS': [
    { icon: 'ti-credit-card',     title: 'FICO score report',         prompt: 'Show customers their latest FICO credit score with month-over-month trend, key factors, and tips to improve.' },
    { icon: 'ti-lock',            title: 'Card freeze / unfreeze',    prompt: 'One-tap freeze and unfreeze of debit and credit cards with optional auto-unfreeze timer.' },
    { icon: 'ti-settings',        title: 'Card controls',             prompt: 'Per-card controls: online, contactless, international, ATM toggles plus per-channel spend limits.' },
    { icon: 'ti-trending-up',     title: 'Credit limit increase',     prompt: 'In-app credit limit increase request with eligibility check, soft credit pull, and instant decision.' },
    { icon: 'ti-gift',            title: 'Rewards & cashback',        prompt: 'Track reward points and cashback earned per card, with redemption flow and partner-merchant browse.' },
    { icon: 'ti-credit-card-off', title: 'Lost / stolen card',        prompt: 'Report a card lost or stolen, instantly block transactions, request replacement, and ship a virtual card while the plastic is in transit.' },
    { icon: 'ti-calendar-stats',  title: 'EMI on transactions',       prompt: 'Convert eligible card transactions to EMI with tenure selection, interest preview, and approval workflow.' },
  ],
  'LOB-WEALTH': [
    { icon: 'ti-chart-line',      title: 'Portfolio dashboard',       prompt: 'Single dashboard showing portfolio value, asset allocation, day-change, and benchmark comparison.' },
    { icon: 'ti-target',          title: 'Goal-based investing',      prompt: 'Investment goals (retirement, education, home) with risk profiling and a recommended fund basket.' },
    { icon: 'ti-file-report',     title: 'Capital gains statement',   prompt: 'Generate FY-wise capital gains statements (short and long-term) for tax filing with downloadable PDF and CSV.' },
    { icon: 'ti-arrows-shuffle',  title: 'Auto-rebalance',            prompt: 'Auto-rebalance the portfolio quarterly to the target allocation with customer-approved drift bands.' },
    { icon: 'ti-news',            title: 'Research feed',             prompt: 'Personalised research feed pulling reports for instruments the customer holds or watches.' },
    { icon: 'ti-coin',            title: 'SIP setup',                 prompt: 'Set up systematic investment plans with mandate registration, pause/skip, and step-up SIP options.' },
  ],
  'LOB-DIGITAL-CHANNELS': [
    { icon: 'ti-message-chatbot', title: 'AI chat assistant',         prompt: 'Add an in-app AI assistant that answers banking questions, executes transfers via chat, and escalates to a human agent on demand.' },
    { icon: 'ti-fingerprint',     title: 'Biometric login',           prompt: 'Fingerprint and Face-ID login with device-bound key storage and a 30-day re-auth window.' },
    { icon: 'ti-device-mobile',   title: 'Device management',         prompt: 'Show all devices logged into the account with remote sign-out and last-seen location.' },
    { icon: 'ti-bell-ringing',    title: 'Smart notifications',       prompt: 'Smart notifications grouped by category with quiet hours, snooze, and per-channel mute.' },
    { icon: 'ti-language',        title: 'Multi-language support',    prompt: 'Add support for 5 additional languages with right-to-left layout for Arabic and per-account language preference.' },
    { icon: 'ti-accessible',      title: 'Accessibility upgrade',     prompt: 'Bring the app to WCAG 2.2 AA: screen-reader labels, dynamic font scaling, and high-contrast mode.' },
  ],
  'LOB-RISK-PLATFORM': [
    { icon: 'ti-alert-triangle',  title: 'Risk scorecard view',       prompt: 'Display customer-level risk scorecard with contributing factors, last refresh time, and drill-down by signal.' },
    { icon: 'ti-list-check',      title: 'Watchlist screening',       prompt: 'Real-time sanctions and PEP watchlist screening on customer onboarding and outbound payments.' },
    { icon: 'ti-clipboard-data',  title: 'Risk reports export',       prompt: 'Export regulatory risk reports (concentration, exposure) in standard formats with scheduled delivery.' },
    { icon: 'ti-radar',           title: 'Transaction monitoring',    prompt: 'Add rule-based and ML-driven transaction monitoring with case management for analysts.' },
  ],
  'LOB-FRAUD-OPS': [
    { icon: 'ti-shield-x',        title: 'Fraud dispute flow',        prompt: 'End-to-end fraud dispute flow: report unauthorised transaction, provisional credit, evidence upload, and resolution SLA tracking.' },
    { icon: 'ti-eye',             title: 'Suspicious activity feed',  prompt: 'Real-time feed of suspicious transactions ranked by risk score with quick approve/reject actions.' },
    { icon: 'ti-message-circle',  title: 'Customer fraud alerts',     prompt: 'Push/SMS alerts to the customer on any flagged transaction with one-tap confirm or deny.' },
    { icon: 'ti-history',         title: 'Case history & audit',      prompt: 'Searchable case history with full audit trail of analyst decisions and supporting evidence.' },
  ],
  'LOB-CORE-LEDGER': [
    { icon: 'ti-book',            title: 'Posting rules engine',      prompt: 'Configurable double-entry posting rules with effective-dated versions and pre-prod simulation.' },
    { icon: 'ti-calendar-time',   title: 'End-of-day batch',          prompt: 'Optimised EOD batch with parallel partitions, restartable checkpoints, and SLA dashboard.' },
    { icon: 'ti-arrows-up-down',  title: 'Reconciliation engine',     prompt: 'Auto-reconcile core ledger against downstream systems with break detection and ageing report.' },
    { icon: 'ti-archive',         title: 'Ledger archive & query',    prompt: 'Long-term ledger archival to cold storage with searchable point-in-time query API.' },
  ],
};

const BIZ_APP_SUGGESTIONS = {
  'ABC Bank Mobile': [
    { icon: 'ti-qrcode',          title: 'UPI / QR payments',         prompt: 'Add UPI and merchant QR code payments with in-app scanner, recent merchants, and split-bill.' },
    { icon: 'ti-fingerprint',     title: 'Biometric login',           prompt: 'Fingerprint and Face-ID login with device-bound key storage.' },
  ],
  'ABC Bank Admin Console': [
    { icon: 'ti-users',           title: 'Bulk customer ops',         prompt: 'Bulk customer operations: CSV-driven account flags, freeze/unfreeze, and audit trail.' },
    { icon: 'ti-shield-check',    title: 'Role-based access',         prompt: 'Granular role-based access with maker-checker workflows and quarterly access review.' },
  ],
  'ABC Payments Gateway': [
    { icon: 'ti-webhook',         title: 'Merchant webhooks',         prompt: 'Reliable merchant webhooks with retries, signature verification, and replay protection.' },
    { icon: 'ti-refresh',         title: 'Refund automation',         prompt: 'Self-service merchant refunds with partial-refund support and settlement-aware capacity checks.' },
  ],
};

const DEFAULT_SUGGESTIONS = [
  { icon: 'ti-file-download',   title: 'Statement download',  prompt: 'Let customers download account statements as PDF or CSV with date-range filters.' },
  { icon: 'ti-credit-card',     title: 'FICO score report',   prompt: 'Show customers their latest FICO credit score with trend and contributing factors.' },
  { icon: 'ti-bell',            title: 'Balance alerts',      prompt: 'Configurable push and SMS alerts for low balance, large debits, and salary credits.' },
  { icon: 'ti-lock',            title: 'Card freeze / unfreeze', prompt: 'One-tap freeze and unfreeze of debit and credit cards.' },
  { icon: 'ti-fingerprint',     title: 'Biometric login',     prompt: 'Fingerprint and Face-ID login with device-bound key storage.' },
  { icon: 'ti-message-chatbot', title: 'AI chat assistant',   prompt: 'In-app AI assistant for banking Q&A and quick actions.' },
];

function suggestFeatures(lob, bizApp) {
  const buckets = [];
  if (bizApp && BIZ_APP_SUGGESTIONS[bizApp]) buckets.push(...BIZ_APP_SUGGESTIONS[bizApp]);
  if (lob    && LOB_SUGGESTIONS[lob])         buckets.push(...LOB_SUGGESTIONS[lob]);
  if (buckets.length === 0) buckets.push(...DEFAULT_SUGGESTIONS);
  const seen = new Set();
  const out = [];
  for (const s of buckets) {
    if (seen.has(s.title)) continue;
    seen.add(s.title);
    out.push(s);
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}
