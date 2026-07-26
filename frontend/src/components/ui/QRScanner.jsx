import { useRef, useState, useEffect } from "react";
import { FiX, FiCamera, FiUpload } from "react-icons/fi";

function QRScanner({ onScan, onClose }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const onScanRef = useRef(onScan);

  const [mode, setMode] = useState("upload");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => { onScanRef.current = onScan; });

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStarted(false);
  }

  function parseQR(text) {
    try {
      const data = JSON.parse(text);
      if (data.type === "libconnect-member") {
        onScanRef.current(data);
        return true;
      }
      setError("Not a LibConnect QR code. Please scan a valid library card.");
    } catch {
      setError("Invalid QR code format. Please try again.");
    }
    return false;
  }

  function scanLoop(jsQR) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => scanLoop(jsQR));
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      stopCamera();
      parseQR(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(() => scanLoop(jsQR));
  }

  async function startCamera() {
    stopCamera();
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraStarted(true);
        const { default: jsQR } = await import("jsqr");
        rafRef.current = requestAnimationFrame(() => scanLoop(jsQR));
      }
    } catch {
      setError("Camera not available. Use Upload Image instead.");
    }
  }

  function switchToCamera() {
    setError("");
    setMode("camera");
  }

  function switchToUpload() {
    stopCamera();
    setError("");
    setMode("upload");
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const { default: jsQR } = await import("jsqr");
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code && code.data) {
        parseQR(code.data);
      } else {
        setError("Could not find a QR code in that image. Try a clearer photo.");
      }
    } catch {
      setError("Could not read the image. Try another file.");
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR code"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold">Verify Student Identity</h2>
          <button type="button" onClick={handleClose} className="rounded-lg p-2 hover:bg-slate-100">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={switchToCamera}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "camera" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiCamera /> Camera
            </button>
            <button
              type="button"
              onClick={switchToUpload}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "upload" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiUpload /> Upload Image
            </button>
          </div>

          {/* Camera */}
          {mode === "camera" && (
            <div className="mt-4">
              <div className="overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              {!cameraStarted && !error && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <FiCamera /> Click to start camera
                </button>
              )}
              {cameraStarted && (
                <p className="mt-3 text-center text-sm text-slate-500">
                  Point camera at the student&apos;s QR code
                </p>
              )}
            </div>
          )}

          {/* Upload */}
          {mode === "upload" && (
            <div className="mt-4">
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <FiUpload className="text-3xl text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-700">
                    {processing ? "Scanning..." : "Click to upload QR image"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={processing}
                  className="hidden"
                />
              </label>
              {processing && (
                <div className="mt-3 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
          )}

          {/* Cancel */}
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
