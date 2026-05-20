async function initializeGame(req, res) {
  return res.status(200).json({ success: "Hello from word Hunt" });
}

module.exports = { initializeGame };
