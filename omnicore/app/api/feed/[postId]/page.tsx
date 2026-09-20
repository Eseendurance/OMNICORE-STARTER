import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ReactionPicker } from "@/components/social/ReactionPicker";
import { InteractivePoll } from "@/components/social/InteractivePoll";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  const supabase = await createClient();

  // Fetch Post with relations
  const { data: post, error: postErr } = await supabase
    .from("social_posts")
    .select(
      `*, 
       vendor:vendors(id, name, slug, location, is_verified), 
       product:products(id, title, price, image_url),
       poll:polls(id, question, options:poll_options(id, text, votes_count))`
    )
    .eq("id", postId)
    .maybeSingle();

  if (postErr || !post) {
    notFound();
  }

  // Fetch Comments
  const { data: comments } = await supabase
    .from("social_comments")
    .select(`id, author_id, body, created_at`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  // Fetch Reactions Summary
  const { data: reactionsData } = await supabase
    .from("social_reactions")
    .select("type, user_id")
    .eq("post_id", postId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Group reactions by type
  const reactionTypes = ["LIKE", "FIRE", "LAUGH", "ROCKET", "MIND_BLOWN"] as const;
  const initialReactions = reactionTypes.map((type) => {
    const matching = reactionsData?.filter((r) => r.type === type) || [];
    return {
      type,
      count: matching.length,
      userReacted: user ? matching.some((r) => r.user_id === user.id) : false,
    };
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation back header */}
      <Link
        href="/feed"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        ← Back to feed
      </Link>

      {/* Main Post Card */}
      <article className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Author / Vendor Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold text-sm">
              {post.vendor?.name ? post.vendor.name[0] : "A"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">
                  {post.vendor?.name || "OmniCore Creator"}
                </span>
                {post.vendor?.is_verified && (
                  <span className="text-amber-500 text-xs" title="Verified Creator">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        )}

        {/* Optional Attached Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-1 gap-2 rounded-xl overflow-hidden border border-slate-100">
            {post.media_urls.map((url: string, index: number) => (
              <div key={index} className="relative w-full h-64 bg-slate-100">
                <Image
                  src={url}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Optional Linked Product Showcase */}
        {post.product && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {post.product.image_url && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200">
                <Image
                  src={post.product.image_url}
                  alt={post.product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {post.product.title}
              </p>
              <p className="text-xs font-medium text-amber-600">
                ${post.product.price}
              </p>
            </div>
          </div>
        )}

        {/* Optional Interactive Poll Widget */}
        {post.poll && (
          <InteractivePoll
            pollId={post.poll.id}
            question={post.poll.question}
            options={post.poll.options}
            totalVotes={post.poll.options.reduce(
              (acc: number, opt: { votes_count: number }) => acc + (opt.votes_count || 0),
              0
            )}
          />
        )}

        {/* Micro Reaction Picker */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <ReactionPicker postId={postId} initialReactions={initialReactions} />
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Comments ({comments?.length || 0})
        </h3>

        <div className="space-y-3 divide-y divide-slate-100">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-700">
                    User {comment.author_id.slice(0, 6)}
                  </span>
                  <span>
                    {new Date(comment.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-2">
              No comments yet. Start the conversation!
            </p>
          )}
        </div>
      </section>
    </main>
  );
}