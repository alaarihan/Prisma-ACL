import { UserModule } from "./User/User.module";
import { RoleAccessModule } from "./RoleAccess/RoleAccess.module";
import { LogModule } from "./Log/Log.module";
import { createApplication } from "graphql-modules";
import { InputsModule } from "./inputs/inputs.module";
import { AuthModule } from "./auth/auth.module";
import { addSelect } from "./addSelect";
import { jwtAuth } from "../middlewares/jwtAuth";
import { acl } from "../middlewares/acl";
import { SalatModule } from "./Salat/Salat.module";
import { PostModule } from "./Post/Post.module";
import { CategoryModule } from "./Category/Category.module";
// import { logger } from '../middlewares/logger'

export const application = createApplication({
  modules: [
    InputsModule,
    AuthModule,
    LogModule,
    UserModule,
    RoleAccessModule,
    SalatModule,
    PostModule,
    CategoryModule,
  ],
  middlewares: {
    "*": { "*": [jwtAuth, addSelect, acl] },
  },
});
