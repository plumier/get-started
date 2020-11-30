import { authorize, bind, preSave, val } from "plumier"
import { Column, Entity, ManyToOne } from "typeorm"

import { BaseEntity, LoginUser } from "./base"
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
        // set current login user as the user of the comment
        this.user = <User>{ id: user.userId }
    }
}
