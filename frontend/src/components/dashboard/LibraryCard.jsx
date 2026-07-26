import { QRCodeCanvas } from "qrcode.react";
import { FiDownload } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { libraryService } from "../../services/libraryService";
import { useEffect, useRef, useState } from "react";

function LibraryCard() {
  const { user } = useAuth();
  const [libraryName, setLibraryName] = useState("");
  const downloadCanvasRef = useRef(null);

  useEffect(() => {
    if (user?.library_id) {
      libraryService
        .get(user.library_id)
        .then((lib) => setLibraryName(lib.name))
        .catch(() => setLibraryName("LibConnect Library"));
    }
  }, [user?.library_id]);

  const qrData = JSON.stringify({
    type: "libconnect-member",
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: user?.role,
  });

  function downloadQR() {
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `libconnect-qr-${user?.name?.replace(/\s+/g, "-") || "user"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-lg">
      {/* Hidden high-res canvas for download */}
      <div className="hidden">
        <QRCodeCanvas ref={downloadCanvasRef} value={qrData} size={400} level="H" />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            LibConnect
          </p>
          <h3 className="mt-1 text-lg font-bold">Library Card</h3>
        </div>
        <div className="rounded-xl bg-white p-2">
          <QRCodeCanvas value={qrData} size={80} level="M" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-blue-300">Name</p>
          <p className="font-semibold">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-blue-300">Role</p>
          <p className="font-semibold capitalize">{user?.role}</p>
        </div>
        <div>
          <p className="text-xs text-blue-300">Email</p>
          <p className="font-semibold">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-blue-300">Library</p>
          <p className="font-semibold">{libraryName || "All libraries"}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={downloadQR}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <FiDownload /> Download QR Code
        </button>
        <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-blue-300">
          Show this at the library desk for quick borrowing
        </p>
      </div>
    </div>
  );
}

export default LibraryCard;
