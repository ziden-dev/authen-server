import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { GlobalVariables } from "../common/config/global.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getListOperator, getOperatorInfor } from "../services/Operator.js";
import { registerOperator, revokeOperator } from "../services/TreeState.js";

export class AdminController {
    public async registerAdmin(req: Request, res: Response) {
        try {
            const {userId} = req.body;
            if (typeof userId != "string") {
                throw("Invalid data");
            }

            const registerResponse = await registerOperator(userId, userId, 1);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registerResponse, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async addNewOperator(req: Request, res: Response) {
        try {
            const {adminId} = req.params;
            if (!adminId || typeof adminId != "string") {
                throw("AdminId invalid!");
            }

            const {operatorId, role} = req.body;
            if (!operatorId || typeof operatorId != "string" || typeof role != "number") {
                throw("Operator invalid!");
            }

            if (GlobalVariables.logTree) {
                throw("Await Publish!");
            }

            const registerResponse = await registerOperator(operatorId, adminId, role);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, registerResponse, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async deleteOperator(req: Request, res: Response) {
        try {
            const {adminId, operatorId} = req.params;
            if (!adminId || typeof adminId != "string") {
                throw("AdminId invalid!");
            }

            if (!operatorId || typeof operatorId != "string") {
                throw("OperatorId invalid!");
            }

            await revokeOperator(operatorId, adminId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getOperatorInfor(req: Request, res: Response) {
        try {
            const {adminId, operatorId} = req.params;
            if (!adminId || typeof adminId != "string") {
                throw("AdminId invalid!");
            }

            if (!operatorId || typeof operatorId != "string") {
                throw("OperatorId invalid!");
            }

            const operator = await getOperatorInfor(operatorId, adminId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, operator, ResultMessage.APISUCCESS.message));
        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getListOperator(req: Request, res: Response) {
        try {
            const {adminId} = req.params;
            if (!adminId || typeof adminId != "string") {
                throw("AdminId invalid!");
            }

            const operators = await getListOperator(adminId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, operators, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}