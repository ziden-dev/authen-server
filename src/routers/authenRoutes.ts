import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";

export class AthenRoutes {
    public router: Router;
    public authenController = new AuthenController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("/login/:adminId", this.authenController.authentication);
        this.router.post("/verify-token/:adminId", this.authenController.verifyToken);
        this.router.post("/verify-token-admin/:adminId", this.authenController.verifyTokenAdmin);
    }
}