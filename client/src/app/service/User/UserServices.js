"use server";

const EXPRESS_SERVER_URL = "http://express-server:5000/api/v1/user";

export const addNewUser = async (userName) => {
  const response = await fetch(`${EXPRESS_SERVER_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName }),
  });

  return await response.json();
};
