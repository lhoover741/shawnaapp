import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getLocalBookings,
  updateLocalBookingStatus,
  type LocalBooking,
} from "@/hooks/useMyBookings";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const CASHAPP_HANDLE = "$ravishingbeaute";
const CASHAPP_URL = `https://cash.app/${CASHAPP_HANDLE}`;
const ZELLE_PHONE = "7085743658";
const ZELLE_PHONE_FORMATTED = "(708) 574-3658";

function openCashApp() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Linking.openURL(CASHAPP_URL).catch(() =>
    Alert.alert("Cash App", `Open Cash App and send $25 to ${CASHAPP_HANDLE}`)
  );
}

function openZelle() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Alert.alert(
    "Pay via Zelle",
    `Send $25 to Shawna:\n\n${ZELLE_PHONE_FORMATTED}\n\nOpen your bank app, tap Zelle, and search by phone number.`,
    [
      {
        text: "Open Zelle",
        onPress: () =>
          Linking.openURL("https://www.zellepay.com/").catch(() => {}),
      },
      { text: "Got it", style: "cancel" },
    ]
  );
}

function openApplePay() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const body = encodeURIComponent("Hi Shawna! Sending my $25 deposit 💅");
  Linking.openURL(`sms:+1${ZELLE_PHONE}?body=${body}`).catch(() =>
    Alert.alert(
      "Apple Cash",
      `Open iMessage, text ${ZELLE_PHONE_FORMATTED}, and tap the $ button to send $25 via Apple Cash.`
    )
  );
}

interface LiveBooking extends LocalBooking {
  liveStatus: string;
  updatedAt?: string;
  isNew: boolean;
}

function BookingDetailsCard({
  booking,
  colors,
  onRequestAgain,
}: {
  booking: LiveBooking;
  colors: ReturnType<typeof useColors>;
  onRequestAgain: () => void;
}) {
  const cfg = STATUS_CONFIG[booking.liveStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const dateLabel = booking.preferredDate
    ? new Date(booking.preferredDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Flexible date";

  return (
    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.detailTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>REQUEST STATUS</Text>
          <Text style={[styles.detailStatus, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Feather name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <Text style={[styles.detailDesc, { color: colors.foreground }]}>{cfg.desc}</Text>
      <View style={[styles.detailGrid, { borderTopColor: colors.border }]}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailItemLabel, { color: colors.mutedForeground }]}>Service</Text>
          <Text style={[styles.detailItemValue, { color: colors.foreground }]}>{booking.serviceLabel}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailItemLabel, { color: colors.mutedForeground }]}>Date</Text>
          <Text style={[styles.detailItemValue, { color: colors.foreground }]}>{dateLabel}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailItemLabel, { color: colors.mutedForeground }]}>Submitted</Text>
          <Text style={[styles.detailItemValue, { color: colors.foreground }]} numberOfLines={1}>
            {new Date(booking.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </View>
      </View>
      <View style={[styles.detailExtras, { borderTopColor: colors.border }]}>
        {booking.totalEstimate ? (
          <Text style={[styles.detailExtraText, { color: colors.mutedForeground }]}>
            Estimated total: ${booking.totalEstimate}+
          </Text>
        ) : null}
        {booking.hairColor ? (
          <Text style={[styles.detailExtraText, { color: colors.mutedForeground }]}>
            Hair color: {booking.hairColor}
          </Text>
        ) : null}
        {booking.addons ? (
          <Text style={[styles.detailExtraText, { color: colors.mutedForeground }]}>
            Add-ons: {booking.addons}
          </Text>
        ) : null}
      </View>
      {booking.liveStatus === "confirmed" && (
        <View style={[styles.depositSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.depositLabel, { color: cfg.color }]}>Pay $25 Deposit to Secure Your Spot</Text>
          <View style={styles.payRow}>
            <Pressable style={({ pressed }) => [styles.payBtn, styles.payBtnCashApp, { opacity: pressed ? 0.85 : 1 }]} onPress={openCashApp}>
              <Text style={styles.payBtnDollar}>$</Text>
              <Text style={styles.payBtnText}>Cash App</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.payBtn, styles.payBtnZelle, { opacity: pressed ? 0.85 : 1 }]} onPress={openZelle}>
              <Text style={styles.payBtnZIcon}>Z</Text>
              <Text style={styles.payBtnText}>Zelle</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.payBtn, styles.payBtnApple, { opacity: pressed ? 0.85 : 1 }]} onPress={openApplePay}>
              <Ionicons name="logo-apple" size={13} color="#fff" />
              <Text style={styles.payBtnText}>Pay</Text>
            </Pressable>
          </View>
        </View>
      )}
      {booking.liveStatus === "cancelled" && (
        <Pressable
          style={({ pressed }) => [styles.rebookBtn, { borderColor: cfg.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={onRequestAgain}
        >
          <Feather name="edit-3" size={14} color={cfg.color} />
          <Text style={[styles.rebookBtnText, { color: cfg.color }]}>Request Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const STATUS_CONFIG = {
  pending: {
    color: "#B8860B",
    bg: "#FEF9EC",
    border: "#EDD9A3",
    label: "Pending Review",
    icon: "clock" as const,
    desc: "Shawna will confirm your appointment shortly.",
  },
  confirmed: {
    color: "#3A6B28",
    bg: "#EEF7E9",
    border: "#A8D5A2",
    label: "Confirmed ✓",
    icon: "check-circle" as const,
    desc: "Your appointment is confirmed! A $25 deposit secures your spot.",
  },
  cancelled: {
    color: "#C0392B",
    bg: "#FEECEC",
    border: "#F5B7B1",
    label: "Cancelled",
    icon: "x-circle" as const,
    desc: "This request was cancelled. Reach out to Shawna to reschedule.",
  },
};

export default function MyBookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        const local = await getLocalBookings();

        if (!active) return;
        setBookings(
          local.map((b) => ({ ...b, liveStatus: b.lastSeenStatus, isNew: false }))
        );
        setLoading(false);

        const results = await Promise.allSettled(
          local.map((b) =>
            fetch(`${API_BASE}/api/booking-requests/${b.id}`)
              .then((r) =>
                r.ok
                  ? (r.json() as Promise<{ status: string; updatedAt?: string }>)
                  : null
              )
              .catch(() => null)
          )
        );

        if (!active) return;

        const merged: LiveBooking[] = local.map((b, i) => {
          const res = results[i];
          const live = res?.status === "fulfilled" ? res.value : null;
          const liveStatus = live?.status ?? b.lastSeenStatus;
          return {
            ...b,
            liveStatus,
            updatedAt: live?.updatedAt,
            isNew: liveStatus !== b.lastSeenStatus,
          };
        });

        setBookings(merged);

        for (const item of merged) {
          if (item.isNew) {
            await updateLocalBookingStatus(item.id, item.liveStatus);
          }
        }
      }

      load();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}> 
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12 + webTopPad,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Bookings</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="book-open" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No bookings yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Submit a booking request and track its status right here — no account needed.</Text>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace("/book");
            }}
          >
            <Feather name="edit-3" size={16} color="#fff" />
            <Text style={styles.ctaText}>Request Appointment</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
        >
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>Pull up anytime to check your appointment status.</Text>
          {bookings.map((b) => (
            <View key={b.id}>
              {b.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>UPDATED</Text>
                </View>
              )}
              <BookingDetailsCard
                booking={b}
                colors={colors}
                onRequestAgain={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/book");
                }}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#AC5D7A",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 8,
  },
  ctaText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  sectionNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  card: { borderWidth: 1.5, borderRadius: 16, overflow: "hidden" },
  newBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#AC5D7A",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    zIndex: 1,
  },
  newBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  cardStatus: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 3 },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    paddingRight: 48,
  },
  divider: { height: 1 },
  cardBody: { padding: 14, gap: 4 },
  cardService: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  cardMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  detailCard: { borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 10 },
  detailTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  detailLabel: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1.2 },
  detailStatus: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, marginTop: 2 },
  detailDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  detailGrid: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  detailItem: { gap: 2 },
  detailItemLabel: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.8 },
  detailItemValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  detailExtras: { borderTopWidth: 1, paddingTop: 10, gap: 5 },
  detailExtraText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  rebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: 12,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  rebookBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  depositSection: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  depositLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
  payRow: {
    flexDirection: "row",
    gap: 8,
  },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
  },
  payBtnCashApp: { backgroundColor: "#00C244" },
  payBtnZelle: { backgroundColor: "#6D1ED4" },
  payBtnApple: { backgroundColor: "#1C1C1E" },
  payBtnDollar: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
    lineHeight: 15,
  },
  payBtnZIcon: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
    lineHeight: 15,
  },
  payBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
});