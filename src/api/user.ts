import bcrypt from "bcryptjs"
import { authorize, entityPolicy, preSave, Public, route, val } from "plumier"
import { Column, Entity } from "typeorm"

import { AppRole, BaseEntity } from "./_shared"

@route.controller(c => {
    c.post().authorize(Public)
    c.actions("Put", "Patch", "Delete").authorize(AppRole.Owner, AppRole.Admin)
})
@Entity()
export class User extends BaseEntity {
    @val.required()
    @val.unique()
    @val.email()
    @authorize.read(AppRole.Owner, AppRole.Admin)
    @Column()
    email: string

    @val.required()
    @authorize.writeonly()
    @Column()
    password: string

    @val.required()
    @Column()
    name: string

    @authorize.write(AppRole.Admin)
    @Column({ default: AppRole.User })
    role: AppRole

    @preSave()
    async hashPassword() {
        if (this.password)
            this.password = await bcrypt.hash(this.password, await bcrypt.genSalt())
    }
}

export const UserOwnerPolicy = entityPolicy(User)
    .define(AppRole.Owner, (ctx, id) => ctx.user?.userId === id)
