import bcrypt from "bcryptjs"
import { authorize, preSave, Public, route, val } from "plumier"
import { Column, Entity } from "typeorm"

import { BaseEntity } from "./base"

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
