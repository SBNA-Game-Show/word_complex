const DBManager = require("../config/testdbconfig");

const User = require("./models/User");
const RegistrationRequest = require("./DTO/RegistrationRequest");

// Repository Methods Import
const createUser = require("./repository/createUser");
const getUserByName = require("./repository/getuserbyname");

// Service Methods Import
const addNewUser = require("./service/addnewuser");

// Controller Methods Import
const registerUser = require("./controller/registeruser");

const db = new DBManager();

let userRequest;
let adminRequest;

beforeAll(async () => {
  await db.start();

  userRequest = new RegistrationRequest("testUser");
  adminRequest = new RegistrationRequest("admin", "helloworld", "ADMIN");
});

afterEach(async () => {
  jest.resetModules();
  jest.restoreAllMocks();
  await db.cleanup();
});

afterAll(async () => {
  await db.stop();
});

describe("User Tests", () => {
  describe("User DTO tests", () => {
    describe("Registration Request Tests", () => {
      it("should throw if username is too short", () => {
        expect(() => {
          new RegistrationRequest("tes");
        }).toThrow("USERNAME_TOO_SHORT");
      });

      it("should throw if username is invalid type", () => {
        expect(() => {
          new RegistrationRequest(1234);
        }).toThrow("INVALID_USER_NAME_TYPE");
      });

      it("should throw if role is invalid", () => {
        expect(() => {
          new RegistrationRequest("validname", "pass123", "SUPER");
        }).toThrow("INVALID_ROLE");
      });

      it("should throw if admin has no password", () => {
        expect(() => {
          new RegistrationRequest("admin", null, "ADMIN");
        }).toThrow("INVALID_PASSWORD");
      });
      it("should throw if admin password is length is less than 6", () => {
        expect(() => {
          new RegistrationRequest("admin", "hello", "ADMIN");
        }).toThrow("PASSWORD_TOO_SHORT");
      });
    });
  });
  describe("User Repository Layer tests", () => {
    describe("Create User Tests", () => {
      it("Should create a new user", async () => {
        const user = await createUser(userRequest);

        expect(user).toBeDefined();
        expect(user.userName).toBe("testUser");
        expect(user.role).toBe("USER");
      });

      it("Should create a new admin", async () => {
        const user = await createUser(adminRequest);

        expect(user).toBeDefined();
        expect(user.userName).toBe("admin");
        expect(user.role).toBe("ADMIN");
      });
      it("should throw DB Error. Testing the catch block", async () => {
        const User = require("./models/User");

        const saveMock = jest
          .spyOn(User.prototype, "save")
          .mockRejectedValueOnce(new Error("DB_ERROR"));

        const createUser = require("./repository/createUser");

        await expect(createUser(userRequest)).rejects.toThrow("DB_ERROR");

        saveMock.mockRestore();
      });
    });
    describe("Get User By Name Tests", () => {
      it("should get user by name", async () => {
        const request = new RegistrationRequest("user");

        const created = await createUser(request);

        const user = await getUserByName(created.userName);

        expect(user).toBeDefined();
        expect(user.userName).toBe("user");
      });
      it("should throw DB ERROR. Testing the catch block", async () => {
        const findMock = jest
          .spyOn(User, "findOne")
          .mockRejectedValueOnce(new Error("DB_ERROR"));

        await expect(getUserByName("testUser")).rejects.toThrow("DB_ERROR");

        findMock.mockRestore();
      });
    });
  });
  describe("User Service Layer tests", () => {
    describe("Add New User Tests", () => {
      it("should Register a new user", async () => {
        const userReg = new RegistrationRequest("Jack");

        const savedUser = await addNewUser(userReg);

        expect(savedUser).toBeDefined();
        expect(savedUser.userName).toBe("Jack");
        expect(savedUser.role).toBe("USER");
      });
      it("should not register user. User Already exists", async () => {
        const userReg = new RegistrationRequest("Jack");

        const savedUser = await addNewUser(userReg);
        expect(savedUser).toBeDefined();
        expect(savedUser.userName).toBe("Jack");
        expect(savedUser.role).toBe("USER");

        expect(addNewUser(userReg)).rejects.toThrow(
          "USER_ALREADY_EXISTS_BY_GIVEN_NAME",
        );
      });
      it("should Register a new admin", async () => {
        const adminReg = new RegistrationRequest("Jack", "helloworld", "ADMIN");

        const savedAdmin = await addNewUser(adminReg);

        expect(savedAdmin).toBeDefined();
        expect(savedAdmin.userName).toBe("Jack");
        expect(savedAdmin.role).toBe("ADMIN");
      });
      it("should not register Admin. Admin Already exists", async () => {
        const adminReg = new RegistrationRequest("Jack", "helloworld", "ADMIN");

        const savedAdmin = await addNewUser(adminReg);
        expect(savedAdmin).toBeDefined();
        expect(savedAdmin.userName).toBe("Jack");
        expect(savedAdmin.role).toBe("ADMIN");

        expect(addNewUser(adminReg)).rejects.toThrow(
          "USER_ALREADY_EXISTS_BY_GIVEN_NAME",
        );
      });
    });
  });

  describe("User Controller Layer tests", () => {});
});
