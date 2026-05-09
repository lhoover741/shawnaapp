import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  DEPOSIT_NOTE,
  HAIR_INCLUDED_NOTE,
  HOURS_NOTE,
  PREP_NOTE,
  SAME_DAY_NOTE,
  SERVICE_CATEGORIES,
  getGroupedServices,
  getServiceById,
  getServicesByCategory,
  type ServiceCategory,
} from "@/lib/services";
import { registerPushToken } from "@/lib/api";
import ClientNotificationOptIn from "@/components/ClientNotificationOptIn";
import { requestAndSubscribe } from "@/lib/push";

type FormData = {
  service: string;
  preferredDate: string | null;
  flexibleDate: boolean;
  timePreference: string;
  addons: string[];
  name: string;
  phone: string;
  notes: string;
};

const INITIAL: FormData = {
  service: "",
  preferredDate: null,
  flexibleDate: false,
  timePreference: "flexible",
  addons: [],
  name: "",
  phone: "",
  notes: "",
};

const TIME_PREFS = [
  { id: "morning", label: "Morning", sub: "8:30 AM–12 PM" },
  { id: "afternoon", label: "Afternoon", sub: "12 PM–6 PM" },
  { id: "flexible", label: "Flexible", sub: "Any Tue–Sat" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function MiniCalendar({
  year,
  month,
  selected,
  availability,
  loading = false,
  onSelect,
  onMonthChange,
}: {
  year: number;
  month: number;
  selected: string | null;
  availability: Record<string, "open" | "blocked">;
  loading?: boolean;
  onSelect: (date: string) => void;
  onMonthChange: (y: number, m: number) => void;
}) {
  const days = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }
  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E4D3D8",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Month nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #F3EAED",
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7D6268"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#201B1C" }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7D6268"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      {/* Day labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "8px 8px 0",
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#7D6268",
              fontWeight: 600,
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 8px 8px",
          gap: 2,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isSelected = dateStr === selected;
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const avail = availability[dateStr];
          const isBlocked = avail === "blocked";
          const isOpen = avail === "open";
          const dow = new Date(dateStr + "T12:00:00").getDay();
          const isClosedDay = dow === 0 || dow === 1;
          const isSameDay = dateStr === today;

          const disabled =
            isPast || isBlocked || isClosedDay || (isSameDay && !isOpen);

          return (
            <button
              key={i}
              onClick={() => !disabled && onSelect(dateStr)}
              disabled={disabled}
              style={{
                height: 38,
                borderRadius: 8,
                border: "none",
                cursor: disabled ? "default" : "pointer",
                fontWeight: isSelected ? 700 : 400,
                fontSize: 13,
                backgroundColor: loading
                  ? "#F6EEF1"
                  : isSelected
                    ? "#AC5D7A"
                    : isOpen
                      ? "#EEF7E9"
                      : "transparent",
                color: isSelected
                  ? "#fff"
                  : disabled
                    ? "#C9B8BC"
                    : isToday
                      ? "#AC5D7A"
                      : "#201B1C",
                outline: isToday && !isSelected ? "1px solid #AC5D7A" : "none",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {loading ? "" : d}
              {loading && (
                <span
                  style={{
                    display: "block",
                    width: 16,
                    height: 8,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, #F6EEF1, #EFE0E5, #F6EEF1)",
                    margin: "0 auto",
                  }}
                />
              )}
              {isOpen && !isSelected && !loading && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: "#5C8A40",
                    borderRadius: "50%",
                    margin: "2px auto 0",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Book() {
  const [route, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [availability, setAvailability] = useState<
    Record<string, "open" | "blocked">
  >({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCategory>(
    "all",
  );
  useEffect(() => {
    const params = new URLSearchParams(route.split("?")[1] ?? "");
    const service = params.get("service");
    const addons = params.get("addons");
    if (!service) return;
    const selectedSvc = getServiceById(service);
    if (!selectedSvc) return;
    setForm((f) => ({
      ...f,
      service: selectedSvc.id,
      addons: addons
        ? addons
            .split(",")
            .filter(Boolean)
            .filter((id) => selectedSvc.addOns.some((a) => a.id === id))
        : selectedSvc.addOns.map((a) => a.id),
    }));
    setStep(2);
  }, [route]);

  useEffect(() => {
    if (step === 2) loadAvailability(calYear, calMonth);
  }, [step, calYear, calMonth]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  async function loadAvailability(y: number, m: number) {
    setAvailabilityLoading(true);
    try {
      const res = await fetch(`/api/availability?year=${y}&month=${m}`);
      if (res.ok) {
        const data = (await res.json()) as { date: string; status: string }[];
        const map: Record<string, "open" | "blocked"> = {};
        for (const r of data) {
          if (r.status === "open" || r.status === "blocked")
            map[r.date] = r.status;
        }
        setAvailability(map);
      }
    } catch {
      setAvailability({});
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!form.service) {
        setError("Please select a service to continue.");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (!form.flexibleDate && !form.preferredDate) {
        setError("Please choose a date or tap 'I'm flexible'.");
        return;
      }
      setError("");
      setStep(3);
    }
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const selectedSvc = getServiceById(form.service);
      const selectedAddons =
        selectedSvc?.addOns.filter((a) => form.addons.includes(a.id)) ?? [];
      const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);

      // Request push permission & get web push subscription (fire-and-forget on failure)
      let webPushSub: string | undefined;
      try {
        const pushResult = await requestAndSubscribe();
        if (pushResult.status === "success" && pushResult.subscription) {
          webPushSub = JSON.stringify(pushResult.subscription);
        }
      } catch {
        /* non-blocking */
      }

      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.name.trim(),
          phone: form.phone.trim(),
          service: form.service,
          preferredDate: form.preferredDate,
          flexibleDate: form.flexibleDate,
          timePreference: form.timePreference,
          notes: form.notes.trim() || undefined,
          addons: selectedAddons.length
            ? selectedAddons.map((a) => `${a.name} (+$${a.price})`).join(", ")
            : undefined,
          basePrice: selectedSvc?.basePrice,
          totalEstimate: (selectedSvc?.basePrice ?? 0) + addonsTotal,
          clientWebPushSubscription: webPushSub,
        }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("rb_push_token")
          : null;
      if (token) {
        void registerPushToken(
          token,
          window.localStorage.getItem("rb_push_device_id") ?? undefined,
        );
      }
      setConfirmId(data.id ?? null);
      setSubmitted(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSvc = getServiceById(form.service);
  const selectedAddons =
    selectedSvc?.addOns.filter((a) => form.addons.includes(a.id)) ?? [];
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const visibleServices = getServicesByCategory(activeCategory);
  const visibleGroups = getGroupedServices(visibleServices);
  const selectedDateLabel = form.preferredDate
    ? new Date(form.preferredDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : form.flexibleDate
      ? "I'm flexible"
      : null;

  // Success screen
  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "#F9F5F0",
          minHeight: "100vh",
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 16px",
            borderBottom: "1px solid #E4D3D8",
            backgroundColor: "#fff",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: "#201B1C",
            }}
          >
            Request Sent
          </p>
        </div>
        <div
          style={{
            padding: "32px 16px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              backgroundColor: "#EEF7E9",
              borderRadius: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5C8A40"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p
            style={{
              fontSize: 24,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              color: "#201B1C",
              marginBottom: 8,
            }}
          >
            Request Sent!
          </p>
          <p
            style={{
              fontSize: 14,
              color: "#7D6268",
              textAlign: "center",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Your request is now{" "}
            <span style={{ color: "#AC5D7A", fontWeight: 600 }}>
              pending review
            </span>
            . Shawna will text you to confirm.
          </p>
          {confirmId && (
            <p style={{ fontSize: 12, color: "#7D6268", marginBottom: 12 }}>
              Confirmation #{confirmId}
            </p>
          )}
          <div
            style={{
              backgroundColor: "#FEF9EC",
              border: "1px solid #EDD9A3",
              borderRadius: 50,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              marginBottom: 24,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B8860B"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 12, color: "#B8860B", fontWeight: 500 }}>
              Pending review
            </span>
          </div>
          {/* Summary */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#fff",
              border: "1px solid #E4D3D8",
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
            }}
          >
            {[
              {
                icon: "✉️",
                label: "Next step",
                value: "Wait for Shawna's confirmation text",
              },
              {
                icon: "✂️",
                label: "Service",
                value: selectedSvc?.name ?? form.service,
              },
              ...(selectedDateLabel
                ? [{ icon: "📅", label: "Date", value: selectedDateLabel }]
                : []),
              {
                icon: "🕐",
                label: "Time",
                value:
                  TIME_PREFS.find((t) => t.id === form.timePreference)?.label ??
                  form.timePreference,
              },
              {
                icon: "💵",
                label: "Estimate",
                value: `$${(selectedSvc?.basePrice ?? 0) + addonsTotal}`,
              },
              { icon: "👤", label: "Name", value: form.name },
              { icon: "📱", label: "Phone", value: form.phone },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: "1px solid #F3EAED",
                }}
              >
                <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>
                  {row.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7D6268",
                    fontWeight: 500,
                    width: 70,
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "#201B1C",
                    flex: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div style={{ width: "100%", marginBottom: 16 }}>
            <ClientNotificationOptIn compact />
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "13px 0",
              border: "1px solid #E4D3D8",
              borderRadius: 12,
              backgroundColor: "transparent",
              color: "#201B1C",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            Back to Home
          </button>
          <a
            href={`sms:7085743658?body=${encodeURIComponent(`Hi Shawna, I just submitted a booking request (Confirmation #${confirmId ?? ""}). Looking forward to hearing from you!`)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#AC5D7A",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AC5D7A"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Follow up via text
          </a>
        </div>
      </div>
    );
  }

  const progressPct = (step / 3) * 100;

  return (
    <div
      ref={topRef}
      style={{
        backgroundColor: "#F9F5F0",
        minHeight: "100vh",
        paddingBottom: "calc(124px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px",
          borderBottom: "1px solid #E4D3D8",
          backgroundColor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() =>
              step === 1 ? navigate("/") : setStep((s) => (s - 1) as 1 | 2 | 3)
            }
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#201B1C",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {step === 1 ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <polyline points="15 18 9 12 15 6" />
                </>
              )}
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#201B1C",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {step === 1
                ? "Choose Service"
                : step === 2
                  ? "Date & Time"
                  : "Your Info"}
            </p>
            <div
              style={{
                height: 3,
                backgroundColor: "#E4D3D8",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  backgroundColor: "#AC5D7A",
                  borderRadius: 2,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "#7D6268",
              fontWeight: 500,
              width: 30,
              textAlign: "right",
            }}
          >
            {step}/3
          </span>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {/* STEP 1: Service */}
        {step === 1 && (
          <>
            <p
              style={{
                fontSize: 20,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                color: "#201B1C",
                marginBottom: 4,
              }}
            >
              Select your service
            </p>
            <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 12 }}>
              {DEPOSIT_NOTE}
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 10,
                marginBottom: 10,
              }}
            >
              {SERVICE_CATEGORIES.map((category) => {
                const selected = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    style={{
                      flex: "0 0 auto",
                      border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`,
                      backgroundColor: selected ? "#AC5D7A" : "#fff",
                      color: selected ? "#fff" : "#7D6268",
                      borderRadius: 999,
                      padding: "9px 13px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            {Object.keys(visibleGroups).length === 0 ? (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px dashed #D8C3C9",
                  borderRadius: 16,
                  padding: 18,
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: "#201B1C" }}>
                  No services in this category yet.
                </p>
                <p style={{ fontSize: 12, color: "#7D6268", marginTop: 4 }}>
                  Choose another category or request a custom consultation.
                </p>
              </div>
            ) : (
              Object.entries(visibleGroups).map(([group, services]) => (
                <section key={group} style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.8,
                      color: "#7D6268",
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    {group.toUpperCase()}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 10,
                    }}
                  >
                    {services.map((s) => {
                      const sel = form.service === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setForm((f) => ({ ...f, service: s.id }));
                            setError("");
                          }}
                          style={{
                            backgroundColor: sel ? "#F9EFF3" : "#fff",
                            border: `1.5px solid ${sel ? "#AC5D7A" : "#E4D3D8"}`,
                            borderRadius: 16,
                            padding: 14,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "grid",
                            gridTemplateColumns: "38px 1fr auto",
                            gap: 12,
                            position: "relative",
                            alignItems: "center",
                            boxShadow: sel
                              ? "0 14px 26px rgba(172,93,122,0.15)"
                              : "0 8px 20px rgba(82,42,57,0.04)",
                          }}
                        >
                          {sel && (
                            <div
                              style={{ position: "absolute", top: 8, right: 8 }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#AC5D7A"
                                strokeWidth="2.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              backgroundColor: sel ? "#F0DDE5" : "#F3EAED",
                              borderRadius: 9,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={sel ? "#AC5D7A" : "#7D6268"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="6" cy="6" r="3" />
                              <circle cx="6" cy="18" r="3" />
                              <line x1="20" y1="4" x2="8.12" y2="15.88" />
                              <line x1="14.47" y1="14.48" x2="20" y2="20" />
                            </svg>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#201B1C",
                                lineHeight: 1.25,
                              }}
                            >
                              {s.name}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: 11,
                                color: "#7D6268",
                                marginTop: 3,
                              }}
                            >
                              {s.duration}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: 11,
                                color: "#7D6268",
                                marginTop: 4,
                                lineHeight: 1.35,
                              }}
                            >
                              {s.description}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#B9874D",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.priceLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </>
        )}

        {/* STEP 2: Date & Time */}
        {step === 2 && (
          <>
            <p
              style={{
                fontSize: 20,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                color: "#201B1C",
                marginBottom: 4,
              }}
            >
              When works for you?
            </p>
            <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 12 }}>
              {HOURS_NOTE} {SAME_DAY_NOTE}
            </p>
            {selectedSvc && (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #E4D3D8",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 800, color: "#201B1C" }}
                  >
                    {selectedSvc.name}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 800, color: "#B9874D" }}
                  >
                    {selectedSvc.priceLabel}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45 }}>
                  Estimated duration: {selectedSvc.duration}.{" "}
                  {selectedSvc.hairIncluded ? HAIR_INCLUDED_NOTE : PREP_NOTE}
                </p>
              </div>
            )}

            {/* Flexible toggle */}
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  flexibleDate: !f.flexibleDate,
                  preferredDate: null,
                }))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: form.flexibleDate ? "#F9EFF3" : "#F3EAED",
                border: `1px solid ${form.flexibleDate ? "#AC5D7A" : "#E4D3D8"}`,
                borderRadius: 50,
                padding: "10px 16px",
                cursor: "pointer",
                marginBottom: 16,
                fontSize: 14,
                fontWeight: 500,
                color: form.flexibleDate ? "#AC5D7A" : "#201B1C",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={form.flexibleDate ? "#AC5D7A" : "#7D6268"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {form.flexibleDate ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              I'm flexible with dates
            </button>

            {!form.flexibleDate && (
              <>
                <MiniCalendar
                  year={calYear}
                  month={calMonth}
                  selected={form.preferredDate}
                  availability={availability}
                  loading={availabilityLoading}
                  onSelect={(d) =>
                    setForm((f) => ({
                      ...f,
                      preferredDate: d,
                      flexibleDate: false,
                    }))
                  }
                  onMonthChange={(y, m) => {
                    setCalYear(y);
                    setCalMonth(m);
                  }}
                />
                {form.preferredDate && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 10,
                      padding: "10px 14px",
                      backgroundColor: "#EEF7E9",
                      borderRadius: 10,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#5C8A40"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "#3A6B28",
                        fontWeight: 500,
                      }}
                    >
                      {new Date(
                        form.preferredDate + "T12:00:00",
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        setForm((f) => ({ ...f, preferredDate: null }))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#7D6268"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            <p
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                color: "#7D6268",
                fontWeight: 600,
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              TIME PREFERENCE
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {TIME_PREFS.map((t) => {
                const sel = form.timePreference === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setForm((f) => ({ ...f, timePreference: t.id }))
                    }
                    style={{
                      padding: "12px 8px",
                      border: `1.5px solid ${sel ? "#AC5D7A" : "#E4D3D8"}`,
                      borderRadius: 10,
                      backgroundColor: sel ? "#F9EFF3" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: sel ? "#AC5D7A" : "#201B1C",
                        margin: 0,
                      }}
                    >
                      {t.label}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#7D6268",
                        margin: "2px 0 0",
                      }}
                    >
                      {t.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 3: Your Info */}
        {step === 3 && (
          <>
            <p
              style={{
                fontSize: 20,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                color: "#201B1C",
                marginBottom: 4,
              }}
            >
              Almost there!
            </p>
            <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 20 }}>
              Shawna will text you to confirm the details.
            </p>

            {/* Booking summary */}
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #E4D3D8",
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Service", value: selectedSvc?.name ?? form.service },
                ...(selectedDateLabel
                  ? [{ label: "Date", value: selectedDateLabel }]
                  : []),
                {
                  label: "Time",
                  value:
                    TIME_PREFS.find((t) => t.id === form.timePreference)
                      ?.label ?? form.timePreference,
                },
                {
                  label: "Estimate",
                  value: selectedSvc?.basePrice
                    ? `$${selectedSvc.basePrice + addonsTotal}+`
                    : (selectedSvc?.priceLabel ?? "Consult"),
                },
                { label: "Deposit", value: "$25 non-refundable" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "6px 0",
                    borderBottom: "1px solid #F3EAED",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#7D6268",
                      width: 60,
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{ fontSize: 13, color: "#201B1C", fontWeight: 500 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Add-ons */}
            {selectedSvc && selectedSvc.addOns.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#7D6268",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  ADD-ONS (OPTIONAL)
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedSvc.addOns.map((addon) => {
                    const checked = form.addons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            addons: checked
                              ? f.addons.filter((id) => id !== addon.id)
                              : [...f.addons, addon.id],
                          }))
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: 50,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          border: `1.5px solid ${checked ? "#AC5D7A" : "#E4D3D8"}`,
                          backgroundColor: checked ? "#F9EFF3" : "#fff",
                          color: checked ? "#AC5D7A" : "#201B1C",
                        }}
                      >
                        {addon.name} {addon.priceLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name input */}
            <p
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                color: "#7D6268",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              YOUR NAME *
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #E4D3D8",
                borderRadius: 10,
                backgroundColor: "#fff",
                padding: "0 14px",
                marginBottom: 14,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7D6268"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                placeholder="First & last name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{
                  flex: 1,
                  padding: "14px 0",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  backgroundColor: "transparent",
                  color: "#201B1C",
                }}
              />
            </div>

            {/* Phone input */}
            <p
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                color: "#7D6268",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              PHONE NUMBER *
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #E4D3D8",
                borderRadius: 10,
                backgroundColor: "#fff",
                padding: "0 14px",
                marginBottom: 14,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7D6268"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                type="tel"
                placeholder="(708) 000-0000"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                style={{
                  flex: 1,
                  padding: "14px 0",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  backgroundColor: "transparent",
                  color: "#201B1C",
                }}
              />
            </div>

            {/* Notes input */}
            <p
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                color: "#7D6268",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              NOTES (optional)
            </p>
            <textarea
              placeholder="Hair length, specialty color requests, inspiration, or same-day approval notes..."
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #E4D3D8",
                borderRadius: 10,
                backgroundColor: "#fff",
                fontSize: 14,
                color: "#201B1C",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </>
        )}

        {/* Error */}
        {error && (
          <p
            style={{
              color: "#E04040",
              fontSize: 13,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(58px + env(safe-area-inset-bottom, 0px))",
          padding: "8px 16px",
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTop: "1px solid #E4D3D8",
          zIndex: 20,
          boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",
          backdropFilter: "blur(14px)",
        }}
      >
        {step < 3 ? (
          <button
            onClick={goNext}
            style={{
              width: "100%",
              padding: "12px 0",
              backgroundColor: "#AC5D7A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {step === 1 ? "Choose Date →" : "Enter Your Info →"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "12px 0",
              backgroundColor: "#AC5D7A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.75 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? "Sending…" : "Send Request ✓"}
          </button>
        )}
      </div>
    </div>
  );
}
