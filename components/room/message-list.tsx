"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { IMessage } from "@/interfaces/message.interface";
import { IRoom } from "@/interfaces/room.interface";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MoreHorizontal, Reply, SmilePlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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
  onScrollToParent?: (messageId: string) => void; // ADD THIS
  isHighlighted?: boolean; // ADD THIS
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
  onScrollToParent, // ADD THIS
  isHighlighted = false, // ADD THIS
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [reactingWith, setReactingWith] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { user } = useAuth();

  const getPositionIcon = () => {
    if (room.content.content_type === "series") {
      return "📺"; // TV emoji for series
    }
    return "🎬"; // Movie camera emoji for movies
  };

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
    setEmojiPickerOpen(false);
    try {
      await onReact(message.id, emoji);
    } catch (error) {
      console.error("Failed to react:", error);
    } finally {
      setReactingWith(null);
    }
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
      acc[reaction.emoji].users.push(reaction.user.display_name);
      return acc;
    },
    {} as Record<
      string,
      { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }
    >
  );

  const reactionArray = groupedReactions ? Object.values(groupedReactions) : [];

  return (
    <div
      id={`message-${message.id}`} // ADD THIS
      className={clsx(
        "group px-4 py-1 hover:bg-muted/20 transition-all duration-300 relative", // CHANGED transition-colors to transition-all duration-300
        isOwnMessage ? "flex justify-end" : "flex justify-start"
        // ADD THIS
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={clsx(
          "max-w-[70%] relative",
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
                  : parentMessage.user.display_name}
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
                    {message.user.display_name.charAt(0).toUpperCase()}
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
                ? "bg-[#c7d2fe]  rounded-br-md"
                : "bg-muted rounded-bl-md",
              message.thread_depth > 0 && "mt-1",
              isHighlighted && "ring-8 ring-primary rounded-lg opacity-60"
            )}
          >
            {/* Header for first message in group (others only) */}
            {!isOwnMessage && isFirstInGroup && (
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  {message.user.display_name}
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
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
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

          {/* Message timestamp for own messages */}
          {/* {isOwnMessage && (
            <div className="flex-shrink-0 mb-1 ml-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <span
                  className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-default"
                  title={messageTime.fullFormat}
                >
                  {messageTime.timeOnly}
                </span>
              </div>
            </div>
          )} */}
        </div>

        {/* Floating action buttons */}
        {showActions && (
          <div
            className={clsx(
              "absolute top-0 flex items-center gap-1 z-10 transition-opacity",
              isOwnMessage ? "-left-20 opacity-100" : "-right-20 opacity-100"
            )}
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
              onClick={() => onReply?.(message)}
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
                  onClick={() => onReply?.(message)}
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

  // const [currentUserId, setCurrentUserId] = useState<string>("");

  // // Get current user ID
  // useEffect(() => {
  //   const getCurrentUser = async () => {
  //     const supabase = createClient();
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();
  //     if (user) {
  //       setCurrentUserId(user.id);
  //     }
  //   };
  //   getCurrentUser();
  // }, []);

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
          <div className="flex items-center justify-center h-full">
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
                      onScrollToParent={scrollToMessage} // ADD THIS
                      isFirstInGroup={messageIndex === 0}
                      showAvatar={messageIndex === 0}
                      isOwnMessage={isOwnMessage}
                      parentMessage={parentMessage}
                      isHighlighted={highlightedMessage === message.id} // ADD THIS
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
        <div className="absolute bottom-20 right-6">
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
