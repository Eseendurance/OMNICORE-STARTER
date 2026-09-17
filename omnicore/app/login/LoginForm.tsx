"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { signIn, type ActionState } from "@/app/auth-actions";

const initialState: ActionState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const callbackError = params.get("error");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-5 py-16"
    >
      <h1 className="font-display text-3xl font-bold">Vendor sign in</h1>
      <p className="mt-2 text-sm text-ink/60">
        Manage your storefront, orders, and dispatches.
      </p>

      <motion.form
        action={formAction}
        className="mt-8 flex flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
      >
        <input type="hidden" name="next" value={next} />
        {callbackError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral"
          >
            That confirmation link didn&apos;t work or has expired. Try signing in, or sign up again.
          </motion.p>
        )}
        <motion.label
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="flex flex-col gap-1"
        >
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </motion.label>
        <motion.label
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          className="flex flex-col gap-1"
        >
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Password</span>
          <input
            type="password"
            name="password"
            required
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </motion.label>

        {state.error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          type="submit"
          disabled={pending}
          whileHover={{ y: -2, boxShadow: "5px 5px 0 0 #1E3A8A" }}
          whileTap={{ y: 0, boxShadow: "2px 2px 0 0 #1E3A8A" }}
          className="mt-2 rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#1E3A8A] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </motion.button>
      </motion.form>

      <p className="mt-6 text-sm text-ink/60">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-sky hover:underline">
          Start selling
        </Link>
      </p>
    </motion.div>
  );
}
