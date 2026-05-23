import type { ReactNode } from "react";

export type InspectorSectionProps = {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  as?: "article" | "div" | "footer" | "section";
};

export function InspectorSection({ children, hover = false, className = "", as: Component = "div" }: InspectorSectionProps) {
  const baseClass = "wvaie-inspector-section";
  const hoverClass = hover ? "wvaie-inspector-section-hover" : "";
  const combinedClass = [baseClass, hoverClass, className].filter(Boolean).join(" ");

  return (
    <Component className={combinedClass}>
      {children}
    </Component>
  );
}
