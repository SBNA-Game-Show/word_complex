const RegistrationRequest = require("../DTO/RegistrationRequest");
const addNewUser = require("../service/addnewuser");

// ==========================================
// REGISTER USER CONTROLLER
// ==========================================
const registerUser = async (req, res) => {
  console.log("Registration endpoint hit");

  try {
    // ==========================================
    // EXTRACT DATA
    // ==========================================
    const { userName, password, role } = req.body;

    // ==========================================
    // DTO VALIDATION
    // ==========================================
    const registrationRequest = new RegistrationRequest(
      userName,
      password,
      role,
    );

    // ==========================================
    // SERVICE CALL
    // ==========================================
    const user = await addNewUser(registrationRequest);

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(201).json({
      success: true,
      message: `${user.role} registered successfully`,
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = registerUser;
