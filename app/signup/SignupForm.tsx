"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { signUp, type ActionState } from "@/app/auth-actions";

const initialState: ActionState = { error: null };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <AnimatePresence mode="wait">
        {state.checkEmail ? (
          <motion.div
            key="check-email"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-jade-tint text-2xl"
            >
              ✉️
            </motion.span>
            <h1 className="mt-4 font-display text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-ink/60">
              We sent a confirmation link to finish creating your account.
              Click it, then come back here and sign in.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5"
            >
              Go to sign in
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-3xl font-bold">Start selling</h1>
            <p className="mt-2 text-sm text-ink/60">
              Create your vendor account — you&apos;ll set up your storefront next.
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
                  minLength={6}
                  required
                  className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-marigold/40"
                />
                <span className="text-xs text-ink/40">At least 6 characters.</span>
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
                whileHover={{ y: -2, boxShadow: "5px 5px 0 0 #14171F" }}
                whileTap={{ y: 0, boxShadow: "2px 2px 0 0 #14171F" }}
                className="mt-2 rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#14171F] disabled:opacity-60"
              >
                {pending ? "Creating account…" : "Create account"}
              </motion.button>
            </motion.form>

            <p className="mt-6 text-sm text-ink/60">
              Already selling here?{" "}
              <Link href="/login" className="font-semibold text-sky hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
