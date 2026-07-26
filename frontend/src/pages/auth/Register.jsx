import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "./AuthInput";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { authService } from "../../services/authService";
import { apiError } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({ name: z.string().min(2, "Enter your name"), email: z.string().email("Enter a valid email"), password: z.string().min(8, "Use at least 8 characters"), role: z.enum(["student", "librarian"]) });

function Register() {
  const { login } = useAuth(); const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: "student" } });
  async function onSubmit(values) { try { const session = await authService.register(values); login(session); toast.success("Your account is ready"); navigate(session.user.role === "librarian" ? ROUTES.LIBRARIAN : ROUTES.STUDENT); } catch (error) { toast.error(apiError(error)); } }
  return <AuthCard title="Create an account" subtitle="Join your library community"><form onSubmit={handleSubmit(onSubmit)} noValidate><AuthInput id="name" label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} /><AuthInput id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} /><AuthInput id="password" label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} /><div className="mb-5"><label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">I am registering as</label><select id="role" className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" {...register("role")}><option value="student">Student</option><option value="librarian">Librarian</option></select></div><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button></form><p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link to={ROUTES.LOGIN} className="font-semibold text-blue-600 hover:underline">Sign in</Link></p></AuthCard>;
}

export default Register;
