import Operator from "../models/Operator.js";
import { getClaimByClaimId } from "./Claim.js";

export async function saveNewOperator(userId: string, role: number, claimId: string, issuerId: string) {
    const isOperatorExisted = await checkOperatorExisted(userId, issuerId);
    if (isOperatorExisted) {
        activateOperator(userId, issuerId, claimId);
    }
    else {
        const operator = new Operator({
            userId: userId,
            role: role,
            claimId: claimId,
            createAt: Number(Date.now()),
            issuerId: issuerId,
            activate: true
        });
    
        await operator.save();
    }
}

export async function activateOperator(userId: string, issuerId: string, claimId: string) {
    const operator = await Operator.findOne({userId: userId, issuerId: issuerId});
    if (!operator) {
        throw("Operator not exist!");
    } else {
        operator.activate = true;
        operator.claimId = claimId;
        operator.createAt = Number(Date.now());
        await operator.save();
    }
}

export async function disableOperator(userId: string, issuerId: string) {
    const operator = await Operator.findOne({userId: userId, issuerId: issuerId});
    if (!operator) {
        throw("Operator not exist!");
    } else {
        operator.activate = false;
        await operator.save();
    }
}

export async function checkOperatorExisted(userId: string, issuerId: string) {
    const operator = await Operator.findOne({userId: userId, issuerId: issuerId});
    if (operator) {
        return true;
    } else {
        return false;
    }
}

export async function getListOperator(issuerId: string) {
    const operators = await Operator.find({issuerId: issuerId});
    const res: Array<any> = [];
    for (let i = 0; i < operators.length; i++) {
        res.push({
            userId: operators[i].userId,
            role: operators[i].role,
            claimId: operators[i].claimId,
            issuerId: operators[i].issuerId,
            activate: operators[i].activate 
        });
    }

    return res;
}

export async function getOperatorInfor(operatorId: string, issuerId: string) {
    const operator = await Operator.findOne({userId: operatorId, issuerId: issuerId});
    if (!operator) {
        throw("Operator not exist!");
    }
    if (!operator.activate) {
        throw("Operator not activate");
    }
    const claim = await getClaimByClaimId(operator.claimId!);
    return {
        userId: operator.userId!,
        issuerId: operator.issuerId!,
        role: operator.role!,
        claimId: operator.claimId,
        schemaHash: claim.schemaHash,
        version: claim.version,
        revNonce: claim.revNonce
    }
}
