const User = require("../models/User");

const getUserByName = async (userName) => {
  try {
    const user = await User.findOne({ userName: userName });

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = getUserByName;
