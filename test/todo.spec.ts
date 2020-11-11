import "@plumier/typeorm"

import dotenv from "dotenv"
import { join } from "path"
import supertest from "supertest"
import { getConnection } from "typeorm"

import createApp from "../src/app"
import { adminToken, createUser, ignoreProps, userToken } from "./shared"

dotenv.config({ path: join(__dirname, ".env-test") })

afterEach(async () => {
    const con = getConnection()
    if (con.isConnected)
        await con.close()
})


describe("Todo Spec", () => {
    it("Should not allow non login user to create todo", async () => {
        const app = await createApp({ mode: "production" })
        await supertest(app.callback())
            .post("/api/v1/todos")
            .send({ message: "lorem ipsum dolor sit amet" })
            .expect(403)
    })
    it("Should automatically assign todo owner", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const { body: todo } = await supertest(app.callback())
            .post("/api/v1/todos")
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/todos/${todo.id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        expect(body).toMatchSnapshot({ ...ignoreProps, user: ignoreProps })
    })
    it("Should only the owner of the todo or Admin can modify", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const { body: todo } = await supertest(app.callback())
            .post("/api/v1/todos")
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}`)
            .send({ completed: true })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}`)
            .send({ completed: false })
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}`)
            .send({ completed: false })
            .set("Authorization", `Bearer ${userToken}`)
            .expect(401)
    })
    it("Should only the owner of the todo or Admin can delete", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const { body: todo } = await supertest(app.callback())
            .post("/api/v1/todos")
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .delete(`/api/v1/todos/${todo.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .expect(401)
        await supertest(app.callback())
            .delete(`/api/v1/todos/${todo.id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
    })
    it("Should not showing user sensitive data on user filed when accessed by other user", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const { body: todo } = await supertest(app.callback())
            .post("/api/v1/todos")
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/todos/${todo.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .expect(200)
        expect(body.user.email).toBeUndefined()
    })
})