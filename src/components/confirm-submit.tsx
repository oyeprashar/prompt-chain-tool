"use client";

import type { MouseEvent, ReactNode } from "react";

export function ConfirmSubmit({
  message,
  children,
  className,
}: {
  message: string;
  children: ReactNode;
  className?: string;
}) {
  function confirmDelete(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <button type="submit" onClick={confirmDelete}
      className={className ?? "text-sm text-rose-300 hover:text-rose-200"}>
      {children}
    </button>
  );
}
