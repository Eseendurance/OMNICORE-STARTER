import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { swiperId, targetId, direction } = await req.json();

    if (!swiperId || !targetId || !direction) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 1. Record swipe entry
    const { error: swipeErr } = await supabase
      .from('dating_swipes')
      .insert([{ swiper_id: swiperId, target_id: targetId, direction }]);

    if (swipeErr) throw swipeErr;

    // 2. Check for mutual right swipe (Match)
    let isMatch = false;
    if (direction === 'right') {
      const { data: reciprocal } = await supabase
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', targetId)
        .eq('target_id', swiperId)
        .eq('direction', 'right')
        .single();

      if (reciprocal) {
        isMatch = true;
        await supabase.from('dating_matches').insert([
          { user_1: swiperId, user_2: targetId }
        ]);
      }
    }

    return NextResponse.json({ success: true, isMatch });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process swipe' },
      { status: 500 }
    );
  }
}