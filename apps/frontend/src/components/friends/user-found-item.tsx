import type { UserFound } from "@/api/user-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";

type UserFoundItemProps = {
  user: UserFound;
};

// A User found by their Handle: their avatar and their Handle, nothing else of them.
export const UserFoundItem = ({ user }: UserFoundItemProps) => (
  <li className="flex items-center gap-3 px-3 py-2">
    <Avatar size="sm">
      {user.image ? <AvatarImage src={user.image} alt="" /> : null}
      <AvatarFallback>{initials(user.handle)}</AvatarFallback>
    </Avatar>
    <span className="truncate">{atHandle(user.handle)}</span>
  </li>
);
