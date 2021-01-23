import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { sendEmail } from "../../common/sendEmail";
import { generateToken } from "../../common/generateToken";
import { prisma } from "../../common/prisma";

export default {
  Query: {
    me: (_parent, args, ctx) => {
      if (!ctx.user || !ctx.user.id) throw new Error("User not found");
      return ctx.user;
    },
  },
  Mutation: {
    signup: async (_parent, args) => {
      args.password = await hash(args.password, 10);
      const generatedToken = generateToken();
      args.verificationToken = sign(
        { token: generatedToken, created: new Date(), type: "email" },
        process.env.APP_SECRET,
        {
          expiresIn: "1d",
        }
      );
      delete args.select;
      const user = await prisma.user.create({ data: args }).catch((err) => {
        throw new Error(`User couldn't be created! ${err.message}`);
      });
      sendEmail
        .send({
          template: "signup",
          message: {
            to: args.email,
            //   attachments: [
            // 	{
            // 	  filename: 'logo.jpg',
            // 	  path: path.resolve('src/email-templates/imgs/logo.jpg'),
            // 	  cid: 'logo',
            // 	},
            //   ],
          },
          locals: {
            user,
            token: generatedToken,
          },
        })
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.error("sending email error happened!!", error);
        });
      delete user.password;
      delete user.verificationToken;
      return {
        token: sign({ userId: user.id }, process.env.APP_SECRET, {
          expiresIn: "30d",
        }),
        user,
      };
    },
    login: async (_parent, args) => {
      const user = await prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error(`No account found for this email: ${args.email}`);
      }
      const passwordValid = await compare(args.password, user.password);
      if (!passwordValid) {
        throw new Error("Invalid password");
      }
      delete user.password;
      delete user.verificationToken;
      return {
        token: sign({ userId: user.id }, process.env.APP_SECRET, {
          expiresIn: "30d",
        }),
        user,
      };
    },
    async verifyUserEmail(_parent, { email, token }) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error(`No account found for this email address: ${email}`);
      }
      const verificationToken = user.verificationToken
        ? verify(user.verificationToken, process.env.APP_SECRET)
        : false;
      if (!verificationToken) throw new Error("Invalid token!");
      if (
        user.role === "UNVERIFIED" &&
        verificationToken.token === token &&
        verificationToken.type === 'email'
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
        throw new Error("Invalid token!");
      }
      return true;
    },
    async forgotPassword(_parent, { email }) {
      let user = await prisma.user
        .findUnique({ where: { email } })
        .catch((err) => undefined);
      if (!user) {
        throw new Error("Account not exists!");
      }
      const generatedToken = generateToken();
      const verificationToken = sign(
        { token: generatedToken, created: new Date(), type: "password" },
        process.env.APP_SECRET,
        {
          expiresIn: "1d",
        }
      );

      user = await prisma.user.update({
        where: { email },
        data: { verificationToken },
      });
      sendEmail
        .send({
          template: "forgotPassword",
          message: {
            to: email,
            //   attachments: [
            // 	{
            // 	  filename: 'logo.jpg',
            // 	  path: path.resolve('src/email-templates/imgs/logo.jpg'),
            // 	  cid: 'logo',
            // 	},
            //   ],
          },
          locals: {
            user,
            token: generatedToken,
          },
        })
        .then((res) => {
          console.log(res);
        })
        .catch((error) => {
          console.error("sending email error happened!!", error);
        });
      return true;
    },
    async resetUserPassword(_parent, { email, token, password }) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error(`No account found for this email address: ${email}`);
      }

      if (user.role === "UNVERIFIED") {
        throw new Error("Verify your email first!");
      }
      let hashedPassword = await hash(password, 10);
      const verificationToken = user.verificationToken
        ? verify(user.verificationToken, process.env.APP_SECRET)
        : false;
      if (!verificationToken) throw new Error("Invalid token!");
      if (verificationToken.token === token && verificationToken.type === 'password') {
        await prisma.user.update({
          where: {
            email,
          },
          data: {
            password: hashedPassword,
            verificationToken: null,
          },
        });
      } else {
        throw new Error("Invalid link");
      }
      return true;
    },
  },
};
