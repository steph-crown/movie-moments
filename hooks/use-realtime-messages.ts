/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/use-realtime-messages.ts
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IMessage } from "@/interfaces/message.interface";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeMessagesProps {
  roomId: string;
  enabled?: boolean;
}

interface UseRealtimeMessagesReturn {
  messages: IMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (
    message: Omit<IMessage, "id" | "created_at" | "updated_at" | "user">
  ) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (reactionId: string) => Promise<void>;
  channel: RealtimeChannel | null;
}

export function useRealtimeMessages({
  roomId,
  enabled = true,
}: UseRealtimeMessagesProps): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const supabase = createClient();

  const formMessageFromQueryResponse = (msg: any): IMessage => {
    return {
      id: msg.id,
      room_id: roomId,
      user_id: msg.user_id,
      message_text: msg.message_text,
      current_season: msg.current_season, // Updated field name
      current_episode: msg.current_episode, // Updated field name
      playback_timestamp: msg.playback_timestamp, // Updated field name
      thread_depth: msg.thread_depth,
      parent_message_id: msg.parent_message_id,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      is_deleted: msg.is_deleted,
      user: {
        id: msg.profiles?.id || msg.user_id,
        email: msg.profiles?.email || "",
        username: msg.profiles?.username || "User",
        display_name:
          msg.profiles?.display_name || msg.profiles?.username || "User",
        avatar_url: msg.profiles?.avatar_url,
      },
      reactions: (msg.reactions || []).map((reaction: any) => ({
        id: reaction.id,
        message_id: msg.id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
        created_at: reaction.created_at,
        user: {
          id: reaction.profiles?.id || reaction.user_id,
          username: reaction.profiles?.username || "User",
          display_name:
            reaction.profiles?.display_name ||
            reaction.profiles?.username ||
            "User",
        },
      })),
    };
  };

  // Load initial messages
  const loadMessages = useCallback(async () => {
    // if (!enabled) return;

    setLoading(true);
    setError(null);

    console.log("whatttttttt");

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          profiles!messages_profiles_user_id_fkey(
            id,
            email,
            username,
            display_name,
            avatar_url
          ),
          reactions(
            id,
            emoji,
            created_at,
            user_id,
            profiles!reactions_profiles_user_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `
        )
        .eq("room_id", roomId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      console.log({ therealdata: data });

      if (error) throw error;

      // Transform the data to match IMessage interface
      const transformedMessages: IMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        room_id: roomId,
        user_id: msg.user_id,
        message_text: msg.message_text,
        current_season: msg.current_season, // Updated field name
        current_episode: msg.current_episode, // Updated field name
        playback_timestamp: msg.playback_timestamp, // Updated field name
        thread_depth: msg.thread_depth,
        parent_message_id: msg.parent_message_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        is_deleted: msg.is_deleted,
        user: {
          id: msg.profiles?.id || msg.user_id,
          email: msg.profiles?.email || "",
          username: msg.profiles?.username || "User",
          display_name:
            msg.profiles?.display_name || msg.profiles?.username || "User",
          avatar_url: msg.profiles?.avatar_url,
        },
        reactions: (msg.reactions || []).map((reaction: any) => ({
          id: reaction.id,
          message_id: msg.id,
          user_id: reaction.user_id,
          emoji: reaction.emoji,
          created_at: reaction.created_at,
          user: {
            id: reaction.profiles?.id || reaction.user_id,
            username: reaction.profiles?.username || "User",
            display_name:
              reaction.profiles?.display_name ||
              reaction.profiles?.username ||
              "User",
          },
        })),
      }));

      setMessages(transformedMessages);
    } catch (err) {
      console.error("Error loading messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [roomId, enabled, supabase]);

  // Send message function
  const sendMessage = useCallback(
    async (
      messageData: Omit<IMessage, "id" | "created_at" | "updated_at" | "user">
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("messages").insert({
          room_id: roomId,
          user_id: user.id,
          message_text: messageData.message_text,
          current_season: messageData.current_season, // Updated field name
          current_episode: messageData.current_episode, // Updated field name
          playback_timestamp: messageData.playback_timestamp, // Updated field name
          thread_depth: messageData.thread_depth || 0,
          parent_message_id: messageData.parent_message_id,
          is_deleted: false,
        });

        if (error) throw error;
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [roomId, supabase]
  );

  // Add reaction function
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        await supabase
          .from("reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id);

        const { error } = await supabase.from("reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji,
        });

        if (error) throw error;
      } catch (err) {
        console.error("Error adding reaction:", err);
        throw err;
      }
    },
    [supabase]
  );

  // Remove reaction function
  const removeReaction = useCallback(
    async (reactionId: string) => {
      try {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("id", reactionId);

        if (error) throw error;
      } catch (err) {
        console.error("Error removing reaction:", err);
        throw err;
      }
    },
    [supabase]
  );

  // Set up realtime subscription
  useEffect(() => {
    loadMessages();

    if (!enabled) return;

    // Create realtime channel
    const realtimeChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);

          // Fetch the full message with user data
          const { data, error } = await supabase
            .from("messages")
            .select(
              `
              *,
              profiles!messages_profiles_user_id_fkey(
                id,
                email,
                username,
                display_name,
                avatar_url
              ),
              reactions(
                id,
                emoji,
                created_at,
                user_id,
                profiles!reactions_profiles_user_id_fkey(
                  id,
                  username,
                  display_name,
                  avatar_url
                )
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          console.log({ thenewmessageis: data, error });

          if (!error && data) {
            const newMessage = formMessageFromQueryResponse(data);
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Message updated:", payload);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new, updated_at: payload.new.updated_at }
                : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Message deleted:", payload);
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      // Listen for reaction changes
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
        },
        async (payload) => {
          console.log("Reaction added:", payload);

          // Fetch the full reaction with user data
          const { data, error } = await supabase
            .from("reactions")
            .select(
              `
              *,
              profiles!reactions_profiles_user_id_fkey(
                id,
                username,
                display_name,
                avatar_url
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            const newReaction = {
              id: data.id,
              message_id: data.message_id,
              user_id: data.profiles?.id || "",
              emoji: data.emoji,
              created_at: data.created_at,
              user: {
                id: data.user?.id || "",
                username: data.profiles?.username || "User",
                display_name:
                  data.profiles?.display_name ||
                  data.profiles?.username ||
                  "User",
              },
            };

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.message_id
                  ? {
                      ...msg,
                      reactions: [...(msg.reactions || []), newReaction],
                    }
                  : msg
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "reactions",
        },
        (payload) => {
          console.log("Reaction removed:", payload);
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              reactions:
                msg.reactions?.filter((r) => r.id !== payload.old.id) || [],
            }))
          );
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      realtimeChannel.unsubscribe();
      setChannel(null);
    };
  }, [roomId, enabled, loadMessages, supabase]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    addReaction,
    removeReaction,
    channel,
  };
}
