import bcrypt from "bcryptjs"
import { authorize, entityPolicy, preSave, Public, route, val } from "plumier"
import { Column, Entity } from "typeorm"

import { BaseEntity } from "../../shared"

@route.controller(c => {
    c.post().authorize(Public)
    c.actions("Put", "Patch", "Delete").authorize("Owner", "Admin")
})
@Entity()
export class User extends BaseEntity {
    @val.required()
    @val.unique()
    @val.email()
    @authorize.read("Owner", "Admin")
    @Column()
    email: string

    @val.required()
    @authorize.writeonly()
    @Column()
    password: string

    @val.required()
    @Column()
    name: string

    @authorize.write("Admin")
    @Column({ default: "User" })
    role: "User" | "Admin"

    @preSave()
    async hashPassword() {
        if (this.password)
            this.password = await bcrypt.hash(this.password, await bcrypt.genSalt())
    }
}

// define "Owner" policy authorization for User entity
entityPolicy(User)
    // owner of User is when current login user id is the same as current accessed User id 
    // ctx.user is the JWT claim, the object signed during login process (see auth.ts)
    .register("Owner", (ctx, id) => ctx.user?.userId === id)