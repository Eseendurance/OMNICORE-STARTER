import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  if (!uuidPattern.test(conversationId)) return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });

  const { data: conversation, error: conversationError } = await supabase
    .from("order_conversations")
    .select("id, order_id, buyer_id, vendor_id, order:orders(order_ref, status), vendor:vendors(name, slug)")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) {
    console.error("Order conversation lookup failed:", conversationError);
    return NextResponse.json({ error: "Could not load this conversation." }, { status: 500 });
  }
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const { data: messages, error } = await supabase
    .from("order_messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    console.error("Order messages query failed:", error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
  return NextResponse.json({ conversation, messages: messages ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  if (!uuidPattern.test(conversationId)) return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to send a message." }, { status: 401 });
  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid message." }, { status: 400 });
  }
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > 2000) return NextResponse.json({ error: "Messages must be 1–2,000 characters." }, { status: 400 });
  if (/(https?:\/\/|www\.|bit\.ly|free money)/i.test(body)) {
    return NextResponse.json({ error: "Links are disabled in order conversations to reduce scams." }, { status: 400 });
  }
  const { data, error } = await supabase.from("order_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  }).select("id, sender_id, body, created_at").single();
  if (error?.message.includes("Rate limit exceeded")) {
    return NextResponse.json({ error: "You are sending messages quickly. Wait a minute and try again." }, { status: 429 });
  }
  if (error) {
    console.error("Order message insert failed:", error);
    return NextResponse.json({ error: "Could not send this message." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
