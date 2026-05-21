const bcrypt = require("bcrypt");

class PasswordHandler {
  constructor(password) {
    this.password = password;
    this.saltRounds = 10;
  }

  // Generate hashed password
  async encryptPassword() {
    try {
      const hashedPassword = await bcrypt.hash(this.password, this.saltRounds);

      return hashedPassword;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Compare password with hash
  async comparePassword(hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(this.password, hashedPassword);

      return isMatch;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = PasswordHandler;
