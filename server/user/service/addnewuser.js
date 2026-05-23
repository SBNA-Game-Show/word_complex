const createUser = require("../repository/createUser");
const registrationRequest = require("../DTO/RegistrationRequest");
const findByUserName = require("./finduserbyname");
const PasswordHandler = require("./passwordhandler");
const { TopologyDescription } = require("mongodb");

const addNewUser = async (registrationRequest) => {
  try {
    const existingUser = await findByUserName(registrationRequest.userName);

    //check if the user already exists

    if (existingUser) {
      /**
       * then we will be returning the user id for the user. 
       * ASSUMING ITS THE SAME USER
       */
      throw new Error("USER_ALREADY_EXISTS_BY_GIVEN_NAME");
    }
    //password hashing

    if (registrationRequest.password) {
      const encryptor = new PasswordHandler(registrationRequest.password);
      const hashedPassword = await encryptor.encryptPassword();
      registrationRequest.password = hashedPassword;
    }
    //saving user

    const user = await createUser(registrationRequest);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = addNewUser;
