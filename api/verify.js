export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ status: "error", message: "Method Not Allowed" });
    }

    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ status: "error", message: "User ID missing" });
        }

        const ip =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "unknown";

        global.verifiedUsers = global.verifiedUsers || {};

        if (global.verifiedUsers[user_id]) {
            return res.status(200).json({
                status: "already_verified",
                ip: ip
            });
        }

        global.verifiedUsers[user_id] = {
            ip: ip,
            time: new Date().toISOString()
        };

        return res.status(200).json({
            status: "verified",
            ip: ip
        });

    } catch (error) {
        return res.status(500).json({ status: "error", message: "Server Error" });
    }
              }
