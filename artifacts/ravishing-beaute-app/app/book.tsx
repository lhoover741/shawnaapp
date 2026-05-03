import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as Notifications from "expo-notifications";

import Calendar, { type AvailabilityMap } from "@/components/Calendar";
import { SERVICES as SERVICE_DETAILS } from "@/constants/services";
import { useColors } from "@/hooks/useColors";
import { addLocalBooking } from "@/hooks/useMyBookings";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const ADMIN_PIN = "3658";

const TIME_PREFS = [
  { id: "morning",   label: "Morning",   sub: "8am–12pm" },
  { id: "afternoon", label: "Afternoon", sub: "12pm–6pm" },
  { id: "flexible",  label: "Flexible",  sub: "Any time" },
];

interface FormData {
  service: string;
  preferredDate: string | null;
  flexibleDate: boolean;
  timePreference: string;
  addons: string[];
  name: string;
  phone: string;
  notes: string;
}

const INITIAL: FormData = {
  service: "",
  preferredDate: null,
  flexibleDate: false,
  timePreference: "flexible",
  addons: [],
  name: "",
  phone: "",
  notes: "",
};

const BOOKING_SERVICES = [
  { id: "knotless-sm", label: "Small Knotless", sub: "5–7 hrs", price: "$220+" },
  { id: "knotless-md", label: "Medium Knotless", sub: "4–6 hrs", price: "$180+" },
  { id: "knotless-lg", label: "Large Knotless", sub: "6–8 hrs", price: "$260+" },
  { id: "feedin", label: "Feed-In Braids", sub: "2–3 hrs", price: "$85+" },
  { id: "stitch", label: "Stitch Braids", sub: "2–3 hrs", price: "$100+" },
  { id: "bobbraids", label: "Bob Braids", sub: "3–4 hrs", price: "$150+" },
  { id: "ponytail", label: "Braided Ponytail", sub: "1–2 hrs", price: "$80+" },
  { id: "quickweave", label: "Quick Weave", sub: "2–3 hrs", price: "$120+" },
];

export default function BookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // PIN gate state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.getExpoPushTokenAsync()
      .then((t) => setPushToken(t.data))
      .catch(() => {});
  }, []);

  // Hidden admin access — 7 taps on "Sun" header → PIN modal
  const sunTapCount = useRef(0);
  const sunTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSunTap() {
    if (sunTapTimer.current) clearTimeout(sunTapTimer.current);
    sunTapCount.current += 1;
    if (sunTapCount.current >= 7) {
      sunTapCount.current = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setPinInput("");
      setPinError("");
      setPinModalVisible(true);
    } else {
      sunTapTimer.current = setTimeout(() => { sunTapCount.current = 0; }, 2500);
    }
  }

  function handlePinSubmit() {
    if (pinInput === ADMIN_PIN) {
      setPinModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/admin");
    } else {
      setPinError("Incorrect PIN");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinInput("");
    }
  }

  // Calendar state for step 2
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [availLoading, setAvailLoading] = useState(false);

  // Progress bar animation
  const progress = useRef(new Animated.Value(1 / 3)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / 3,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    if (step === 2) loadAvailability(calYear, calMonth);
  }, [step, calYear, calMonth]);

  async function loadAvailability(y: number, m: number) {
    setAvailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/availability?year=${y}&month=${m}`);
      if (res.ok) {
        const data = (await res.json()) as { date: string; status: string }[];
        const map: AvailabilityMap = {};
        for (const r of data) {
          if (r.status === "open" || r.status === "blocked") map[r.date] = r.status;
        }
        setAvailability(map);
      }
    } catch {
      // silent — calendar still usable
    } finally {
      setAvailLoading(false);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!form.service) { Alert.alert("Choose a service", "Please select a service to continue."); return; }
      setStep(2);
    } else if (step === 2) {
      if (!form.flexibleDate && !form.preferredDate) {
        Alert.alert("Pick a date", "Please choose a date or tap 'I'm flexible'.");
        return;
      }
      setStep(3);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.back();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function handleSubmit() {
    if (!form.name.trim()) { Alert.alert("Your name", "Please enter your name."); return; }
    if (!form.phone.trim()) { Alert.alert("Your phone", "Please enter your phone number."); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/booking-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.name.trim(),
          phone: form.phone.trim(),
          service: form.service,
          preferredDate: form.preferredDate,
          flexibleDate: form.flexibleDate,
          timePreference: form.timePreference,
          notes: form.notes.trim() || undefined,
          addons: selectedAddons.length ? selectedAddons.map((addon) => `${addon.name} (+$${addon.price})`).join(", ") : undefined,
          basePrice: selectedServiceObj?.basePrice,
          totalEstimate: (selectedServiceObj?.basePrice ?? 0) + addonsTotal,
          clientPushToken: pushToken ?? undefined,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setConfirmId(data.id ?? null);
      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.id) {
        addLocalBooking({
          id: data.id,
          service: form.service,
          serviceLabel:
            SERVICE_DETAILS.find((s) => s.id === form.service)?.name ?? form.service,
          preferredDate: form.preferredDate,
          submittedAt: new Date().toISOString(),
        });
      }
    } catch (e: unknown) {
      Alert.alert("Oops", e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectDate(date: string) {
    if (availability[date] === "blocked") {
      Alert.alert("Day unavailable", "This day is blocked. Please choose another date.");
      return;
    }
    Haptics.selectionAsync();
    setForm((f) => ({ ...f, preferredDate: date, flexibleDate: false }));
  }

  const selectedServiceObj = SERVICE_DETAILS.find((s) => s.id === form.service);
  const selectedAddons = selectedServiceObj?.addOns.filter((addon) => form.addons.includes(addon.id)) ?? [];
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const selectedDateLabel = form.preferredDate
    ? new Date(form.preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : form.flexibleDate ? "I'm flexible" : null;

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 + webTopPad, borderBottomColor: colors.border }]}>
          <View style={{ width: 34 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Request Sent</Text>
          <View style={{ width: 34 }} />
        </View>
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.successIcon, { backgroundColor: "#EEF7E9" }]}>
            <Feather name="check" size={40} color="#5C8A40" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Request Sent!</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Your request is now <Text style={{ color: colors.primary }}>pending review</Text>. Shawna will text you to confirm.
          </Text>
          {confirmId && (
            <Text style={[styles.confirmId, { color: colors.mutedForeground }]}>Confirmation #{confirmId}</Text>
          )}
          <View style={[styles.statusPill, { backgroundColor: "#FEF9EC", borderColor: "#EDD9A3" }]}>
            <Feather name="clock" size={14} color="#B8860B" />
            <Text style={styles.statusPillText}>Pending review</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SummaryRow icon="message-circle" label="Next step" value="Wait for Shawna's confirmation text" colors={colors} />
            <SummaryRow icon="scissors" label="Service" value={selectedServiceObj?.name ?? form.service} colors={colors} />
            {selectedDateLabel && <SummaryRow icon="calendar" label="Date" value={selectedDateLabel} colors={colors} />}
            <SummaryRow icon="clock" label="Time" value={TIME_PREFS.find((t) => t.id === form.timePreference)?.label ?? form.timePreference} colors={colors} />
            {selectedAddons.length > 0 && <SummaryRow icon="plus-circle" label="Add-ons" value={selectedAddons.map((addon) => addon.name).join(", ")} colors={colors} />}
            <SummaryRow icon="dollar-sign" label="Estimate" value={`$${(selectedServiceObj?.basePrice ?? 0) + addonsTotal}`} colors={colors} />
            <SummaryRow icon="user" label="Name" value={form.name} colors={colors} />
            <SummaryRow icon="phone" label="Phone" value={form.phone} colors={colors} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.backHomeBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.replace("/")}
          >
            <Text style={[styles.backHomeBtnText, { color: colors.foreground }]}>Back to Home</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.textConfirmBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              const msg = `Hi Shawna, I just submitted a booking request (Confirmation #${confirmId ?? ""}). Looking forward to hearing from you!`;
              Linking.openURL(`sms:7085743658?body=${encodeURIComponent(msg)}`);
            }}
          >
            <Feather name="message-circle" size={15} color={colors.primary} />
            <Text style={[styles.textConfirmBtnText, { color: colors.primary }]}>Follow up via text</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={12}>
          <Feather name={step === 1 ? "x" : "arrow-left"} size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", gap: 6 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {step === 1 ? "Choose Service" : step === 2 ? "Date & Time" : "Your Info"}
          </Text>
          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
            />
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>{step}/3</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Service ──────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.foreground }]}>What service?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Select the style you'd like</Text>
            <View style={styles.serviceGrid}>
              {SERVICE_DETAILS.map((s) => {
                const selected = form.service === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? "#F9EFF3" : colors.card },
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setForm((f) => ({ ...f, service: s.id }));
                    }}
                  >
                    <View style={[styles.serviceIconCircle, { backgroundColor: selected ? "#F0DDE5" : colors.muted }]}>
                      <Feather name="scissors" size={16} color={selected ? colors.primary : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.serviceCardLabel, { color: colors.foreground }]} numberOfLines={2}>{s.name}</Text>
                    <Text style={[styles.serviceCardPrice, { color: colors.accent }]}>{s.priceLabel}</Text>
                    <Text style={[styles.serviceCardSub, { color: colors.mutedForeground }]}>{s.duration}</Text>
                    {selected && (
                      <View style={styles.serviceCheckMark}>
                        <Feather name="check-circle" size={16} color={colors.primary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 2: Date & Time ──────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.foreground }]}>When works for you?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Green days are confirmed open. You can pick any Tue–Sat.
            </Text>

            {/* Flexible toggle */}
            <Pressable
              style={({ pressed }) => [
                styles.flexibleChip,
                {
                  backgroundColor: form.flexibleDate ? "#F9EFF3" : colors.muted,
                  borderColor: form.flexibleDate ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setForm((f) => ({ ...f, flexibleDate: !f.flexibleDate, preferredDate: null }));
              }}
            >
              <Feather name={form.flexibleDate ? "check-circle" : "circle"} size={15} color={form.flexibleDate ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.flexibleChipText, { color: form.flexibleDate ? colors.primary : colors.foreground }]}>
                I'm flexible with dates
              </Text>
            </Pressable>

            {/* Calendar */}
            {!form.flexibleDate && (
              <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Calendar
                  year={calYear}
                  month={calMonth}
                  onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
                  availability={availability}
                  loading={availLoading}
                  adminMode={false}
                  selectedDate={form.preferredDate ?? undefined}
                  onSelectDate={handleSelectDate}
                  showLegend={false}
                  onSunLabelPress={handleSunTap}
                />
                {form.preferredDate && (
                  <View style={[styles.selectedDateRow, { borderTopColor: colors.border }]}>
                    <Feather name="check-circle" size={14} color="#5C8A40" />
                    <Text style={[styles.selectedDateText, { color: "#3A6B28" }]}>
                      {new Date(form.preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </Text>
                    <Pressable onPress={() => setForm((f) => ({ ...f, preferredDate: null }))} hitSlop={8}>
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Time preference */}
            <Text style={[styles.timePrefLabel, { color: colors.mutedForeground }]}>TIME PREFERENCE</Text>
            <View style={styles.timePrefRow}>
              {TIME_PREFS.map((t) => {
                const sel = form.timePreference === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.timePrefCard,
                      { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? "#F9EFF3" : colors.card, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setForm((f) => ({ ...f, timePreference: t.id })); }}
                  >
                    <Text style={[styles.timePrefCardLabel, { color: sel ? colors.primary : colors.foreground }]}>{t.label}</Text>
                    <Text style={[styles.timePrefCardSub, { color: colors.mutedForeground }]}>{t.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 3: Your Info ────────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.foreground }]}>Almost there!</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Shawna will text you to confirm the details.
            </Text>

            {/* Booking summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SummaryRow icon="scissors" label="Service" value={selectedServiceObj?.name ?? form.service} colors={colors} />
              {selectedDateLabel && <SummaryRow icon="calendar" label="Date" value={selectedDateLabel} colors={colors} />}
              <SummaryRow icon="clock" label="Time" value={TIME_PREFS.find((t) => t.id === form.timePreference)?.label ?? form.timePreference} colors={colors} />
              {selectedAddons.length > 0 && <SummaryRow icon="plus-circle" label="Add-ons" value={selectedAddons.map((addon) => addon.name).join(", ")} colors={colors} />}
              <SummaryRow icon="dollar-sign" label="Estimate" value={`$${(selectedServiceObj?.basePrice ?? 0) + addonsTotal}`} colors={colors} />
            </View>

            {/* Name */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>YOUR NAME *</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="First & last name"
                placeholderTextColor={colors.mutedForeground}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Phone */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginTop: 14 }]}>PHONE NUMBER *</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="phone" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="(708) 000-0000"
                placeholderTextColor={colors.mutedForeground}
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            {/* Notes */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginTop: 14 }]}>NOTES (optional)</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.inputField, styles.textArea, { color: colors.foreground }]}
                placeholder="Hair length, color, any questions for Shawna…"
                placeholderTextColor={colors.mutedForeground}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Deposit note */}
            <View style={[styles.depositNote, { backgroundColor: "#FDF6EC", borderColor: "#EDD9A3" }]}>
              <Feather name="info" size={13} color="#C4892A" />
              <Text style={[styles.depositNoteText, { color: "#7A5418" }]}>
                A <Text style={{ fontFamily: "Inter_700Bold" }}>$25 deposit</Text> is required to secure your appointment. Shawna will send payment details when confirming.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            step === 3 && submitting && styles.ctaBtnDisabled,
            { opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={step < 3 ? goNext : handleSubmit}
          disabled={submitting}
        >
          {step === 3 && submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaBtnText}>
                {step === 1 ? "Next: Date & Time" : step === 2 ? "Next: Your Info" : "Send Request"}
              </Text>
              <Feather name={step === 3 ? "send" : "arrow-right"} size={17} color="#fff" />
            </>
          )}
        </Pressable>
      </View>

      {/* Hidden admin PIN modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.pinOverlay}>
          <View style={[styles.pinCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.pinIconWrap, { backgroundColor: "#F9EFF3" }]}>
              <Feather name="lock" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.pinTitle, { color: colors.foreground }]}>Enter PIN</Text>
            <TextInput
              style={[styles.pinInput, { borderColor: pinError ? "#C0392B" : colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={pinInput}
              onChangeText={(v) => { setPinInput(v); setPinError(""); }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="• • • •"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              onSubmitEditing={handlePinSubmit}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.pinBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.pinCancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={[styles.pinCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.pinConfirmBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handlePinSubmit}
              >
                <Text style={styles.pinConfirmText}>Unlock</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ icon, label, value, colors }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.summaryRow}>
      <Feather name={icon} size={14} color={colors.mutedForeground} />
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { width: 34, alignItems: "flex-start" },
  headerTitle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 16 },
  stepLabel: { width: 28, textAlign: "right", fontFamily: "Inter_500Medium", fontSize: 12 },
  progressTrack: { width: "100%", height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3, backgroundColor: "#AC5D7A", borderRadius: 2 },

  stepContent: { paddingHorizontal: 16, paddingTop: 22 },
  stepHeading: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 24, marginBottom: 4 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 20 },

  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: {
    width: "48%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    position: "relative",
  },
  serviceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  serviceCardLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 17 },
  serviceCardPrice: { fontFamily: "Inter_700Bold", fontSize: 14 },
  serviceCardSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  serviceCheckMark: { position: "absolute", top: 10, right: 10 },

  flexibleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  flexibleChipText: { fontFamily: "Inter_500Medium", fontSize: 14 },

  calendarCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20 },
  selectedDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  selectedDateText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13 },

  timePrefLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  timePrefRow: { flexDirection: "row", gap: 10 },
  timePrefCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 3,
  },
  timePrefCardLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  timePrefCardSub: { fontFamily: "Inter_400Regular", fontSize: 11 },

  summaryCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 2, marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  summaryLabel: { fontFamily: "Inter_500Medium", fontSize: 12, width: 52 },
  summaryValue: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13 },

  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 12 },
  textAreaWrap: { alignItems: "flex-start", paddingTop: 12, paddingBottom: 8 },
  textArea: { minHeight: 90, paddingVertical: 0, textAlignVertical: "top" },

  depositNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
  },
  depositNoteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#AC5D7A",
    borderRadius: 50,
    paddingVertical: 15,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },

  // Success screen
  successContent: { alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 48, gap: 16 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 30 },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  confirmId: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#B8860B" },
  backHomeBtn: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  backHomeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  textConfirmBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  textConfirmBtnText: { fontFamily: "Inter_500Medium", fontSize: 13 },

  // PIN modal
  pinOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  pinCard: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  pinIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pinTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20 },
  pinInput: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    fontFamily: "Inter_600SemiBold",
  },
  pinError: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#C0392B" },
  pinBtnRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  pinCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
  },
  pinCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  pinConfirmBtn: {
    flex: 1,
    backgroundColor: "#AC5D7A",
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
  },
  pinConfirmText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
});
