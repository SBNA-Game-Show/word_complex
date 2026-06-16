const demoUsers = [
  {
    id: "reader-1",
    name: "Anthony",
    nickname: "Ace",
    username: "anthony",
    password: "demo123",
    role: "Level 3 Reader",
    stars: 240,
  },
  {
    id: "reader-2",
    name: "Maya",
    nickname: "Mimi",
    username: "maya",
    password: "reader",
    role: "Story Builder",
    stars: 180,
  },
  // TEMPORARY admin account — needs to be deleted later once real auth (Firebase)
  // is fetching the admin claim. The `isAdmin` flag is what gates the admin panel;
  // in production it comes from the auth token, not a hardcoded user.
  {
    id: "admin-1",
    name: "Admin",
    nickname: "Admin",
    username: "admin",
    password: "password",
    role: "ADMIN",
    isAdmin: true,
    stars: 0,
  },
];

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    nickname: user.nickname,
    username: user.username,
    role: user.role,
    isAdmin: Boolean(user.isAdmin),
    stars: user.stars,
  };
}

export async function loginWithPassword({ username, password }) {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const normalizedUsername = username.trim().toLowerCase();
  const user = demoUsers.find(
    (candidate) =>
      candidate.username === normalizedUsername && candidate.password === password
  );

  if (!user) {
    throw new Error("That demo login did not match. Try anthony / demo123.");
  }

  return toPublicUser(user);
}

export async function signUpWithPassword({ name, nickname, username, password }) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const trimmedName = name.trim();
  const trimmedNickname = nickname.trim();
  const normalizedUsername = username.trim().toLowerCase();

  if (!trimmedName || !trimmedNickname || !normalizedUsername || !password) {
    throw new Error("Fill out every field to create a temporary player.");
  }

  if (password.length < 4) {
    throw new Error("Use at least 4 characters for the prototype password.");
  }

  const usernameTaken = demoUsers.some(
    (candidate) => candidate.username === normalizedUsername
  );

  if (usernameTaken) {
    throw new Error("That username is already used in this demo session.");
  }

  const user = {
    id: `temp-${Date.now()}`,
    name: trimmedName,
    nickname: trimmedNickname,
    username: normalizedUsername,
    password,
    role: "New Reader",
    stars: 0,
  };

  demoUsers.push(user);
  return toPublicUser(user);
}

export const demoLoginHint = {
  username: demoUsers[0].username,
  password: demoUsers[0].password,
};

// TEMPORARY — remove with the hardcoded admin account once real auth is wired.
export const adminLoginHint = {
  username: "admin",
  password: "password",
};
