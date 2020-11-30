import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { authorize, HttpStatus, HttpStatusError, route } from "plumier"
import { getManager } from "typeorm"

import { User } from "../entity/user"
import { LoginUser } from "../entity/base"


export class AuthController {
    readonly userRepo = getManager().getRepository(User)

    @authorize.public()
    @route.post()
    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({ email })
        if (!user || !await compare(password, user.password))
            throw new HttpStatusError(HttpStatus.UnprocessableEntity, "Invalid username or password")
        // sign JWT claims for Bearer authorization header 
        // this claim then accessible from request context ctx.user 
        return { token: sign(<LoginUser>{ userId: user.id, role: user.role }, process.env.PLUM_JWT_SECRET!) }
    }
}