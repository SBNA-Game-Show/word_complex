const path = require("path");
const { getAdminAuth, getAdminFirestore } = require("../config/firebaseAdmin");

/*
 * Admin gate for admin-only routes.
 *
 * Expects an "Authorization: Bearer <Firebase ID token>" header. It verifies the
 * token, then reads the admin flag from Firestore at
 * users/{uid}/private/account.isAdmin (source of truth). Fails closed:
 *   - 401 when the token is missing or invalid
 *   - 403 when the caller is authenticated but not an admin
 *   - 500 when the admin check itself cannot run (e.g. misconfigured server)
 * The client attaches the token via adminAuthInterceptor.js.
 */
const unauthorizedPage = path.join(__dirname, "../views/unauthorized.html");

const requireAdmin = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/i);

  if (!match) {
    return res.status(401).sendFile(unauthorizedPage);
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(match[1]);
  } catch {
    return res.status(401).sendFile(unauthorizedPage);
  }

  try {
    const snap = await getAdminFirestore()
      .doc(`users/${decoded.uid}/private/account`)
      .get();

    const isAdmin = snap.exists && snap.data().isAdmin === true;
    if (!isAdmin) {
      return res.status(403).sendFile(unauthorizedPage);
    }

    req.adminUser = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (err) {
    console.error("requireAdmin: admin check failed:", err);
    return res.status(500).sendFile(unauthorizedPage);
  }
};

module.exports = requireAdmin;