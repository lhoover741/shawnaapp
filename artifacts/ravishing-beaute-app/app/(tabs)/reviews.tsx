import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getListReviewsQueryKey,
  useListReviews,
  useSubmitReview,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const SERVICES = [
  "Small Knotless Braids",
  "Medium Knotless Braids",
  "Large Knotless Braids",
  "Feed-In Braids",
  "Stitch Braids",
  "Bob Braids",
  "Sleek Ponytail",
  "Quick Weave",
  "Other",
];

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= rating ? colors.accent : colors.border}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(i);
          }}
          style={{ padding: 4 }}
        >
          <Feather
            name="star"
            size={28}
            color={i <= value ? colors.accent : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewCard({
  item,
}: {
  item: {
    id: number;
    clientName: string;
    rating: number;
    body: string;
    service: string;
    createdAt: string;
  };
}) {
  const colors = useColors();
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <StarDisplay rating={item.rating} />
      <Text style={[styles.reviewBody, { color: colors.foreground }]}>
        "{item.body}"
      </Text>
      <View style={styles.reviewMeta}>
        <Text style={[styles.reviewName, { color: colors.foreground }]}>
          {item.clientName}
        </Text>
        <Text style={[styles.reviewSub, { color: colors.mutedForeground }]}>
          {item.service} · {date}
        </Text>
      </View>
    </View>
  );
}

function SubmitForm({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [service, setService] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const honeypot = useRef("");

  const { mutate, isPending } = useSubmitReview({
    mutation: { onSuccess: () => setSubmitted(true) },
  });

  if (submitted) {
    return (
      <View style={styles.successBox}>
        <Feather name="check-circle" size={40} color="#4CAF50" />
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Thank you, {name.split(" ")[0]}!
        </Text>
        <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
          Your review is pending approval and will appear here once Shawna reviews it.
        </Text>
        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.submitBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const isValid = name.trim().length > 0 && rating > 0 && service && body.trim().length >= 10;

  return (
    <View>
      <Text style={[styles.formLabel, { color: colors.foreground }]}>Your Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Tanya M."
        placeholderTextColor={colors.mutedForeground}
      />

      <Text style={[styles.formLabel, { color: colors.foreground }]}>Rating</Text>
      <StarPicker value={rating} onChange={setRating} />

      <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 12 }]}>Service</Text>
      <Pressable
        style={[styles.input, styles.selectInput, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => setShowServicePicker(!showServicePicker)}
      >
        <Text style={{ color: service ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          {service || "Select a service"}
        </Text>
        <Feather name={showServicePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </Pressable>

      {showServicePicker && (
        <View style={[styles.servicePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SERVICES.map((s) => (
            <Pressable
              key={s}
              style={[styles.serviceOption, { borderBottomColor: colors.border }]}
              onPress={() => {
                setService(s);
                setShowServicePicker(false);
              }}
            >
              <Text style={[styles.serviceOptionText, { color: s === service ? colors.primary : colors.foreground }]}>
                {s}
              </Text>
              {s === service && <Feather name="check" size={14} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[styles.formLabel, { color: colors.foreground }]}>Your Review</Text>
      <TextInput
        style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
        value={body}
        onChangeText={setBody}
        placeholder="Share your experience…"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={2000}
      />
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
        {body.length}/2000
      </Text>

      <Pressable
        style={[
          styles.submitBtn,
          { backgroundColor: isValid ? colors.primary : colors.border },
        ]}
        disabled={!isValid || isPending}
        onPress={() => {
          if (honeypot.current) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          mutate({ data: { clientName: name.trim(), rating, body: body.trim(), service } });
        }}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Review</Text>
        )}
      </Pressable>
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        All reviews are approved by Shawna before appearing publicly.
      </Text>
    </View>
  );
}

export default function ReviewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const { data: reviews, isLoading, refetch, isRefetching } = useListReviews({
    query: { queryKey: getListReviewsQueryKey() },
  });

  const avg =
    reviews && reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 4.9;

  const headerEl = (
    <View>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 20 + webTopPad,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
          CLIENT TESTIMONIALS
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Reviews</Text>

        {/* Rating summary */}
        <View style={[styles.ratingSummary, { borderColor: colors.border }]}>
          <View style={styles.ratingCol}>
            <Text style={[styles.ratingNum, { color: colors.primary }]}>{avg}</Text>
            <StarDisplay rating={Math.round(avg)} size={12} />
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              Average
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.ratingCol}>
            <Text style={[styles.ratingNum, { color: colors.foreground }]}>
              {reviews?.length ?? "—"}
            </Text>
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              Reviews
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.ratingCol}>
            <Text style={[styles.ratingNum, { color: colors.foreground }]}>
              {reviews?.filter((r) => r.rating === 5).length ?? "—"}
            </Text>
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              5-Star
            </Text>
          </View>
        </View>
      </View>

      {/* Leave a review button */}
      {!showForm && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Pressable
            style={({ pressed }) => [
              styles.leaveReviewBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowForm(true);
            }}
          >
            <Feather name="edit-2" size={16} color="#fff" />
            <Text style={styles.leaveReviewText}>Leave a Review</Text>
          </Pressable>
        </View>
      )}

      {/* Form */}
      {showForm && (
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 },
          ]}
        >
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Share Your Experience</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <SubmitForm onClose={() => setShowForm(false)} />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ALL REVIEWS
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20 }}
      data={reviews ?? []}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <ReviewCard item={item} />
        </View>
      )}
      ListHeaderComponent={headerEl}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="star" size={32} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No reviews yet
            </Text>
          </View>
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, marginBottom: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 14 },
  ratingSummary: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  ratingCol: { flex: 1, alignItems: "center", gap: 4 },
  ratingNum: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold" },
  ratingLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { width: 1, height: 40, marginHorizontal: 8 },
  starRow: { flexDirection: "row" },
  leaveReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  leaveReviewText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  formCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 16 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  formTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  formLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  selectInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  servicePicker: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    overflow: "scroll" as any,
  },
  serviceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  serviceOptionText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, lineHeight: 16 },
  successBox: { alignItems: "center", paddingVertical: 24, gap: 12 },
  successTitle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 22 },
  successBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, fontFamily: "Inter_500Medium" },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reviewBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, fontStyle: "italic" },
  reviewMeta: { gap: 2 },
  reviewName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reviewSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
