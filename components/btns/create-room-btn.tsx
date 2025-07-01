"use client";

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
import { z } from "zod";
import { ContentTypeEnum } from "@/interfaces/room.interface";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const FormSchema = z.object({
  content_type: z.enum([ContentTypeEnum.Movie, ContentTypeEnum.Series], {
    required_error: "You need to select a notification type.",
  }),
});

export function CreateRoomBtn() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-[32.5rem]">
            <DialogHeader>
              <DialogTitle>🎬 Create Your Movie Room</DialogTitle>
              <DialogDescription>
                Share reactions and chat with friends as you watch
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 mt-2">
              <div className="grid gap-3">
                <FormField
                  control={form.control}
                  name="content_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>
                        What type of content are you watching
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col"
                        >
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="movie" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Movie{" "}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="series" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Series
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
}
