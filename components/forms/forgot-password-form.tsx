import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "../logo";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Logo className="mb-5" />

            <h1 className="text-xl font-bold text-center">
              Forgot your MovieMoments password?
            </h1>

            <p className="text-center text-sm">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </div>
        </div>
      </form>

      <div>
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/auth/login" className="underline underline-offset-4 ">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
