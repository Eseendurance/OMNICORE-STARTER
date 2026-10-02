'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

export default function ChatWindow({
  currentUserId,
  recipientId,
}: {
  currentUserId: string;
  recipientId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // 1. Initial Load
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // 2. Realtime WebSocket Subscription
    const channel = supabase
      .channel(`chat_${currentUserId}_${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const payload = {
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: text.trim(),
    };

    setText('');
    await supabase.from('direct_messages').insert(payload);
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl p-4 bg-gray-900 text-white">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[70%] p-3 rounded-lg ${
              m.sender_id === currentUserId
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-gray-800 text-gray-200'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}