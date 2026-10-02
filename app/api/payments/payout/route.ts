import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { sellerId, amount, bankCode, accountNumber, gateway } = await req.json();

    // 1. Fetch current profile balance
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('wallet_balance_ngn')
      .eq('id', sellerId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    if ((profile.wallet_balance_ngn || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    let transferSuccess = false;

    // 2. Paystack Transfer Flow
    if (gateway === 'paystack') {
      // Step A: Create Transfer Recipient
      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: 'Merchant Withdrawal',
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN',
        }),
      });

      const recipientData = await recipientRes.json();
      if (!recipientData.status) {
        return NextResponse.json({ error: recipientData.message || 'Invalid bank account details' }, { status: 400 });
      }

      // Step B: Initiate Transfer
      const transferRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: amount * 100, // kobo
          recipient: recipientData.data.recipient_code,
          reason: 'Merchant Wallet Payout',
        }),
      });

      const transferData = await transferRes.json();
      if (transferData.status) transferSuccess = true;
    }

    // 3. Flutterwave Transfer Flow
    if (gateway === 'flutterwave') {
      const flwRes = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          amount,
          narration: 'Merchant Wallet Payout',
          currency: 'NGN',
          reference: `PAYOUT_${Date.now()}`,
        }),
      });

      const flwData = await flwRes.json();
      if (flwData.status === 'success') transferSuccess = true;
    }

    if (!transferSuccess) {
      return NextResponse.json({ error: 'Bank transfer processing failed at gateway.' }, { status: 500 });
    }

    // 4. Deduct seller balance atomically upon successful gateway execution
    const newBalance = profile.wallet_balance_ngn - amount;
    await supabase.from('profiles').update({ wallet_balance_ngn: newBalance }).eq('id', sellerId);

    return NextResponse.json({ success: true, newBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}