const pool = require("../db.js");

// Get all access keys for the authenticated user
async function getAllUserTokens(req, res) {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            "SELECT id, accesskey, created_at FROM accesskeys WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        res.status(200).json({
            userId,
            total: result.rows.length,
            accessKeys: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Delete user access key
async function deleteUserToken(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const existing = await pool.query(
            "SELECT * FROM accesskeys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Token not found for this user" });
        }

        await pool.query(
            "DELETE FROM accesskeys WHERE id = $1",
            [id]
        );

        res.status(200).json({ message: "Access key deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// update api key
async function updateLLMKey(req, res) {
    try {
        const { id, provider, apiKey } = req.body;
        const userId = req.user.userId;

        if (!id || !provider || !apiKey) {
            return res.status(400).json({ error: "id, provider and apiKey are required" });
        }

        // Check ownership
        const existing = await pool.query(
            "SELECT * FROM llm_keys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "LLM key not found for this user" });
        }

        const result = await pool.query(
            "UPDATE llm_keys SET provider = $1, api_key = $2 WHERE id = $3 RETURNING *",
            [provider, apiKey, id]
        );

        res.status(200).json({
            message: "LLM key updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Delete LLM key
async function deleteLLMKey(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const existing = await pool.query(
            "SELECT * FROM llm_keys WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "LLM key not found for this user" });
        }

        await pool.query(
            "DELETE FROM llm_keys WHERE id = $1",
            [id]
        );

        res.status(200).json({ message: "LLM key deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {updateLLMKey, deleteLLMKey, deleteUserToken, getAllUserTokens};