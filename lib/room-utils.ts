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
