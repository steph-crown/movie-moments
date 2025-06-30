export interface IFormState {
  error: string;

  // error per key
  errors: Record<string, string>;

  success: boolean;
}
