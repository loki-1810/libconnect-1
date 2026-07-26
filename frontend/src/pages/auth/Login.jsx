import { Link, useLocation, useNavigate } from "react-router-dom";
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

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Password is required") });

function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  async function onSubmit(values) { try { const session = await authService.login(values); login(session); toast.success("Welcome back!"); const fallback = session.user.role === "admin" ? ROUTES.ADMIN : session.user.role === "librarian" ? ROUTES.LIBRARIAN : ROUTES.STUDENT; navigate(location.state?.from || fallback, { replace: true }); } catch (error) { toast.error(apiError(error)); } }
  return <AuthCard title="Welcome back" subtitle="Sign in to your LibConnect account"><form onSubmit={handleSubmit(onSubmit)} noValidate><AuthInput id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} /><AuthInput id="password" label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} /><div className="mb-6 text-right text-sm"><Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-blue-600 hover:underline">Forgot password?</Link></div><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button></form><p className="mt-6 text-center text-sm text-slate-600">New to LibConnect? <Link to={ROUTES.REGISTER} className="font-semibold text-blue-600 hover:underline">Create an account</Link></p></AuthCard>;
}

export default Login;
