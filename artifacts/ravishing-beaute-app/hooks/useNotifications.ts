import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useEffect, useRef } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenObj = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenObj.data;
    await fetch(`${API_BASE}/api/push-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, deviceId: Constants.deviceId ?? null }),
    });
    return token;
  } catch {
    return null;
  }
}

export async function fireBookingConfirmation(serviceName: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Request Sent ✨",
        body: `Your request for ${serviceName} was sent to Shawna. She'll confirm your appointment shortly.`,
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}

export async function scheduleAppointmentReminder(
  serviceName: string,
  offsetMs: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Appointment Reminder 💅",
        body: `Don't forget — your ${serviceName} appointment at Ravishing Beauté is coming up! Come detangled and on time.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, Math.floor(offsetMs / 1000)),
      },
    });
    return id;
  } catch {
    return null;
  }
}

export function useNotificationListener(
  onReceive?: (n: Notifications.Notification) => void,
  onResponse?: (r: Notifications.NotificationResponse) => void
) {
  const receiveRef = useRef(onReceive);
  const responseRef = useRef(onResponse);
  receiveRef.current = onReceive;
  responseRef.current = onResponse;

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub1 = Notifications.addNotificationReceivedListener((n) => {
      receiveRef.current?.(n);
    });
    const sub2 = Notifications.addNotificationResponseReceivedListener((r) => {
      responseRef.current?.(r);
    });
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);
}
