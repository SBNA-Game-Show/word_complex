async function initializeGame(req, res) {
  return res
    .status(200)
    .json({ success: "Hello from Passage Reconstruction " });
}

module.exports = { initializeGame };
