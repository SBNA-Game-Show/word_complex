
async function initializeGame(req, res) {
  return res.status(200).json({ success: "Hello from Fill in the Blanks " });
}

module.exports = { initializeGame };
