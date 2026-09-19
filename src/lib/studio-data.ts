import { supabase } from "@/integrations/supabase/client";
import seamless from "@/assets/setup-seamless.jpg";
import sound from "@/assets/setup-sound.jpg";
import chroma from "@/assets/setup-chroma.jpg";

/** Maps a studio's stored image key to a bundled photo. */
export const studioImages: Record<string, string> = { seamless, sound, chroma };

export function studioImage(key: string | null) {
  return (key && studioImages[key]) || seamless;
}

export type Studio = {
  id: string;
  name: string;
  slug: string;
  description: string;
  equipment: string[];
  hourly_rate: number;
  image_key: string | null;
  capacity: number;
  is_active: boolean;
  sort_order: number;
};

export type Package = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  price: number;
  duration_hours: number;
  includes: string[];
  highlight: boolean;
  is_active: boolean;
  sort_order: number;
};

export const studiosQuery = {
  queryKey: ["studios"],
  queryFn: async (): Promise<Studio[]> => {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Studio[];
  },
};

export const packagesQuery = {
  queryKey: ["packages"],
  queryFn: async (): Promise<Package[]> => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Package[];
  },
};

/** Studio opening hours, used to build the hourly slot grid. */
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 21;

export function slotHours() {
  return Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
}

export function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${suffix}`;
}

export function money(value: number) {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
