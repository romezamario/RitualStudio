import { supabaseAdminRequest } from "@/lib/supabase-admin";

export type PaymentMode = "prod" | "test";

type AppSettingRow = {
  key: string;
  value: string;
  updated_at?: string;
};

const PAYMENT_MODE_KEY = "payments_mode";

export async function getPaymentMode(): Promise<PaymentMode> {
  const { data, error } = await supabaseAdminRequest<AppSettingRow[]>(
    `/rest/v1/app_settings?key=eq.${PAYMENT_MODE_KEY}&select=key,value&limit=1`,
    { method: "GET" },
  );

  if (error || !data?.[0]?.value) {
    return "prod";
  }

  return data[0].value === "test" ? "test" : "prod";
}

export async function setPaymentMode(mode: PaymentMode) {
  const { error } = await supabaseAdminRequest<AppSettingRow[]>("/rest/v1/app_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ key: PAYMENT_MODE_KEY, value: mode }),
  });

  return { error };
}
