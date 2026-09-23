"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReel, type ReelActionState } from "@/app/dashboard/(main)/reels/actions";
import MediaCapture from "@/components/media/MediaCapture";

export default function NewReelForm({
  products,
}: {
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const videoElRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [state, setState] = useState<ReelActionState>({ error: null });
  const [pending, setPending] = useState(false);

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setPosterBlob(null);
    setPosterPreviewUrl(null);
  }

  function onCameraCapture(file: File) {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setPosterBlob(null);
    setPosterPreviewUrl(null);
  }

  // Once the hidden <video> has loaded metadata, seek to a frame and draw
  // it onto a canvas to produce a real thumbnail — no separate image upload
  // needed from the vendor.
  function onVideoLoaded() {
    const video = videoElRef.current;
    if (!video) return;
    setCapturing(true);
    video.currentTime = Math.min(0.3, video.duration / 2);
  }

  function onSeeked() {
    const video = videoElRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPosterBlob(blob);
          setPosterPreviewUrl(URL.createObjectURL(blob));
        }
        setCapturing(false);
      },
      "image/jpeg",
      0.85
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!videoFile) {
      setState({ error: "Choose a video first." });
      return;
    }
    if (!posterBlob) {
      setState({ error: "Still capturing a thumbnail — try again in a moment." });
      return;
    }
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("video", videoFile);
    formData.set("poster", new File([posterBlob], "poster.jpg", { type: "image/jpeg" }));
    const result = await createReel(state, formData);
    setState(result); // only reached on error — success redirects
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-bold">Upload a reel</h1>
      <p className="mt-1 text-sm text-ink/60">
        A short product video. A thumbnail is captured automatically from the clip.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Video file</span>
          <input
            type="file"
            accept="video/*"
            onChange={onVideoChange}
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm"
          />
          <span className="text-xs text-ink/40">Max 60MB.</span>
        </label>
        <MediaCapture mode="video" onCapture={onCameraCapture} />

        {/* Hidden elements used purely to capture a poster frame */}
        {videoPreviewUrl && (
          <video
            ref={videoElRef}
            src={videoPreviewUrl}
            muted
            playsInline
            onLoadedMetadata={onVideoLoaded}
            onSeeked={onSeeked}
            className="hidden"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {videoPreviewUrl && (
          <div className="flex items-center gap-4">
            <div className="relative h-40 w-24 overflow-hidden rounded-lg border-2 border-ink bg-ink/5">
              {posterPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreviewUrl} alt="Captured thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-[10px] text-ink/40">
                  {capturing ? "Capturing…" : "No thumbnail"}
                </div>
              )}
            </div>
            <p className="text-xs text-ink/50">
              {posterPreviewUrl ? "Thumbnail captured ✓" : "Capturing thumbnail from your video…"}
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">Caption</span>
          <textarea
            name="caption"
            rows={2}
            placeholder="Restock drop happening now — first 10 orders ship free"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase text-ink/60">
            Link a product (optional)
          </span>
          <select
            name="productId"
            className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-marigold/40"
          >
            <option value="">No specific product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        {state.error && (
          <p className="rounded-md border-2 border-coral bg-coral-tint px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || capturing || !posterBlob}
            className="rounded-md border-2 border-ink bg-marigold px-4 py-2.5 font-bold shadow-[3px_3px_0_0_#14171F] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pending ? "Uploading…" : "Post reel"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/reels")}
            className="rounded-md border-2 border-ink bg-white px-4 py-2.5 font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
