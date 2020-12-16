import { authorize, bind, entityPolicy, preSave, route, val } from "plumier"
import { Column, Entity, getManager, ManyToOne } from "typeorm"

import { BaseEntity, LoginUser } from "../../shared"
import { Todo } from "../todos/todo-entity"
import { User } from "../users/user-entity"

@route.controller(c => {
    c.useNested(Todo, "comments")
    c.actions("Put", "Patch", "Delete").authorize("Owner", "Admin")
})
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
        // set current login user as the user of the comment
        this.user = <User>{ id: user.userId }
    }
}

// define "Owner" policy authorization for Comment entity
entityPolicy(Comment)
    .register("Owner", async (ctx, id) => {
        const repo = getManager().getRepository(Comment)
        const comment = await repo.findOne(id, { relations: ["user"], cache: true })
        // owner of Comment is when current login user is the same as comment.user.id
        return ctx.user?.userId === comment?.user?.id
    })
