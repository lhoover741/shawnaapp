import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "@/lib/push";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  const btn = document.getElementById("installBtn");
  if (btn) btn.style.display = "block";
});

window.addEventListener("load", () => {
  const btn = document.getElementById("installBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      console.log("Install:", outcome);
    });
  }

  void registerServiceWorker().catch((error) => {
    console.error("[RB Push] Service worker registration failed", error);
  });
});

createRoot(document.getElementById("root")!).render(<App />);
