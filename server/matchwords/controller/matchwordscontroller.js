async function initializeGame(req, res) {
  return res.status(200).json({ success: "Hello from Match the words" });
}

module.exports = { initializeGame };
