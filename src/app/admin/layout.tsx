import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!isAdmin) {
    redirect("/unauthorized");
  }

  return children;
}
