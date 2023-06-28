import { queryMTP } from "@zidendev/zidenjs";
import { GlobalVariables } from "../common/config/global.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import { serializaData } from "../util/utils.js";
import { getTreeState, saveTreeState } from "./TreeState.js";

export async function getClaimByClaimId(claimId: string) {
    const claim = await Claim.findOne({id: claimId});
    if (!claim) {
        throw("ClaimId not exist!");
    }

    return {
        claimId: claimId,
        hi: claim.hi!,
        hv: claim.hv!,
        schemaHash: claim.schemaHash!,
        expiration: claim.expiration,
        updatable: claim.updatable,
        version: claim.version!,
        revNonce: claim.revNonce!,
        status: claim.status!,
        userId: claim.userId!,
        proofType: claim.proofType,
        issuerId: claim.issuerId!,
        schemaRegistryId: claim.schemaRegistryId

    }
}

export async function getQueryMTPInput(issuerId: string, hi: string) {
    const issuerTree = await getTreeState(issuerId);
    try {
        const kycQueryMTPInput = await queryMTP.kycGenerateQueryMTPInput(
            GlobalVariables.F.e(hi),
            issuerTree
        );
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycQueryMTPInput))
        }
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function getNonRevQueryMTPInput(issuerId: string, revNonce: number) {
    const issuerTree = await getTreeState(issuerId);
    try {
        const kycNonRevQueryMTPInput = await queryMTP.kycGenerateNonRevQueryMTPInput(
            BigInt(revNonce),
            issuerTree
        );
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycNonRevQueryMTPInput))
        }
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}