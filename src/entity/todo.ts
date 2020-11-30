import { authorize, bind, preSave, route, val } from "plumier"
import { Column, Entity, ManyToOne, OneToMany } from "typeorm"

import { BaseEntity, LoginUser } from "./base"
import { Comment } from "./comment"
import { User } from "./user"

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

    @route.controller(c => c.actions("Put", "Patch", "Delete").authorize("Owner", "Admin"))
    @OneToMany(x => Comment, x => x.todo)
    comments: Comment[]

    @preSave("post")
    setUser(@bind.user() user: LoginUser) {
        // set current login user as the user of the todo
        this.user = <User>{ id: user.userId }
    }
}
