import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Calendar, { type AvailabilityMap, type DayStatus } from "@/components/Calendar";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const TOKEN_KEY = "rb_admin_token";
const now = new Date();

interface Review {
  id: number; clientName: string; rating: number; body: string; service: string;
  createdAt: string; featured: boolean; approved: boolean;
}

interface BookingRequest {
  id: number; clientName: string; phone: string; service: string; serviceLabel: string;
  preferredDate: string | null; flexibleDate: string; timePreference: string;
  notes: string | null; hairColor: string | null; addons: string | null;
  basePrice: number | null; totalEstimate: number | null;
  status: string; createdAt: string;
}

interface AvailRecord { date: string; status: "open" | "blocked"; note: string | null; }

// ── API helpers ────────────────────────────────────────────────────────────

function getHmacToken(_secret: string, password: string) {
  return fetch(`${API_BASE}/api/admin/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  }).then((r) => r.json()).then((d: { token?: string; error?: string }) => {
    if (!d.token) throw new Error(d.error ?? "Login failed");
    return d.token;
  });
}
async function apiLogin(password: string): Promise<string> { return getHmacToken("", password); }

async function apiVerify(token: string): Promise<boolean> {
  const r = await fetch(`${API_BASE}/api/admin/verify`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok;
}
async function apiGetDeviceCount(token: string): Promise<number> {
  const r = await fetch(`${API_BASE}/api/admin/push/count`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? (((await r.json()) as { count?: number }).count ?? 0) : 0;
}
async function apiSendPush(token: string, title: string, body: string, deep: string) {
  const r = await fetch(`${API_BASE}/api/admin/push`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, body, data: deep ? { path: deep } : undefined }),
  });
  const d = (await r.json()) as { sent?: number; failed?: number; error?: string };
  if (!r.ok) throw new Error(d.error ?? "Send failed");
  return { sent: d.sent ?? 0, failed: d.failed ?? 0 };
}
async function apiGetReviews(token: string): Promise<Review[]> {
  const r = await fetch(`${API_BASE}/api/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? ((await r.json()) as Review[]) : [];
}
async function apiPatchReview(token: string, id: number, patch: { approved?: boolean; featured?: boolean }) {
  await fetch(`${API_BASE}/api/admin/reviews/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
}
async function apiDeleteReview(token: string, id: number) {
  await fetch(`${API_BASE}/api/admin/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
async function apiGetAdminAvailability(token: string, year: number, month: number): Promise<AvailRecord[]> {
  const r = await fetch(`${API_BASE}/api/admin/availability?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? ((await r.json()) as AvailRecord[]) : [];
}
async function apiSetAvailability(token: string, date: string, status: "open" | "blocked") {
  await fetch(`${API_BASE}/api/admin/availability`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date, status }),
  });
}
async function apiClearAvailability(token: string, date: string) {
  await fetch(`${API_BASE}/api/admin/availability/${encodeURIComponent(date)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  });
}
async function apiRegisterAdminDevice(token: string, pushToken: string) {
  try {
    await fetch(`${API_BASE}/api/admin/push/register-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pushToken }),
    });
  } catch {
    // fire-and-forget
  }
}
async function apiGetBookingRequests(token: string): Promise<BookingRequest[]> {
  const r = await fetch(`${API_BASE}/api/admin/booking-requests`, { headers: { Authorization: `Bearer ${token}` } });
  return r.ok ? ((await r.json()) as BookingRequest[]) : [];
}
async function apiPatchBooking(token: string, id: number, status: string) {
  await fetch(`${API_BASE}/api/admin/booking-requests/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather key={s} name="star" size={13} color={s <= rating ? "#D9A96A" : "#E4D3D8"} />
      ))}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: "#FEF9EC", text: "#B8860B", label: "Pending" },
    confirmed: { bg: "#EEF7E9", text: "#3A6B28", label: "Confirmed" },
    cancelled: { bg: "#FEECEC", text: "#C0392B", label: "Cancelled" },
  };
  const cfg = configs[status] ?? configs["pending"]!;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function BookingCard({ booking, onConfirm, onCancel, colors }: {
  booking: BookingRequest; onConfirm?: () => void; onCancel?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const dateLabel = booking.preferredDate
    ? new Date(booking.preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : booking.flexibleDate === "true" ? "Flexible" : "—";
  const timeLabel = ({ morning: "Morning", afternoon: "Afternoon", flexible: "Flexible" } as Record<string, string>)[booking.timePreference] ?? booking.timePreference;

  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.bookingCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookingClientName, { color: colors.foreground }]}>{booking.clientName}</Text>
          <Text style={[styles.bookingService, { color: colors.mutedForeground }]}>{booking.serviceLabel}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>
      <View style={styles.bookingMeta}>
        <View style={styles.bookingMetaItem}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]}>{dateLabel} · {timeLabel}</Text>
        </View>
        <Pressable
          style={styles.bookingMetaItem}
          onPress={() => Linking.openURL(`sms:${booking.phone}`)}
          hitSlop={6}
        >
          <Feather name="phone" size={12} color={colors.primary} />
          <Text style={[styles.bookingMetaText, { color: colors.primary }]}>{booking.phone}</Text>
        </Pressable>
      </View>
      {(booking.hairColor || booking.addons || booking.totalEstimate) ? (
        <View style={[styles.bookingExtras, { borderTopColor: colors.border }]}>
          {booking.totalEstimate ? (
            <View style={styles.bookingMetaItem}>
              <Feather name="dollar-sign" size={12} color={colors.mutedForeground} />
              <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]}>
                Est. ${booking.totalEstimate}+
              </Text>
            </View>
          ) : null}
          {booking.hairColor ? (
            <View style={styles.bookingMetaItem}>
              <Feather name="droplet" size={12} color={colors.mutedForeground} />
              <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]}>
                {booking.hairColor}
              </Text>
            </View>
          ) : null}
          {booking.addons ? (
            <View style={styles.bookingMetaItem}>
              <Feather name="plus-circle" size={12} color={colors.mutedForeground} />
              <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {booking.addons}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {booking.notes ? (
        <Text style={[styles.bookingNotes, { color: colors.mutedForeground }]} numberOfLines={2}>
          "{booking.notes}"
        </Text>
      ) : null}
      {booking.status === "confirmed" && (
        <Pressable
          style={({ pressed }) => [
            styles.reminderBtn,
            { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => {
            const msg = `Hi ${booking.clientName}, this is Shawna from Ravishing Beauté. Just a reminder for your upcoming appointment.`;
            Linking.openURL(`sms:${booking.phone}?body=${encodeURIComponent(msg)}`);
          }}
        >
          <Feather name="message-circle" size={14} color={colors.primary} />
          <Text style={[styles.reminderBtnText, { color: colors.foreground }]}>Send Reminder</Text>
        </Pressable>
      )}
      {(onConfirm || onCancel) && (
        <View style={[styles.bookingActions, { borderTopColor: colors.border }]}>
          {onConfirm && (
            <Pressable onPress={onConfirm} style={({ pressed }) => [styles.actionBtn, styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={styles.approveBtnText}>Confirm</Text>
            </Pressable>
          )}
          {onCancel && (
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="x" size={14} color="#C0392B" />
              <Text style={[styles.rejectBtnText, { color: "#C0392B" }]}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function ReviewCard({ review, onApprove, onReject, onFeature, onDelete, colors }: {
  review: Review; onApprove?: () => void; onReject?: () => void;
  onFeature?: () => void; onDelete?: () => void; colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.body.length > 120;
  const displayBody = expanded || !isLong ? review.body : review.body.slice(0, 120) + "…";
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.reviewCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reviewClientName, { color: colors.foreground }]}>{review.clientName}</Text>
          <Text style={[styles.reviewService, { color: colors.mutedForeground }]}>{review.service}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <StarRow rating={review.rating} />
          {review.featured && (
            <View style={styles.featuredBadge}>
              <Feather name="star" size={9} color="#D9A96A" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>
      </View>
      <Pressable onPress={() => isLong && setExpanded((e) => !e)}>
        <Text style={[styles.reviewBody, { color: colors.foreground }]}>{displayBody}</Text>
        {isLong && <Text style={[styles.reviewReadMore, { color: colors.primary }]}>{expanded ? "Show less" : "Read more"}</Text>}
      </Pressable>
      <View style={[styles.reviewActions, { borderTopColor: colors.border }]}>
        {!review.approved ? (
          <>
            <Pressable onPress={onApprove} style={({ pressed }) => [styles.actionBtn, styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="check" size={14} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text>
            </Pressable>
            <Pressable onPress={onReject} style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="x" size={14} color="#C0392B" /><Text style={[styles.rejectBtnText, { color: "#C0392B" }]}>Reject</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={onFeature} style={({ pressed }) => [styles.actionBtn, review.featured ? styles.unfeatureBtn : styles.featureBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="star" size={14} color={review.featured ? "#D9A96A" : colors.mutedForeground} />
              <Text style={[styles.featureBtnText, { color: review.featured ? "#D9A96A" : colors.mutedForeground }]}>{review.featured ? "Unfeature" : "Feature"}</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="trash-2" size={14} color="#C0392B" /><Text style={[styles.rejectBtnText, { color: "#C0392B" }]}>Delete</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

type TabId = "bookings" | "notifications" | "reviews" | "schedule";

const TABS: { id: TabId; icon: React.ComponentProps<typeof Feather>["name"]; label: string }[] = [
  { id: "bookings",      icon: "book-open",  label: "Bookings"  },
  { id: "notifications", icon: "bell",       label: "Notifs"    },
  { id: "reviews",       icon: "star",       label: "Reviews"   },
  { id: "schedule",      icon: "calendar",   label: "Schedule"  },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("bookings");

  // Notifications
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Schedule
  const [schedYear, setSchedYear] = useState(now.getFullYear());
  const [schedMonth, setSchedMonth] = useState(now.getMonth() + 1);
  const [adminAvailMap, setAdminAvailMap] = useState<AvailabilityMap>({});
  const [availLoading, setAvailLoading] = useState(false);

  const pendingReviews = reviews.filter((r) => !r.approved);
  const approvedReviews = reviews.filter((r) => r.approved);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysRequests = bookings.filter((b) => b.createdAt.slice(0, 10) === todayKey);
  const openDays = Object.values(adminAvailMap).filter((v) => v === "open").length;
  const blockedDays = Object.values(adminAvailMap).filter((v) => v === "blocked").length;

  const loadData = useCallback(async (t: string) => {
    const count = await apiGetDeviceCount(t);
    setDeviceCount(count);
    setBookingsLoading(true);
    try { setBookings(await apiGetBookingRequests(t)); } finally { setBookingsLoading(false); }
  }, []);

  const loadReviews = useCallback(async (t: string) => {
    setReviewsLoading(true);
    try { setReviews(await apiGetReviews(t)); } finally { setReviewsLoading(false); }
  }, []);

  const loadAvailability = useCallback(async (t: string, y: number, m: number) => {
    setAvailLoading(true);
    try {
      const rows = await apiGetAdminAvailability(t, y, m);
      const map: AvailabilityMap = {};
      for (const r of rows) map[r.date] = r.status;
      setAdminAvailMap(map);
    } finally { setAvailLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored && await apiVerify(stored)) {
          setToken(stored);
          loadData(stored);
        } else if (stored) {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      } finally { setChecking(false); }
    })();
  }, [loadData]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "reviews" && reviews.length === 0) loadReviews(token);
    if (activeTab === "schedule") loadAvailability(token, schedYear, schedMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  useEffect(() => {
    if (token && activeTab === "schedule") loadAvailability(token, schedYear, schedMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedYear, schedMonth]);

  async function handleLogin() {
    setLoginError(""); setLoginLoading(true);
    try {
      const t = await apiLogin(password);
      await AsyncStorage.setItem(TOKEN_KEY, t);
      setToken(t); loadData(t); setPassword("");
      if (Platform.OS !== "web") {
        Notifications.getExpoPushTokenAsync()
          .then((pt) => apiRegisterAdminDevice(t, pt.data))
          .catch(() => {});
      }
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : "Login failed");
    } finally { setLoginLoading(false); }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null); setLastResult(null); setReviews([]); setBookings([]); setAdminAvailMap({});
  }

  async function handleSend() {
    if (!token || !pushTitle.trim() || !pushBody.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true); setLastResult(null);
    try {
      const result = await apiSendPush(token, pushTitle.trim(), pushBody.trim(), deepLink.trim());
      setLastResult(result);
      if (result.sent > 0) { setPushTitle(""); setPushBody(""); setDeepLink(""); }
      Alert.alert(result.sent > 0 ? "Sent!" : "Nothing sent",
        `Delivered to ${result.sent} device${result.sent !== 1 ? "s" : ""}${result.failed > 0 ? ` · ${result.failed} failed` : ""}.`);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send");
    } finally { setSending(false); }
  }

  function handleConfirmBooking(id: number) {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" } : b));
    apiPatchBooking(token, id, "confirmed");
  }

  function handleCancelBooking(id: number) {
    if (!token) return;
    Alert.alert("Cancel booking?", "This will mark the request as cancelled.", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel Booking", style: "destructive", onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
        apiPatchBooking(token, id, "cancelled");
      }},
    ]);
  }

  async function handleApprove(id: number) {
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, approved: true } : r));
    await apiPatchReview(token, id, { approved: true });
  }

  function handleReject(id: number) {
    if (!token) return;
    Alert.alert("Delete review?", "This will permanently remove the review.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setReviews((prev) => prev.filter((r) => r.id !== id));
        await apiDeleteReview(token, id);
      }},
    ]);
  }

  async function handleToggleFeature(review: Review) {
    if (!token) return;
    Haptics.selectionAsync();
    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, featured: !r.featured } : r));
    await apiPatchReview(token, review.id, { featured: !review.featured });
  }

  function handleDeleteReview(id: number) {
    if (!token) return;
    Alert.alert("Delete review?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setReviews((prev) => prev.filter((r) => r.id !== id));
        await apiDeleteReview(token, id);
      }},
    ]);
  }

  function handleDayPress(date: string, currentStatus: DayStatus | undefined) {
    if (!token) return;
    const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const options: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [];
    if (currentStatus !== "open") options.push({ text: "Mark as Open", onPress: async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAdminAvailMap((prev) => ({ ...prev, [date]: "open" }));
      await apiSetAvailability(token, date, "open");
    }});
    if (currentStatus !== "blocked") options.push({ text: "Mark as Blocked", onPress: async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAdminAvailMap((prev) => ({ ...prev, [date]: "blocked" }));
      await apiSetAvailability(token, date, "blocked");
    }});
    if (currentStatus) options.push({ text: "Clear", style: "destructive", onPress: async () => {
      Haptics.selectionAsync();
      setAdminAvailMap((prev) => { const n = { ...prev }; delete n[date]; return n; });
      await apiClearAvailability(token, date);
    }});
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(dateLabel, currentStatus ? `Currently: ${currentStatus}` : "No status set", options);
  }

  if (checking) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Shawna's Portal</Text>
        {token ? (
          <Pressable onPress={handleLogout} hitSlop={10}><Feather name="log-out" size={18} color={colors.mutedForeground} /></Pressable>
        ) : <View style={{ width: 22 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 8 }} keyboardShouldPersistTaps="handled">
        {!token ? (
          /* ── Login ── */
          <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.lockIcon}><Feather name="lock" size={28} color={colors.primary} /></View>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>Admin Access</Text>
            <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>Manage bookings, notifications, reviews & schedule</Text>
            <TextInput
              style={[styles.loginInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="Admin password" placeholderTextColor={colors.mutedForeground}
              value={password} onChangeText={setPassword} secureTextEntry returnKeyType="done"
              onSubmitEditing={handleLogin} autoCapitalize="none"
            />
            {loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}
            <Pressable style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleLogin} disabled={loginLoading || !password}>
              {loginLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={[styles.statsRow, { marginHorizontal: 16, marginBottom: 16 }]}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="smartphone" size={17} color={colors.primary} />
                <Text style={[styles.statNum, { color: colors.foreground }]}>{deviceCount === null ? "—" : deviceCount}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Devices</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: pendingBookings.length > 0 ? "#FEF9EC" : colors.card, borderColor: pendingBookings.length > 0 ? "#EDD9A3" : colors.border }]}>
                <Feather name="book-open" size={17} color={pendingBookings.length > 0 ? "#B8860B" : colors.mutedForeground} />
                <Text style={[styles.statNum, { color: pendingBookings.length > 0 ? "#7A5418" : colors.foreground }]}>{pendingBookings.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Requests</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="bell" size={17} color="#D9A96A" />
                <Text style={[styles.statNum, { color: colors.foreground }]}>{lastResult ? lastResult.sent : "—"}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Last push</Text>
              </View>
            </View>

            <View style={[styles.summaryStrip, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 18 }]}>
              <Text style={[styles.summaryStripText, { color: colors.foreground }]}>
                {pendingBookings.length} booking request{pendingBookings.length === 1 ? "" : "s"} waiting
              </Text>
              <Text style={[styles.summaryStripSub, { color: colors.mutedForeground }]}>
                {confirmedBookings.length} confirmed · {cancelledBookings.length} cancelled · {todaysRequests.length} today · {openDays} open / {blockedDays} blocked
              </Text>
            </View>

            {/* ── Tabs ── */}
            <View style={[styles.tabRow, { marginHorizontal: 16, marginBottom: 20, borderColor: colors.border, backgroundColor: colors.muted }]}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                const hasBadge = (tab.id === "reviews" && pendingReviews.length > 0) || (tab.id === "bookings" && pendingBookings.length > 0);
                const badgeCount = tab.id === "reviews" ? pendingReviews.length : tab.id === "bookings" ? pendingBookings.length : 0;
                return (
                  <Pressable key={tab.id} onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                    style={[styles.tabBtn, active && [styles.tabBtnActive, { backgroundColor: colors.card }]]}>
                    <View style={{ position: "relative" }}>
                      <Feather name={tab.icon} size={16} color={active ? colors.primary : colors.mutedForeground} />
                      {hasBadge && (
                        <View style={styles.tabDot}><Text style={styles.tabDotText}>{badgeCount}</Text></View>
                      )}
                    </View>
                    <Text style={[styles.tabBtnText, { color: active ? colors.foreground : colors.mutedForeground }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Bookings tab ── */}
            {activeTab === "bookings" && (
              <View style={{ paddingHorizontal: 16 }}>
                {bookingsLoading ? (
                  <View style={styles.centeredLoading}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text></View>
                ) : (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PENDING ({pendingBookings.length})</Text>
                    {pendingBookings.length === 0 ? (
                      <View style={[styles.emptyState, { borderColor: colors.border, marginBottom: 20 }]}>
                        <Feather name="check-circle" size={24} color={colors.border} />
                        <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>No pending requests</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12, marginBottom: 24 }}>
                        {pendingBookings.map((b) => (
                          <BookingCard key={b.id} booking={b} colors={colors}
                            onConfirm={() => handleConfirmBooking(b.id)} onCancel={() => handleCancelBooking(b.id)} />
                        ))}
                      </View>
                    )}

                    {confirmedBookings.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONFIRMED ({confirmedBookings.length})</Text>
                        <View style={{ gap: 12, marginBottom: 24 }}>
                          {confirmedBookings.map((b) => (
                            <BookingCard key={b.id} booking={b} colors={colors} onCancel={() => handleCancelBooking(b.id)} />
                          ))}
                        </View>
                      </>
                    )}

                    {cancelledBookings.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CANCELLED ({cancelledBookings.length})</Text>
                        <View style={{ gap: 12, marginBottom: 16 }}>
                          {cancelledBookings.map((b) => (
                            <BookingCard key={b.id} booking={b} colors={colors} />
                          ))}
                        </View>
                      </>
                    )}

                    {bookings.length === 0 && (
                      <View style={[styles.emptyState, { borderColor: colors.border }]}>
                        <Feather name="book-open" size={28} color={colors.border} />
                        <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>No booking requests yet</Text>
                        <Text style={[styles.emptyStateSub, { color: colors.mutedForeground }]}>Client requests submitted through the app appear here</Text>
                      </View>
                    )}

                    <Pressable style={({ pressed }) => [styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => token && loadData(token)}>
                      <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.refreshBtnText, { color: colors.mutedForeground }]}>Refresh</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {/* ── Notifications tab ── */}
            {activeTab === "notifications" && (
              <View style={{ paddingHorizontal: 16 }}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SEND NOTIFICATION</Text>
                <View style={[styles.composeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.composeRow}>
                    <Text style={[styles.composeFieldLabel, { color: colors.mutedForeground }]}>Title</Text>
                    <TextInput style={[styles.composeInput, { color: colors.foreground }]} placeholder="e.g. Limited Slots This Week!" placeholderTextColor={colors.mutedForeground} value={pushTitle} onChangeText={setPushTitle} returnKeyType="next" />
                  </View>
                  <View style={[styles.composeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.composeRow}>
                    <Text style={[styles.composeFieldLabel, { color: colors.mutedForeground }]}>Message</Text>
                    <TextInput style={[styles.composeInput, styles.composeTextArea, { color: colors.foreground }]} placeholder="e.g. Book now — only 3 spots left this Saturday! 💅" placeholderTextColor={colors.mutedForeground} value={pushBody} onChangeText={setPushBody} multiline numberOfLines={3} textAlignVertical="top" />
                  </View>
                  <View style={[styles.composeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.composeRow}>
                    <Text style={[styles.composeFieldLabel, { color: colors.mutedForeground }]}>Deep link</Text>
                    <TextInput style={[styles.composeInput, { color: colors.foreground }]} placeholder="optional — e.g. /services" placeholderTextColor={colors.mutedForeground} value={deepLink} onChangeText={setDeepLink} autoCapitalize="none" returnKeyType="done" />
                  </View>
                </View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>QUICK TEMPLATES</Text>
                <View style={styles.presetsRow}>
                  {[
                    { title: "Open slots!", body: "I have openings this week — DM or tap to book your appointment 💅" },
                    { title: "New availability", body: "Some new slots just opened up! Book before they're gone ✨" },
                    { title: "Prep reminder", body: "Reminder: come to your appointment detangled & with clean hair 🙏" },
                  ].map((p) => (
                    <Pressable key={p.title} style={({ pressed }) => [styles.presetChip, { backgroundColor: colors.muted, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]} onPress={() => { setPushTitle(p.title); setPushBody(p.body); }}>
                      <Text style={[styles.presetText, { color: colors.foreground }]}>{p.title}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={({ pressed }) => [styles.sendBtn, (!pushTitle.trim() || !pushBody.trim() || sending) && styles.sendBtnDisabled, { opacity: pressed ? 0.88 : 1 }]} onPress={handleSend} disabled={!pushTitle.trim() || !pushBody.trim() || sending}>
                  {sending ? <ActivityIndicator color="#fff" size="small" /> : (
                    <><Feather name="send" size={17} color="#fff" /><Text style={styles.sendBtnText}>Send to All {deviceCount != null && deviceCount > 0 ? `(${deviceCount})` : "Devices"}</Text></>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Reviews tab ── */}
            {activeTab === "reviews" && (
              <View style={{ paddingHorizontal: 16 }}>
                {reviewsLoading ? (
                  <View style={styles.centeredLoading}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading reviews…</Text></View>
                ) : (
                  <>
                    {pendingReviews.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NEEDS REVIEW ({pendingReviews.length})</Text>
                        <View style={{ gap: 12, marginBottom: 24 }}>
                          {pendingReviews.map((r) => <ReviewCard key={r.id} review={r} colors={colors} onApprove={() => handleApprove(r.id)} onReject={() => handleReject(r.id)} />)}
                        </View>
                      </>
                    )}
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPROVED ({approvedReviews.length})</Text>
                    {approvedReviews.length === 0 ? (
                      <View style={[styles.emptyState, { borderColor: colors.border }]}>
                        <Feather name="star" size={24} color={colors.border} />
                        <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>No approved reviews yet</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {approvedReviews.map((r) => <ReviewCard key={r.id} review={r} colors={colors} onFeature={() => handleToggleFeature(r)} onDelete={() => handleDeleteReview(r.id)} />)}
                      </View>
                    )}
                    <Pressable style={({ pressed }) => [styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1, marginTop: 16 }]} onPress={() => token && loadReviews(token)}>
                      <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.refreshBtnText, { color: colors.mutedForeground }]}>Refresh</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {/* ── Schedule tab ── */}
            {activeTab === "schedule" && (
              <View style={{ paddingHorizontal: 16 }}>
                <View style={[styles.schedHintCard, { backgroundColor: "#F9EFF3", borderColor: "#E4C9D5" }]}>
                  <Feather name="info" size={13} color="#AC5D7A" />
                  <Text style={[styles.schedHintText, { color: "#7A3050" }]}>Tap any future day to mark it open or blocked. Clients see open days on the Availability screen.</Text>
                </View>
                <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Calendar year={schedYear} month={schedMonth} onMonthChange={(y, m) => { setSchedYear(y); setSchedMonth(m); }}
                    availability={adminAvailMap} loading={availLoading} adminMode onDayPress={handleDayPress} showLegend />
                </View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
                <View style={styles.quickActionsRow}>
                  {[
                    { label: "This Sat open", daysAhead: (6 - now.getDay() + 7) % 7 || 7 },
                    { label: "Next Sat open", daysAhead: ((6 - now.getDay() + 7) % 7 || 7) + 7 },
                  ].map((qa) => {
                    const d = new Date(); d.setDate(d.getDate() + qa.daysAhead);
                    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    return (
                      <Pressable key={qa.label} style={({ pressed }) => [styles.quickActionBtn, { backgroundColor: "#EEF7E9", borderColor: "#A8D5A2", opacity: pressed ? 0.7 : 1 }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAdminAvailMap((p) => ({ ...p, [ds]: "open" })); if (token) apiSetAvailability(token, ds, "open"); }}>
                        <Feather name="check-circle" size={14} color="#5C8A40" />
                        <Text style={[styles.quickActionText, { color: "#3A6B28" }]}>{qa.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable style={({ pressed }) => [styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1, marginTop: 12 }]} onPress={() => token && loadAvailability(token, schedYear, schedMonth)}>
                  <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.refreshBtnText, { color: colors.mutedForeground }]}>Refresh</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 34, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 17 },

  loginCard: { margin: 32, borderWidth: 1, borderRadius: 20, padding: 28, alignItems: "center", gap: 12 },
  lockIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F9EFF3", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  loginTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  loginSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  loginInput: { width: "100%", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15, marginTop: 4 },
  loginError: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#C0392B" },
  loginBtn: { width: "100%", backgroundColor: "#AC5D7A", borderRadius: 50, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 3 },
  statNum: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },

  tabRow: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 9, gap: 3 },
  tabBtnActive: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  tabDot: { position: "absolute", top: -4, right: -6, backgroundColor: "#AC5D7A", borderRadius: 8, minWidth: 15, height: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  tabDotText: { fontFamily: "Inter_700Bold", fontSize: 8, color: "#fff" },

  sectionLabel: { fontSize: 10, letterSpacing: 2, fontFamily: "Inter_600SemiBold", marginBottom: 10 },

  bookingCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  bookingCardHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, paddingBottom: 8, gap: 8 },
  bookingClientName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  bookingService: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  bookingMeta: { paddingHorizontal: 14, paddingBottom: 8, gap: 5 },
  bookingMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  bookingMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  bookingExtras: { paddingHorizontal: 14, paddingVertical: 8, gap: 5, borderTopWidth: 1 },
  bookingNotes: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, paddingHorizontal: 14, paddingBottom: 10, fontStyle: "italic" },
  reminderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 14, marginBottom: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  reminderBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  bookingActions: { flexDirection: "row", borderTopWidth: 1, padding: 10, gap: 8 },
  summaryStrip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryStripText: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 16 },
  summaryStripSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },

  reviewCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  reviewCardHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, paddingBottom: 10, gap: 8 },
  reviewClientName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  reviewService: { fontFamily: "Inter_400Regular", fontSize: 12 },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FDF6EC", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  featuredBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#D9A96A" },
  reviewBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, paddingHorizontal: 14, paddingBottom: 10 },
  reviewReadMore: { fontFamily: "Inter_500Medium", fontSize: 12, paddingHorizontal: 14, marginBottom: 8 },
  reviewActions: { flexDirection: "row", borderTopWidth: 1, padding: 10, gap: 8 },

  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 9 },
  approveBtn: { backgroundColor: "#5C8A40" },
  approveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  rejectBtn: { borderWidth: 1, backgroundColor: "transparent" },
  rejectBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  featureBtn: { borderWidth: 1, backgroundColor: "transparent" },
  unfeatureBtn: { borderWidth: 1, backgroundColor: "#FDF6EC" },
  featureBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

  composeCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  composeRow: { paddingHorizontal: 16, paddingVertical: 14 },
  composeDivider: { height: 1 },
  composeFieldLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  composeInput: { fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 0 },
  composeTextArea: { minHeight: 72, textAlignVertical: "top" },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  presetText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#AC5D7A", borderRadius: 50, paddingVertical: 15 },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },

  centeredLoading: { alignItems: "center", gap: 10, paddingVertical: 40 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 36, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, marginBottom: 16 },
  emptyStateText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  emptyStateSub: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  refreshBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 50, paddingVertical: 10 },
  refreshBtnText: { fontFamily: "Inter_400Regular", fontSize: 13 },

  schedHintCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  schedHintText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  calendarCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  quickActionsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  quickActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  quickActionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
