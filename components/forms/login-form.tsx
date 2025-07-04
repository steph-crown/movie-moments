"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { GoogleSignInBtn } from "../btns/google-sign-in-btn";
import { Logo } from "../logo";
import { useActionState, useState, useEffect } from "react";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/constants";
import { login } from "@/app/auth/login/actions";
import { useDisplayStateError } from "@/hooks/use-display-state-error";
import { useFormErrorReset } from "@/hooks/use-form-error-reset";
import { InlineLoader } from "../loaders/inline-loader";
import { useSearchParams } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(
    login,
    INITIAL_FORM_ACTION_STATE
  );

  const { displayErrors, clearFieldError } = useFormErrorReset(state.errors);
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");

  // State to preserve form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  // Clear form only on successful submission
  useEffect(() => {
    if (state.success) {
      setFormData({
        email: "",
        password: "",
      });
    }
  }, [state.success]);

  useDisplayStateError(state);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        {/* Hidden field for room code */}
        {roomCode && <input type="hidden" name="roomCode" value={roomCode} />}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Logo className="mb-5" />

            <h1 className="text-xl font-bold text-center">
              {roomCode
                ? "Log in to join the room"
                : "Welcome Back to MovieMoments"}
            </h1>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  roomCode
                    ? `/auth/signup?roomCode=${roomCode}`
                    : "/auth/signup"
                }
                className="underline underline-offset-4 "
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="person@mail.com"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />

              {displayErrors?.email && (
                <p className="text-destructive text-sm -mt-1.5">
                  {state.errors.email}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

                <Link
                  href="/auth/forgot-password"
                  className="hover:underline underline-offset-4 text-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />

              {displayErrors?.password && (
                <p className="text-destructive text-sm -mt-1.5">
                  {state.errors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              {roomCode ? "Log in & Join Room" : "Login"}{" "}
              {isPending && <InlineLoader />}
            </Button>
          </div>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>

          <GoogleSignInBtn>Continue with Google</GoogleSignInBtn>
        </div>
      </form>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
