import type { Me } from "@/api/me";
import { PHOTO_ACCEPT } from "@/components/photo/use-choose-photo";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type PhotoAvatarInputProps = {
  id: string;
  label: string;
  me: Me;
  onFile: (file: File) => void;
};

// The User's Avatar, large, under a transparent file input of its size: the browser takes an image
// dropped on it, or opens its picker on a click. Named like the button beside it, a label of the
// same input, it keeps the focus, ringed on the Avatar. Emptied after each choice: the same file
// can come again.
export const PhotoAvatarInput = ({ id, label, me, onFile }: PhotoAvatarInputProps) => (
  <div className="relative shrink-0 rounded-[33%] has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
    <UserAvatar
      handle={me.handle ?? me.name}
      image={me.image}
      className="size-20"
      fallbackClassName="bg-surface-2 text-2xl font-extrabold text-caret"
    />
    <input
      id={id}
      aria-label={label}
      type="file"
      accept={PHOTO_ACCEPT}
      className="absolute inset-0 cursor-pointer opacity-0"
      onChange={(event) => {
        const [file] = event.currentTarget.files ?? [];

        event.currentTarget.value = "";

        if (file !== undefined) {
          onFile(file);
        }
      }}
    />
  </div>
);
