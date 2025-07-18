/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { IMessage } from "@/interfaces/message.interface";
import { IRoom } from "@/interfaces/room.interface";
import { decodeSeasonData, parseTimestamp } from "@/lib/utils/season.utils";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Reply,
  SmilePlus,
  Eye,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useUserPosition } from "@/contexts/user-position-context";

interface MessageListProps {
  messages: IMessage[];
  loading: boolean;
  error: string | null;
  room: IRoom;
  onReplyToMessage?: (message: IMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => Promise<void>;
}

interface MessageItemProps {
  message: IMessage;
  room: IRoom;
  onReply?: (message: IMessage) => void;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
  isFirstInGroup?: boolean;
  showAvatar?: boolean;
  isOwnMessage?: boolean;
  parentMessage?: IMessage | null;
  onScrollToParent?: (messageId: string) => void;
  isHighlighted?: boolean;
}

// Spoiler confirmation modal component
function SpoilerConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  spoilerText,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  spoilerText: string;
  room: IRoom;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem("spoiler-modal-disabled", "true");
    }
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Potential Spoiler Warning
          </DialogTitle>
          <DialogDescription>
            This message contains a comment about a future point in{" "}
            {room.content.content_type === "series"
              ? "the series"
              : "the movie"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-sm">
                Position: {spoilerText}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              This message was sent from a position ahead of where you currently
              are. It might contain spoilers about upcoming events.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(value) => {
                setDontShowAgain(!!value);
              }}
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don&apos;t show this warning again
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Eye className="mr-2 h-4 w-4" />
            Show Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageItem({
  message,
  room,
  onReply,
  onReact,
  isFirstInGroup = false,
  showAvatar = true,
  isOwnMessage = false,
  parentMessage = null,
  onScrollToParent,
  isHighlighted = false,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [reactingWith, setReactingWith] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isUnblurred, setIsUnblurred] = useState(false);
  const [showSpoilerModal, setShowSpoilerModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [startX, setStartX] = useState(0);

  const { user } = useAuth();
  const { position: userPosition } = useUserPosition();
  const isMobile = useIsMobile();
  const messageRef = useRef<HTMLDivElement>(null);

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      const touch = e.touches[0];
      setStartX(touch.clientX);

      // Disable text selection on long press
      const timer = setTimeout(() => {
        setShowActions(true);
        // Haptic feedback on supported devices
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobile && startX > 0) {
      const touch = e.touches[0];
      const distance = touch.clientX - startX;

      // Only allow drag to the right (reply gesture)
      if (distance > 0) {
        setDragDistance(Math.min(distance, 100)); // Max drag distance
        if (distance > 20 && !isDragging) {
          setIsDragging(true);
          // Cancel long press timer if dragging
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      // If dragged enough, trigger reply
      if (isDragging && dragDistance > 50) {
        onReply?.(message);
      }

      // Reset drag state
      setIsDragging(false);
      setDragDistance(0);
      setStartX(0);
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsDragging(false);
    setDragDistance(0);
    setStartX(0);
  };

  // Close actions when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActions(false);
    };

    if (showActions) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showActions]);

  const getPositionIcon = () => {
    if (room.content.content_type === "series") {
      return "📺";
    }
    return "🎬";
  };

  const formatTimestamp = (timestamp?: string | null) => {
    if (!timestamp) return "";
    return timestamp;
  };

  const formatMessageTime = (utcTimestamp: string) => {
    const date = new Date(utcTimestamp + "Z");
    const timeOnly = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const fullFormat = date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    return { fullFormat, timeOnly, relativeTime };
  };

  const getPositionText = () => {
    // Don't show position for replies (thread_depth > 0)
    if (message.thread_depth > 0) return null;

    // Don't show position if message doesn't have timestamp data
    if (
      !message.current_season &&
      !message.current_episode &&
      !message.playback_timestamp
    ) {
      return null;
    }

    if (
      room.content.content_type === "series" &&
      message.current_season &&
      message.current_episode
    ) {
      try {
        const seasonData = decodeSeasonData(message.current_season);
        return `S${seasonData.number}E${message.current_episode}${
          message.playback_timestamp
            ? ` • ${formatTimestamp(message.playback_timestamp)}`
            : ""
        }`;
      } catch {
        return `S${message.current_season}E${message.current_episode}${
          message.playback_timestamp
            ? ` • ${formatTimestamp(message.playback_timestamp)}`
            : ""
        }`;
      }
    }
    if (message.playback_timestamp) {
      return formatTimestamp(message.playback_timestamp);
    }
    return null;
  };

  // Get the position text for spoiler warning
  const getSpoilerPositionText = () => {
    const messageToCheck =
      message.thread_depth > 0 && parentMessage ? parentMessage : message;

    if (
      room.content.content_type === "series" &&
      messageToCheck.current_season &&
      messageToCheck.current_episode
    ) {
      try {
        const seasonData = decodeSeasonData(messageToCheck.current_season);
        return `S${seasonData.number}E${messageToCheck.current_episode}${
          messageToCheck.playback_timestamp
            ? ` ${messageToCheck.playback_timestamp}`
            : ""
        }`;
      } catch {
        return `S${messageToCheck.current_season}E${messageToCheck.current_episode}${
          messageToCheck.playback_timestamp
            ? ` ${messageToCheck.playback_timestamp}`
            : ""
        }`;
      }
    }
    return messageToCheck.playback_timestamp || "Unknown position";
  };

  // Spoiler detection logic
  const shouldBlurMessage = () => {
    if (room.spoiler_policy !== "hide_spoilers" || !userPosition || isUnblurred)
      return false;

    // Don't blur own messages
    if (isOwnMessage) return false;

    // Don't blur messages without position data
    if (
      !message.current_season &&
      !message.current_episode &&
      !message.playback_timestamp
    ) {
      return false;
    }

    // Check the message to compare (message itself or its parent for replies)
    const messageToCheck =
      message.thread_depth > 0 && parentMessage ? parentMessage : message;

    if (
      !messageToCheck.current_season &&
      !messageToCheck.current_episode &&
      !messageToCheck.playback_timestamp
    ) {
      return false;
    }

    // For movies, compare timestamps
    if (room.content.content_type === "movie") {
      const userTimestamp = parseTimestamp(
        userPosition.playback_timestamp || "0:00"
      );
      const messageTimestamp = parseTimestamp(
        messageToCheck.playback_timestamp || "0:00"
      );
      return messageTimestamp > userTimestamp + 60; // 1 minute buffer
    }

    // For series, compare season/episode/timestamp
    if (room.content.content_type === "series") {
      let userSeason = 1;
      let messageSeason = 1;

      // Parse user season
      if (userPosition.current_season) {
        try {
          const decoded = decodeSeasonData(userPosition.current_season);
          userSeason = decoded.number;
        } catch {
          userSeason = parseInt(userPosition.current_season) || 1;
        }
      }

      // Parse message season
      if (messageToCheck.current_season) {
        try {
          const decoded = decodeSeasonData(messageToCheck.current_season);
          messageSeason = decoded.number;
        } catch {
          messageSeason = parseInt(messageToCheck.current_season) || 1;
        }
      }

      const userEpisode = userPosition.current_episode || 1;
      const messageEpisode = messageToCheck.current_episode || 1;

      // If message is from a later season, blur it
      if (messageSeason > userSeason) return true;

      // If same season but later episode, blur it
      if (messageSeason === userSeason && messageEpisode > userEpisode)
        return true;

      // If same season and episode, check timestamp
      if (messageSeason === userSeason && messageEpisode === userEpisode) {
        const userTimestamp = parseTimestamp(
          userPosition.playback_timestamp || "0:00"
        );
        const messageTimestamp = parseTimestamp(
          messageToCheck.playback_timestamp || "0:00"
        );
        return messageTimestamp > userTimestamp + 60; // 1 minute buffer
      }
    }

    return false;
  };

  const handleReact = async (emoji: string) => {
    if (!onReact || reactingWith) return;

    setReactingWith(emoji);
    setEmojiPickerOpen(false);
    setShowActions(false); // Close actions after reacting
    try {
      await onReact(message.id, emoji);
    } catch (error) {
      console.error("Failed to react:", error);
    } finally {
      setReactingWith(null);
    }
  };

  const handleReplyClick = () => {
    setShowActions(false); // Close actions after replying
    onReply?.(message);
  };

  const getUserName = (user: { username: string; display_name: string }) => {
    return user.username || user.display_name || "Unknown User";
  };

  const handleUnblurClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if spoiler modal is disabled
    const spoilerModalDisabled =
      localStorage.getItem("spoiler-modal-disabled") === "true";

    if (spoilerModalDisabled) {
      setIsUnblurred(true);
    } else {
      setShowSpoilerModal(true);
    }
  };

  const handleSpoilerConfirm = () => {
    setIsUnblurred(true);
  };

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "💯"];
  const messageTime = formatMessageTime(message.created_at);

  // Group reactions by emoji and count them
  const groupedReactions = message.reactions?.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(getUserName(reaction.user));
      return acc;
    },
    {} as Record<
      string,
      { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }
    >
  );

  const reactionArray = groupedReactions ? Object.values(groupedReactions) : [];
  const isBlurred = shouldBlurMessage();

  return (
    <>
      <div
        ref={messageRef}
        id={`message-${message.id}`}
        className={clsx(
          "group px-4 py-1 hover:bg-muted/20 transition-all duration-300 relative",
          isOwnMessage ? "flex justify-end" : "flex justify-start",
          isDragging && "bg-muted/30"
        )}
        style={{
          transform:
            isMobile && isDragging
              ? `translateX(${dragDistance}px)`
              : undefined,
          userSelect: isMobile ? "none" : "auto", // Disable text selection on mobile
        }}
        onMouseEnter={() => !isMobile && setShowActions(true)}
        onMouseLeave={() => !isMobile && setShowActions(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Reply indicator for drag gesture */}
        {isDragging && dragDistance > 20 && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-50">
            <Reply className="h-5 w-5 text-primary" />
          </div>
        )}

        <div
          className={clsx(
            "max-w-[90%] relative",
            isOwnMessage ? "order-2" : "order-1"
          )}
        >
          {/* Reply reference */}
          {message.thread_depth > 0 && parentMessage && (
            <div className="mb-2 ml-2 opacity-70">
              <button
                onClick={() => onScrollToParent?.(parentMessage.id)}
                className="flex items-center gap-2 text-xs text-muted-foreground border-l-2 border-muted pl-3 py-1 hover:bg-muted/20 rounded-r transition-colors cursor-pointer"
              >
                <Reply className="h-3 w-3" />
                <span className="font-medium">
                  {parentMessage.user_id === user?.id
                    ? "You"
                    : getUserName(parentMessage.user)}
                </span>
                <span className="truncate max-w-[200px]">
                  {parentMessage.message_text}
                </span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Avatar for others */}
            {!isOwnMessage && (
              <div className="flex-shrink-0 mb-1">
                {showAvatar && isFirstInGroup ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.user.avatar_url} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {getUserName(message.user).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span
                      className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-default"
                      title={messageTime.fullFormat}
                    >
                      {messageTime.timeOnly}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Message bubble */}
            <div
              className={clsx(
                "rounded-2xl px-4 py-2 relative max-w-full transition-all",
                isOwnMessage
                  ? "bg-[#c7d2fe] rounded-br-md"
                  : "bg-muted rounded-bl-md",
                message.thread_depth > 0 && "mt-1",
                isHighlighted && "ring-8 ring-primary rounded-lg opacity-60"
              )}
            >
              {/* Spoiler overlay */}
              {isBlurred && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 cursor-pointer hover:bg-black/30 transition-colors"
                        onClick={handleUnblurClick}
                      >
                        <div className="text-xs font-medium text-center px-2">
                          <div className="flex items-center gap-1 justify-center mb-1">
                            <Eye className="h-3 w-3" />
                            <span>Potential Spoiler</span>
                          </div>
                          <span className="text-muted-foreground text-[10px]">
                            Click to reveal
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">
                          This message contains a comment about future{" "}
                          {room.content.content_type === "series"
                            ? "episodes"
                            : "scenes"}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          <span>Position: {getSpoilerPositionText()}</span>
                        </div>
                        <p className="text-xs opacity-75">
                          Click to view anyway or update your position if
                          you&apos;ve passed this point
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Header for first message in group (others only) */}
              {!isOwnMessage && isFirstInGroup && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm">
                    ~ {getUserName(message.user)}
                  </span>
                  <span className="text-[.6835rem] opacity-70">
                    {messageTime.timeOnly}
                  </span>
                  {getPositionText() && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-auto border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1"
                      title={`Viewer position: ${getPositionText()}`}
                    >
                      <span className="font-medium">{getPositionIcon()}</span>
                      {getPositionText()}
                    </Badge>
                  )}
                </div>
              )}

              {/* Own message header */}
              {isOwnMessage && isFirstInGroup && getPositionText() && (
                <div className="flex items-center justify-end gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-auto border-blue-500 text-blue-700 flex items-center gap-1"
                    title={`Your position: ${getPositionText()}`}
                  >
                    <span className="font-medium">{getPositionIcon()}</span>
                    {getPositionText()}
                  </Badge>
                  <span className="text-xs opacity-70">
                    {messageTime.timeOnly}
                  </span>
                </div>
              )}

              {/* Message text */}
              <div
                className={clsx(
                  "text-sm leading-relaxed whitespace-pre-wrap break-words",
                  isBlurred && "blur-sm"
                )}
              >
                {message.message_text}
              </div>

              {/* Reactions */}
              {reactionArray.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {reactionArray.map((reaction) => (
                    <Button
                      key={reaction.emoji}
                      variant="ghost"
                      size="sm"
                      className={clsx(
                        "h-6 px-2 text-xs rounded-full border border-border/50 hover:border-border",
                        isOwnMessage
                          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                          : "bg-background/70 hover:bg-background"
                      )}
                      onClick={() => handleReact(reaction.emoji)}
                      title={`${reaction.users.join(", ")} reacted with ${reaction.emoji}`}
                    >
                      {reaction.emoji} {reaction.count}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Floating action buttons */}
          {showActions && !isBlurred && !isMobile && (
            <div
              className={clsx(
                "absolute top-0 flex items-center gap-1 z-20 transition-opacity",
                isOwnMessage ? "-left-20 opacity-100" : "-right-20 opacity-100"
              )}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking actions
            >
              {/* Emoji picker */}
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full shadow-md border bg-background hover:bg-muted"
                  >
                    {reactingWith ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SmilePlus className="h-4 w-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="center">
                  <div className="grid grid-cols-4 gap-1">
                    {quickReactions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted text-base"
                        onClick={() => handleReact(emoji)}
                        disabled={reactingWith === emoji}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Reply button */}
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 rounded-full shadow-md border bg-background hover:bg-muted"
                onClick={handleReplyClick}
              >
                <Reply className="h-4 w-4" />
              </Button>

              {/* More options */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full shadow-md border bg-background hover:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleReplyClick}
                  >
                    <Reply className="h-3 w-3 mr-2" />
                    Reply
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Spoiler Confirmation Modal */}
      <SpoilerConfirmationModal
        open={showSpoilerModal}
        onOpenChange={setShowSpoilerModal}
        onConfirm={handleSpoilerConfirm}
        spoilerText={getSpoilerPositionText()}
        room={room}
      />
    </>
  );
}

export function MessageList({
  messages,
  loading,
  error,
  room,
  onReplyToMessage,
  onReactToMessage,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [highlightedMessage, setHighlightedMessage] = useState<string | null>(
    null
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && containerRef.current) {
      // Calculate scroll position to center the message
      const containerRect = containerRef.current.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();
      const scrollTop =
        containerRef.current.scrollTop +
        messageRect.top -
        containerRect.top -
        containerRect.height / 2 +
        messageRect.height / 2;

      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });

      // Highlight the message
      setHighlightedMessage(messageId);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMessage(null);
      }, 3000);

      // Prevent auto-scroll while user is viewing the highlighted message
      setShouldAutoScroll(false);
    }
  }, []);

  const scrollPositionKey = `room-${room.id}-scroll`;

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouldAutoScroll]);

  const saveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const scrollData = {
        scrollTop: containerRef.current.scrollTop,
        scrollHeight: containerRef.current.scrollHeight,
        timestamp: Date.now(),
      };
      localStorage.setItem(scrollPositionKey, JSON.stringify(scrollData));
    }
  }, [scrollPositionKey]);

  const restoreScrollPosition = useCallback(() => {
    const savedData = localStorage.getItem(scrollPositionKey);
    if (savedData && containerRef.current) {
      try {
        const { scrollTop, timestamp } = JSON.parse(savedData);
        if (Date.now() - timestamp < 3600000) {
          containerRef.current.scrollTop = scrollTop;
          setShouldAutoScroll(false);
          setUserScrolledUp(true);
        }
      } catch (error) {
        console.error("Failed to restore scroll position:", error);
      }
    }
  }, [scrollPositionKey]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setUserScrolledUp(!isAtBottom);
    setShouldAutoScroll(isAtBottom);

    if (!isAtBottom) {
      saveScrollPosition();
    }
  }, [saveScrollPosition]);

  // Create a map of parent messages for replies
  const messageMap = messages.reduce(
    (map, msg) => {
      map[msg.id] = msg;
      return map;
    },
    {} as Record<string, IMessage>
  );

  // Group messages by user and time with better logic
  const groupedMessages = messages.reduce(
    (groups: IMessage[][], message, index) => {
      const prevMessage = messages[index - 1];
      const timeDiff = prevMessage
        ? new Date(message.created_at).getTime() -
          new Date(prevMessage.created_at).getTime()
        : Infinity;

      const shouldGroup =
        prevMessage &&
        prevMessage.user_id === message.user_id &&
        timeDiff < 300000 && // 5 minutes
        message.thread_depth === prevMessage.thread_depth &&
        message.parent_message_id === prevMessage.parent_message_id;

      if (shouldGroup) {
        groups[groups.length - 1].push(message);
      } else {
        groups.push([message]);
      }

      return groups;
    },
    []
  );

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      if (localStorage.getItem(scrollPositionKey)) {
        setTimeout(restoreScrollPosition, 100);
      } else {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages.length > 0, loading]);

  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2 font-medium">
            Failed to load messages
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center text-muted-foreground max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Reply className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium mb-2">Start the conversation</p>
              <p className="text-sm">
                Be the first to share your thoughts about{" "}
                <span className="font-medium">{room.title}</span>!
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            {groupedMessages.map((group) => (
              <div key={group[0].id}>
                {group.map((message, messageIndex) => {
                  const isOwnMessage = message.user_id === currentUserId;
                  const parentMessage = message.parent_message_id
                    ? messageMap[message.parent_message_id]
                    : null;

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      room={room}
                      onReply={onReplyToMessage}
                      onReact={onReactToMessage}
                      onScrollToParent={scrollToMessage}
                      isFirstInGroup={messageIndex === 0}
                      showAvatar={messageIndex === 0}
                      isOwnMessage={isOwnMessage}
                      parentMessage={parentMessage}
                      isHighlighted={highlightedMessage === message.id}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {userScrolledUp && (
        <div className="absolute bottom-5 right-6 z-[1000]">
          <Button
            size="sm"
            className="rounded-full shadow-lg border bg-background text-foreground hover:bg-muted"
            onClick={() => {
              setShouldAutoScroll(true);
              setUserScrolledUp(false);
              scrollToBottom();
            }}
          >
            ↓ New messages
          </Button>
        </div>
      )}
    </div>
  );
}
