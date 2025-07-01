import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, SearchIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="w-full border-b border-solid border-border">
        <div className="container mx-auto px-5 sm:px-10 md:px-14 lg:px-20 py-3 flex justify-between items-center">
          <div className="flex gap-16 items-center">
            <Logo />

            <div className="hidden lg:flex gap-2">
              <Link
                href={"/rooms"}
                className="text-sm font-medium bg-secondary px-4 py-2 rounded-md"
              >
                Rooms
              </Link>

              <Link
                href={"/rooms"}
                className="text-sm font-medium px-4 py-2 rounded-md"
              >
                Profile
              </Link>
            </div>
          </div>

          <div className=" items-center gap-4 hidden sm:flex">
            <div className="relative">
              <SearchIcon className="h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

              <Input
                placeholder="Search rooms"
                className="!text-xs !h-[2.25rem] !w-[16rem] !pl-10"
              />
            </div>

            <Button
              size={"default"}
              className="text-xs rounded-sm font-medium !px-4"
            >
              <Plus />
              Create room
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-10 md:px-14 lg:px-20 py-5">
        {children}
      </div>
    </section>
  );
}
