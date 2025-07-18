"use client";

import { CreateRoomBtn } from "@/components/btns/create-room-btn";
import { JoinRoomBtn } from "@/components/btns/join-room-btn";
import { LoginBtn } from "@/components/btns/login-btn";
import { ViewRoomBtn } from "@/components/btns/view-room-btn";
import { Logo } from "@/components/logo";
import { ProfileMenu } from "@/components/profile-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/user/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

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
            </div>
          </div>

          <div className=" items-center gap-4 flex">
            {user ? (
              <>
                <CreateRoomBtn btnClassName="h-10" />

                <JoinRoomBtn btnClassName="h-10 hidden lg:flex" />

                <div className="hidden lg:flex">
                  <ProfileMenu
                    menuTrigger={
                      <button>
                        <UserAvatar />
                      </button>
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <LoginBtn btnClassName="h-10" />

                <ViewRoomBtn btnClassName="h-10 hidden lg:flex" />
              </>
            )}

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
