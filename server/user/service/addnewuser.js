const createUser = require("../repository/createUser");
const registrationRequest = require("../DTO/RegistrationRequest");
const findByUserName = require("./finduserbyname");

const addNewUser = async (registrationRequest) => {
  try {
    const existingUser = await findByUserName(registrationRequest.userName);

    if (existingUser) {
      throw new Error("USER_ALREADY_EXISTS_BY_GIVEN_NAME");
    }

    const user = await createUser(registrationRequest);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = addNewUser;
