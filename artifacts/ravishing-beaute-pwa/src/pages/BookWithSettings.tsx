import { useEffect, useMemo, useState } from "react";
import Book from "@/pages/Book";

const DEFAULT_SETTINGS = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
  contactPhone: "7085743658",
};

type PublicSettings = typeof DEFAULT_SETTINGS;

function cleanDeposit(value: string) {
  return value.replace(/[^0-9.]/g, "") || DEFAULT_SETTINGS.depositAmount;
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "") || DEFAULT_SETTINGS.contactPhone;
}

function walkTextNodes(root: ParentNode, visitor: (node: Text) => void) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    visitor(node as Text);
    node = walker.nextNode();
  }
}

export default function BookWithSettings() {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<PublicSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }

    void loadSettings();
  }, []);

  const dynamicCopy = useMemo(() => {
    const deposit = cleanDeposit(settings.depositAmount);
    return {
      deposit,
      phone: cleanPhone(settings.contactPhone),
      depositNote: `$${deposit} deposit required to secure approved appointments.`,
      depositRequired: `$${deposit} required`,
      hours: settings.hoursNote,
      closedDays: settings.closedDaysNote,
      sameDay: settings.sameDayNote,
      hairColors: settings.naturalHairColorsNote,
    };
  }, [settings]);

  useEffect(() => {
    function updateSmsLinks(root: ParentNode = document) {
      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="sms:"]'));
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (!href.includes("7085743658") && !/sms:\d+/i.test(href)) continue;
        const bodyStart = href.indexOf("?body=");
        const body = bodyStart >= 0 ? href.slice(bodyStart) : "";
        link.setAttribute("href", `sms:${dynamicCopy.phone}${body}`);
      }
    }

    function updateVisibleCopy(root: ParentNode = document) {
      walkTextNodes(root, (node) => {
        const original = node.nodeValue || "";
        let next = original;
        next = next.replace("$25 non-refundable deposit required to secure approved appointments.", dynamicCopy.depositNote);
        next = next.replace("$25 deposit required to secure approved appointments.", dynamicCopy.depositNote);
        next = next.replace("$25 required", dynamicCopy.depositRequired);
        next = next.replace("$25 deposit", `$${dynamicCopy.deposit} deposit`);
        next = next.replace("Tuesday–Saturday, 8:30 AM – 6:00 PM. Closed Sunday & Monday.", `${dynamicCopy.hours}. ${dynamicCopy.closedDays}.`);
        next = next.replace("Same-day bookings are request-only and must be approved.", dynamicCopy.sameDay);
        next = next.replace("Braiding hair is included in natural colors only: 1, 1B, 2, and 4. Specialty colors must be requested in advance.", dynamicCopy.hairColors);
        if (next !== original) node.nodeValue = next;
      });
    }

    function applySettings(root: ParentNode = document) {
      updateSmsLinks(root);
      updateVisibleCopy(root);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="sms:"]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href.includes("7085743658")) return;
      event.preventDefault();
      const bodyStart = href.indexOf("?body=");
      const body = bodyStart >= 0 ? href.slice(bodyStart) : "";
      window.location.href = `sms:${dynamicCopy.phone}${body}`;
    }

    applySettings();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            applySettings(node as ParentNode);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
    };
  }, [dynamicCopy]);

  return <Book />;
}
