import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicEvent = {
  id: string;
  name: string;
  event_type: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  location: string;
  featured: boolean;
  require_id: boolean;
  ticket_types: { id: string; name: string; price: number; quantity: number; sold: number; sort_order: number; sales_start: string | null; sales_end: string | null }[];
};

const SEL =
  "id, name, event_type, description, cover_image_url, event_date, start_time, end_time, venue, location, featured, require_id, ticket_types(id, name, price, quantity, sold, sort_order, sales_start, sales_end)";

export const publicEventsQuery = queryOptions({
  queryKey: ["public-events"],
  queryFn: async () => {
    const { data, error } = await supabase.from("events").select(SEL).eq("status", "published").order("event_date");
    if (error) throw error;
    return (data ?? []) as unknown as PublicEvent[];
  },
});

export const publicEventQuery = (id: string) =>
  queryOptions({
    queryKey: ["public-event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select(SEL).eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const e = data as unknown as PublicEvent;
      e.ticket_types.sort((a, b) => a.sort_order - b.sort_order);
      return e;
    },
  });

export const minPrice = (e: PublicEvent) =>
  e.ticket_types.length ? Math.min(...e.ticket_types.map((t) => Number(t.price))) : 0;
export const remaining = (e: PublicEvent) => e.ticket_types.reduce((s, t) => s + t.quantity - t.sold, 0);
