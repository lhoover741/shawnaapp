import { Router } from "express";
import webpush from "web-push";

const router = Router();

const vapidPublicKey = process.env["VAPID_PUBLIC_KEY"];
const vapidPrivateKey = process.env["VAPID_PRIVATE_KEY"];
const vapidSubject = process.env["VAPID_SUBJECT"] ?? "mailto:admin@ravishingbeaute.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

router.get("/web-push/vapid-public-key", (_req, res) => {
  if (!vapidPublicKey) {
    res.status(503).json({ error: "Web push not configured" });
    return;
  }
  res.json({ publicKey: vapidPublicKey });
});

export { webpush };
export default router;
