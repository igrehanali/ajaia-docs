"use client";

import { useState } from "react";
import type { User } from "@/lib/auth";

/** Round user photo; falls back to a coloured initial if the image is missing or fails. */
export default function Avatar({ user, size = 32 }: { user: Pick<User, "name" | "color" | "avatar">; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, background: user.color, fontSize: size * 0.42 };
  if (user.avatar && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote avatars, no optimisation needed
      <img
        src={user.avatar}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover ring-2 ring-white"
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
      style={style}
    >
      {user.name[0]}
    </span>
  );
}
