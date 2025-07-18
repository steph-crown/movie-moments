import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function UserAvatar() {
  const { user, userProfile } = useAuth();

  const avatarUrl = userProfile?.avatar_url || "";
  const displayName =
    userProfile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    "User";

  return (
    <Avatar className="h-8 w-8 rounded-lg border border-solid border-border">
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback className="rounded-lg">
        {displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
