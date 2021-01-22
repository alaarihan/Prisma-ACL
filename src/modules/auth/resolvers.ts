import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { sendEmail } from "../../common/sendEmail";
import { generateToken } from "../../common/generateToken";

export default {
  Query: {
    me: (_parent, args, ctx) => {
      return ctx.prisma.user.findUnique(args);
    },
  },
  Mutation: {
    signup: async (_parent, args, ctx) => {
      args.password = await hash(args.password, 10);
      args.verificationToken = generateToken();
      delete args.select;
      const user = await ctx.prisma
        .user.create({ data: args })
        .catch((err) => {
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
            // 	  path: path.resolve('src/email-templates/signup/imgs/logo.jpg'),
            // 	  cid: 'logo',
            // 	},
            //   ],
          },
          locals: {
            user,
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
        token: sign({ userId: user.id }, process.env.APP_SECRET, { expiresIn: "14d" }),
        user,
      };
    },
    login: async (_parent, args, ctx) => {
      const user = await ctx.prisma
        .user.findUnique({ where: { email: args.email } });
      if (!user) {
        throw new Error(`No user found for email: ${args.email}`);
      }
      const passwordValid = await compare(args.password, user.password);
      if (!passwordValid) {
        throw new Error("Invalid password");
      }
      delete user.password;
      delete user.verificationToken;
      return {
        token: sign({ userId: user.id }, process.env.APP_SECRET, {
          expiresIn: "14d",
        }),
        user,
      };
    },
  },
};
