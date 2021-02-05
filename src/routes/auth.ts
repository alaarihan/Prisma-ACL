import { prisma } from "../common/prisma";
const authRoute = require("express").Router();
import { verify } from "jsonwebtoken";

authRoute.get("/verify-email/:email/:token", async function (req, res) {
  const token = req.params.token;
  const email = req.params.email;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res
      .status(400)
      .send(`No account found for this email address: ${email}`);
  }
  const verificationToken = user.verificationToken
    ? verify(user.verificationToken, process.env.APP_SECRET)
    : false;
  if (!verificationToken) return res.status(400).send("Invalid token!");
  if (
    user.role === "UNVERIFIED" &&
    verificationToken.token === token &&
    verificationToken.type === "email"
  ) {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        role: "USER",
        verificationToken: null,
      },
    });
  } else {
    return res.status(400).send("Invalid token or email already verified!");
  }
  return res.status(200).send("Email has been verified successfully.");
});
export default authRoute;
