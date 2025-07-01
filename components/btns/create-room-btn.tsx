import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export function CreateRoomBtn() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* <Button variant="outline">Open Dialog</Button> */}
        <div>
          <Button
            size={"default"}
            className="hidden min-[390px]:flex text-xs rounded-sm font-semibold !px-3 sm:!px-4"
          >
            <Plus />
            Create room
          </Button>

          <Button
            size={"icon"}
            className="flex min-[390px]:hidden text-xs rounded-sm font-medium !px-3 sm:!px-4"
          >
            <Plus />
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[32.5rem]">
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="name-1">Name</Label>
            <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="username-1">Username</Label>
            <Input id="username-1" name="username" defaultValue="@peduarte" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
