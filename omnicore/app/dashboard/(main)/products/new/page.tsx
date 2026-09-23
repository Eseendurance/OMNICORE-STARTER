"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, type ProductActionState } from "@/app/dashboard/(main)/products/actions";
import MediaCapture from "@/components/media/MediaCapture";

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [workingFile, setWorkingFile] = useState<File | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [state, setState] = useState<ProductActionState>({ error: null });
  const [pending, setPending] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setWorkingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEnhanceError(null);
  }

  function onCameraCapture(file: File) {
    setWorkingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEnhanceError(null);
  }

  async function enhanceWithAI() {
    if (!workingFile) return;
    setEnhancing(true);
    setEnhanceError(null);
    try {
      const body = new FormData();
      body.append("image", workingFile);
      const res = await fetch("/api/ai/enhance-product", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setEnhanceError(data.error || "Enhancement failed.");
        return;
      }
      // data.image is a base64 data URL — convert back to a File so it can
      // be uploaded to storage the same way as an untouched photo.
      const blob = await (await fetch(data.image)).blob();
      const enhancedFile = new File([blob], "enhanced.png", { type: "image/png" });
      setWorkingFile(enhancedFile);
      setPreviewUrl(URL.createObjectURL(enhancedFile));
    } catch {
      setEnhanceError("Could not reach the enhancement service.");
    } finally {
      setEnhancing(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!workingFile) {
      setState({ error: "Add a product photo first." });
      return;
    }
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("image", workingFile);
    const result = await createProduct(state, formData);
    // createProduct redirects on success, so if we get here there was an error.
    setState(result);
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-bold">Add a product</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm"
          />
        </label>
        <MediaCapture mode="image" onCapture={onCameraCapture} />

        {previewUrl && (
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border-2 border-ink bg-[repeating-conic-gradient(#eee_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
              <Image src={previewUrl} alt="Preview" fill className="object-contain" />
            </div>
            <div>
              <button
                type="button"
                onClick={enhanceWithAI}
                disabled={enhancing}
                className="rounded-md border-2 border-ink bg-jade px-3 py-2 text-xs font-bold text-paper shadow-[3px_3px_0_0_#14171F] disabled:opacity-60"
              >
                {enhancing ? "Removing background…" : "✨ Remove background (AI)"}
              </button>
              {enhanceError && <p className="mt-2 text-xs text-coral">{enhanceError}</p>}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Title</span>
          <input
            name="title"
            required
            placeholder="Oxford Leather Loafers"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase text-ink/60">Price (₦)</span>
            <input
              name="price"
              type="number"
              min={0}
              required
              className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase text-ink/60">
              Compare-at (₦, optional)
            </span>
            <input
              name="compareAt"
              type="number"
              min={0}
              className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase text-ink/60">Category</span>
            <input
              name="category"
              placeholder="Footwear"
              className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase text-ink/60">Stock</span>
            <input
              name="stockLeft"
              type="number"
              min={0}
              defaultValue={0}
              className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
            />
          </label>
        </div>

        {state.error && (
          <p className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Publish product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            className="rounded-md border-2 border-ink bg-white px-4 py-2.5 font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
