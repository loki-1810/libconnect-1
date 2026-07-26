import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "./AuthInput";
import Button from "../../components/ui/Button";
import { authService } from "../../services/authService";
import { apiError } from "../../services/api";
import { ROUTES } from "../../constants/routes";

function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email") })) });
  async function onSubmit(values) { try { const response = await authService.forgotPassword(values); toast.success(response.message); } catch (error) { toast.error(apiError(error)); } }
  return <AuthCard title="Reset your password" subtitle="Enter your account email and we’ll send reset instructions."><form onSubmit={handleSubmit(onSubmit)} noValidate><AuthInput id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} /><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reset instructions"}</Button></form><p className="mt-6 text-center text-sm"><Link to={ROUTES.LOGIN} className="font-semibold text-blue-600 hover:underline">Back to sign in</Link></p></AuthCard>;
}

export default ForgotPassword;
