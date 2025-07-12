"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IMessage } from "@/interfaces/message.interface";
import { IRoom } from "@/interfaces/room.interface";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MoreHorizontal, Reply, Smile } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
}

function MessageItem({
  message,
  room,
  onReply,
  onReact,
  isFirstInGroup = false,
  showAvatar = true,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [reactingWith, setReactingWith] = useState<string | null>(null);

  const formatTimestamp = (timestamp?: number | null) => {
    if (!timestamp) return "";
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = timestamp % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPositionText = () => {
    if (
      room.content.content_type === "series" &&
      message.season_number &&
      message.episode_number
    ) {
      return `S${message.season_number}E${message.episode_number}${message.episode_timestamp ? ` • ${formatTimestamp(message.episode_timestamp)}` : ""}`;
    }
    if (message.episode_timestamp) {
      return formatTimestamp(message.episode_timestamp);
    }
    return null;
  };

  const handleReact = async (emoji: string) => {
    if (!onReact || reactingWith) return;

    setReactingWith(emoji);
    try {
      await onReact(message.id, emoji);
    } catch (error) {
      console.error("Failed to react:", error);
    } finally {
      setReactingWith(null);
    }
  };

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div
      className={clsx(
        "group flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors",
        message.thread_depth > 0 && "ml-8 border-l-2 border-muted pl-4"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && isFirstInGroup ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.user.avatar_url} />
            <AvatarFallback className="text-xs">
              {message.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: false,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        {isFirstInGroup && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {message.user.display_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </span>
            {getPositionText() && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                {getPositionText()}
              </Badge>
            )}
          </div>
        )}

        {/* Message text */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message_text}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {message.reactions.map((reaction, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs rounded-full"
                onClick={() => handleReact(reaction.emoji)}
              >
                {reaction.emoji} {/* You might want to count reactions here */}
              </Button>
            ))}
          </div>
        )}

        {/* Actions */}
        {(showActions || reactingWith) && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick reactions */}
            <div className="flex items-center gap-0.5">
              {quickReactions.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => handleReact(emoji)}
                  disabled={reactingWith === emoji}
                >
                  {reactingWith === emoji ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-sm">{emoji}</span>
                  )}
                </Button>
              ))}
            </div>

            {/* Reply button */}
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onReply(message)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="h-3 w-3 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Smile className="h-3 w-3 mr-2" />
                  React
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
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

  // Load scroll position from localStorage
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
        // Only restore if it's recent (within 1 hour)
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
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold

    setUserScrolledUp(!isAtBottom);
    setShouldAutoScroll(isAtBottom);

    // Save scroll position when user scrolls
    if (!isAtBottom) {
      saveScrollPosition();
    }
  }, [saveScrollPosition]);

  // Group messages by user and time
  const groupedMessages = messages.reduce(
    (groups: IMessage[][], message, index) => {
      const prevMessage = messages[index - 1];
      const shouldGroup =
        prevMessage &&
        prevMessage.user_id === message.user_id &&
        new Date(message.created_at).getTime() -
          new Date(prevMessage.created_at).getTime() <
          300000 && // 5 minutes
        message.thread_depth === prevMessage.thread_depth;

      if (shouldGroup) {
        groups[groups.length - 1].push(message);
      } else {
        groups.push([message]);
      }

      return groups;
    },
    []
  );

  // Initial scroll behavior
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      if (localStorage.getItem(scrollPositionKey)) {
        // Restore previous position
        setTimeout(restoreScrollPosition, 100);
      } else {
        // First visit - scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages.length > 0, loading]);

  // Auto-scroll for new messages
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  // Cleanup scroll position on unmount
  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    console.log({ theerroris: error });
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load messages</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">
                Be the first to share your thoughts about this{" "}
                {room.content.content_type}!
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {groupedMessages.map((group) => (
              <div key={group[0].id} className="mb-2">
                {group.map((message, messageIndex) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    room={room}
                    onReply={onReplyToMessage}
                    onReact={onReactToMessage}
                    isFirstInGroup={messageIndex === 0}
                    showAvatar={messageIndex === 0}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {userScrolledUp && (
        <div className="absolute bottom-24 right-6">
          <Button
            size="sm"
            className="rounded-full shadow-lg"
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
