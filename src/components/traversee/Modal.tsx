"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./traversee.module.css";

type ModalProps = {
  onClose: () => void;
  label: string;
  children: ReactNode;
  size?: "default" | "large" | "narrow" | "full";
  className?: string;
};

export function Modal({ onClose, label, children, size = "default", className = "" }: ModalProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sizeCls = size === "large" ? styles.boiteLarge : size === "narrow" ? styles.boiteEtroite : size === "full" ? styles.boitePlein : "";

  return (
    <div
      ref={ref}
      className={styles.voile}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className={`${styles.boite} ${sizeCls} ${className}`}>{children}</div>
    </div>
  );
}
