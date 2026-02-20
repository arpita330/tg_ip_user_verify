import crypto from "crypto";

const BOT_TOKEN = "7369737719:AAEo1Jx0iJa0DFYcVkFnP4s-D-EM7o12NGk";

let usedSignatures = {};
let verifiedUsers = {};

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {

        const { initData, fingerprint } = req.body;

        if (!initData || !fingerprint) {
            return res.status(400).json({ error: "Missing Data" });
        }

        const params = new URLSearchParams(initData);
        const hash = params.get("hash");
        params.delete("hash");

        const dataCheckString = [...params.entries()]
            .sort()
            .map(([k, v]) => `${k}=${v}`)
            .join("\n");

        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(BOT_TOKEN)
            .digest();

        const hmac = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");

        if (hmac !== hash) {
            return res.status(403).json({ error: "Invalid Telegram Data" });
        }

        const user = JSON.parse(params.get("user"));
        const userId = user.id;

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket.remoteAddress ||
            "unknown";

        // 🔐 CREATE UNIQUE SIGNATURE
        const signatureRaw =
            ip +
            fingerprint.canvas +
            fingerprint.webgl +
            fingerprint.screen +
            fingerprint.timezone +
            fingerprint.cpu +
            fingerprint.memory;

        const signature = crypto
            .createHash("sha256")
            .update(signatureRaw)
            .digest("hex");

        // 🚫 MULTI ACCOUNT BLOCK
        if (usedSignatures[signature] && usedSignatures[signature] !== userId) {
            return res.status(403).json({
                status: "multi_account_blocked"
            });
        }

        usedSignatures[signature] = userId;
        verifiedUsers[userId] = signature;

        return res.status(200).json({
            status: "verified"
        });

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
            }
