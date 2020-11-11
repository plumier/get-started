import "@plumier/typeorm"

import dotenv from "dotenv"
import { join } from "path"
import supertest from "supertest"
import { getConnection } from "typeorm"

import createApp from "../src/app"
import { adminToken, createUser, ignoreProps, userToken } from "./shared"


async function createTodo(app: any, userToken: string) {
    const { body } = await await supertest(app.callback())
        .post("/api/v1/todos")
        .send({ message: "lorem ipsum dolor sit amet" })
        .set("Authorization", `Bearer ${userToken}`)
    return { id: body.id }
}

dotenv.config({ path: join(__dirname, ".env-test") })

afterEach(async () => {
    const con = getConnection()
    if (con.isConnected)
        await con.close()
})

describe("Comment Spec", () => {
    it("Should not allow non login user to comment", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const todo = await createTodo(app, user.token)
        await supertest(app.callback())
            .post(`/api/v1/todos/${todo.id}/comments`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .expect(403)
    })
    it("Should automatically add comment owner with current login user", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const todo = await createTodo(app, user.token)
        const { body: comment } = await supertest(app.callback())
            .post(`/api/v1/todos/${todo.id}/comments`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        expect(body).toMatchSnapshot({ ...ignoreProps, user: ignoreProps })
    })
    it("Should only the owner of the comment or Admin can modify", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const todo = await createTodo(app, user.token)
        const { body: comment } = await supertest(app.callback())
            .post(`/api/v1/todos/${todo.id}/comments`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${userToken}`)
            .expect(401)
    })
    it("Should only the owner of the comment or Admin can delete", async () => {
        const app = await createApp({ mode: "production" })
        const user = await createUser(app)
        const todo = await createTodo(app, user.token)
        const { body: comment } = await supertest(app.callback())
            .post(`/api/v1/todos/${todo.id}/comments`)
            .send({ message: "lorem ipsum dolor sit amet" })
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
        await supertest(app.callback())
            .delete(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .expect(401)
        await supertest(app.callback())
            .delete(`/api/v1/todos/${todo.id}/comments/${comment.id}`)
            .set("Authorization", `Bearer ${user.token}`)
            .expect(200)
    })
})