import { Hono } from 'hono'
import { renderer } from './renderer'
import { handlerProxy } from './controller/proxy'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <>
      <h1>Hello!</h1>
      <p>This is a proxy server, currently running normally.</p>
    </>
  )
})

app.get('/proxy', handlerProxy)

export default app
