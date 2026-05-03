import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const PHONE = "7085743658";
const INSTAGRAM = "ravishingbeaute_";

const HOURS = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday – Saturday", hours: "8:30 AM – 6:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

function ActionRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.actionValue, { color: colors.foreground }]}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTitleTap() {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapCount.current += 1;
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push("/admin");
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 3000);
  }

  function handleSMS() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = "Hi Ravishing Beauté, I would like to request an appointment.\nName: \nService: \nPreferred date/time: ";
    Linking.openURL(`sms:${PHONE}?body=${encodeURIComponent(msg)}`);
  }

  function handleCall() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${PHONE}`);
  }

  function handleInstagram() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.instagram.com/${INSTAGRAM}`);
  }

  function handleReview() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = "Hi Shawna! I wanted to leave a review for my recent appointment 🌟\nService: \nMy experience: \nRating (1–5): ";
    Linking.openURL(`sms:${PHONE}?body=${encodeURIComponent(msg)}`);
  }

  function handleRefer() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = "Hey! I've been getting my hair done by Shawna at Ravishing Beauté and she's amazing ✨ You should check her out — she does knotless braids, weaves, ponytails and more. Text her to book: (708) 574-3658 or follow her on Instagram @ravishingbeaute_";
    Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 20 + webTopPad, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>GET IN TOUCH</Text>
        <Pressable onPress={handleTitleTap} hitSlop={8}>
          <Text style={[styles.title, { color: colors.foreground }]}>Contact & Book</Text>
        </Pressable>
      </View>

      {/* Book Now hero */}
      <LinearGradient
        colors={["#C47090", "#AC5D7A"]}
        style={styles.bookHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.bookHeroTitle}>Ready to Book?</Text>
        <Text style={styles.bookHeroSub}>
          Submit a request and Shawna will confirm your spot. A $25 deposit secures the appointment.
        </Text>
        <View style={styles.bookHeroBtns}>
          <Pressable
            style={({ pressed }) => [styles.bookOnlineBtn, { opacity: pressed ? 0.88 : 1, flex: 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/services"); }}
          >
            <Feather name="calendar" size={18} color="#fff" />
            <Text style={styles.bookOnlineBtnText}>Request Appointment</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={handleSMS}
          >
            <Feather name="message-circle" size={16} color="#AC5D7A" />
            <Text style={styles.bookBtnText}>Text Us</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 24 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTACT</Text>

        <ActionRow
          icon="message-circle"
          label="SMS"
          value="Have a question? Text Shawna"
          onPress={handleSMS}
        />
        <ActionRow
          icon="phone"
          label="Phone"
          value="(708) 574-3658"
          onPress={handleCall}
        />
        <ActionRow
          icon="instagram"
          label="Instagram"
          value={`@${INSTAGRAM}`}
          onPress={handleInstagram}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          SHARE YOUR EXPERIENCE
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.reviewCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleReview}
        >
          <View style={styles.reviewCardInner}>
            <View style={[styles.reviewIconWrap, { backgroundColor: "#FDF0F5" }]}>
              <Feather name="star" size={20} color="#AC5D7A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reviewCardTitle, { color: colors.foreground }]}>Leave a Review</Text>
              <Text style={[styles.reviewCardSub, { color: colors.mutedForeground }]}>
                Had a great experience? Send Shawna a review — approved reviews are featured in the app.
              </Text>
            </View>
          </View>
          <View style={[styles.reviewCardBtn, { borderColor: colors.primary }]}>
            <Feather name="message-circle" size={14} color="#AC5D7A" />
            <Text style={[styles.reviewCardBtnText, { color: colors.primary }]}>Text a Review</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.referCard,
            { backgroundColor: "#FDF0F5", borderColor: "#E4C9D5", opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleRefer}
        >
          <View style={styles.referCardInner}>
            <View style={styles.referIconWrap}>
              <Feather name="user-plus" size={20} color="#AC5D7A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referCardTitle, { color: "#6B1F3E" }]}>Refer a Friend</Text>
              <Text style={[styles.referCardSub, { color: "#9C5070" }]}>
                Love your hair? Share Ravishing Beauté with a friend — one tap sends them everything they need to book.
              </Text>
            </View>
          </View>
          <View style={styles.referCardBtn}>
            <Feather name="share-2" size={14} color="#AC5D7A" />
            <Text style={styles.referCardBtnText}>Share with a Friend</Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          LOCATION
        </Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Calumet City / NWI</Text>
            <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
              Exact address provided upon booking confirmation.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          HOURS
        </Text>
        <View style={[styles.hoursCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {HOURS.map((row, i) => (
            <View
              key={row.day}
              style={[
                styles.hoursRow,
                i < HOURS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.hoursDay, { color: colors.foreground }]}>{row.day}</Text>
              <Text
                style={[
                  styles.hoursTime,
                  { color: row.hours === "Closed" ? colors.mutedForeground : colors.foreground },
                ]}
              >
                {row.hours}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.policyNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="alert-circle" size={14} color={colors.primary} />
          <Text style={[styles.policyText, { color: colors.foreground }]}>
            $25 non-refundable deposit required. Same-day appointments by approval only. Please arrive detangled unless a wash is booked.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
          HELPFUL GUIDES
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.guideCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/prep");
          }}
        >
          <View style={[styles.guideIconWrap, { backgroundColor: "#EEF5DF" }]}>
            <Feather name="check-square" size={20} color="#5C6F2E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>Appointment Prep Checklist</Text>
            <Text style={[styles.guideSub, { color: colors.mutedForeground }]}>
              What to do before your appointment — hair prep, what to bring, and day-of reminders.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.guideCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/faq");
          }}
        >
          <View style={[styles.guideIconWrap, { backgroundColor: "#FDF0F5" }]}>
            <Feather name="help-circle" size={20} color="#AC5D7A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>FAQ & Policies</Text>
            <Text style={[styles.guideSub, { color: colors.mutedForeground }]}>
              Answers to common questions on deposits, cancellations, hair included, hours, and more.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "PlayfairDisplay_700Bold" },
  bookHero: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 24,
    gap: 8,
  },
  bookHeroTitle: { color: "#fff", fontFamily: "PlayfairDisplay_700Bold", fontSize: 24 },
  bookHeroSub: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bookHeroBtns: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
  },
  bookBtnText: { color: "#AC5D7A", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  bookOnlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  bookOnlineBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, fontFamily: "Inter_500Medium", marginBottom: 4 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actionValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  infoSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  hoursCard: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  hoursDay: { fontFamily: "Inter_400Regular", fontSize: 14 },
  hoursTime: { fontFamily: "Inter_500Medium", fontSize: 14 },
  policyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  policyText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  guideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  guideTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 3 },
  guideSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  reviewCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reviewIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  reviewCardSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  reviewCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 10,
  },
  reviewCardBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  referCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  referCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  referIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F7D6E4",
    alignItems: "center",
    justifyContent: "center",
  },
  referCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  referCardSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  referCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#AC5D7A",
    borderRadius: 50,
    paddingVertical: 10,
  },
  referCardBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#AC5D7A" },
  portalLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 16,
    marginTop: 4,
  },
  portalLinkText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
