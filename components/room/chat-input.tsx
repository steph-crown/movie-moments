"use client";

import clsx from "clsx";
import { Clock2, Edit2Icon, Send, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { IRoom } from "@/interfaces/room.interface";
import { PositionSetupDialog } from "./position-setup-dialog";
import { decodeSeasonData } from "@/lib/utils/season.utils";
import { useUserPosition } from "@/contexts/user-position-context";

interface ChatInputProps {
  className?: string;
  room: IRoom;
  onSendMessage: (
    message: string,
    options?: {
      currentSeason?: string;
      currentEpisode?: number;
      playbackTimestamp?: string;
      parentMessageId?: string;
    }
  ) => Promise<void>;
  replyingTo?: {
    messageId: string;
    userName: string;
    messageText: string;
  } | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  className,
  room,
  onSendMessage,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);

  // Use the shared position context
  const { position: userPosition, loading: loadingPosition } =
    useUserPosition();

  // Show position dialog for new series participants
  useEffect(() => {
    if (
      room.content.content_type === "series" &&
      !loadingPosition &&
      (!userPosition?.current_season || !userPosition?.current_episode)
    ) {
      setShowPositionDialog(true);
    }
  }, [room.content.content_type, loadingPosition, userPosition]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || sending) return;

    setSending(true);
    try {
      // Send message with current position data from context
      await onSendMessage(message.trim(), {
        currentSeason: userPosition?.current_season || undefined,
        currentEpisode: userPosition?.current_episode || undefined,
        playbackTimestamp: userPosition?.playback_timestamp || undefined,
        parentMessageId: replyingTo?.messageId,
      });

      setMessage("");
      onCancelReply?.();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustHeight();
  };

  const formatPosition = () => {
    if (loadingPosition) {
      return "Loading...";
    }

    if (
      room.content.content_type === "series" &&
      userPosition?.current_season
    ) {
      try {
        const seasonData = decodeSeasonData(userPosition.current_season);
        const episode = userPosition.current_episode || 1;
        const timestamp = userPosition.playback_timestamp || "0:00";
        return `S${seasonData.number}E${episode}: ${timestamp}`;
      } catch {
        // Fallback if decoding fails
        const season = userPosition.current_season;
        const episode = userPosition.current_episode || 1;
        const timestamp = userPosition.playback_timestamp || "0:00";
        return `S${season}E${episode}: ${timestamp}`;
      }
    }

    return userPosition?.playback_timestamp || "0:00";
  };

  const handlePositionDialogSuccess = async () => {
    setShowPositionDialog(false);
    // Position context will automatically update via optimistic updates
  };

  const handlePositionClick = () => {
    setShowPositionDialog(true);
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  return (
    <>
      <div className={clsx("px-4 lg:px-6 w-full", className)}>
        {/* Reply indicator */}
        {replyingTo && (
          <div className="mb-2 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium text-primary">
                  Replying to {replyingTo.userName}
                </span>
                <p className="text-muted-foreground mt-1 line-clamp-1">
                  {replyingTo.messageText}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onCancelReply}>
                ×
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="w-full border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 rounded-[1.5rem] border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] p-4 h-max">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[3rem] max-h-[12.5rem] text-base font-medium border-none shadow-none focus-visible:ring-0 focus-visible:border-transparent bg-transparent p-0 rounded-none resize-none overflow-hidden"
              placeholder={
                replyingTo ? "Type your reply..." : "Type your thoughts..."
              }
              disabled={sending || showPositionDialog}
            />

            <div className="flex items-end justify-between gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full !text-muted-foreground text-xs cursor-pointer"
                size="sm"
                disabled={loadingPosition}
                onClick={handlePositionClick}
              >
                <Clock2 className="h-4 text-muted-foreground" />
                {formatPosition()}
                <Edit2Icon className="h-4 text-muted-foreground" />
              </Button>

              <Button
                type="submit"
                size="icon"
                className="rounded-full"
                disabled={!message.trim() || sending || showPositionDialog}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Position Setup Dialog */}
      <PositionSetupDialog
        room={room}
        open={showPositionDialog}
        onSuccess={handlePositionDialogSuccess}
        onOpenChange={setShowPositionDialog}
        initialSeason={userPosition?.current_season}
        initialEpisode={userPosition?.current_episode}
        initialTimestamp={userPosition?.playback_timestamp}
        allowClose={true}
      />
    </>
  );
}
