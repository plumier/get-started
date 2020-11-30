import "@plumier/typeorm"

import supertest from "supertest"
import { getConnection, getManager } from "typeorm"

import { User } from "../src/entity/user"
import createApp from "../src/app"
import dotenv from "dotenv"
import { join } from "path"
import bcrypt from "bcryptjs"
import { adminToken, createToken, userToken, ignoreProps } from "./shared"
import { AppRole } from "../src/entity/base"

dotenv.config({ path: join(__dirname, ".env-test") })

afterEach(async () => {
    const con = getConnection()
    if (con.isConnected)
        await con.close()
})


describe("User Spec", () => {
    it("Should allow anyone to register", async () => {
        const app = await createApp({ mode: "production" })
        await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
    })
    it("Should hash password during registration", async () => {
        const app = await createApp({ mode: "production" })
        const pwd = "john0doe#"
        const { body } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: pwd,
                name: "John Doe",
            })
            .expect(200)
        const repo = getManager().getRepository(User)
        const user = await repo.findOne(body.id)
        expect(await bcrypt.compare(pwd, user?.password!)).toBe(true)
    })
    it("Should not allow user to specify role", async () => {
        const app = await createApp({ mode: "production" })
        await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
                role: "Admin"
            })
            .expect(403)
    })
    it("Should not showing password on the response to anyone", async () => {
        const app = await createApp({ mode: "production" })
        const { body: user } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/users/${user.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .expect(200)
        expect(body).toMatchSnapshot(ignoreProps)
    })
    it("Should only showing Email to the owner or admin on response", async () => {
        const app = await createApp({ mode: "production" })
        const { body: user } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        const token = createToken(user.id, AppRole.User)
        const { body: byItself } = await supertest(app.callback())
            .get(`/api/v1/users/${user.id}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200)
        const { body: bySomeoneElse } = await supertest(app.callback())
            .get(`/api/v1/users/${user.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .expect(200)
        const { body: byAdmin } = await supertest(app.callback())
            .get(`/api/v1/users/${user.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
        expect(byItself).toMatchSnapshot(ignoreProps)
        expect(bySomeoneElse).toMatchSnapshot(ignoreProps)
        expect(byAdmin).toMatchSnapshot(ignoreProps)
    })
    it("Should not allow user to set their own role", async () => {
        const app = await createApp({ mode: "production" })
        await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
                role: "Admin"
            })
            .expect(403)
    })
    it("Should allow admin to set someone else role", async () => {
        const app = await createApp({ mode: "production" })
        const { body: user } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        await supertest(app.callback())
            .patch(`/api/v1/users/${user.id}`)
            .send({
                role: "Admin"
            })
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
    })
    it("Should not allow any user to modify other user", async () => {
        const app = await createApp({ mode: "production" })
        const { body: userOne } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        const { body: userTwo } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "jane.doe@gmail.com",
                password: "jane0doe#",
                name: "Jane Doe",
            })
            .expect(200)
        const userTwoToken = createToken(userTwo.id, AppRole.User)
        await supertest(app.callback())
            .patch(`/api/v1/users/${userOne.id}`)
            .send({
                role: "Admin"
            })
            .set("Authorization", `Bearer ${userTwoToken}`)
            .expect(401)
    })
    it("Should allow any user to delete their own account", async () => {
        const app = await createApp({ mode: "production" })
        const { body: userOne } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        const userOneToken = createToken(userOne.id, AppRole.User)
        await supertest(app.callback())
            .delete(`/api/v1/users/${userOne.id}`)
            .set("Authorization", `Bearer ${userOneToken}`)
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/users/${userOne.id}`)
            .set("Authorization", `Bearer ${userOneToken}`)
            .expect(200)
        expect(body.deleted).toBe(true)
    })
    it("Should allow admin to delete any account", async () => {
        const app = await createApp({ mode: "production" })
        const { body: userOne } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        await supertest(app.callback())
            .delete(`/api/v1/users/${userOne.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
        const { body } = await supertest(app.callback())
            .get(`/api/v1/users/${userOne.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)
        expect(body.deleted).toBe(true)
    })
    it("Should not allow any user to delete someone else user", async () => {
        const app = await createApp({ mode: "production" })
        const { body: userOne } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "john.doe@gmail.com",
                password: "john0doe#",
                name: "John Doe",
            })
            .expect(200)
        const { body: userTwo } = await supertest(app.callback())
            .post("/api/v1/users")
            .send({
                email: "jane.doe@gmail.com",
                password: "jane0doe#",
                name: "Jane Doe",
            })
            .expect(200)
        const userTwoToken = createToken(userTwo.id, AppRole.User)
        await supertest(app.callback())
            .delete(`/api/v1/users/${userOne.id}`)
            .set("Authorization", `Bearer ${userTwoToken}`)
            .expect(401)
    })
})