import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-[400px] px-[15px] py-[60px]">
      <h1 className="text-[24px] font-black uppercase text-ink">Admin</h1>
      <div className="mt-[20px]">
        <AdminLoginForm />
      </div>
    </div>
  );
}
