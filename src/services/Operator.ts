import Operator from "../models/Operator.js";
import { getClaimByClaimId } from "./Claim.js";

export async function saveNewOperator(userId: string, role: number, claimId: string, adminId: string) {
    const isOperatorExisted = await checkOperatorExisted(userId, adminId);
    if (isOperatorExisted) {
        activateOperator(userId, adminId, claimId);
    }
    else {
        const operator = new Operator({
            userId: userId,
            role: role,
            claimId: claimId,
            createAt: Number(Date.now()),
            adminId: adminId,
            activate: true
        });
    
        await operator.save();
    }
}

export async function activateOperator(userId: string, adminId: string, claimId: string) {
    const operator = await Operator.findOne({userId: userId, adminId: adminId});
    if (!operator) {
        throw("Operator not exist!");
    } else {
        operator.activate = true;
        operator.claimId = claimId;
        operator.createAt = Number(Date.now());
        await operator.save();
    }
}

export async function disableOperator(userId: string, adminId: string) {
    const operator = await Operator.findOne({userId: userId, adminId: adminId});
    if (!operator) {
        throw("Operator not exist!");
    } else {
        operator.activate = false;
        await operator.save();
    }
}

export async function checkOperatorExisted(userId: string, adminId: string) {
    const operator = await Operator.findOne({userId: userId, adminId: adminId});
    if (operator) {
        return true;
    } else {
        return false;
    }
}

export async function getListOperator(adminId: string) {
    const operators = await Operator.find({adminId: adminId});
    const res: Array<any> = [];
    for (let i = 0; i < operators.length; i++) {
        res.push({
            userId: operators[i].userId,
            role: operators[i].role,
            claimId: operators[i].claimId,
            adminId: operators[i].adminId,
            activate: operators[i].activate 
        });
    }

    return res;
}

export async function getOperatorInfor(operatorId: string, adminId: string) {
    const operator = await Operator.findOne({userId: operatorId, adminId: adminId});
    if (!operator) {
        throw("Operator not exist!");
    }
    if (!operator.activate) {
        throw("Operator not activate");
    }
    const claim = await getClaimByClaimId(operator.claimId!);
    return {
        userId: operator.userId!,
        adminId: operator.adminId!,
        role: operator.role!,
        claimId: operator.claimId,
        schemaHash: claim.schemaHash,
        version: claim.version,
        revNonce: claim.revNonce
    }
}
