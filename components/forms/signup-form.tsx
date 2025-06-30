"use client";

import { signup } from "@/app/auth/signup/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDisplayStateError } from "@/hooks/use-display-state-error";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useActionState } from "react";
import { GoogleSignInBtn } from "../btns/google-sign-in-btn";
import { InlineLoader } from "../loaders/inline-loader";
import { Logo } from "../logo";
import { Button } from "../ui/button";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(
    signup,
    INITIAL_FORM_ACTION_STATE
  );

  useDisplayStateError(state);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Logo className="mb-5" />

            <h1 className="text-xl font-bold text-center">
              Share movie moments with friends
            </h1>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
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
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="userName">Username</Label>
              <Input id="userName" name="userName" required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {/* <SubmitBtn className="w-full">Login</SubmitBtn> */}
            <Button type="submit" className="w-full">
              Login
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
