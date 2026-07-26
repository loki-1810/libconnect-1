import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import { apiError } from "../../services/api";

function Profile() {
  const { user, setUser } = useAuth(); const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { name: user?.name, phone: user?.phone || "", avatar_url: user?.avatar_url || "" } });
  async function onSubmit(values) { try { const updated = await authService.updateProfile(values); setUser(updated); localStorage.setItem("libconnect_user", JSON.stringify(updated)); toast.success("Profile updated"); } catch (error) { toast.error(apiError(error)); } }
  return <section className="max-w-2xl"><h2 className="text-2xl font-bold">Your profile</h2><p className="mt-1 text-slate-600">Manage the contact details associated with your account.</p><form onSubmit={handleSubmit(onSubmit)} className="mt-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Full name<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600" {...register("name", { required: true })} /></label><label className="text-sm font-medium">Email<input disabled value={user?.email || ""} className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" /></label><label className="text-sm font-medium">Phone<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600" {...register("phone")} /></label><label className="text-sm font-medium">Avatar image URL<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600" {...register("avatar_url")} /></label></div><p className="mt-5 text-sm text-slate-500">Account role: <span className="font-semibold capitalize">{user?.role}</span></p><Button type="submit" className="mt-6" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save profile"}</Button></form></section>;
}

export default Profile;
