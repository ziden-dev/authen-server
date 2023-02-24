import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { AdminController } from "../controllers/AdminsController.js";

export class IssuerRooutes {
    public router: Router;
    public adminController = new AdminController();
    public authenController = new AuthenController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("/register", this.adminController.registerAdmin);
        this.router.post("/:adminId/operators", this.authenController.authorizationAdmin, this.adminController.addNewOperator);
        this.router.delete("/:adminId/operators/:operatorId", this.authenController.authorizationAdmin, this.adminController.deleteOperator);
        this.router.get("/:adminId/operators/:operatorId", this.adminController.getOperatorInfor);
        this.router.get("/:adminId/operators", this.authenController.authorizationAdmin, this.adminController.getListOperator);
    }
}