import { JwtAuthFacility } from "@plumier/jwt"
import { SwaggerFacility } from "@plumier/swagger"
import { TypeORMFacility } from "@plumier/typeorm"
import Plumier, { Configuration, ControllerFacility, WebApiFacility } from "plumier"

function createApp(config?: Partial<Configuration>) {
    return new Plumier()
        .set({ ...config, rootDir: __dirname })
        .set(new WebApiFacility())
        .set(new TypeORMFacility())
        .set(new ControllerFacility({ controller: "./auth/*.*(ts|js)" }))
        .set(new ControllerFacility({ controller: "./entity/*.*(ts|js)", rootPath: "api/v1" }))
        .set(new JwtAuthFacility({ authPolicies: "./policy/*.*(ts|js)" }))
        .set(new SwaggerFacility())
        .initialize()
}

export default createApp