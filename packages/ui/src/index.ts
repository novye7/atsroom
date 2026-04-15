// ─── Types ───
export * from "./types";

// ─── Data Context ───
export { DataContext, useData } from "./data-context";
export type { DataContextType } from "./data-context";

// ─── Hooks ───
export { useClipboard } from "./hooks/use-clipboard";
export { useDarkMode } from "./hooks/use-dark-mode";
export { useIsMobile } from "./hooks/use-mobile";
export {
  useAliasesCollapsed,
  useAliasesCollapseBroadcast,
} from "./hooks/use-aliases-collapsed";

// ─── Utils ───
export { cn, stringToHsl } from "./lib/utils";

// ─── UI Primitives ───
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";

export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps } from "./components/ui/badge";

export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./components/ui/dropdown-menu";

export { DropdownWrapper } from "./components/ui/dropdown-wrapper";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./components/ui/popover";

export { Toaster } from "./components/ui/sonner";

export { EmailAvatar } from "./components/ui/email-avatar";

// ─── Labels ───
export { LabelChip } from "./components/labels/label-chip";
export { LabelPicker } from "./components/labels/label-picker";

// ─── Capsules ───
export { InlineAdd } from "./components/capsules/inline-add";
export { CapsuleCard } from "./components/capsules/capsule-card";
export { CapsuleList } from "./components/capsules/capsule-list";
export { DomainSection } from "./components/capsules/domain-section";

// ─── Layout ───
export { AppShell } from "./components/layout/app-shell";
export { AppNav } from "./components/layout/app-nav";
