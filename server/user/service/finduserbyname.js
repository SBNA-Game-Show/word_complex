const getUserByName = require("../repository/getuserbyname");

const findByUserName = async (userName) => {
  try {
    if (!userName) {
      throw new Error("USER_NAME_IS_MISSING");
    }

    const user = await getUserByName(userName);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = findByUserName;
