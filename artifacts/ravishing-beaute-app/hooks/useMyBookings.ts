import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rb_my_bookings";

export interface LocalBooking {
  id: number;
  service: string;
  serviceLabel: string;
  preferredDate: string | null;
  submittedAt: string;
  hairColor?: string | null;
  addons?: string | null;
  basePrice?: number | null;
  totalEstimate?: number | null;
  lastSeenStatus: string;
}

export async function addLocalBooking(
  booking: Omit<LocalBooking, "lastSeenStatus">
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: LocalBooking[] = raw ? JSON.parse(raw) : [];
    list.unshift({ ...booking, lastSeenStatus: "pending" });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export async function getLocalBookings(): Promise<LocalBooking[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalBooking[]) : [];
  } catch {
    return [];
  }
}

export async function updateLocalBookingStatus(
  id: number,
  status: string
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: LocalBooking[] = raw ? JSON.parse(raw) : [];
    const updated = list.map((b) =>
      b.id === id ? { ...b, lastSeenStatus: status } : b
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function useMyBookingsBadge(): {
  count: number;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const list = await getLocalBookings();
    setCount(list.filter((b) => b.lastSeenStatus === "pending").length);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh };
}
