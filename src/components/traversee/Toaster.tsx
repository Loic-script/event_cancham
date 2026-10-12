"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./traversee.module.css";

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail);
      setOn(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOn(false), 2800);
    };
    window.addEventListener("traversee:toast", onToast);
    return () => {
      window.removeEventListener("traversee:toast", onToast);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <p role="status" aria-live="polite" className={`${styles.toast} ${on ? styles.toastOn : ""}`}>
      {message}
    </p>
  );
}
