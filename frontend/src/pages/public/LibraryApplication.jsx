import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { libraryService } from "../../services/libraryService";
import { apiError } from "../../services/api";
import { ROUTES } from "../../constants/routes";

function LibraryApplication() {
  const navigate = useNavigate(); const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  async function submit(values) { try { await libraryService.apply(values); toast.success("Library registration submitted for approval"); navigate(ROUTES.LIBRARIES); } catch (error) { toast.error(apiError(error)); } }
  return <section className="mx-auto max-w-2xl px-6 py-16"><p className="text-sm font-bold uppercase tracking-widest text-blue-600">For libraries</p><h1 className="mt-2 text-4xl font-bold">Join the LibConnect network</h1><p className="mt-4 text-slate-600">Tell us about your library. An administrator will review the details before it appears in the public directory.</p><form onSubmit={handleSubmit(submit)} className="mt-8 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100"><div className="grid gap-5 sm:grid-cols-2">{[["name", "Library name"], ["city", "City"], ["address", "Street address"], ["contact_email", "Contact email"], ["contact_phone", "Contact phone"]].map(([name, label]) => <label key={name} className={`text-sm font-medium ${name === "address" ? "sm:col-span-2" : ""}`}>{label}<input required={["name", "city", "address"].includes(name)} type={name === "contact_email" ? "email" : "text"} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600" {...register(name)} /></label>)}<label className="text-sm font-medium sm:col-span-2">Brief description<textarea rows="4" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600" {...register("description")} /></label></div><Button type="submit" className="mt-6" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit registration"}</Button></form></section>;
}

export default LibraryApplication;
