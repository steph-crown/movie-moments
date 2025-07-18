import { IRoom } from "@/interfaces/room.interface";
import { sendRoomInvitations } from "@/lib/actions/invitations";
import { searchUsersByUsername } from "@/lib/actions/users";
import { IconShare3 } from "@tabler/icons-react";
import clsx from "clsx";
import { Check, Copy, Mail, User2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { InlineLoader } from "../loaders/inline-loader";

interface InviteItem {
  id: string;
  value: string;
  type: "email" | "username";
  isValid: boolean;
}

export function ShareBtn({
  room,
  triggerNode,
}: {
  room: IRoom;
  triggerNode?: ReactNode;
}) {
  const roomCode = room.room_code;
  const roomTitle = room.title;
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [inviteItems, setInviteItems] = useState<InviteItem[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);
  // const [usernameSuggestions, setUsernameSuggestions] = useState(mockUsers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameSuggestions, setUsernameSuggestions] = useState<
    Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
    }>
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomLink = `${process.env.NEXT_PUBLIC_SITE_URL}/${roomCode}`;

  const form = useForm({
    defaultValues: {
      personalMessage: "",
    },
  });

  // Check for invite query parameter on mount
  useEffect(() => {
    if (searchParams.get("invite") === "true") {
      setIsOpen(true);
      // Remove the query parameter
      const params = new URLSearchParams(searchParams);
      params.delete("invite");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return (
      username.startsWith("@") &&
      username.length > 1 &&
      /^@[a-zA-Z][a-zA-Z0-9_]*$/.test(username)
    );
  };

  const handleShareClick = () => {
    // Add query parameter to show invite mode
    const params = new URLSearchParams(searchParams);
    params.set("invite", "true");
    router.push(`?${params.toString()}`, { scroll: false });
    setIsOpen(true);
  };

  const addInviteItem = (value: string, type: "email" | "username") => {
    const isValid =
      type === "email" ? validateEmail(value) : validateUsername(value);
    const newItem: InviteItem = {
      id: Date.now().toString(),
      value,
      type,
      isValid,
    };

    // Check if item already exists
    const exists = inviteItems.some(
      (item) => item.value.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      setInviteItems((prev) => [...prev, newItem]);
    }
    setCurrentInput("");
    setShowUsernameSuggestions(false);
  };

  const removeInviteItem = (id: string) => {
    setInviteItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInputChange = async (value: string) => {
    setCurrentInput(value);

    // Show username suggestions if input starts with @
    if (value.startsWith("@") && value.length > 1) {
      const query = value.slice(1);
      const result = await searchUsersByUsername(query);

      if (result.success && result.data) {
        setUsernameSuggestions(result.data);
        setShowUsernameSuggestions(true);
      } else {
        setUsernameSuggestions([]);
        setShowUsernameSuggestions(false);
      }
    } else {
      setShowUsernameSuggestions(false);
      setUsernameSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (currentInput.trim()) {
        const value = currentInput.trim();
        const type = value.startsWith("@") ? "username" : "email";
        addInviteItem(value, type);
      }
    }
  };

  const handleUsernameSuggestionClick = (username: string) => {
    addInviteItem(`@${username}`, "username");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const resetForm = () => {
    form.reset();
    setInviteItems([]);
    setCurrentInput("");
    setShowUsernameSuggestions(false);
    setLinkCopied(false);
  };

  const handleSubmit = async () => {
    // Check for invalid entries before submitting
    const invalidItems = inviteItems.filter((item) => !item.isValid);

    if (invalidItems.length > 0) {
      toast.error("Please fix invalid entries", {
        description:
          "Remove the entries shown in red before sending invitations.",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = form.getValues();
    const validItems = inviteItems.filter((item) => item.isValid);
    const emails = validItems
      .filter((item) => item.type === "email")
      .map((item) => item.value);
    const usernames = validItems
      .filter((item) => item.type === "username")
      .map((item) => item.value);

    try {
      const result = await sendRoomInvitations({
        roomId: room.id,
        emails,
        usernames,
        personalMessage: formData.personalMessage,
        roomTitle: room.title,
        roomCode: room.room_code,
      });

      if (result.success) {
        toast.success("Invitations sent!", {
          description: result.message,
        });
        // Success - close modal and reset
        setIsOpen(false);
        resetForm();
      } else {
        toast.error("Failed to send invitations", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidInvites = inviteItems.some((item) => item.isValid);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {triggerNode || (
          <Button
            variant="outline"
            size="sm"
            className="font-semibold"
            onClick={handleShareClick}
          >
            <IconShare3 className="text-muted-foreground text-sm" />
            Share
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[32.5rem]" fullScreenOnMobile={true}>
        <DialogHeader>
          <DialogTitle>
            🎬 Invite Friends to &apos;{roomTitle}&apos;
          </DialogTitle>
          <DialogDescription>
            Share your movie room and watch together
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-2">
          {/* Invite Section */}
          <div className="grid gap-3">
            <Label>Invite by email or username</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-background">
                {/* Display added invite items as badges */}
                {inviteItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    // variant={item.isValid ? "secondary" : "destructive"}
                    className={clsx(
                      "flex items-center gap-1",
                      !item.isValid &&
                        "!text-destructive !border-destructive !border !border-solid"
                    )}
                  >
                    {item.type === "email" ? (
                      <Mail className="h-3 w-3" />
                    ) : (
                      <User2 className="h-3 w-3" />
                    )}
                    {item.value}
                    <button
                      type="button"
                      onClick={() => removeInviteItem(item.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {/* Input field */}
                <Input
                  ref={inputRef}
                  value={currentInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    inviteItems.length === 0
                      ? "friend@gmail.com or @username"
                      : ""
                  }
                  className="border-none shadow-none focus-visible:ring-0 flex-1 min-w-[200px] p-0 h-auto"
                />
              </div>

              {/* Username suggestions dropdown */}
              {showUsernameSuggestions && usernameSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {usernameSuggestions.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        handleUsernameSuggestionClick(user.username)
                      }
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">@{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.display_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Type an email or @username and press Enter to add them
            </p>
          </div>

          {/* Share Link Section */}
          <div className="grid gap-3">
            <Label>Or share link directly</Label>
            <div className="flex gap-2">
              <Input value={roomLink} readOnly className="bg-muted text-sm" />
              <Button
                type="button"
                onClick={copyLink}
                variant="outline"
                className="shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Personal Message */}
          <Form {...form}>
            <FormField
              control={form.control}
              name="personalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hey! Join me watching this amazing movie..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    This message will be included in email invitations
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasValidInvites || isSubmitting}
          >
            {isSubmitting && <InlineLoader />}

            {isSubmitting ? "Sending..." : "Send Invitations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
