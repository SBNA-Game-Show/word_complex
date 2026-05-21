const DBManager = require("../config/testdbconfig");

const createUser = require("./repository/createUser");
const User = require("./models/User");
const RegistrationRequest = require("./DTO/RegistrationRequest");

const db = new DBManager();

let userRequest;
let adminRequest;

beforeAll(async () => {
  await db.start();

  userRequest = new RegistrationRequest("testUser");
  adminRequest = new RegistrationRequest("admin", "helloworld", "ADMIN");
});

afterEach(async () => {
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
        expect();
        expect(user.userName).toBe("testUser");
      });
      it("Should create a new admin", async () => {
        const user = await createUser(adminRequest);
        expect();
        expect(user.userName).toBe("admin");
      });
    });
  });
});
