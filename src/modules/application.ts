import { UserModule } from './User/User.module'
import { LogModule } from './Log/Log.module'
import { createApplication } from 'graphql-modules'
import { InputsModule } from './inputs/inputs.module'
import { AuthModule } from './auth/auth.module'
import { addSelect } from './addSelect'
import { jwtAuth } from '../middlewares/jwtAuth'
// import { logger } from '../middlewares/logger'

export const application = createApplication({
  modules: [InputsModule, AuthModule, LogModule, UserModule],
  middlewares: {
    '*': { '*': [jwtAuth, addSelect] },
  },
})
