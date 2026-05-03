import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
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

const SPECIALTIES = [
  { icon: "scissors" as const, label: "Knotless Braids" },
  { icon: "wind" as const, label: "Feed-In & Stitch Braids" },
  { icon: "star" as const, label: "Bob Braids" },
  { icon: "sun" as const, label: "Sleek Ponytails" },
  { icon: "layers" as const, label: "Quick Weaves" },
];

const VALUES = [
  {
    icon: "heart" as const,
    title: "Client-First Experience",
    body: "Every client is treated with care and respect. Shawna takes time to understand what you want and delivers results you'll love.",
  },
  {
    icon: "shield" as const,
    title: "Protective Styling",
    body: "All styles are installed with your hair health in mind — low tension, clean parts, and proper technique every time.",
  },
  {
    icon: "award" as const,
    title: "Premium Quality",
    body: "No rushed appointments. Shawna gives each client her full attention and takes pride in a polished, lasting finish.",
  },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>About Shawna</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero photo card */}
        <View style={styles.heroWrap}>
          <Image
            source={require("@/assets/images/shawna.jpg")}
            style={styles.heroImg}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,4,7,0.75)"]}
            style={styles.heroGrad}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>Shawna</Text>
            <Text style={styles.heroRole}>Owner & Master Braider · Ravishing Beauté</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bioText, { color: colors.foreground }]}>
            Shawna is the owner and lead stylist behind Ravishing Beauté — a premium natural hair and braiding studio serving clients in Calumet City and the Northwest Indiana area.
          </Text>
          <Text style={[styles.bioText, { color: colors.foreground }]}>
            With years of hands-on experience, Shawna specializes in protective styles that are as healthy as they are beautiful. Her attention to detail and commitment to clean, precise technique has earned her a loyal clientele who come back again and again.
          </Text>
          <Text style={[styles.bioText, { color: colors.foreground }]}>
            Ravishing Beauté operates by appointment only, ensuring every client receives Shawna's full attention and a salon experience that feels personal, comfortable, and elevated.
          </Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SPECIALTIES</Text>
          <View style={styles.specialtyGrid}>
            {SPECIALTIES.map((s) => (
              <View
                key={s.label}
                style={[styles.specialtyChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.specialtyIcon, { backgroundColor: "#FDF0F5" }]}>
                  <Feather name={s.icon} size={14} color="#AC5D7A" />
                </View>
                <Text style={[styles.specialtyLabel, { color: colors.foreground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHAT TO EXPECT</Text>
          <View style={{ gap: 10 }}>
            {VALUES.map((v) => (
              <View
                key={v.title}
                style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.valueIcon, { backgroundColor: "#FDF0F5" }]}>
                  <Feather name={v.icon} size={18} color="#AC5D7A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.valueTitle, { color: colors.foreground }]}>{v.title}</Text>
                  <Text style={[styles.valueSub, { color: colors.mutedForeground }]}>{v.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Location & hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LOCATION & HOURS</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={15} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Calumet City / NWI</Text>
                <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                  Exact address provided after booking confirmation.
                </Text>
              </View>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Feather name="clock" size={15} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Tue – Sat · 8:30 AM – 6:00 PM</Text>
                <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                  Closed Sunday & Monday. By appointment only.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Book CTA */}
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => {
              const msg = "Hi Ravishing Beauté, I would like to request an appointment.\nName: \nService: \nPreferred date/time: ";
              Linking.openURL(`sms:${PHONE}?body=${encodeURIComponent(msg)}`);
            }}
          >
            <Feather name="message-circle" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Text Shawna to Book</Text>
          </Pressable>
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
  heroWrap: { margin: 16, borderRadius: 20, overflow: "hidden", height: 280 },
  heroImg: { width: "100%", height: "100%" },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroText: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  heroName: {
    color: "#fff",
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 32,
    marginBottom: 4,
  },
  heroRole: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  bioCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 24,
  },
  bioText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  specialtyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specialtyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  specialtyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  specialtyLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  valueCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  valueIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  valueTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  valueSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  infoCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  infoDivider: { height: 1 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  infoSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#AC5D7A",
    borderRadius: 50,
    paddingVertical: 16,
  },
  bookBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
});
