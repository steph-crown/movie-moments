// interfaces/message.interface.ts
export interface IMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string;
  current_season?: string | null; // Changed: Now string for encoded season data
  current_episode?: number | null; // Changed: Renamed from episode_number
  playback_timestamp?: string | null; // Changed: Now string for time format like "1:23:45"
  thread_depth: number; // 0 for top-level, 1+ for replies
  parent_message_id?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  reactions?: IMessageReaction[];
}

export interface IMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
  };
}
