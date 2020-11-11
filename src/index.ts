import dotenv from "dotenv"

import createApp from "./app"

dotenv.config()

createApp()
    .then(koa => koa.listen(process.env.PORT ?? 8000))
    .catch(err => console.error(err))