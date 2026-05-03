import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const COLS = 2;
const TILE = (width - 32 - 8) / COLS;

const GALLERY = [
  {
    id: 1,
    source: require("@/assets/images/braids-1.jpg"),
    label: "Feed-In Braids",
    caption: "Clean parts with a sleek, polished finish",
    category: "Braids",
  },
  {
    id: 2,
    source: require("@/assets/images/braids-2.jpg"),
    label: "Knotless Braids",
    caption: "Lightweight, protective braids with natural movement",
    category: "Braids",
  },
  {
    id: 3,
    source: require("@/assets/images/hero-1.jpg"),
    label: "Quick Weave",
    caption: "Seamless blending with a full, smooth finish",
    category: "Weaves",
  },
  {
    id: 4,
    source: require("@/assets/images/client-1.jpg"),
    label: "Sleek Ponytail",
    caption: "Smooth molded base with laid edges and shine",
    category: "Styling",
  },
  {
    id: 5,
    source: require("@/assets/images/hero-2.jpg"),
    label: "Bob Braids",
    caption: "Short, structured braids with a chic bob shape",
    category: "Braids",
  },
  {
    id: 6,
    source: require("@/assets/images/style-1.jpg"),
    label: "Stitch Braids",
    caption: "Crisp stitch work with clean parting",
    category: "Braids",
  },
];

export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number | null>(null);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const selectedItem = GALLERY.find(g => g.id === selected);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 20 + webTopPad,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>OUR WORK</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Gallery</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Real results from real clients.
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {GALLERY.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelected(item.id)}
              style={({ pressed }) => [
                styles.tile,
                { width: TILE, height: TILE * 1.25, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Image
                source={item.source}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.tileOverlay}>
                <Text style={styles.tileLabel} numberOfLines={1}>{item.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Lightbox */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayClose} onPress={() => setSelected(null)}>
            <Feather name="x" size={26} color="#fff" />
          </Pressable>
          {selectedItem && (
            <View style={[styles.lightboxCard, { backgroundColor: colors.card }]}>
              <Image
                source={selectedItem.source}
                style={styles.lightboxImage}
                contentFit="cover"
                transition={200}
              />
              <View style={{ padding: 16 }}>
                <Text style={[styles.lightboxTitle, { color: colors.foreground }]}>
                  {selectedItem.label}
                </Text>
                <Text style={[styles.lightboxCaption, { color: colors.mutedForeground }]}>
                  {selectedItem.caption}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  tile: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e0d0d4",
  },
  tileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  tileLabel: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  overlayClose: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 8,
  },
  lightboxCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    overflow: "hidden",
  },
  lightboxImage: {
    width: "100%",
    height: 320,
  },
  lightboxTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    marginBottom: 4,
  },
  lightboxCaption: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
