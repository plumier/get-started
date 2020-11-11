import { authorize, bind, entityPolicy, preSave, val } from "plumier"
import { Column, Entity, getManager, ManyToOne } from "typeorm"

import { AppRole, BaseEntity, LoginUser } from "./_shared"
import { Todo } from "./todo"
import { User } from "./user"

@Entity()
export class Comment extends BaseEntity {
    @val.required()
    @Column()
    message: string

    @ManyToOne(x => User)
    user: User

    @authorize.readonly()
    @ManyToOne(x => Todo)
    todo: Todo

    @preSave("post")
    setUser(@bind.user() user: LoginUser) {
        // set login user as the owner of the todo
        this.user = <User>{ id: user.userId }
    }
}

export const TodoOwnerPolicy = entityPolicy(Comment)
    .define(AppRole.Owner, async (ctx, id) => {
        const repo = getManager().getRepository(Comment)
        const comment = await repo.findOne(id, { relations: ["user"], cache: true })
        return ctx.user?.userId === comment?.user?.id
    })
