const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

// ==========================================
// CREATE USER
// ==========================================
const createUser = async (registrationRequest) => {
  try {
    const user = new User({
      _id: uuidv4(),
      userName: registrationRequest.userName,
      password: registrationRequest.password,
      role: registrationRequest.role,
    });

    const savedUser = await user.save();

    if (!savedUser) {
      throw new Error("UNABLE_TO_SAVE_USER");
    }

    return savedUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = createUser;
