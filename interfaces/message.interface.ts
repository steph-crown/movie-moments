// interfaces/message.interface.ts
export interface IMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string;
  season_number?: number | null;
  episode_number?: number | null;
  episode_timestamp?: number | null; // seconds within episode/movie
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
