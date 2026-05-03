import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

import { HAIR_COLORS, SERVICES } from "@/constants/services";
import { useColors } from "@/hooks/useColors";
import { addLocalBooking } from "@/hooks/useMyBookings";
import { scheduleAppointmentReminder } from "@/hooks/useNotifications";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

const REMINDER_OPTIONS = [
  { label: "Tomorrow", ms: 24 * 60 * 60 * 1000 },
  { label: "In 2 days", ms: 2 * 24 * 60 * 60 * 1000 },
  { label: "In 3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "In 1 week", ms: 7 * 24 * 60 * 60 * 1000 },
];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const service = SERVICES.find((s) => s.id === id);

  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderSet, setReminderSet] = useState<string | null>(null);
  const [settingReminder, setSettingReminder] = useState(false);

  if (!service) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Service not found.</Text>
      </View>
    );
  }

  const addOnTotal = service.addOns
    .filter((a) => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const estimatedTotal = service.basePrice + addOnTotal;

  function toggleAddOn(addonId: string) {
    Haptics.selectionAsync();
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  }

  async function handleBook() {
    if (!clientName.trim()) {
      Alert.alert("Your name", "Please enter your name before submitting.");
      return;
    }
    if (!clientPhone.trim()) {
      Alert.alert("Your phone", "Please enter your phone number before submitting.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      let pushToken: string | undefined;
      if (Platform.OS !== "web") {
        try {
          pushToken = (await Notifications.getExpoPushTokenAsync()).data;
        } catch {
          // no push token — not fatal
        }
      }

      const svc = service!;
      const selectedAddonsList = svc.addOns.filter((a) => selectedAddOns.has(a.id));
      const addonsText = selectedAddonsList.length > 0
        ? selectedAddonsList.map((a) => `${a.name} (+$${a.price})`).join(", ")
        : undefined;

      const timePreference = preferredTime
        ? (preferredTime.toLowerCase().includes("am") || parseInt(preferredTime) < 12
            ? "morning" : "afternoon")
        : "flexible";

      const res = await fetch(`${API_BASE}/api/booking-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          phone: clientPhone.trim(),
          service: svc.id,
          preferredDate: preferredDate.trim() || null,
          flexibleDate: !preferredDate.trim(),
          timePreference,
          notes: notes.trim() || undefined,
          hairColor: svc.hairIncluded && hairColor ? hairColor : undefined,
          addons: addonsText,
          basePrice: svc.basePrice,
          totalEstimate: estimatedTotal,
          clientPushToken: pushToken,
        }),
      });

      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to submit request");

      if (data.id) {
        await addLocalBooking({
          id: data.id,
          service: svc.id,
          serviceLabel: svc.name,
          preferredDate: preferredDate.trim() || null,
          submittedAt: new Date().toISOString(),
        });
      }

      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (Platform.OS !== "web") {
        setShowReminderModal(true);
      }
    } catch (e: unknown) {
      Alert.alert("Oops", e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetReminder(label: string, ms: number) {
    setSettingReminder(true);
    const notifId = await scheduleAppointmentReminder(service!.name, ms);
    setSettingReminder(false);
    if (notifId) {
      setReminderSet(label);
    }
    setShowReminderModal(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Custom header */}
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {service.name}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Reminder badge */}
        {reminderSet && (
          <View style={[styles.reminderBadge, { backgroundColor: "#EEF7E9", borderColor: "#A8D5A2" }]}>
            <Feather name="bell" size={13} color="#5C8A40" />
            <Text style={[styles.reminderBadgeText, { color: "#5C8A40" }]}>
              Reminder set for {reminderSet.toLowerCase()}
            </Text>
          </View>
        )}

        {/* Service card */}
        <View style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.serviceCardTop}>
            <View style={{ flex: 1 }}>
              {service.badge && (
                <View style={[styles.badge, { backgroundColor: service.badge.bg }]}>
                  <Text style={[styles.badgeText, { color: service.badge.color }]}>
                    {service.badge.label}
                  </Text>
                </View>
              )}
              <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>
                {service.description}
              </Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={[styles.servicePrice, { color: colors.accent }]}>{service.priceLabel}</Text>
              <Text style={[styles.serviceDuration, { color: colors.mutedForeground }]}>~{service.duration}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {service.hairIncluded ? (
            <View style={styles.noteRow}>
              <Feather name="check-circle" size={14} color="#5C8A40" />
              <Text style={[styles.noteText, { color: "#5C8A40" }]}>
                Braiding hair included — natural colors 1, 1B, 2 & 4
              </Text>
            </View>
          ) : (
            <View style={styles.noteRow}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                Hair not included — please bring your own hair
              </Text>
            </View>
          )}
          <View style={styles.noteRow}>
            <Feather name="dollar-sign" size={14} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.primary }]}>
              $25 non-refundable deposit required to secure your appointment
            </Text>
          </View>
        </View>

        {/* Add-ons */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADD-ONS</Text>
          <View style={[styles.addonsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {service.addOns.map((addon, i) => {
              const selected = selectedAddOns.has(addon.id);
              return (
                <Pressable
                  key={addon.id}
                  onPress={() => toggleAddOn(addon.id)}
                  style={({ pressed }) => [
                    styles.addonRow,
                    i < service.addOns.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selected
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: "transparent", borderColor: colors.border },
                    ]}
                  >
                    {selected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.addonName, { color: colors.foreground }]}>{addon.name}</Text>
                  <Text style={[styles.addonPrice, { color: colors.accent }]}>+${addon.price}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Booking details */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR BOOKING DETAILS</Text>
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InputField
              label="Your Name"
              placeholder="Full name"
              value={clientName}
              onChangeText={setClientName}
              colors={colors}
            />
            <InputField
              label="Your Phone Number"
              placeholder="(XXX) XXX-XXXX"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              colors={colors}
            />
            <InputField
              label="Preferred Date"
              placeholder="e.g. Tuesday, June 10"
              value={preferredDate}
              onChangeText={setPreferredDate}
              colors={colors}
            />
            <InputField
              label="Preferred Time"
              placeholder="e.g. 10:00 AM"
              value={preferredTime}
              onChangeText={setPreferredTime}
              colors={colors}
              isLast={!service.hairIncluded && !true}
            />

            {/* Hair color selector — only for services with hair included */}
            {service.hairIncluded && (
              <View style={[styles.inputBlock, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Hair Color</Text>
                <View style={styles.colorRow}>
                  {HAIR_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setHairColor(c);
                      }}
                      style={({ pressed }) => [
                        styles.colorChip,
                        hairColor === c
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.muted, borderColor: colors.border },
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.colorChipText,
                          { color: hairColor === c ? "#fff" : colors.foreground },
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={[styles.inputBlock, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Notes / Inspiration</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground }]}
                placeholder="Inspo details, hair length preferences, anything Shawna should know…"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Policy reminder */}
        <View style={[styles.policyRow, { backgroundColor: colors.muted, borderColor: colors.border, marginHorizontal: 16 }]}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.policyText, { color: colors.mutedForeground }]}>
            Tue–Sat · 8:30 AM – 6:00 PM · By appointment only · Please arrive detangled
          </Text>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
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
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Estimated Total</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>
            ${estimatedTotal}+
          </Text>
        </View>
        {submitted ? (
          <View style={[styles.bookBtn, { backgroundColor: "#5C8A40", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Request Sent!</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={handleBook}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="send" size={17} color="#fff" />
                <Text style={styles.bookBtnText}>Request Appointment</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Reminder modal — Option 1 */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReminderModal(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIcon, { backgroundColor: "#F9EFF3" }]}>
                <Feather name="bell" size={22} color="#AC5D7A" />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Set an Appointment Reminder
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              We'll remind you about your {service.name} appointment.
            </Text>
            <View style={styles.reminderOptions}>
              {REMINDER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.label}
                  onPress={() => handleSetReminder(opt.label, opt.ms)}
                  disabled={settingReminder}
                  style={({ pressed }) => [
                    styles.reminderOptionBtn,
                    { borderColor: colors.border, backgroundColor: pressed ? colors.muted : colors.background },
                  ]}
                >
                  <Text style={[styles.reminderOptionText, { color: colors.foreground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.modalSkip, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => setShowReminderModal(false)}
            >
              <Text style={[styles.modalSkipText, { color: colors.mutedForeground }]}>
                No thanks
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  colors,
  isLast = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "phone-pad";
  colors: ReturnType<typeof useColors>;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.inputBlock,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 17 },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  serviceCard: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  serviceCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  serviceName: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, marginBottom: 6 },
  serviceDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  priceBlock: { alignItems: "flex-end", gap: 4 },
  servicePrice: { fontFamily: "Inter_700Bold", fontSize: 22 },
  serviceDuration: { fontFamily: "Inter_400Regular", fontSize: 12 },
  divider: { height: 1 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  addonsCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  addonName: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  addonPrice: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  formCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  inputBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  input: { fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 0 },
  textArea: { fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 72, paddingVertical: 0 },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  colorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  colorChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  policyText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  totalAmount: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 24 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 8,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  modalIconRow: { marginBottom: 4 },
  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, textAlign: "center" },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8 },
  reminderOptions: { width: "100%", gap: 10, marginTop: 4 },
  reminderOptionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  reminderOptionText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  modalSkip: { marginTop: 8 },
  modalSkipText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
