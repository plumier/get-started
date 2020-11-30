import { entityPolicy } from "plumier"
import { getManager } from "typeorm"

import { Comment } from "../entity/comment"
import { Todo } from "../entity/todo"
import { User } from "../entity/user"

// this files define custom authorization policy that can be used to authorize route or property (read/write)

// define "Owner" policy authorization for User entity
export const UserOwnerPolicy = entityPolicy(User)
    // owner of User is when current login user id is the same as current accessed User id 
    // ctx.user is the JWT claim, the object signed during login process (see auth.ts)
    .define("Owner", (ctx, id) => ctx.user?.userId === id)

// define "Owner" policy authorization for Comment entity
export const CommentOwnerPolicy = entityPolicy(Comment)
    .define("Owner", async (ctx, id) => {
        const repo = getManager().getRepository(Comment)
        const comment = await repo.findOne(id, { relations: ["user"], cache: true })
        // owner of Comment is when current login user is the same as comment.user.id
        return ctx.user?.userId === comment?.user?.id
    })

// define "Owner" policy authorization for Todo entity
export const TodoOwnerPolicy = entityPolicy(Todo)
    .define("Owner", async (ctx, id) => {
        const repo = getManager().getRepository(Todo)
        const todo = await repo.findOne(id, { relations: ["user"], cache: true })
        // owner of Todo is when current login user is the same as todo.user.id
        return ctx.user?.userId === todo?.user?.id
    })