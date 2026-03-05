import TransactionList from '@/components/TransactionList';

interface PortfolioSectionProps {
  walletBalance: number;
  transactions: Array<{ amount: number }>;
}

export default function PortfolioSection({ walletBalance, transactions }: PortfolioSectionProps) {
  const credits = transactions
    .filter((transaction) => Number(transaction.amount) > 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const debits = Math.abs(transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
          <p className="text-white/80 text-base font-semibold">Current Balance</p>
          <p className="text-white text-4xl font-extrabold mt-2">${walletBalance.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
          <p className="text-white/80 text-base font-semibold">Total Inflow</p>
          <p className="text-green-400 text-4xl font-extrabold mt-2">+${credits.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
          <p className="text-white/80 text-base font-semibold">Total Outflow</p>
          <p className="text-red-400 text-4xl font-extrabold mt-2">-${debits.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-[#0B1E39] border border-white/10">
        <h3 className="text-white font-bold text-xl mb-4">Portfolio Activity</h3>
        <TransactionList />
      </div>
    </div>
  );
}
