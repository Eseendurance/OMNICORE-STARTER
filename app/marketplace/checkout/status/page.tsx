'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface EscrowDetails {
  id: string;
  reference_code: string;
  amount: number;
  status: string;
  gateway: string;
  products?: {
    title: string;
    images: string[];
  };
}

export default function CheckoutStatusPage() {
  const searchParams = useSearchParams();
  const router = Router();
  const supabase = createClientComponentClient();

  const reference = searchParams.get('ref') || searchParams.get('trxref') || searchParams.get('tx_ref');

  const [loading, setLoading] = useState<boolean>(true);
  const [escrow, setEscrow] = useState<EscrowDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found in query parameters.');
      setLoading(false);
      return;
    }

    async function verifyEscrowStatus() {
      try {
        // Query database for updated transaction state (populated by webhook or gateway redirect)
        const { data, error: dbError } = await supabase
          .from('escrow_transactions')
          .select(`
            id,
            reference_code,
            amount,
            status,
            gateway,
            products (title, images)
          `)
          .eq('reference_code', reference)
          .single();

        if (dbError || !data) {
          setError('Could not verify escrow record. The payment may still be processing.');
        } else {
          setEscrow(data as unknown as EscrowDetails);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during verification.');
      } finally {
        setLoading(false);
      }
    }

    verifyEscrowStatus();
  }, [reference, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Verifying Escrow Lock Status...</h2>
        <p className="text-gray-400 text-sm mt-1">Checking payment status on the ledger.</p>
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            ✕
          </div>
          <h2 className="text-xl font-bold">Verification Failed</h2>
          <p className="text-gray-400 text-sm mt-2">{error || 'Transaction not found.'}</p>
          <Link
            href="/marketplace"
            className="mt-6 inline-block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-8 text-center relative overflow-hidden">
        {/* Success Icon Header */}
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>

        <h1 className="text-2xl font-bold">Funds Locked in Escrow!</h1>
        <p className="text-gray-400 text-sm mt-2">
          Your payment was processed successfully via <span className="capitalize font-semibold text-white">{escrow.gateway}</span> and is securely held in escrow.
        </p>

        {/* Transaction Summary Box */}
        <div className="my-6 bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-left space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Reference:</span>
            <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
              {escrow.reference_code}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Item:</span>
            <span className="font-medium text-white">{escrow.products?.title || 'Product Purchase'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Amount Locked:</span>
            <span className="font-bold text-green-400 text-base">
              ₦{escrow.amount.toLocaleString('en-NG')}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700/60">
            <span className="text-gray-400">Status:</span>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">
              {escrow.status === 'held' ? 'Held in Escrow' : escrow.status}
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 text-left mb-6">
          <p className="font-semibold mb-1">What happens next?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>The seller is notified to dispatch your item.</li>
            <li>Once you inspect and confirm delivery, click <strong>"Release Funds"</strong> in your account orders to pay the seller.</li>
          </ul>
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/orders"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            View Order & Escrow Status
          </Link>
          <Link
            href="/marketplace"
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-colors text-sm"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}