const {Router} = require("express");
const { deleteUserToken, updateLLMKey, deleteLLMKey, getAllUserTokens } = require("../controllers/controller");
const { registerUser, loginUser } = require("../controllers/auth");
const auth = require("../middleware/auth");
const { storeLLMKey, storeUserToken, checkAccessKey, getLLMKeysForUser } = require("../controllers/keyController");

const router = Router();

// to handle authentication
router.post("/register", registerUser);
router.post("/login", loginUser);

// User access keys
router.post("/save-token", auth, storeUserToken);
router.delete("/delete-token/:id", auth, deleteUserToken);
router.get("/tokens", auth, getAllUserTokens);

// LLM keys
router.post("/save-llm-key", auth, storeLLMKey);
router.put("/update-llm-key", auth, updateLLMKey);
router.delete("/delete-llm-key/:id", auth, deleteLLMKey);
router.get("/llm/keys", auth, getLLMKeysForUser);

// to check accesskey for cli authentication
router.post("/check-accesskey", checkAccessKey);

// protected route example
router.get("/profile", auth, (req, res) => {
  res.status(200).json({
    message: "Access granted",
    user: req.user
  });
});

module.exports = router;