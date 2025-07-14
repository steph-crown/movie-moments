import { CreateRoomBtn } from "@/components/btns/create-room-btn";
import { JoinRoomBtn } from "@/components/btns/join-room-btn";
import { Logo } from "@/components/logo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MenuIcon } from "lucide-react";
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
                className="text-sm font-semibold bg-secondary px-4 py-2 rounded-md"
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

          <div className=" items-center gap-4 flex">
            <CreateRoomBtn btnClassName="h-10" />

            <JoinRoomBtn btnClassName="h-10 hidden lg:flex" />

            <Popover>
              <PopoverTrigger className="flex lg:hidden">
                <div className="flex lg:hidden border border-solid border-border rounded-sm p-1 items-center justify-center h-8 w-8">
                  <MenuIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </PopoverTrigger>

              <PopoverContent>
                Place content for the popover here.
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-10 md:px-14 lg:px-20 py-5">
        {children}
      </div>
    </section>
  );
}
