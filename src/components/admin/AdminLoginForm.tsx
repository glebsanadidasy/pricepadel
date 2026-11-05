"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/admin/actions";
import { Field, Notice, SubmitButton } from "@/components/ui/Form";

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLogin, undefined);
  return (
    <form action={action} className="space-y-[16px]" aria-label="Admin sign-in">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
