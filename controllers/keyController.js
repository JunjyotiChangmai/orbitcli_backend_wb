const pool = require("../db");
const jwt = require("jsonwebtoken");

async function storeUserToken(req, res) {
    try {
        const { accessKey } = req.body;
        const userId = req.user.userId; // from JWT

        if (!accessKey) {
            return res.status(400).json({ error: "API key is required" });
        }

        // checking already present or not
        const existingKey = await pool.query(
            "SELECT * FROM accesskeys WHERE accessKey = $1",
            [accessKey]
        );

        if (existingKey.rows.length > 0) {
            return res.status(400).json({
                error: "This access key already exists. Please try a new one."
            });
        }

        // adding new accessKey
        const result = await pool.query(
            "INSERT INTO accesskeys (user_id, accessKey) VALUES ($1, $2) RETURNING *",
            [userId, accessKey]
        );

        res.status(201).json({
            message: "Token saved successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function storeLLMKey(req, res) {
    try {
        const { provider, apiKey } = req.body;
        const userId = req.user.userId;

        if (!provider || !apiKey) {
            return res.status(400).json({ error: "Provider and API key are required" });
        }

        const result = await pool.query(
            "INSERT INTO llm_keys (user_id, provider, api_key) VALUES ($1, $2, $3) RETURNING *",
            [userId, provider, apiKey]
        );

        res.status(201).json({
            message: "LLM API key saved successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


async function checkAccessKey(req, res) {
    try {
        const { accessKey } = req.body;

        if (!accessKey) {
            return res.status(400).json({ error: "accessKey is required" });
        }

        // Check in DB
        const result = await pool.query(
            "SELECT * FROM accesskeys WHERE accesskey = $1",
            [accessKey]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Invalid accessKey" });
        }

        const record = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            {
                userId: record.user_id,
                accessKey: record.accesskey
            },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            message: "AccessKey valid",
            userId: record.user_id,
            accessKey: record.accesskey,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getLLMKeysForUser(req, res) {
    try {
        const userId = req.user.userId; // from JWT

        const result = await pool.query(
            "SELECT id, provider, api_key, created_at FROM llm_keys WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        return res.status(200).json({
            userId,
            total: result.rows.length,
            keys: result.rows
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = { storeUserToken, storeLLMKey, checkAccessKey, getLLMKeysForUser };
