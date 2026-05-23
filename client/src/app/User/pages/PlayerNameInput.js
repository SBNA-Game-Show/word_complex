import ZimContainer from "@/app/GlobalComponents/Container";
import ZimButton from "@/app/GlobalComponents/ZimButton";
import ZimInput from "@/app/GlobalComponents/ZimInput";
import { addNewUser } from "@/app/service/User/UserServices";

export default class PlayerNameInput {
  constructor(zim, stage) {
    this.zim = zim;
    this.stage = stage;

    // =========================
    // CONTAINER
    // =========================
    this.container = new ZimContainer(
      zim,
      stage,
      500,
      350,
      "#5F6062",
      250,
      250,
      4,
      4,
      2,
    );

    // =========================
    // INPUT (IMPORTANT FIX)
    // =========================
    this.input = new ZimInput(zim, this.container.component, {
      width: 250,
      height: 40,
      placeholder: "Enter Player Name",
      x: 50,
      y: 50,
      fontSize: 20,
    });

    // =========================
    // BUTTON
    // =========================
    this.button = new ZimButton(
      zim,
      this.container.component,
      200,
      60,
      "Start Game",
      18,
      "#4E3D42",
      50,
      150,
    );

    // =========================
    // ADD TO GRID (IMPORTANT)
    // =========================
    this.container.add(this.input, 1, 1);
    this.container.add(this.button, 2, 1);

    // =========================
    // CLICK EVENT
    // =========================
    this.button.component.tap(async () => {
      const userName = this.input.getValue().trim();
      if (!userName) {
        window.alert("User Name is Empty");
        return;
      }
      try {
        const response = await addNewUser(userName);
        this.input.component.text = "";
        console.log("User Created Data From Backend:", response);
      } catch (err) {
        console.error("Failed to create user:", err);
      }
    });
  }
}
