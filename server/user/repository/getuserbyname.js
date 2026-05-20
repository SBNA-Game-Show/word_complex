const User = require("../models/User");

const getUserByName = async (username) => {
  try {
    const user = await User.findOne({ userName: username });

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = getUserByName;
