// Sample bank data — DEMO ONLY
const ABC_USERS = {
  demo:  { password: 'demo123',  name: 'Demo User',  accountNo: '4521-0019', balance: 12450.78 },
  alice: { password: 'alice123', name: 'Alice Park', accountNo: '4521-0020', balance: 38215.20 },
  bob:   { password: 'bob123',   name: 'Bob Singh',  accountNo: '4521-0021', balance:   682.50 }
};

const ABC_TRANSACTIONS = {
  demo: [
    { date: '2026-06-04', desc: 'Salary deposit',      type: 'credit', amount:  4200.00 },
    { date: '2026-06-03', desc: 'Whole Foods',         type: 'debit',  amount:  -127.43 },
    { date: '2026-06-02', desc: 'Electricity bill',    type: 'debit',  amount:   -89.10 },
    { date: '2026-06-01', desc: 'Transfer to savings', type: 'debit',  amount:  -500.00 },
    { date: '2026-05-30', desc: 'ATM withdrawal',      type: 'debit',  amount:  -200.00 },
    { date: '2026-05-28', desc: 'Refund — Amazon',     type: 'credit', amount:    34.99 }
  ],
  alice: [
    { date: '2026-06-04', desc: 'Consulting payment',  type: 'credit', amount: 12500.00 },
    { date: '2026-06-02', desc: 'Rent',                type: 'debit',  amount: -2400.00 },
    { date: '2026-05-30', desc: 'Investment buy',      type: 'debit',  amount: -5000.00 }
  ],
  bob: [
    { date: '2026-06-04', desc: 'Coffee',              type: 'debit',  amount:    -5.20 },
    { date: '2026-06-03', desc: 'Grocery',             type: 'debit',  amount:   -42.10 }
  ]
};

// FICO score per user (300-850). Populated by the SDLC Orchestrator
// after detecting credit-scoring intent in the BRD.
const ABC_FICO = {
  demo:  { score: 742, updated: '2026-06-15', factors: ['On-time payments (36/36)', 'Low credit utilization 18%', 'Avg account age 6.4y'] },
  alice: { score: 805, updated: '2026-06-14', factors: ['Excellent payment history', 'Utilization 9%', 'Diverse credit mix'] },
  bob:   { score: 612, updated: '2026-06-10', factors: ['Late payment in last 12 months', 'High utilization 71%', 'Short credit history'] }
};

