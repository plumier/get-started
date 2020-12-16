import { authorize, entity } from "plumier"
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class BaseEntity {
    @authorize.readonly()
    @PrimaryGeneratedColumn()
    id: number

    @authorize.readonly()
    @CreateDateColumn()
    createdAt: Date

    @authorize.readonly()
    @UpdateDateColumn()
    updatedAt: Date

    @entity.deleteColumn()
    @Column({ default: false })
    deleted: boolean
}

export interface LoginUser {
    userId: number,
    role: "User" | "Admin"
}
