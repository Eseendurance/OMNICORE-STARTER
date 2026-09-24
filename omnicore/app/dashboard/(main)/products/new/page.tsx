"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, type ProductActionState } from "@/app/dashboard/(main)/products/actions";
import MediaCapture from "@/components/media/MediaCapture";
import { removeBackground } from "@imgly/background-removal";

const MAX_BACKGROUND_REMOVAL_DIMENSION = 1600;

async function prepareBackgroundRemovalImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_BACKGROUND_REMOVAL_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare image for background removal.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("Could not prepare image for background removal.");
  return new File([blob], "product-source.jpg", { type: "image/jpeg" });
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [workingFile, setWorkingFile] = useState<File | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [enhanceStatus, setEnhanceStatus] = useState("");
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

  async function removeProductBackground() {
    if (!workingFile) return;
    setEnhancing(true);
    setEnhanceProgress(0);
    setEnhanceStatus("Preparing image…");
    setEnhanceError(null);
    try {
      const source = await prepareBackgroundRemovalImage(workingFile);
      // Processing happens in the browser. The source image is not sent to a
      // third-party background-removal API.
      const blob = await removeBackground(source, {
        model: "isnet_fp16",
        output: { format: "image/png" },
        progress: (key, current, total) => {
          const progress = total > 0 ? Math.round((current / total) * 100) : 0;
          setEnhanceProgress(Math.min(99, progress));
          if (key.startsWith("fetch:")) setEnhanceStatus("Loading the removal tool…");
          else if (key.startsWith("compute:")) setEnhanceStatus("Removing the background…");
        },
      });
      const enhancedFile = new File([blob], "enhanced.png", { type: "image/png" });
      setWorkingFile(enhancedFile);
      setPreviewUrl(URL.createObjectURL(enhancedFile));
      setEnhanceProgress(100);
      setEnhanceStatus("Background removed.");
    } catch (error) {
      console.error("Local background removal failed:", error);
      setEnhanceError("Background removal failed. Try a smaller image or try again.");
      setEnhanceStatus("");
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
          <div className="rounded-xl border-2 border-ink bg-white p-3">
            <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border-2 border-ink bg-[repeating-conic-gradient(#eee_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
              <Image src={previewUrl} alt="Preview" fill className="object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={removeProductBackground}
                disabled={enhancing}
                className="rounded-md border-2 border-ink bg-jade px-3 py-2 text-xs font-bold text-paper shadow-[3px_3px_0_0_#14171F] disabled:opacity-60"
              >
                {enhancing ? "Processing on this device…" : "Remove background"}
              </button>
              {enhancing && (
                <div className="mt-2" aria-live="polite">
                  <div className="h-2 overflow-hidden rounded-full bg-sky/15">
                    <div
                      className="h-full rounded-full bg-sky transition-all duration-300"
                      style={{ width: `${enhanceProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/60">
                    {enhanceStatus} {enhanceProgress > 0 ? `${enhanceProgress}%` : ""}
                  </p>
                </div>
              )}
              {!enhancing && enhanceStatus && !enhanceError && (
                <p className="mt-2 text-xs font-semibold text-jade" aria-live="polite">
                  {enhanceStatus}
                </p>
              )}
              {enhanceError && <p className="mt-2 text-xs text-coral">{enhanceError}</p>}
            </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink/55">
              Tip: clear, well-lit photos with the product separated from the background process fastest and cleanest.
            </p>
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
