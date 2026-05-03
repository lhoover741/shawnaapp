import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getListFeaturedReviewsQueryKey,
  useListFeaturedReviews,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useMyBookingsBadge } from "@/hooks/useMyBookings";

const FEATURED_SERVICES = [
  { id: "knotless-sm", name: "Small Knotless Braids", price: "$220+", duration: "5–7 hrs" },
  { id: "knotless-md", name: "Medium Knotless Braids", price: "$180+", duration: "4–6 hrs" },
  { id: "feedin", name: "Feed-In Braids", price: "$85+", duration: "2–3 hrs" },
];

function StarRow({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={12}
          color={i <= rating ? colors.accent : colors.border}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { count: badgeCount, refresh: refreshBadge } = useMyBookingsBadge();

  useFocusEffect(useCallback(() => { refreshBadge(); }, [refreshBadge]));

  const { data: featuredReviews, isLoading: reviewsLoading } = useListFeaturedReviews({
    query: { queryKey: getListFeaturedReviewsQueryKey() },
  });

  function handleBook() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/book");
  }

  const webTopPad = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ position: "relative" }}>
        <Image
          source={require("@/assets/images/shawna.jpg")}
          style={[styles.heroImage, { paddingTop: insets.top + webTopPad }]}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(10,4,7,0.55)", "rgba(10,4,7,0.15)", "rgba(10,4,7,0.8)"]}
          locations={[0, 0.4, 1]}
          style={[styles.heroOverlay, { paddingTop: insets.top + 20 + webTopPad }]}
        >
          {/* Bell / notification center */}
          <Pressable
            style={[styles.bellBtn, { top: insets.top + 24 + webTopPad }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/my-bookings");
            }}
            hitSlop={8}
          >
            <Feather name="bell" size={21} color="rgba(255,255,255,0.92)" />
            {badgeCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {badgeCount > 9 ? "9+" : String(badgeCount)}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Logo pinned to top-center */}
          <View style={styles.heroLogoWrap}>
            <Image
              source={require("@/assets/images/logo-cropped.png")}
              style={styles.heroLogo}
              contentFit="contain"
            />
          </View>

          {/* Text + button pinned to bottom-center */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroEyebrow}>CALUMET CITY / NWI</Text>
            <Text style={styles.heroSub}>Premium braiding & natural hair by appointment</Text>
            <Pressable
              style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleBook}
            >
              <Text style={styles.bookBtnText}>Request Appointment</Text>
              <Feather name="calendar" size={16} color="#AC5D7A" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
      {/* Featured Services */}
      <View style={[styles.section, { paddingHorizontal: 16, paddingTop: 20 }]}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>POPULAR SERVICES</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Book a Service</Text>
        <View style={styles.serviceCards}>
          {FEATURED_SERVICES.map((s) => (
            <Pressable
              key={s.name}
              style={({ pressed }) => [
                styles.serviceCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/service/${s.id}`);
              }}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name="scissors" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.serviceName, { color: colors.foreground }]} numberOfLines={2}>
                {s.name}
              </Text>
              <Text style={[styles.servicePrice, { color: colors.accent }]}>{s.price}</Text>
              <Text style={[styles.serviceDuration, { color: colors.mutedForeground }]}>{s.duration}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.viewAllBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push("/(tabs)/services")}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Services</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {/* Gallery preview */}
      <View style={[styles.section, { paddingTop: 16 }]}>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>RECENT WORK</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gallery</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {[
            require("@/assets/images/braids-1.jpg"),
            require("@/assets/images/braids-2.jpg"),
            require("@/assets/images/client-1.jpg"),
            require("@/assets/images/hero-1.jpg"),
            require("@/assets/images/hero-2.jpg"),
            require("@/assets/images/style-1.jpg"),
          ].map((src, i) => (
            <Pressable
              key={i}
              onPress={() => router.push("/(tabs)/gallery")}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <Image
                source={src}
                style={styles.galleryThumb}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={({ pressed }) => [
            styles.viewAllBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1, marginHorizontal: 16, marginTop: 12 },
          ]}
          onPress={() => router.push("/(tabs)/gallery")}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View Full Gallery</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {/* Check Availability card */}
      <Pressable
        style={({ pressed }) => [
          styles.availCard,
          { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 24, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/availability");
        }}
      >
        <View style={[styles.availIconWrap, { backgroundColor: "#EEF7E9" }]}>
          <Feather name="calendar" size={22} color="#5C8A40" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.availTitle, { color: colors.foreground }]}>Check Availability</Text>
          <Text style={[styles.availSub, { color: colors.mutedForeground }]}>
            See which days have open booking slots this month
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      {/* About Shawna teaser */}
      <Pressable
        style={({ pressed }) => [
          styles.aboutCard,
          { backgroundColor: "#FDF0F5", borderColor: "#E4C9D5", marginHorizontal: 16, marginTop: 16, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/about");
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: "#9C5070", marginBottom: 4 }]}>YOUR STYLIST</Text>
          <Text style={[styles.aboutTitle, { color: "#6B1F3E" }]}>Meet Shawna</Text>
          <Text style={[styles.aboutSub, { color: "#9C5070" }]}>
            Owner & master braider serving Calumet City / NWI — protective styles done right.
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#AC5D7A" />
      </Pressable>

      {/* Featured Reviews */}
      <View style={[styles.section, { paddingHorizontal: 16, paddingTop: 18 }]}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>WHAT CLIENTS SAY</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reviews</Text>
        {reviewsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : featuredReviews && featuredReviews.length > 0 ? (
          featuredReviews.slice(0, 2).map((r) => (
            <View
              key={r.id}
              style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <StarRow rating={r.rating} />
              <Text style={[styles.reviewBody, { color: colors.foreground }]} numberOfLines={3}>
                "{r.body}"
              </Text>
              <Text style={[styles.reviewMeta, { color: colors.mutedForeground }]}>
                {r.clientName} · {r.service}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="star" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Reviews coming soon</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.viewAllBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push("/(tabs)/reviews")}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>All Reviews</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  heroImage: { width: "100%", height: 480 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLogoWrap: {
    alignItems: "center",
    width: "100%",
    paddingTop: 4,
  },
  heroLogo: {
    width: "100%",
    height: 220,
  },
  heroBottom: {
    width: "100%",
    alignItems: "center",
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    textAlign: "center",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 50,
  },
  bookBtnText: { color: "#AC5D7A", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  section: {},
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontFamily: "Inter_500Medium", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontFamily: "PlayfairDisplay_600SemiBold", marginBottom: 16 },
  serviceCards: { flexDirection: "row", gap: 10 },
  serviceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
  servicePrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  serviceDuration: { fontSize: 10, fontFamily: "Inter_400Regular" },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    gap: 4,
  },
  viewAllText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  galleryThumb: { width: 160, height: 200, borderRadius: 12 },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  aboutTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, marginBottom: 4 },
  aboutSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  reviewCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10, gap: 8 },
  starRow: { flexDirection: "row" },
  reviewBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  reviewMeta: { fontFamily: "Inter_500Medium", fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  availCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  availIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  availTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 3 },
  availSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  bellBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#AC5D7A",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.3)",
  },
  bellBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },
});
