import { sign } from "jsonwebtoken";
import { AppRole, LoginUser } from "../src/entity/base";
import dotenv from "dotenv"
import { join } from "path"
import supertest from "supertest";

dotenv.config({ path: join(__dirname, ".env-test") })

export function createToken(id: number, role: AppRole) {
    return sign(<LoginUser>{ userId: id, role }, process.env.PLUM_JWT_SECRET!)
}


export const ignoreProps = {
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
}

export const userToken = createToken(123, AppRole.User)
export const adminToken = createToken(456, AppRole.Admin)

export async function createUser(app: any) {
    const { body } = await await supertest(app.callback())
        .post("/api/v1/users")
        .send({
            email: "john.doe@gmail.com",
            password: "john0doe#",
            name: "John Doe",
        })
    const token = createToken(body.id, AppRole.User)
    return { id: body.id, token }
}