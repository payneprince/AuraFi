'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency as formatMoney } from '@/lib/currency';
import { CheckCircle, X } from 'lucide-react';

export default function InvestmentsPage() {
  const { accounts, updateAccounts, addTransaction } = useAuth();
  const bankInvestmentProducts = [
    {
      id: 'tbill-91',
      name: 'Treasury Bill (91-Day)',
      provider: 'Bank Investment Desk',
      minimum: 'GHS 100',
      minimumAmount: 100,
      tenor: '91 days',
      rate: '17.8% p.a.',
      annualRate: 17.8,
      tenorDays: 91,
      risk: 'Low',
      liquidity: 'Locked',
    },
    {
      id: 'fixed-6m',
      name: 'Fixed Deposit Plus',
      provider: 'Bank Investment Desk',
      minimum: 'GHS 1,000',
      minimumAmount: 1000,
      tenor: '6 months',
      rate: '16.2% p.a.',
      annualRate: 16.2,
      tenorDays: 180,
      risk: 'Low',
      liquidity: 'Locked',
    },
    {
      id: 'money-market',
      name: 'Money Market Saver',
      provider: 'Bank Investment Desk',
      minimum: 'GHS 50',
      minimumAmount: 50,
      tenor: 'Flexible',
      rate: '13.9% p.a.',
      annualRate: 13.9,
      tenorDays: null,
      risk: 'Low',
      liquidity: 'Flexible',
    },
    {
      id: 'bond-2y',
      name: 'Government Bond (2-Year)',
      provider: 'Public Debt Market',
      minimum: 'GHS 500',
      minimumAmount: 500,
      tenor: '2 years',
      rate: '19.1% p.a.',
      annualRate: 19.1,
      tenorDays: 730,
      risk: 'Low',
      liquidity: 'Locked',
    },
  ];

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [previewProductId, setPreviewProductId] = useState(bankInvestmentProducts[0].id);
  const [previewAmount, setPreviewAmount] = useState('500');
  const [investmentAmount, setInvestmentAmount] = useState('1000');
  const [feedback, setFeedback] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    productId: string;
    amount: string;
  }>({
    isOpen: false,
    productId: '',
    amount: '',
  });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    productName: string;
    amount: number;
    sourceAccountName: string;
  }>({
    isOpen: false,
    productName: '',
    amount: 0,
    sourceAccountName: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('aurabank_investment_positions');
    if (saved) {
      setPositions(JSON.parse(saved));
      return;
    }

    const starter = [
      {
        id: 'inv-seed-1',
        productId: 'tbill-91',
        productName: 'Treasury Bill (91-Day)',
        amount: 1200,
        annualRate: 17.8,
        sourceAccountName: 'Cedi Account',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        maturityDate: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setPositions(starter);
  }, []);

  useEffect(() => {
    localStorage.setItem('aurabank_investment_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const previewProduct = bankInvestmentProducts.find((item) => item.id === previewProductId) || bankInvestmentProducts[0];
  const previewPrincipal = Number(previewAmount) || 0;
  const previewDays = previewProduct.tenorDays ?? 30;
  const projectedValue = useMemo(() => {
    if (previewPrincipal <= 0) return 0;
    return previewPrincipal * (1 + (previewProduct.annualRate / 100) * (previewDays / 365));
  }, [previewPrincipal, previewProduct.annualRate, previewDays]);

  const openConfirmModal = (productId: string, amount: number) => {
    setConfirmModal({
      isOpen: true,
      productId,
      amount: String(amount),
    });
  };

  const executeInvestment = (productId: string, amount: number) => {
    const account = accounts.find((item: any) => item.id === selectedAccountId);
    const product = bankInvestmentProducts.find((item) => item.id === productId);

    if (!account || !product) {
      setFeedback('Please select a valid source account.');
      return;
    }

    if (!amount || amount <= 0) {
      setFeedback('Enter a valid investment amount.');
      return;
    }

    if (amount < product.minimumAmount) {
      setFeedback(`Minimum for ${product.name} is GHS ${product.minimumAmount.toLocaleString()}.`);
      return;
    }

    if (account.balance < amount) {
      setFeedback('Insufficient balance for this investment amount.');
      return;
    }

    const updatedAccounts = accounts.map((item: any) => {
      if (item.id === account.id) {
        return { ...item, balance: item.balance - amount };
      }
      return item;
    });

    updateAccounts(updatedAccounts as any);

    const now = new Date();
    const maturityDate = product.tenorDays ? new Date(now.getTime() + product.tenorDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const newPosition = {
      id: `inv-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      amount,
      annualRate: product.annualRate,
      sourceAccountName: account.name,
      startDate: now.toISOString(),
      maturityDate,
    };

    setPositions((prev) => [newPosition, ...prev]);

    addTransaction({
      id: `tx-invest-${Date.now()}`,
      accountId: account.id,
      type: 'debit',
      category: 'Investment',
      description: `Invested in ${product.name}`,
      amount: -amount,
      date: now.toISOString(),
      status: 'completed',
    } as any);

    setFeedback(`Investment placed: GHS ${amount.toLocaleString()} in ${product.name}.`);
    setSuccessModal({
      isOpen: true,
      productName: product.name,
      amount,
      sourceAccountName: account.name,
    });
    setConfirmModal({
      isOpen: false,
      productId: '',
      amount: '',
    });
  };

  const totalInvested = positions.reduce((sum, item) => sum + item.amount, 0);
  const estimatedAnnualEarnings = positions.reduce((sum, item) => sum + item.amount * (item.annualRate / 100), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-text-light">Investments</h2>
            <p className="text-sm text-text-light/70 mt-1">Local Ghana investment products available through AuraBank</p>
          </div>
          <button
            onClick={() => window.open('http://localhost:3002', '_self')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-magenta-500 to-teal-500 text-white text-sm font-semibold"
          >
            Invest in AuraVest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4">
          <p className="text-xs text-slate-500">Total Invested</p>
          <p className="text-2xl font-bold text-text-dark">GHS {totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4">
          <p className="text-xs text-slate-500">Estimated Annual Earnings</p>
          <p className="text-2xl font-bold text-teal-600">GHS {estimatedAnnualEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-4">
          <p className="text-xs text-slate-500">Active Positions</p>
          <p className="text-2xl font-bold text-text-dark">{positions.length}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Source Account</label>
            <select
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-text-dark"
            >
              {accounts.map((account: any) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatMoney(account.balance, account.currency)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Amount to Invest (GHS)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={investmentAmount}
              onChange={(event) => setInvestmentAmount(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-text-dark"
              placeholder="Enter amount"
            />
          </div>
        </div>
        {feedback && <p className="text-sm text-teal-700 mt-3">{feedback}</p>}
      </div>

      <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {bankInvestmentProducts.map((product) => (
            <div key={product.id} className="rounded-xl border border-navy-700 bg-navy-50 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-text-dark">{product.name}</h3>
                <p className="text-xs text-slate-500">{product.provider}</p>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Minimum</span>
                  <span className="font-medium text-text-dark">{product.minimum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenor</span>
                  <span className="font-medium text-text-dark">{product.tenor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Indicative Return</span>
                  <span className="font-semibold text-teal-600">{product.rate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Risk: {product.risk}</span>
                <span className="px-2 py-1 rounded-full bg-magenta-100 text-magenta-700">{product.liquidity}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openConfirmModal(product.id, product.minimumAmount)}
                  className="px-2 py-2 text-xs rounded-lg border border-navy-700 text-text-dark font-medium bg-white"
                >
                  Min
                </button>
                <button
                  onClick={() => openConfirmModal(product.id, 500)}
                  className="px-2 py-2 text-xs rounded-lg border border-navy-700 text-text-dark font-medium bg-white"
                >
                  GHS 500
                </button>
                <button
                  onClick={() => openConfirmModal(product.id, 1000)}
                  className="px-2 py-2 text-xs rounded-lg border border-navy-700 text-text-dark font-medium bg-white"
                >
                  GHS 1000
                </button>
              </div>

              <button
                onClick={() => openConfirmModal(product.id, Number(investmentAmount) || 0)}
                className="w-full px-2 py-2 text-xs rounded-lg bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-semibold"
              >
                Buy
              </button>
              <p className="text-[11px] text-slate-500">Choose an option above or enter any amount and click Buy. Minimum: GHS {product.minimumAmount.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-4">Illustrative demo rates only, not investment advice.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-dark">Maturity Preview</h3>
            <p className="text-sm text-slate-500">Preview projected value before investing</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Product</label>
            <select
              value={previewProductId}
              onChange={(event) => setPreviewProductId(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-text-dark"
            >
              {bankInvestmentProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Principal (GHS)</label>
            <input
              type="number"
              min="1"
              value={previewAmount}
              onChange={(event) => setPreviewAmount(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-text-dark"
            />
          </div>

          <div className="rounded-xl bg-navy-50 border border-navy-700 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tenor used</span>
              <span className="font-medium text-text-dark">{previewProduct.tenorDays ? `${previewProduct.tenorDays} days` : '30-day preview'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Projected value</span>
              <span className="font-semibold text-teal-600">GHS {projectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated gain</span>
              <span className="font-semibold text-text-dark">GHS {(projectedValue - previewPrincipal).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg border border-navy-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text-dark">My Bank Investments</h3>
            <p className="text-sm text-slate-500">Your active and maturing positions</p>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto hide-scrollbar">
            {positions.length === 0 ? (
              <p className="text-sm text-slate-500">No investments yet. Use Quick Buy to start.</p>
            ) : (
              positions.map((position) => {
                const isMatured = position.maturityDate ? new Date(position.maturityDate).getTime() < Date.now() : false;
                return (
                  <div key={position.id} className="rounded-xl border border-navy-700 bg-navy-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-text-dark">{position.productName}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${isMatured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {isMatured ? 'Matured' : 'Active'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-slate-500">Amount: <span className="text-text-dark font-medium">GHS {position.amount.toLocaleString()}</span></p>
                      <p className="text-slate-500">Rate: <span className="text-text-dark font-medium">{position.annualRate}% p.a.</span></p>
                      <p className="text-slate-500">Source: <span className="text-text-dark font-medium">{position.sourceAccountName}</span></p>
                      <p className="text-slate-500">Maturity: <span className="text-text-dark font-medium">{position.maturityDate ? new Date(position.maturityDate).toLocaleDateString() : 'Flexible'}</span></p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl border border-navy-700 w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setConfirmModal({ isOpen: false, productId: '', amount: '' })}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-text-dark">Confirm Investment</h3>
              <p className="text-sm text-slate-500">Review and confirm before we place your order.</p>
            </div>

            {(() => {
              const selectedProduct = bankInvestmentProducts.find((item) => item.id === confirmModal.productId);
              const selectedAccount = accounts.find((item: any) => item.id === selectedAccountId);

              if (!selectedProduct) return null;

              return (
                <div className="space-y-4">
                  <div className="rounded-xl bg-navy-50 border border-navy-700 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Product</span>
                      <span className="font-medium text-text-dark">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source Account</span>
                      <span className="font-medium text-text-dark">{selectedAccount?.name || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Minimum</span>
                      <span className="font-medium text-text-dark">GHS {selectedProduct.minimumAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Amount (GHS)</label>
                    <input
                      type="number"
                      min={selectedProduct.minimumAmount}
                      step="0.01"
                      value={confirmModal.amount}
                      onChange={(event) => setConfirmModal((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-text-dark"
                    />
                    <p className="text-xs text-slate-500 mt-1">You can type any amount above the minimum.</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setConfirmModal({ isOpen: false, productId: '', amount: '' })}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => executeInvestment(selectedProduct.id, Number(confirmModal.amount) || 0)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium"
                    >
                      Confirm Buy
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl border border-navy-700 w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSuccessModal({ isOpen: false, productName: '', amount: 0, sourceAccountName: '' })}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-1">Investment Successful</h3>
              <p className="text-sm text-slate-500">Your investment order has been confirmed.</p>
            </div>

            <div className="mt-5 rounded-xl bg-navy-50 border border-navy-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Product</span>
                <span className="font-medium text-text-dark">{successModal.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-teal-600">GHS {successModal.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source</span>
                <span className="font-medium text-text-dark">{successModal.sourceAccountName}</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessModal({ isOpen: false, productName: '', amount: 0, sourceAccountName: '' })}
              className="w-full mt-5 px-4 py-2 rounded-lg bg-gradient-to-r from-magenta-500 to-teal-500 text-white font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}