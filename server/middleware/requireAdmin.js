const path = require("path");

/*
 * Temporary Middleware to protect important routes.
 * Needs Discussion on Auth System
 */

const requireAdmin = (req, res, next) => {
  const role = req.headers["x-role"];

  if (!role) {
    return res
      .status(401)
      .sendFile(path.join(__dirname, "../views/unauthorized.html"));
  }

  if (role !== "ADMIN") {
    return res
      .status(403)
      .sendFile(path.join(__dirname, "../views/unauthorized.html"));
  }

  next();
};

module.exports = requireAdmin;
