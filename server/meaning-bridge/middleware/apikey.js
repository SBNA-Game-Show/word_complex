const API_KEY_HEADER = "x-meaning-bridge-api-key";

function isMeaningBridgeApiKeyRequired() {
  return (
    String(process.env.MEANING_BRIDGE_REQUIRE_API_KEY || "")
      .trim()
      .toLowerCase() === "true"
  );
}

function getConfiguredMeaningBridgeApiKey() {
  return String(process.env.MEANING_BRIDGE_API_KEY || "").trim();
}

function requireMeaningBridgeApiKey(req, res, next) {
  if (!isMeaningBridgeApiKeyRequired()) {
    return next();
  }

  const configuredApiKey = getConfiguredMeaningBridgeApiKey();

  if (!configuredApiKey) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        "Meaning Bridge API key protection is enabled but no server API key is configured.",
    });
  }

  const providedApiKey = String(req.get(API_KEY_HEADER) || "").trim();

  if (!providedApiKey) {
    return res.status(401).json({
      success: false,
      ok: false,
      error: "Meaning Bridge API key is required.",
    });
  }

  if (providedApiKey !== configuredApiKey) {
    return res.status(403).json({
      success: false,
      ok: false,
      error: "Invalid Meaning Bridge API key.",
    });
  }

  return next();
}

module.exports = {
  API_KEY_HEADER,
  isMeaningBridgeApiKeyRequired,
  getConfiguredMeaningBridgeApiKey,
  requireMeaningBridgeApiKey,
};
