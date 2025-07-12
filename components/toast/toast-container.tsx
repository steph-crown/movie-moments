"use client";

import { useToast } from "@/hooks/use-toast";
import { Toast } from "./toast";

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  console.log({ trending: toasts });

  return (
    <div className="fixed right-4 top-4 z-50  w-[calc(100%_-_2rem)] max-w-sm space-y-3 flex justify-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
