import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export type DayStatus = "open" | "blocked";
export type AvailabilityMap = Record<string, DayStatus>;

interface CalendarCell {
  type: "empty" | "day";
  date?: string;
  day?: number;
  dayOfWeek?: number;
  isPast?: boolean;
  isToday?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DEFAULT_CLOSED = new Set([0, 1]); // Sun, Mon

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

function buildGrid(year: number, month: number): CalendarCell[] {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ type: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toDateStr(year, month, d);
    const dow = new Date(year, month - 1, d).getDay();
    cells.push({
      type: "day",
      date,
      day: d,
      dayOfWeek: dow,
      isPast: date < todayStr,
      isToday: date === todayStr,
    });
  }
  return cells;
}

interface CalendarProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  availability: AvailabilityMap;
  loading?: boolean;
  adminMode?: boolean;
  onDayPress?: (date: string, currentStatus: DayStatus | undefined) => void;
  showLegend?: boolean;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onSunLabelPress?: () => void;
}

export default function Calendar({
  year,
  month,
  onMonthChange,
  availability,
  loading = false,
  adminMode = false,
  onDayPress,
  showLegend = true,
  selectedDate,
  onSelectDate,
  onSunLabelPress,
}: CalendarProps) {
  const colors = useColors();
  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  function prevMonth() {
    Haptics.selectionAsync();
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    Haptics.selectionAsync();
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  return (
    <View>
      {/* Month nav */}
      <View style={styles.navRow}>
        <Pressable
          onPress={prevMonth}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.foreground }]}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Pressable
          onPress={nextMonth}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.dowRow}>
        {DAY_LABELS.map((d) =>
          d === "Sun" && onSunLabelPress ? (
            <Pressable key={d} style={{ flex: 1 }} onPress={onSunLabelPress} hitSlop={6}>
              <Text style={[styles.dowLabel, { color: colors.mutedForeground }]}>{d}</Text>
            </Pressable>
          ) : (
            <Text
              key={d}
              style={[styles.dowLabel, { color: colors.mutedForeground }]}
            >
              {d}
            </Text>
          )
        )}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.grid}>
          {grid.map((cell, idx) => {
            if (cell.type === "empty") {
              return <View key={`e-${idx}`} style={styles.cell} />;
            }

            const status = availability[cell.date!];
            const isClosed = DEFAULT_CLOSED.has(cell.dayOfWeek!);
            const isSelected = selectedDate === cell.date;
            const adminTappable = adminMode && !cell.isPast && !!onDayPress;
            const clientTappable = !adminMode && !cell.isPast && !isClosed && !!onSelectDate;
            const tappable = adminTappable || clientTappable;

            let bg = "transparent";
            let textColor = colors.foreground;
            let opacity = 1;
            let dotColor: string | null = null;

            if (isSelected) {
              bg = "#AC5D7A";
              textColor = "#fff";
            } else if (cell.isPast) {
              opacity = 0.3;
            } else if (status === "open") {
              bg = "#EEF7E9";
              textColor = "#3A6B28";
              dotColor = "#5C8A40";
            } else if (status === "blocked") {
              bg = "#FEECEC";
              textColor = "#C0392B";
              dotColor = "#C0392B";
            } else if (isClosed) {
              opacity = 0.35;
            }

            const isToday = cell.isToday;

            return (
              <Pressable
                key={cell.date}
                onPress={
                  tappable
                    ? () => {
                        if (adminTappable) onDayPress!(cell.date!, status);
                        else if (clientTappable) onSelectDate!(cell.date!);
                      }
                    : undefined
                }
                style={({ pressed }) => [
                  styles.cell,
                  {
                    backgroundColor: bg,
                    opacity: (pressed && tappable) ? 0.7 : opacity,
                    borderRadius: 10,
                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                    borderColor: isToday && !isSelected ? colors.primary : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: textColor,
                      fontFamily: isToday || isSelected ? "Inter_700Bold" : "Inter_400Regular",
                      textDecorationLine: status === "blocked" && !isSelected ? "line-through" : "none",
                    },
                  ]}
                >
                  {cell.day}
                </Text>
                {dotColor && !isSelected && (
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                )}
                {adminMode && !cell.isPast && !status && !isClosed && (
                  <View style={[styles.dot, { backgroundColor: colors.border }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          <LegendItem color="#EEF7E9" dotColor="#5C8A40" label="Open" />
          <LegendItem color="#FEECEC" dotColor="#C0392B" label="Blocked" />
          {adminMode && (
            <LegendItem color="transparent" dotColor="#D0C4C9" label="Tap to set" />
          )}
        </View>
      )}
    </View>
  );
}

function LegendItem({ color, dotColor, label }: { color: string; dotColor: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color, borderWidth: color === "transparent" ? 1 : 0, borderColor: "#E4D3D8", borderStyle: color === "transparent" ? "dashed" : "solid" }]}>
        <View style={[styles.legendDot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 18 },
  dowRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dowLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
    paddingBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayNum: {
    fontSize: 14,
    lineHeight: 18,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  loadingRow: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 14,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
