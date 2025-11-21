const pool = require("../db");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// to store user acceskey
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

// to varify the given api key is real or not
async function validateLLMKey(provider, apiKey) {
    if (provider === "gemini" && !apiKey.startsWith("AIza")) {
        return { valid: false, reason: "Invalid Gemini API key format" };
    }

    if (provider === "gpt" && !apiKey.startsWith("sk-")) {
        return { valid: false, reason: "Invalid OpenAI API key format" };
    }

    if (provider === "claude" && !apiKey.startsWith("sk-ant-")) {
        return { valid: false, reason: "Invalid Anthropic API key format" };
    }

    let url = "";
    let headers = {};

    if (provider === "gemini") {
        url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        headers = {};
    }

    if (provider === "gpt") {
        url = "https://api.openai.com/v1/models";
        headers = { Authorization: `Bearer ${apiKey}` };
    }

    if (provider === "claude") {
        url = "https://api.anthropic.com/v1/models";
        headers = {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        };
    }

    try {
        await axios.get(url, { headers });
        return { valid: true };
    } catch (err) {
        return { valid: false, reason: "Provider rejected API key" };
    }
}

// to store LLM api key
async function storeLLMKey(req, res) {
    try {
        const { provider, apiKey } = req.body;
        const userId = req.user.userId;

        if (!provider || !apiKey) {
            return res.status(400).json({ error: "Provider and API key are required" });
        }

        const validation = await validateLLMKey(provider, apiKey);

        if (!validation.valid) {
            return res.status(400).json({
                error: "Invalid API Key",
                reason: validation.reason
            });
        }

        const result = await pool.query(
            "INSERT INTO llm_keys (user_id, provider, api_key) VALUES ($1, $2, $3) RETURNING *",
            [userId, provider, apiKey]
        );

        return res.status(201).json({
            message: "LLM API key validated & saved successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// to validate the accesskey provided by the user is already present inside the database or not
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

// to get all LLM api keys of a particular user
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
