import { useEffect } from "react";
import { useToast } from "./use-toast";
import { IFormState } from "@/interfaces/form.interface";

export function useDisplayStateError(state: IFormState) {
  const { showError } = useToast();

  useEffect(() => {
    if (state?.error) {
      showError("An error occured", state.error);
    }
  }, [state, showError]);
}
