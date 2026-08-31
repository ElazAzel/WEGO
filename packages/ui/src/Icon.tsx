import { ArrowRight, Check, Clipboard, Heart, X, Share2, Circle, Users, BookOpen, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type IconName = "wego" | "we" | "together" | "story" | "copy" | "share" | "close" | "check" | "arrow-right";

const icons = { wego: Circle, we: Heart, together: Users, story: BookOpen, copy: Clipboard, share: Share2, close: X, check: Check, "arrow-right": ArrowRight, } satisfies Record<IconName, ComponentType<LucideProps>>;

export function Icon({ name, ...props }: LucideProps & { name: IconName }) {
  const Component = icons[name];
  return <Component aria-hidden="true" size={24} strokeWidth={1.5} {...props} />;
}
