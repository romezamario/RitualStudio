import { supabaseAdminRequest } from "@/lib/supabase-admin";

const DELIVERY_CALENDAR_RANGE_DAYS_KEY = "delivery_calendar_range_days";
const DEFAULT_DELIVERY_CALENDAR_RANGE_DAYS = 14;
const MIN_DELIVERY_CALENDAR_RANGE_DAYS = 7;
const MAX_DELIVERY_CALENDAR_RANGE_DAYS = 60;

type AppSettingRow = {
  key: string;
  value: string;
};

function normalizeDeliveryCalendarRangeDays(rawValue: string | null | undefined) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_DELIVERY_CALENDAR_RANGE_DAYS;
  }

  const rounded = Math.trunc(parsed);
  return Math.min(MAX_DELIVERY_CALENDAR_RANGE_DAYS, Math.max(MIN_DELIVERY_CALENDAR_RANGE_DAYS, rounded));
}

export async function getDeliveryCalendarRangeDays() {
  const { data, error } = await supabaseAdminRequest<AppSettingRow[]>(
    `/rest/v1/app_settings?key=eq.${DELIVERY_CALENDAR_RANGE_DAYS_KEY}&select=key,value&limit=1`,
    { method: "GET" },
  );

  if (error) {
    return DEFAULT_DELIVERY_CALENDAR_RANGE_DAYS;
  }

  return normalizeDeliveryCalendarRangeDays(data?.[0]?.value);
}

export async function setDeliveryCalendarRangeDays(days: number) {
  const normalized = normalizeDeliveryCalendarRangeDays(String(days));

  const { error } = await supabaseAdminRequest<AppSettingRow[]>("/rest/v1/app_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ key: DELIVERY_CALENDAR_RANGE_DAYS_KEY, value: String(normalized) }),
  });

  return { error, days: normalized };
}

export {
  DEFAULT_DELIVERY_CALENDAR_RANGE_DAYS,
  DELIVERY_CALENDAR_RANGE_DAYS_KEY,
  MAX_DELIVERY_CALENDAR_RANGE_DAYS,
  MIN_DELIVERY_CALENDAR_RANGE_DAYS,
};
