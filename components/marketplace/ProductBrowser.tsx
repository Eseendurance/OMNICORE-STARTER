'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock_count: number;
  is_active: boolean;
  profiles?: {
    username: string;
    full_name: string;
  };
}

interface ProductBrowserProps {
  currentUserId: string;
  currentUserEmail: string;
}

export default function ProductBrowser({
  currentUserId,
  currentUserEmail,
}: ProductBrowserProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (username, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message);
      } else if (data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }

    loadProducts();
  }, []);

  const handleInitiateEscrow = async () => {
    if (!selectedProduct) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const reference = `ESCROW_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const { error: dbError } = await supabase
        .from('escrow_transactions')
        .insert([
          {
            buyer_id: currentUserId,
            seller_id: selectedProduct.seller_id,
            product_id: selectedProduct.id,
            amount: selectedProduct.price,
            gateway: gateway,
            reference_code: reference,
            status: 'held',
          },
        ]);

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          amount: selectedProduct.price,
          gateway: gateway,
          reference: reference,
          callbackUrl: `${window.location.origin}/marketplace/checkout/status?ref=${reference}`,
        }),
      });

      const paymentData = await res.json();

      if (!res.ok || !paymentData.authorization_url) {
        throw new Error(paymentData.error || 'Failed to initialize payment gateway.');
      }

      window.location.href = paymentData.authorization_url;
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Escrow Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">
            Buy safely. Funds are securely held in escrow until you verify delivery.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-gray-400">No active products found in the marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition-all flex flex-col justify-between"
            >
              <div className="h-48 bg-gray-800 relative overflow-hidden">
                <img
                  src={product.images[0] || '/placeholder-product.png'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-green-400 border border-green-500/30">
                  Escrow Protected
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-white line-clamp-1">{product.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Seller: @{product.profiles?.username || 'Verified Merchant'}
                  </p>
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">{product.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    ₦{product.price.toLocaleString('en-NG')}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded-lg transition-colors"
                  >
                    Buy Safely
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setSelectedProduct(null);
                setErrorMessage(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white">Escrow Protection Checkout</h2>
            <p className="text-xs text-gray-400 mt-1">
              Your payment will be locked safely. The seller won't receive funds until you confirm product receipt.
            </p>

            <div className="my-5 bg-gray-800/50 p-4 rounded-xl border border-gray-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Item:</span>
                <span className="text-white font-medium">{selectedProduct.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Seller:</span>
                <span className="text-white font-medium">@{selectedProduct.profiles?.username}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-300 font-semibold">Total Amount:</span>
                <span className="text-green-400 font-bold text-base">
                  ₦{selectedProduct.price.toLocaleString('en-NG')}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGateway('paystack')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    gateway === 'paystack'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-gray-800 bg-gray-800/30 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  Paystack
                </button>
                <button
                  type="button"
                  onClick={() => setGateway('flutterwave')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    gateway === 'flutterwave'
                      ? 'border-orange-500 bg-orange-500/10 text-white'
                      : 'border-gray-800 bg-gray-800/30 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  Flutterwave
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3 text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateEscrow}
                disabled={isProcessing}
                className="flex-1 py-3 text-sm font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Initializing...' : `Pay via ${gateway === 'paystack' ? 'Paystack' : 'Flutterwave'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}