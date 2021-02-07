require("dotenv").config();
import "reflect-metadata";
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { schema } from './nexusSchema'
import authRoute from "./routes/auth"
import { createContext } from "./context"

const app: FastifyInstance = Fastify({})
app.register(mercurius, {
  schema,
  context: createContext,
  graphiql: 'playground',
  playgroundHeaders (window) {
    return {
      authorization: `bearer ${window.sessionStorage.getItem('token')}`
    }
  }
})

const start = async () => {
  try {
    // await app.ready()
    // app.graphql.addHook('preExecution', async function (schema, document, context) {
    //   console.log('preExecution called', document)
    //   return {
    //     document,
    //     errors: [
    //       new Error('foo')
    //     ]
    //   }
    // })

    await app.listen(5000)

    const address = app.server.address()
    const port = typeof address === 'string' ? address : address?.port
    console.log(`🚀 Server ready at http://localhost:${port}/playground`)
    
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
