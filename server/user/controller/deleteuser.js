const deleteUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
};

module.exports = deleteUser;
