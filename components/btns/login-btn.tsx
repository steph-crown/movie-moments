"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export function LoginBtn({ btnClassName }: { btnClassName?: string }) {
  const router = useRouter();

  return (
    <Button className={btnClassName} onClick={() => router.push("/login")}>
      <LogIn className="h-5 w-5 text-white" />
      Login
    </Button>
  );
}
