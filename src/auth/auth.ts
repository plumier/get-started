import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { authorize, HttpStatus, HttpStatusError, route } from "plumier"
import { getManager } from "typeorm"

import { User } from "../api/user"
import { LoginUser } from "../api/_shared"


export class AuthController {
    readonly userRepo = getManager().getRepository(User)

    @authorize.public()
    @route.post()
    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({ email })
        if (!user || !await compare(password, user.password))
            throw new HttpStatusError(HttpStatus.UnprocessableEntity, "Invalid username or password")
        return { token: sign(<LoginUser>{ userId: user.id, role: user.role }, process.env.PLUM_JWT_SECRET!) }
    }
}