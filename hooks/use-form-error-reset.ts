// hooks/useFormErrorReset.ts
import { useState, useEffect } from "react";

export function useFormErrorReset(serverErrors: Record<string, string>) {
  const [clearedFields, setClearedFields] = useState<Set<string>>(new Set());

  const clearFieldError = (fieldName: string) => {
    setClearedFields((prev) => new Set([...prev, fieldName]));
  };

  const resetClearedFields = () => {
    setClearedFields(new Set());
  };

  // Reset when new server errors come in
  useEffect(() => {
    if (Object.keys(serverErrors).length > 0) {
      setClearedFields(new Set());
    }
  }, [serverErrors]);

  // Return filtered errors (hide cleared ones)
  const displayErrors = Object.entries(serverErrors).reduce(
    (acc, [key, value]) => {
      console.log({ has: clearedFields.has(key), key, clearedFields });
      if (!clearedFields.has(key)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  console.log({ clearedFields, serverErrors, displayErrors });

  return {
    displayErrors,
    clearFieldError,
    resetClearedFields,
  };
}
