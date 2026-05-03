import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FAQ = { q: string; a: string };

const SECTIONS: { title: string; icon: React.ComponentProps<typeof Feather>["name"]; faqs: FAQ[] }[] = [
  {
    title: "Booking & Deposits",
    icon: "calendar",
    faqs: [
      {
        q: "How do I book an appointment?",
        a: "Text Shawna at (708) 574-3658 with your name, desired service, and preferred date and time. You can also tap any service in the Services tab to send a pre-filled booking request.",
      },
      {
        q: "Is a deposit required?",
        a: "Yes — a $25 non-refundable deposit is required to secure every appointment. Your spot is not confirmed until the deposit is received.",
      },
      {
        q: "What if I need to cancel or reschedule?",
        a: "Please give as much notice as possible if you need to cancel or reschedule. The $25 deposit is non-refundable. Rescheduling is at Shawna's discretion and subject to availability.",
      },
      {
        q: "Can I book a same-day appointment?",
        a: "Same-day bookings are accepted only if Shawna approves and has availability. Please text as early as possible to check — no guarantees.",
      },
      {
        q: "Are appointments by appointment only?",
        a: "Yes, Ravishing Beauté is by appointment only. Walk-ins are not accepted.",
      },
    ],
  },
  {
    title: "Services & Pricing",
    icon: "scissors",
    faqs: [
      {
        q: "Why does the price say '+' after the number?",
        a: "All prices are starting prices. The final cost depends on your hair length, density, the number of braids, and any add-ons you select. Shawna will confirm the exact price after reviewing your hair.",
      },
      {
        q: "Is braiding hair included?",
        a: "Braiding hair is included for knotless braids, feed-in braids, stitch braids, and bob braids — in natural colors 1, 1B, 2, and 4 only. Hair is not included for ponytail or quick weave services.",
      },
      {
        q: "Can I request a custom or non-natural hair color?",
        a: "Yes — a Colored Hair Request add-on is available for $15. You may be asked to provide your own hair if the color is outside the standard 1, 1B, 2, and 4 range.",
      },
      {
        q: "Do you offer take-down services?",
        a: "Yes, a take-down service is available as an add-on for select styles. Please add it when sending your booking request.",
      },
      {
        q: "How long do the styles last?",
        a: "Knotless and box braid styles typically last 4–8 weeks with proper care. Feed-in and stitch braids usually last 2–4 weeks. Quick weaves and ponytails last until removal. Longevity depends on how well you maintain your hair.",
      },
    ],
  },
  {
    title: "Appointment Policies",
    icon: "clock",
    faqs: [
      {
        q: "What are the business hours?",
        a: "Ravishing Beauté is open Tuesday through Saturday, 8:30 AM to 6:00 PM. Shawna is closed on Sundays and Mondays.",
      },
      {
        q: "What happens if I'm late?",
        a: "Please arrive on time. Running late can affect the entire schedule. If you are significantly late, your appointment may be shortened or rescheduled. Please text Shawna as soon as you know you'll be delayed.",
      },
      {
        q: "Do I need to come with my hair detangled?",
        a: "Yes — please arrive with your hair fully detangled. Shawna does not detangle hair during appointments. Coming unprepared can delay your session and affect other clients.",
      },
      {
        q: "Can I bring children or guests to my appointment?",
        a: "Please keep guests and extra visitors to a minimum out of respect for other clients and to keep the space comfortable.",
      },
    ],
  },
  {
    title: "Location & Logistics",
    icon: "map-pin",
    faqs: [
      {
        q: "Where is Ravishing Beauté located?",
        a: "Ravishing Beauté is located in the Calumet City / NWI area. The exact address is provided after your deposit is confirmed — please do not come without a confirmed appointment.",
      },
      {
        q: "Is there parking available?",
        a: "Parking details are shared along with the address after your booking is confirmed.",
      },
    ],
  },
];

export default function FAQScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>FAQ & Policies</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Intro */}
        <View style={[styles.intro, { backgroundColor: "#FDF0F5", borderColor: "#E4C9D5" }]}>
          <Text style={styles.introText}>
            Everything you need to know before, during, and after your appointment at Ravishing Beauté.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name={section.icon} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.faqs.map((faq, i) => {
                const key = `${section.title}-${i}`;
                const open = openItems.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggle(key)}
                    style={({ pressed }) => [
                      styles.faqRow,
                      i < section.faqs.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={styles.faqTop}>
                      <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
                      <Feather
                        name={open ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.mutedForeground}
                        style={{ marginLeft: 8, marginTop: 2 }}
                      />
                    </View>
                    {open && (
                      <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Still have questions */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.questionTitle, { color: colors.foreground }]}>Still have a question?</Text>
            <Text style={[styles.questionSub, { color: colors.mutedForeground }]}>
              Text Shawna directly at (708) 574-3658 — she's happy to help.
            </Text>
          </View>
        </View>
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
  intro: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  introText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: "#7A3D5A",
  },
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
  faqRow: { paddingHorizontal: 16, paddingVertical: 16 },
  faqTop: { flexDirection: "row", alignItems: "flex-start" },
  faqQ: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  faqA: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 6,
  },
  questionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  questionSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
});
