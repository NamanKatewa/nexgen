"use client";

import Link from "next/link";
import { useForm, type UseFormRegister } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { signupSchema, type TSignupSchema } from "~/schemas/auth";

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const signupMutation = api.auth.signup.useMutation({
    onSuccess: async (data) => {
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Strict`;
      await utils.auth.me.invalidate();
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      setErrorMessage(
        error.message.includes("already exists")
          ? "An account with this email already exists."
          : error.message || "An error occurred during signup."
      );
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TSignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = useCallback(
    (data: TSignupSchema) => {
      setErrorMessage("");
      setConfirmPasswordError("");

      if (data.password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        return;
      }

      signupMutation.mutate(data);
    },
    [confirmPassword, signupMutation]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const businessTypeOptions = useMemo(
    () => ["Retailer", "Ecommerce", "Franchise"],
    []
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-[500px] bg-blue-100/20">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            Create Account
          </h1>
          <p className="text-sm text-center text-blue-900">
            Enter your details to create your account
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 text-blue-950"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Field label="Name" id="name" error={errors.name?.message}>
              <Input
                id="name"
                {...register("name")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field label="Email" id="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Mobile Number"
              id="mobileNumber"
              error={errors.mobileNumber?.message}
            >
              <Input
                id="mobileNumber"
                maxLength={10}
                {...register("mobileNumber")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Password"
              id="password"
              error={errors.password?.message}
            >
              <PasswordInput
                id="password"
                show={showPassword}
                onToggle={togglePasswordVisibility}
                registerReturn={register("password")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Confirm Password"
              id="confirmPassword"
              error={confirmPasswordError}
            >
              <PasswordInput
                id="confirmPassword"
                show={showPassword}
                onToggle={togglePasswordVisibility}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Company Name"
              id="companyName"
              error={errors.companyName?.message}
            >
              <Input
                id="companyName"
                {...register("companyName")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Monthly Order Volume"
              id="monthlyOrder"
              error={errors.monthlyOrder?.message}
            >
              <Input
                id="monthlyOrder"
                type="number"
                {...register("monthlyOrder")}
                disabled={signupMutation.isPending}
              />
            </Field>

            <Field
              label="Business Type"
              id="businessType"
              error={errors.businessType?.message}
            >
              <Select
                onValueChange={(value) =>
                  setValue("businessType", value as any)
                }
                disabled={signupMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending
                ? "Creating account..."
                : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// 🔹 Helper Components
const Field = ({
  label,
  id,
  children,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

interface PasswordInputProps {
  id: string;
  show: boolean;
  onToggle: () => void;
  registerReturn?: ReturnType<UseFormRegister<any>>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const PasswordInput = ({
  id,
  show,
  onToggle,
  registerReturn,
  value,
  onChange,
  disabled,
}: PasswordInputProps) => {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="pr-10"
        autoComplete="current-password"
        disabled={disabled}
        {...registerReturn}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-950"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
