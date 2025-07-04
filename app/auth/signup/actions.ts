"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignUpWithPasswordCredentials } from "@supabase/supabase-js";
import validator from "validator";
import { IFormState } from "@/interfaces/form.interface";

export async function signup(prevState: IFormState, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("name") as string;
  const username = formData.get("username") as string;
  const roomCode = formData.get("roomCode") as string; // Hidden field from form

  // Validation
  const errors: Record<string, string> = {};

  // Email validation
  if (!email) {
    errors.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!password) errors.password = "Password is required";
  if (!displayName) errors.displayName = "Display name is required";
  if (!username) errors.username = "username is required";

  if (password && password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  // username validation
  if (username) {
    if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username =
        "username can only contain letters, numbers, and underscores";
    } else {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (existingProfile) {
        errors.username = "username already taken";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      error: "Please fix the errors in the form",
      success: false,
    };
  }

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data: SignUpWithPasswordCredentials = {
    email: email,
    password: password,
    options: {
      data: {
        display_name: displayName,
        username: username,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return {
      error: error.message || "Invalid email or password",
      errors: {},
      success: false,
    };
  }

  revalidatePath("/rooms", "layout");

  if (roomCode) {
    redirect(`/${roomCode}`);
  } else {
    redirect("/rooms");
  }
}
