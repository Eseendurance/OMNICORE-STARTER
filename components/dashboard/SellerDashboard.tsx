'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EscrowOrder {
  id: string;
  reference_code: string;
  amount: number;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  created_at: string;
  gateway: string;
  buyer: {
    username: string;
    full_name: string;
  };
  product: {
    title: string;
    images: string[];
  };
}

interface SellerProfile {
  wallet_balance_ngn: number;
}

export default function SellerDashboard({ sellerId }: { sellerId: string }) {
  const supabase = createClientComponentClient();

  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Bank Transfer Modal State
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [bankCode, setBankCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutGateway, setPayoutGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [isProcessingPayout, setIsProcessingPayout] = useState<boolean>(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Orders and Wallet Balance
  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch Seller Wallet Balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance_ngn')
      .eq('id', sellerId)
      .single();

    if (profile) setWalletBalance(profile.wallet_balance_ngn || 0);

    // Fetch Incoming Escrow Orders
    const { data: escrowData, error } = await supabase
      .from('escrow_transactions')
      .select(`
        id,
        reference_code,
        amount,
        status,
        created_at,
        gateway,
        buyer:buyer_id (username, full_name),
        product:product_id (title, images)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading escrow orders:', error.message);
    } else if (escrowData) {
      setOrders(escrowData as unknown as EscrowOrder[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [sellerId]);

  // 2. Trigger Bank Withdrawal (Paystack / Flutterwave Transfer)
  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayout(true);
    setPayoutMessage(null);

    const amountNum = parseFloat(payoutAmount);

    if (!amountNum || amountNum <= 0 || amountNum > walletBalance) {
      setPayoutMessage({ type: 'error', text: 'Invalid payout amount requested.' });
      setIsProcessingPayout(false);
      return;
    }

    try {
      const res = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          amount: amountNum,
          bankCode,
          accountNumber,
          gateway: payoutGateway,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Payout initiation failed.');

      setPayoutMessage({
        type: 'success',
        text: `Payout of ₦${amountNum.toLocaleString('en-NG')} initiated successfully!`,
      });

      // Refresh Dashboard Balance
      fetchDashboardData();
      setTimeout(() => setShowPayoutModal(false), 2000);
    } catch (err: any) {
      setPayoutMessage({ type: 'error', text: err.message });
    } finally {
      setIsProcessingPayout(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Wallet Metric */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage incoming escrow orders and wallet payouts.</p>
        </div>

        <div className="flex items-center gap-6 bg-gray-800/60 border border-gray-700/50 p-4 rounded-xl">
          <div>
            <span className="text-xs text-gray-400 block uppercase tracking-wider">Available Balance</span>
            <span className="text-2xl font-extrabold text-green-400">
              ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 font-semibold text-white text-sm rounded-xl transition-all shadow-lg shadow-green-600/20"
          >
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Escrow Orders Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Incoming Escrow Transactions</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading order records...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No escrow orders found for your products.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-6">Buyer</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Gateway</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-blue-400">{order.reference_code}</td>
                    <td className="py-4 px-6 font-medium text-white">{order.product?.title || 'Unknown Product'}</td>
                    <td className="py-4 px-6">@{order.buyer?.username || 'Buyer'}</td>
                    <td className="py-4 px-6 font-semibold text-green-400">
                      ₦{order.amount.toLocaleString('en-NG')}
                    </td>
                    <td className="py-4 px-6 capitalize">{order.gateway}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          order.status === 'held'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            : order.status === 'released'
                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {order.status === 'held' ? 'Held in Escrow' : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white">Withdraw Funds to Bank</h2>
            <p className="text-xs text-gray-400 mt-1">
              Direct transfer to your local bank account via Paystack or Flutterwave.
            </p>

            <form onSubmit={handlePayout} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Select Gateway</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutGateway('paystack')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      payoutGateway === 'paystack'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-gray-800 text-gray-400'
                    }`}
                  >
                    Paystack Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutGateway('flutterwave')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      payoutGateway === 'flutterwave'
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-gray-800 text-gray-400'
                    }`}
                  >
                    Flutterwave
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Amount (NGN)</label>
                <input
                  type="number"
                  required
                  placeholder={`Max: ₦${walletBalance}`}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Bank Code (e.g. 058 for GTB, 033 for UBA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 058"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">10-Digit NUBAN Account Number</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {payoutMessage && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    payoutMessage.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {payoutMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingPayout}
                className="w-full py-3 bg-green-600 hover:bg-green-500 font-semibold text-white rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {isProcessingPayout ? 'Processing Transfer...' : 'Confirm Bank Payout'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}