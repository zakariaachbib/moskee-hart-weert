import { useEffect, useState, useCallback } from "react";

const KEY = "view_as_student";
const EVENT = "view-as-student-changed";

export function useViewAsStudent() {
  const [viewAsStudent, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    const handler = () => setState(localStorage.getItem(KEY) === "1");
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setViewAsStudent = useCallback((v: boolean) => {
    if (v) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { viewAsStudent, setViewAsStudent };
}
