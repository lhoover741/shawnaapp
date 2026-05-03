import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type CheckItem = { id: string; text: string; note?: string };
type Section = {
  title: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  bg: string;
  items: CheckItem[];
};

const SECTIONS: Section[] = [
  {
    title: "Hair Prep",
    icon: "wind",
    color: "#5C6F2E",
    bg: "#EEF5DF",
    items: [
      {
        id: "detangle",
        text: "Come with your hair fully detangled",
        note: "This is required. Shawna does not detangle during appointments — arriving unprepared can delay your session.",
      },
      {
        id: "wash",
        text: "Wash your hair 1–2 days before (not same day)",
        note: "Freshly washed hair can be harder to braid. Aim to wash 1–2 days prior so hair is clean but settled.",
      },
      {
        id: "dry",
        text: "Make sure your hair is fully dry",
        note: "Damp or wet hair cannot be braided. Blow dry completely if needed.",
      },
      {
        id: "stretched",
        text: "Stretch out your natural hair if possible",
        note: "Blow-dried or banded hair makes braiding easier and faster.",
      },
      {
        id: "products",
        text: "Avoid heavy product buildup",
        note: "Minimal product in the hair is best — no heavy oils or butters applied right before your appointment.",
      },
    ],
  },
  {
    title: "What to Bring",
    icon: "briefcase",
    color: "#7A3D6E",
    bg: "#F8E8F4",
    items: [
      {
        id: "deposit",
        text: "Have your $25 deposit ready",
        note: "Your appointment is not confirmed until the deposit is received.",
      },
      {
        id: "hair",
        text: "Bring your own hair if it's not included in your service",
        note: "Braiding hair is included for braid services in natural colors 1, 1B, 2, and 4 only. Check your service details.",
      },
      {
        id: "inspo",
        text: "Bring inspiration photos",
        note: "A clear photo helps Shawna understand exactly what you want. Screenshots from Instagram or Pinterest work great.",
      },
      {
        id: "accessories",
        text: "Bring any accessories you'd like added (beads, cuffs, etc.)",
        note: "If you have specific accessories you want, bring them. An accessories add-on is also available.",
      },
    ],
  },
  {
    title: "Day-Of Comfort",
    icon: "sun",
    color: "#7A5C1E",
    bg: "#FBF3DF",
    items: [
      {
        id: "eat",
        text: "Eat a good meal before your appointment",
        note: "Braid sessions can be 3–7 hours. Arrive fed so you're comfortable throughout.",
      },
      {
        id: "clothes",
        text: "Wear comfortable, loose clothing",
        note: "A button-down or zip-up is ideal so you don't disturb your hair when changing after.",
      },
      {
        id: "ontime",
        text: "Plan to arrive on time",
        note: "Late arrivals affect other clients. Text Shawna if you're running behind.",
      },
      {
        id: "phone",
        text: "Bring a charger or something to pass the time",
        note: "You'll be sitting for a while — a fully charged phone or earbuds go a long way.",
      },
    ],
  },
  {
    title: "Booking Reminders",
    icon: "check-circle",
    color: "#1A5276",
    bg: "#E8F4FD",
    items: [
      {
        id: "confirm",
        text: "Make sure your appointment is confirmed",
        note: "Do not come without a confirmed appointment and deposit. Shawna is by appointment only.",
      },
      {
        id: "address",
        text: "Wait for the address to be shared",
        note: "The exact address is only shared after your deposit is confirmed.",
      },
      {
        id: "style",
        text: "Know what service and style you want",
        note: "Use the Services tab to browse and select — the booking text will include everything Shawna needs.",
      },
      {
        id: "sameday",
        text: "Same-day bookings require prior approval",
        note: "Text Shawna early if you'd like a same-day appointment — it's not guaranteed.",
      },
    ],
  },
];

export default function PrepScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    Haptics.selectionAsync();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalItems = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const checkedCount = checked.size;
  const allDone = checkedCount === totalItems;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Appointment Prep</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress bar */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressTop}>
            <Text style={[styles.progressLabel, { color: colors.foreground }]}>
              {allDone ? "You're all set! 🎉" : "Your pre-appointment checklist"}
            </Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {checkedCount}/{totalItems}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round((checkedCount / totalItems) * 100)}%`,
                  backgroundColor: allDone ? "#5C8A40" : colors.primary,
                },
              ]}
            />
          </View>
          {!allDone && (
            <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
              Tap each item to check it off before your appointment.
            </Text>
          )}
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: section.bg }]}>
                <Feather name={section.icon} size={14} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, i) => {
                const done = checked.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      i < section.items.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        done
                          ? { backgroundColor: "#5C8A40", borderColor: "#5C8A40" }
                          : { backgroundColor: "transparent", borderColor: colors.border },
                      ]}
                    >
                      {done && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.itemText,
                          { color: done ? colors.mutedForeground : colors.foreground },
                          done && styles.itemTextDone,
                        ]}
                      >
                        {item.text}
                      </Text>
                      {item.note && (
                        <Text style={[styles.itemNote, { color: colors.mutedForeground }]}>
                          {item.note}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Reset */}
        {checkedCount > 0 && (
          <Pressable
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.selectionAsync();
              setChecked(new Set());
            }}
          >
            <Feather name="refresh-ccw" size={13} color={colors.mutedForeground} />
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset checklist</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, alignItems: "flex-start" },
  headerTitle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 18 },
  progressCard: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  progressCount: { fontFamily: "Inter_700Bold", fontSize: 16 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
  },
  card: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  itemText: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  itemTextDone: { textDecorationLine: "line-through" },
  itemNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    marginBottom: 8,
  },
  resetText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
