"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import validator from "validator";

import { createClient } from "@/lib/supabase/server";
import { IFormState } from "@/interfaces/form.interface";

export async function login(
  prevState: IFormState,
  formData: FormData
): Promise<IFormState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation
  const errors: Record<string, string> = {};

  // Email validation
  if (!email) {
    errors.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    errors.email = "Please enter a valid email address";
  }

  // Password validation
  if (!password) {
    errors.password = "Password is required";
  }

  // Return early if validation fails
  if (Object.keys(errors).length > 0) {
    return {
      error: "Please fix the errors below",
      errors,
      success: false,
    };
  }

  // Attempt login
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle different types of auth errors
    let errorMessage = "Invalid email or password";
    const fieldErrors: Record<string, string> = {};

    switch (error.message) {
      case "Email not confirmed":
        errorMessage = "Please verify your email address";
        fieldErrors.email = "Email not verified";
        break;

      default:
        errorMessage = error.message || "Login failed";
    }

    return {
      error: errorMessage,
      errors: fieldErrors,
      success: false,
    };
  }

  // Update last_active in profiles table
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", user.id);
    }
  } catch (profileError) {
    // Don't fail login if profile update fails
    console.error("Failed to update last_active:", profileError);
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      error: error.message || "An error occured signing out",
    };
  }

  revalidatePath("/auth/login", "layout");
  redirect("/auth/login");
}
