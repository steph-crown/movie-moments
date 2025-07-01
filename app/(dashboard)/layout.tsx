import { CreateRoomBtn } from "@/components/btns/create-room-btn";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MenuIcon, SearchIcon } from "lucide-react";
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
            <div className="relative hidden sm:block">
              <SearchIcon className="h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

              <Input
                placeholder="Search rooms"
                className="!text-xs !h-[2.25rem] w-[12rem] min-[780px]:w-[16rem] !pl-10"
              />
            </div>

            <CreateRoomBtn />

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
