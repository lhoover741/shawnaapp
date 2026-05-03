import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Calendar, { type AvailabilityMap } from "@/components/Calendar";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface AvailabilityRecord {
  date: string;
  status: "open" | "blocked";
  note: string | null;
}

export default function AvailabilityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability(year, month);
  }, [year, month]);

  async function loadAvailability(y: number, m: number) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/availability?year=${y}&month=${m}`);
      if (res.ok) {
        const data = (await res.json()) as AvailabilityRecord[];
        const map: AvailabilityMap = {};
        for (const r of data) {
          map[r.date] = r.status;
        }
        setAvailability(map);
      }
    } catch {
      // silent fail — calendar still renders without data
    } finally {
      setLoading(false);
    }
  }

  function handleMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  const openDays = Object.values(availability).filter((s) => s === "open").length;

  function handleBook() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/book");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12 + webTopPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Availability</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: "#F9EFF3", borderColor: "#E4C9D5" }]}>
          <Feather name="info" size={14} color="#AC5D7A" />
          <Text style={[styles.infoBannerText, { color: "#7A3050" }]}>
            Green days are confirmed open for bookings. Tap the button below to submit a booking request — a $25 deposit secures your appointment.
          </Text>
        </View>

        {/* Open days callout */}
        {openDays > 0 && (
          <View style={[styles.openCallout, { backgroundColor: "#EEF7E9", borderColor: "#A8D5A2" }]}>
            <Feather name="check-circle" size={15} color="#5C8A40" />
            <Text style={[styles.openCalloutText, { color: "#3A6B28" }]}>
              {openDays} open day{openDays !== 1 ? "s" : ""} available this month
            </Text>
          </View>
        )}

        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Calendar
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            availability={availability}
            loading={loading}
            adminMode={false}
            showLegend
          />
        </View>

        {/* Business hours reminder */}
        <View style={[styles.hoursCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.hoursTitle, { color: colors.foreground }]}>Regular Hours</Text>
          <View style={styles.hoursRow}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.hoursText, { color: colors.mutedForeground }]}>
              Tuesday – Saturday  ·  8:30 AM – 6:00 PM
            </Text>
          </View>
          <View style={styles.hoursRow}>
            <Feather name="x-circle" size={13} color={colors.mutedForeground} />
            <Text style={[styles.hoursText, { color: colors.mutedForeground }]}>
              Sunday & Monday — Closed
            </Text>
          </View>
          <View style={[styles.noteRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={12} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.foreground }]}>
              By appointment only. Slots not shown here may still be available — always text to ask!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky book CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.88 : 1 }]}
          onPress={handleBook}
        >
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.bookBtnText}>Request Appointment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, alignItems: "flex-start" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 17,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  openCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  openCalloutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  calendarCard: {
    margin: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  hoursCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  hoursTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 4 },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hoursText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  noteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#AC5D7A",
    borderRadius: 50,
    paddingVertical: 15,
  },
  bookBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
});
