import { IRoom } from "@/interfaces/room.interface";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateUniqueRoomCode(existingCodes: string[]): string {
  let code = generateRoomCode();
  while (existingCodes.includes(code)) {
    code = generateRoomCode();
  }
  return code;
}

export function getRoomImageUrl(room: IRoom) {
  const content = room.content;

  if (content?.backdrop_path) {
    return `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`;
  }
  if (content?.poster_path) {
    return `https://image.tmdb.org/t/p/w1280${content.poster_path}`;
  }

  return null; // No image available
}

export function getRoomBackgroundStyle(room: IRoom) {
  const gradients: Record<string, string> = {
    movie: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    series: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    horror: "linear-gradient(135deg, #434343 0%, #000000 100%)",
    comedy: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  };

  return {
    background: gradients[room.content?.content_type] || gradients.movie,
  };
}
