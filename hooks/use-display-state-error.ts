import { useEffect } from "react";
import { useToast } from "./use-toast";

export function useDisplayStateError(state: { error: string }) {
  const { showError } = useToast();

  useEffect(() => {
    if (state?.error) {
      showError("An error occured", state.error);
    }
  }, [state, showError]);
}
