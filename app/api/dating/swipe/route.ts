import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { swiperId, targetId, isLike } = await req.json();

    // 1. Record the swipe
    const { error: swipeErr } = await supabase.from('dating_swipes').upsert(
      { swiper_id: swiperId, target_id: targetId, is_like: isLike },
      { onConflict: 'swiper_id,target_id' }
    );

    if (swipeErr) throw swipeErr;

    // 2. Check for mutual match if liked
    if (isLike) {
      const { data: reciprocalSwipe } = await supabase
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', targetId)
        .eq('target_id', swiperId)
        .eq('is_like', true)
        .single();

      if (reciprocalSwipe) {
        // Create match entry
        await supabase.from('dating_matches').insert([
          { user_1: swiperId, user_2: targetId },
        ]);

        return NextResponse.json({
          match: true,
          message: "It's a Match! You can now start chatting.",
        });
      }
    }

    return NextResponse.json({ match: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}