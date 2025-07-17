"use client";

import { BlockLoader } from "@/components/loaders/block-loader";
import { ChatInput } from "@/components/room/chat-input";
import { JoinRoomPrompt } from "@/components/room/join-room-prompt";
import { LoginPrompt } from "@/components/room/login-prompt";
import { MoviePosition } from "@/components/room/movie-position";
import { RoomHeader } from "@/components/room/room-header";
import { RoomNotFound } from "@/components/room/room-not-found";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { MessageList } from "@/components/room/message-list";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IRoom } from "@/interfaces/room.interface";
import { IMessage } from "@/interfaces/message.interface";
import { fetchRoomByCode } from "@/lib/actions/rooms";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

// Update your page component to pass room to MoviePosition and fix message sending

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.room_code as string;

  const [room, setRoom] = useState<IRoom | null>(null);
  const [userStatus, setUserStatus] = useState<
    "not_member" | "pending" | "joined" | "left"
  >("not_member");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<{
    messageId: string;
    userName: string;
    messageText: string;
  } | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Enable realtime messages only when user is joined
  const enableRealtime = room && isAuthenticated && userStatus === "joined";

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    addReaction,
    removeReaction,
  } = useRealtimeMessages({
    roomId: room?.id || "",
    enabled: !!enableRealtime,
  });

  const loadRoom = async () => {
    if (!roomCode) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRoomByCode(roomCode, {
        requireParticipation: false,
        includeParticipantStatus: true,
        allowUnauthenticatedPublic: true,
      });

      if (result.requiresAuth) {
        toast.error("Please log in to access this room");
        router.push(`/auth/login?roomCode=${roomCode}`);
        return;
      }

      if (result.success && result.data) {
        setRoom(result.data.room);
        setUserStatus(result.data.userStatus || "not_member");
        setIsAuthenticated(result.data.isAuthenticated || false);

        if (
          result.data.room.privacy_level === "private" &&
          !result.data.isAuthenticated
        ) {
          toast.error("Please log in to access this private room");
          router.push(`/auth/login?roomCode=${roomCode}`);
          return;
        }
      } else {
        setError(result.error || "Failed to load room");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomCode]);

  const handleJoinSuccess = () => {
    setUserStatus("joined");
    loadRoom();
  };

  const handleSendMessage = async (
    messageText: string,
    options?: {
      currentSeason?: string; // Updated: Now string for encoded season
      currentEpisode?: number;
      playbackTimestamp?: string; // Updated: Now string for time format
      parentMessageId?: string;
    }
  ) => {
    if (!room || !isAuthenticated || userStatus !== "joined") return;

    try {
      await sendMessage({
        room_id: room.id,
        user_id: "", // Will be set by the hook
        message_text: messageText,
        current_season: options?.currentSeason || null, // Updated field name
        current_episode: options?.currentEpisode || null, // Updated field name
        playback_timestamp: options?.playbackTimestamp || null, // Updated field name
        thread_depth: options?.parentMessageId ? 1 : 0,
        parent_message_id: options?.parentMessageId || null,
        is_deleted: false,
      });
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Send message error:", error);
    }
  };

  const handleReplyToMessage = (message: IMessage) => {
    setReplyingTo({
      messageId: message.id,
      userName: message.user.display_name,
      messageText: message.message_text,
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!room || !isAuthenticated || userStatus !== "joined") return;

    try {
      // Check if user already reacted with this emoji
      const existingReaction = messages
        .find((m) => m.id === messageId)
        ?.reactions?.find(
          (r) => r.emoji === emoji && r.user_id === currentUserId
        );

      if (existingReaction) {
        await removeReaction(existingReaction.id);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (error) {
      toast.error("Failed to react to message");
      console.error("React to message error:", error);
    }
  };

  if (loading) {
    return <BlockLoader />;
  }

  if (error) {
    return <RoomNotFound roomCode={roomCode} message={error} />;
  }

  if (!room) {
    return <RoomNotFound roomCode={roomCode} />;
  }

  const renderBottomComponent = () => {
    if (isAuthenticated && userStatus === "joined") {
      return (
        <div className="relative bottom-0 left-0 right-0 bg-background border-t">
          <ChatInput
            className="py-4"
            room={room}
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
          />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="absolute bottom-0 left-0 right-0">
          <LoginPrompt room={room} roomCode={roomCode} />
        </div>
      );
    }

    return (
      <div className="absolute bottom-0 left-0 right-0">
        <JoinRoomPrompt
          room={room}
          userStatus={userStatus}
          onJoinSuccess={handleJoinSuccess}
        />
      </div>
    );
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 18)",
        } as React.CSSProperties
      }
    >
      <RoomSidebar variant="inset" />

      <SidebarInset className="relative flex flex-col h-[calc(100vh_-_1rem)]">
        <RoomHeader room={room} />
        <MoviePosition room={room} /> {/* Pass room prop */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area - only show when joined */}
          {isAuthenticated && userStatus === "joined" ? (
            <div className="flex-1 overflow-hidden relative">
              <MessageList
                messages={messages}
                loading={messagesLoading}
                error={messagesError}
                room={room}
                onReplyToMessage={handleReplyToMessage}
                onReactToMessage={handleReactToMessage}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {renderBottomComponent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
