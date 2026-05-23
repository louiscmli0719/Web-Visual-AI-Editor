import type { ReactNode } from "react";

export type StatusBadgeProps = {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  ariaLabel?: string;
};

export function StatusBadge({ children, variant = "primary", onClick, ariaLabel }: StatusBadgeProps) {
  const baseClass = "wvaie-status-badge";
  const variantClass = `wvaie-status-badge-${variant}`;
  const clickableClass = onClick ? "wvaie-status-badge-clickable" : "";
  const combinedClass = [baseClass, variantClass, clickableClass].filter(Boolean).join(" ");

  if (onClick) {
    return (
      <button aria-label={ariaLabel} className={combinedClass} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return (
    <span className={combinedClass}>
      {children}
    </span>
  );
}
