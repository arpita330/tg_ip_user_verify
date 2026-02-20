import crypto from "crypto";

const BOT_TOKEN = "7369737719:AAEo1Jx0iJa0DFYcVkFnP4s-D-EM7o12NGk"; // keep secret in env later

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { initData } = req.body;

        if (!initData) {
            return res.status(400).json({ error: "Missing initData" });
        }

        const params = new URLSearchParams(initData);
        const hash = params.get("hash");
        params.delete("hash");

        const dataCheckString = [...params.entries()]
            .sort()
            .map(([k, v]) => `${k}=${v}`)
            .join("\n");

        // 🔥 CORRECT SECRET KEY
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

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket.remoteAddress ||
            "unknown";

        return res.status(200).json({
            status: "verified",
            user_id: user.id,
            ip: ip
        });

    } catch (err) {
        return res.status(500).json({ error: "Server Error" });
    }
}
