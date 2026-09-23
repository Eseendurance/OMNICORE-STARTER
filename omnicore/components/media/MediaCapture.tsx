"use client";

import { useEffect, useRef, useState } from "react";

type CaptureMode = "image" | "video";
type Filter = "natural" | "bright" | "soft" | "vivid";

const FILTERS: Record<Filter, { label: string; css: string }> = {
  natural: { label: "Natural", css: "none" },
  bright: { label: "Bright", css: "brightness(1.12) saturate(1.08)" },
  soft: { label: "Soft", css: "brightness(1.06) contrast(0.92) saturate(0.92)" },
  vivid: { label: "Vivid", css: "contrast(1.08) saturate(1.28)" },
};

export default function MediaCapture({
  mode,
  onCapture,
}: {
  mode: CaptureMode;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [open, setOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [filter, setFilter] = useState<Filter>("natural");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopCamera(), []);

  async function startCamera(nextFacingMode = facingMode) {
    setError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacingMode },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setOpen(true);
    } catch {
      setError("Camera access was blocked. Allow camera permission and try again.");
    }
  }

  function stopCamera() {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
    setOpen(false);
  }

  async function switchCamera() {
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacingMode);
    await startCamera(nextFacingMode);
  }

  function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.filter = FILTERS[filter].css;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  function toggleRecording() {
    if (!streamRef.current) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onCapture(new File([blob], "camera-video.webm", { type: mimeType }));
      stopCamera();
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => startCamera()} className="rounded-md border-2 border-sky bg-sky-tint px-3 py-2 text-xs font-bold text-sky">
          Open camera
        </button>
        {open && (
          <button type="button" onClick={switchCamera} className="rounded-md border-2 border-sky/30 bg-white px-3 py-2 text-xs font-bold text-sky">
            Switch camera
          </button>
        )}
      </div>
      {error && <p className="text-xs text-coral">{error}</p>}
      {open && (
        <div className="overflow-hidden rounded-xl border-2 border-sky bg-sky-tint p-2">
          <video
            ref={videoRef}
            muted
            playsInline
            className="aspect-[3/4] w-full rounded-lg object-cover"
            style={{ filter: FILTERS[filter].css }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(Object.keys(FILTERS) as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-2.5 py-1 text-xs ${filter === item ? "bg-sky text-white" : "bg-white text-sky"}`}
              >
                {FILTERS[item].label}
              </button>
            ))}
            <button
              type="button"
              onClick={mode === "image" ? captureImage : toggleRecording}
              className="ml-auto rounded-full bg-sky px-4 py-2 text-xs font-bold text-white"
            >
              {mode === "image" ? "Capture" : recording ? "Stop recording" : "Record"}
            </button>
            <button type="button" onClick={stopCamera} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-sky">
              Close
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
