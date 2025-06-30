"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignUpWithPasswordCredentials } from "@supabase/supabase-js";

export async function signup(
  prevState: Record<string, string>,
  formData: FormData
) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data: SignUpWithPasswordCredentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        display_name: formData.get("name"),
        username: formData.get("userName"),
      },
    },
  };
  console.log({ poorrr: data });

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return {
      error: error.message || "Invalid email or password",
    };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
