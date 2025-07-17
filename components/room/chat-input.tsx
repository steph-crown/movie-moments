"use client";

import clsx from "clsx";
import { Clock2, Edit2Icon, Send, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { IRoom } from "@/interfaces/room.interface";
import { PositionSetupDialog } from "./position-setup-dialog";
import { getCurrentUserPosition } from "@/lib/actions/rooms";
import { decodeSeasonData } from "@/lib/utils/season.utils";

interface ChatInputProps {
  className?: string;
  room: IRoom;
  onSendMessage: (
    message: string,
    options?: {
      seasonNumber?: number;
      episodeNumber?: number;
      episodeTimestamp?: number;
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
  const [userPosition, setUserPosition] = useState<{
    current_season: string | null;
    current_episode: number | null;
    playback_timestamp: string | null;
  } | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);

  // Load user's current position
  useEffect(() => {
    const loadUserPosition = async () => {
      setLoadingPosition(true);
      try {
        const result = await getCurrentUserPosition(room.id);
        if (result.success && result.data) {
          setUserPosition(result.data);

          // Show dialog if user doesn't have position set for series
          if (
            room.content.content_type === "series" &&
            (!result.data.current_season || !result.data.current_episode)
          ) {
            setShowPositionDialog(true);
          }
        }
      } catch (error) {
        console.error("Error loading user position:", error);
      } finally {
        setLoadingPosition(false);
      }
    };

    loadUserPosition();
  }, [room.id, room.content.content_type]);

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
      // Parse current position
      let seasonNumber: number | undefined;
      let episodeNumber: number | undefined;
      let timestampInSeconds: number = 0;

      if (
        room.content.content_type === "series" &&
        userPosition?.current_season
      ) {
        try {
          const seasonData = decodeSeasonData(userPosition.current_season);
          seasonNumber = seasonData.number;
        } catch {
          // If decoding fails, try parsing as number
          seasonNumber = parseInt(userPosition.current_season);
        }
        episodeNumber = userPosition.current_episode || undefined;
      }

      if (userPosition?.playback_timestamp) {
        timestampInSeconds = parseTimestamp(userPosition.playback_timestamp);
      }

      await onSendMessage(message.trim(), {
        seasonNumber,
        episodeNumber,
        episodeTimestamp: timestampInSeconds,
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

  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
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
    // Reload user position
    const result = await getCurrentUserPosition(room.id);
    if (result.success && result.data) {
      setUserPosition(result.data);
    }
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
                className="rounded-full !text-muted-foreground text-xs"
                size="sm"
                disabled={loadingPosition}
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
      />
    </>
  );
}
