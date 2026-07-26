import { FiX } from "react-icons/fi";

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={title}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label="Close modal" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><FiX /></button></div><div className="p-6">{children}</div></div></div>;
}

export default Modal;
