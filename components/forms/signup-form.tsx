"use client";

import { signup } from "@/app/auth/signup/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDisplayStateError } from "@/hooks/use-display-state-error";
import { useFormErrorReset } from "@/hooks/use-form-error-reset";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { GoogleSignInBtn } from "../btns/google-sign-in-btn";
import { InlineLoader } from "../loaders/inline-loader";
import { Logo } from "../logo";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(
    signup,
    INITIAL_FORM_ACTION_STATE
  );

  const searchParams = useSearchParams();
  const roomCode = searchParams.get("roomCode");

  const { displayErrors, clearFieldError } = useFormErrorReset(state.errors);

  // State to preserve form data
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    username: "",
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
        name: "",
        username: "",
        password: "",
      });
    }
  }, [state.success]);

  useDisplayStateError(state);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Logo className="mb-5" />

            {roomCode && (
              <input type="hidden" name="roomCode" value={roomCode} />
            )}

            <h1 className="text-xl font-bold text-center">
              {roomCode
                ? "Sign up to join the room"
                : "Share movie moments with friends"}
            </h1>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href={
                  roomCode ? `/auth/login?roomCode=${roomCode}` : "/auth/login"
                }
                className="underline underline-offset-4 "
              >
                Log in
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
                placeholder="m@example.com"
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
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />

              {displayErrors?.name && (
                <p className="text-destructive text-sm -mt-1.5">
                  {state.errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />

              {displayErrors?.username && (
                <p className="text-destructive text-sm -mt-1.5">
                  {state.errors.username}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder=""
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
              {roomCode ? "Sign up & Join Room" : "Sign up"}
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
