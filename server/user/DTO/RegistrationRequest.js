class RegistrationRequest {
  constructor(userName, password = null, role = "USER") {
    // ==========================================
    // USERNAME VALIDATION
    // ==========================================
    if (!userName || typeof userName !== "string") {
      throw new Error("INVALID_USER_NAME_TYPE");
    }

    const trimmedUserName = userName.trim();

    if (trimmedUserName.length < 4) {
      throw new Error("USERNAME_TOO_SHORT");
    }

    // ==========================================
    // ROLE VALIDATION
    // ==========================================
    const allowedRoles = ["USER", "ADMIN"];

    if (!allowedRoles.includes(role)) {
      throw new Error("INVALID_ROLE");
    }

    // ==========================================
    // PASSWORD VALIDATION
    // ==========================================
    if (role === "ADMIN") {
      if (!password || typeof password !== "string") {
        throw new Error("INVALID_PASSWORD");
      }

      if (password.length < 6) {
        throw new Error("PASSWORD_TOO_SHORT");
      }
    }

    this.userName = trimmedUserName;
    this.password = password;
    this.role = role;
  }
}

module.exports = RegistrationRequest;
