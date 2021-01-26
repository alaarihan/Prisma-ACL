require("dotenv").config();
import "reflect-metadata";
import express = require("express");
import { ApolloServer } from "apollo-server-express";
import { verify } from "jsonwebtoken";
import { application } from "./modules/application";
import { prisma } from "./common/prisma";

const schema = application.createSchemaForApollo();

const server = new ApolloServer({
  schema,
  context: async ({ req }) => {
    if (req.body.operationName === "IntrospectionQuery") return;
    let authScope = "";
    let user;
    if (req.headers && req.headers.authorization) {
      authScope = req.headers.authorization;
    }
    const token = authScope.replace("Bearer ", "");
    if (token.length) {
      const { userId } = verify(token, process.env.APP_SECRET);
      if (userId) {
        user = await prisma.user
          .findUnique({
            where: { id: userId },
            rejectOnNotFound: true,
            select: {
              id: true,
              email: true,
              country: true,
              dandaraCenter: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          })
          .catch((err) => {
            throw err;
          });
      }
    }
    return {
      req,
      user,
    };
  },
});

const app = express();
server.applyMiddleware({ app, path: "/graphql" });

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Path, Lang"
  );
  next();
});
app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
);
