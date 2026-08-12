import { createServerFn } from "@tanstack/react-start";

const DEMO = [
  { email: "admin@carepriority.local", password: "Admin@123", role: "admin", full_name: "Demo Administrator", job_title: "Administrator" },
  { email: "doctor@carepriority.local", password: "Doctor@123", role: "doctor", full_name: "Demo Doctor", job_title: "Physician" },
  { email: "reception@carepriority.local", password: "Reception@123", role: "receptionist", full_name: "Demo Receptionist", job_title: "Front Desk" },
];

export const seedDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: string[] = [];
  for (const u of DEMO) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, job_title: u.job_title, role: u.role },
    });
    let userId = data?.user?.id ?? null;
    if (error) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users.find((x) => x.email === u.email);
      userId = found?.id ?? null;
      if (userId) await supabaseAdmin.auth.admin.updateUserById(userId, { password: u.password, email_confirm: true });
      out.push(`${u.email}: existed (${error.message})`);
    } else out.push(`${u.email}: created`);
    if (userId) {
      await supabaseAdmin.from("profiles").upsert({ id: userId, full_name: u.full_name, job_title: u.job_title });
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role as never });
    }
  }
  return { out };
});
