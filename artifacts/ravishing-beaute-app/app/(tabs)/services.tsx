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

import { SERVICES } from "@/constants/services";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { name: string; ids: string[] }[] = [
  { name: "Braids", ids: ["knotless-sm", "knotless-md", "knotless-lg", "feedin", "stitch", "bobbraids"] },
  { name: "Styling", ids: ["ponytail"] },
  { name: "Weaves", ids: ["quickweave"] },
];

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAddons, setShowAddons] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  function handleServicePress(id: string) {
    Haptics.selectionAsync();
    router.push(`/service/${id}`);
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 20 + webTopPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>MENU & PRICING</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Services</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tap any service to select add-ons and send a booking request.
        </Text>
      </View>

      {/* Seasonal promo banner */}
      <View style={styles.promoBanner}>
        <Text style={styles.promoEmoji}>☀️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>Summer Booking is Open!</Text>
          <Text style={styles.promoSub}>Spots fill fast — tap a service to lock in your summer style.</Text>
        </View>
      </View>

      {/* Deposit note */}
      <View style={[styles.depositNote, { backgroundColor: colors.muted, marginHorizontal: 16, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.primary} />
        <Text style={[styles.depositText, { color: colors.foreground }]}>
          $25 non-refundable deposit required. Hair in colors 1, 1B, 2, and 4 included where noted. Please come detangled to stay on schedule.
        </Text>
      </View>

      {/* Service Categories */}
      {CATEGORIES.map((cat) => {
        const services = SERVICES.filter((s) => cat.ids.includes(s.id));
        return (
          <View key={cat.name} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={[styles.categoryTitle, { color: colors.mutedForeground, borderBottomColor: colors.border }]}>
              {cat.name.toUpperCase()}
            </Text>
            {services.map((service) => (
              <Pressable
                key={service.id}
                onPress={() => handleServicePress(service.id)}
                style={({ pressed }) => [
                  styles.serviceRow,
                  { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceNameRow}>
                    <Text style={[styles.serviceName, { color: colors.foreground }]} numberOfLines={2}>
                      {service.name}
                    </Text>
                    {service.hairIncluded && (
                      <View style={[styles.hairBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.hairBadgeText, { color: colors.primary }]}>Hair incl.</Text>
                      </View>
                    )}
                  </View>
                  {service.badge && (
                    <View style={[styles.promoBadge, { backgroundColor: service.badge.bg }]}>
                      <Text style={[styles.promoBadgeText, { color: service.badge.color }]}>
                        {service.badge.label}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>
                    {service.description}
                  </Text>
                  <Text style={[styles.serviceDuration, { color: colors.mutedForeground }]}>
                    ~{service.duration}
                  </Text>
                </View>
                <View style={styles.serviceRight}>
                  <Text style={[styles.servicePrice, { color: colors.accent }]}>{service.priceLabel}</Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginTop: 6 }} />
                </View>
              </Pressable>
            ))}
          </View>
        );
      })}

      {/* Add-ons note */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Pressable
          style={[styles.addonsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowAddons(!showAddons);
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.addonsTitle, { color: colors.foreground }]}>About Add-Ons</Text>
            <Text style={[styles.addonsSubtitle, { color: colors.mutedForeground }]}>
              Service-specific add-ons are available when you tap a service.
            </Text>
          </View>
          <Feather
            name={showAddons ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
        {showAddons && (
          <View style={[styles.addonsBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              "Extra length, boho curls, and take-down are available for knotless braids.",
              "Designed parts and additional braid counts available for feed-in and stitch styles.",
              "Wand curls, crimps, and bang details available for ponytail styles.",
              "Bob cut, closure install, and leave-out blend available for quick weaves.",
              "Beads/accessories and colored hair requests available for all braid services.",
            ].map((note, i) => (
              <View key={i} style={[styles.addonNoteRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Feather name="check" size={12} color={colors.primary} />
                <Text style={[styles.addonNoteText, { color: colors.mutedForeground }]}>{note}</Text>
              </View>
            ))}
          </View>
        )}
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
    marginBottom: 16,
  },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  depositNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  depositText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  categoryTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  serviceLeft: { flex: 1, marginRight: 10 },
  serviceRight: { alignItems: "flex-end" },
  serviceNameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  serviceName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hairBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  hairBadgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  serviceDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16, marginBottom: 4 },
  serviceDuration: { fontSize: 11, fontFamily: "Inter_400Regular" },
  servicePrice: { fontSize: 15, fontFamily: "Inter_700Bold", flexShrink: 0 },
  addonsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  addonsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  addonsSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  addonsBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  addonNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addonNoteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF8EC",
    borderWidth: 1,
    borderColor: "#F0D99A",
  },
  promoEmoji: { fontSize: 28 },
  promoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#7A5C1E", marginBottom: 2 },
  promoSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#A07830", lineHeight: 16 },
  promoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
});
