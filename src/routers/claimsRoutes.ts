import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { ClaimsController } from "../controllers/ClaimsController.js";

export class ClaimsRouters {
    public router: Router;
    public authenController = new AuthenController();
    public claimsController = new ClaimsController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.get("/:claimId/proof", this.claimsController.generateProof);
    }
}