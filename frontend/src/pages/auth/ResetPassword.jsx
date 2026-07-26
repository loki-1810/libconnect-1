import { useSearchParams, useNavigate } from "react-router-dom";
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

function ResetPassword() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const token = params.get("token") || "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(z.object({ password: z.string().min(8, "Use at least 8 characters") })) });
  async function onSubmit(values) { if (!token) { toast.error("The reset link is invalid or incomplete."); return; } try { const response = await authService.resetPassword({ token, ...values }); toast.success(response.message); navigate(ROUTES.LOGIN); } catch (error) { toast.error(apiError(error)); } }
  return <AuthCard title="Set a new password" subtitle="Choose a strong password you haven’t used before."><form onSubmit={handleSubmit(onSubmit)} noValidate><AuthInput id="password" label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} /><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Reset password"}</Button></form></AuthCard>;
}

export default ResetPassword;
