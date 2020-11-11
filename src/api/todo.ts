import { authorize, bind, entityPolicy, preSave, route, val } from "plumier"
import { Column, Entity, getManager, ManyToOne, OneToMany } from "typeorm"

import { AppRole, BaseEntity, LoginUser } from "./_shared"
import { Comment } from "./comment"
import { User } from "./user"

@route.controller(c => c.actions("Put", "Patch", "Delete").authorize(AppRole.Owner, AppRole.Admin))
@Entity()
export class Todo extends BaseEntity {
    @val.required()
    @Column()
    message: string

    @authorize.write(AppRole.Owner, AppRole.Admin)
    @Column({ default: false })
    completed: boolean

    @authorize.readonly()
    @ManyToOne(x => User)
    user: User

    @route.controller(c => c.actions("Put", "Patch", "Delete").authorize(AppRole.Owner, AppRole.Admin))
    @OneToMany(x => Comment, x => x.todo)
    comments: Comment[]

    @preSave("post")
    setUser(@bind.user() user: LoginUser) {
        // set login user as the owner of the todo
        this.user = <User>{ id: user.userId }
    }
}

export const TodoOwnerPolicy = entityPolicy(Todo)
    .define(AppRole.Owner, async (ctx, id) => {
        const repo = getManager().getRepository(Todo)
        const todo = await repo.findOne(id, { relations: ["user"], cache: true })
        return ctx.user?.userId === todo?.user?.id
    })
