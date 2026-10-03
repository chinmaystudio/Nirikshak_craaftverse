import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { captureVideoFrame } from "@/utils/download";

export type CameraPhase = "idle" | "camera" | "preview";

interface VisionCameraProps {
  phase: CameraPhase;
  imageDataUrl: string | null;
  onPhaseChange: (phase: CameraPhase) => void;
  onCapture: (dataUrl: string) => void;
  onPickFile: (file: File) => void;
}

function Frame({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary-container via-primary to-primary-container flex items-center justify-center">
      {children}
    </div>
  );
}

function TargetOverlay({ text }: { text: string }): JSX.Element {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <span className="absolute left-0 top-0 w-8 h-8 border-l-4 border-t-4 border-secondary-fixed/80 rounded-tl" />
          <span className="absolute right-0 top-0 w-8 h-8 border-r-4 border-t-4 border-secondary-fixed/80 rounded-tr" />
          <span className="absolute left-0 bottom-0 w-8 h-8 border-l-4 border-b-4 border-secondary-fixed/80 rounded-bl" />
          <span className="absolute right-0 bottom-0 w-8 h-8 border-r-4 border-b-4 border-secondary-fixed/80 rounded-br" />
        </div>
      </div>
      <div className="absolute bottom-3 inset-x-0 text-center text-[12px] text-surface-container-high font-medium px-4">{text}</div>
    </>
  );
}

const SUGGESTIONS = ["Road", "Bridge", "Drain", "Streetlight", "Building", "Water Pipeline", "Construction Site"];

export function VisionCamera({ phase, imageDataUrl, onPhaseChange, onCapture, onPickFile }: VisionCameraProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = (): void => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => stopStream, []);

  useEffect(() => {
    if (phase !== "camera") {
      stopStream();
      return undefined;
    }
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser — upload a photo instead.");
      onPhaseChange("idle");
      return undefined;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream: MediaStream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError("Camera permission denied or unavailable — upload a photo instead.");
          onPhaseChange("idle");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const capture = (): void => {
    const dataUrl = videoRef.current ? captureVideoFrame(videoRef.current) : null;
    if (!dataUrl) return;
    stopStream();
    onCapture(dataUrl);
    onPhaseChange("preview");
  };

  if (phase === "camera") {
    return (
      <div>
        <Frame>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <TargetOverlay text="Keep the infrastructure centered in the frame." />
        </Frame>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => onPhaseChange("idle")} className="px-4 py-2 border border-outline-variant rounded text-label-md text-on-surface-variant hover:bg-surface-container">
            Cancel
          </button>
          <button
            onClick={capture}
            className="w-16 h-16 rounded-full bg-secondary text-on-secondary shadow-pop flex items-center justify-center hover:bg-on-secondary-container active:scale-95 transition-all"
            aria-label="Capture photo"
          >
            <Icon name="photo_camera" className="text-[28px]" />
          </button>
          <span className="w-[76px]" />
        </div>
      </div>
    );
  }

  if (phase === "preview" && imageDataUrl) {
    return (
      <div>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-outline-variant bg-surface-container">
          <img className="w-full h-full object-cover" alt="Your photo preview" src={imageDataUrl} />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary/85 text-on-primary text-label-sm font-semibold">Your Photo</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPhaseChange("idle")}
            className="px-4 py-2 border border-primary text-primary rounded text-label-md font-label-md font-bold hover:bg-surface-container flex items-center gap-1.5"
          >
            <Icon name="replay" className="text-[18px]" /> Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Frame>
        <div className="text-center space-y-2 px-6">
          <span className="inline-flex w-16 h-16 rounded-full bg-surface-container-lowest/10 items-center justify-center">
            <Icon name="photo_camera" className="text-[40px] text-secondary-fixed" />
          </span>
          <div className="text-label-md font-semibold text-surface-container-lowest">Point at any public infrastructure</div>
        </div>
        <TargetOverlay text="Keep the infrastructure centered in the frame." />
      </Frame>
      {cameraError ? <p className="text-label-sm text-error mt-2 text-center">{cameraError}</p> : null}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-label-sm text-outline mr-1">Try:</span>
        {SUGGESTIONS.map((s) => (
          <span key={s} className="px-2 py-0.5 rounded-full border border-outline-variant/60 text-label-sm text-on-surface-variant">
            {s}
          </span>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => {
            setCameraError(null);
            onPhaseChange("camera");
          }}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-label-md font-label-md font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Icon name="photo_camera" className="text-[20px]" /> Take Photo
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-lg border border-primary text-primary hover:bg-surface-container text-label-md font-label-md font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Icon name="upload" className="text-[20px]" /> Upload from Gallery
        </button>
      </div>
    </div>
  );
}
