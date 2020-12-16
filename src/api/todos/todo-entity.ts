import { authorize, bind, entityPolicy, preSave, route, val } from "plumier"
import { Column, Entity, getManager, ManyToOne, OneToMany } from "typeorm"

import { BaseEntity, LoginUser } from "../../shared"
import { Comment } from "../todos-comments/comment-entity"
import { User } from "../users/user-entity"

@route.controller(c => c.actions("Put", "Patch", "Delete").authorize("Owner", "Admin"))
@Entity()
export class Todo extends BaseEntity {
    @val.required()
    @Column()
    message: string

    @authorize.write("Owner", "Admin")
    @Column({ default: false })
    completed: boolean

    @authorize.readonly()
    @ManyToOne(x => User)
    user: User

    @OneToMany(x => Comment, x => x.todo)
    comments: Comment[]

    @preSave("post")
    setUser(@bind.user() user: LoginUser) {
        // set current login user as the user of the todo
        this.user = <User>{ id: user.userId }
    }
}

// define "Owner" policy authorization for Todo entity
entityPolicy(Todo)
    .register("Owner", async (ctx, id) => {
        const repo = getManager().getRepository(Todo)
        const todo = await repo.findOne(id, { relations: ["user"], cache: true })
        // owner of Todo is when current login user is the same as todo.user.id
        return ctx.user?.userId === todo?.user?.id
    })