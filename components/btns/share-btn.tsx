import { IconShare3 } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Form } from "../ui/form";

export function ShareBtn() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({});

  const resetForm = () => {
    form.reset();
  };

  const onSubmit = () => {};

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold">
          <IconShare3 className="text-muted-foreground text-sm" />
          Share
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[32.5rem]" fullScreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share reactions and chat with friends as you watch
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>

              <Button type="submit" onClick={() => {}}>
                Send Invitations
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
