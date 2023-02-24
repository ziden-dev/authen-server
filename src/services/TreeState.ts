import {trees as zidenjsTrees, utils as zidenjsUtils, claim as zidenjsClaim, witness as zidenjsWitness} from "zidenjs";
import Issuer from "../models/Issuer.js";
import TreeState from "../models/TreeState.js";
import { createNewLevelDb, openLevelDb } from "./LevelDbManager.js";
import { v4 } from "uuid";
import { PRIVATEKEY, PUBKEYX, PUBKEYY } from "../common/config/secrets.js";
import { authenSchemaHash, serverAuthenTreeId } from "../common/config/constant.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import { checkIssuerExisted, getIssuerIdByPublicKey, updateIssuer } from "./Issuer.js";
import Claim from "../models/Claim.js";
import { checkOperatorExisted, saveNewOperator } from "./Operator.js";
import { GlobalVariables } from "../common/config/global.js";
import Operator from "../models/Operator.js";
import { getClaimByClaimId } from "./Claim.js";

export async function saveTreeState(issuerTree: zidenjsTrees.Trees) {
    const issuerId = zidenjsUtils.bufferToHex(issuerTree.userID);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        const newTree = new TreeState({
            rootsVersion: issuerTree.rootsVersion,
            revocationNonce: issuerTree.revocationNonce,
            userID: issuerId,
            lastestRootsVersion: issuerTree.rootsVersion,
            lastestRevocationNonce: issuerTree.revocationNonce,
            isLockPublish: false
        });
        await newTree.save();
    } else {
        treeState.rootsVersion = issuerTree.rootsVersion;
        treeState.revocationNonce = issuerTree.revocationNonce;
        await treeState.save();
    }
}

export async function saveLastStateTransistion(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        return;
    } else {
        treeState.lastestRevocationNonce = treeState.revocationNonce;
        treeState.lastestRootsVersion = treeState.rootsVersion;
        await treeState.save();
    }
}

export async function getTreeState(issuerId: string) {
    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("IssuerId not exist!");
    }
    if (!issuer.pathDb) {
        throw("Invalid pathDb");
    }

    const issuerTreeState = await TreeState.findOne({userID: issuerId});
    if (!issuerTreeState) {
        throw("Issuer not exist");
    }

    await openLevelDb(issuer.pathDb);
    const src = issuer.pathDb;
    const claimsTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].claimsDb,
        await GlobalVariables.levelDb[src].claimsDb.getRoot(),
        32
    );

    const revocationTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].revocationDb,
        await GlobalVariables.levelDb[src].revocationDb.getRoot(),
        32
    );

    const rootsTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].rootsDb,
        await GlobalVariables.levelDb[src].rootsDb.getRoot(),
        32
    );

    const issuerTree = new zidenjsTrees.Trees(
        claimsTree,
        revocationTree,
        rootsTree,
        issuerTreeState.rootsVersion!,
        issuerTreeState.revocationNonce!,
        zidenjsUtils.hexToBuffer(issuerId, 31),
        32
    );

    return issuerTree;
}

export async function setupAuthenTree() {
    const checkIssuer = await checkIssuerExisted(PUBKEYX, PUBKEYY);
    if (checkIssuer) {
        console.log("AuthenTree setup!");
        return;
    }

    const pathLevelDb = await createNewLevelDb(serverAuthenTreeId);

    const serverAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(PUBKEYX), BigInt(PUBKEYY));

    const authenTree = await zidenjsTrees.Trees.generateID(
        [serverAuthClaim],
        GlobalVariables.levelDb[pathLevelDb].claimsDb,
        GlobalVariables.levelDb[pathLevelDb].revocationDb,
        GlobalVariables.levelDb[pathLevelDb].rootsDb,
        zidenjsClaim.id.IDType.Default,
        32,
        0
    );

    const serverId = zidenjsUtils.bufferToHex(authenTree.userID);
    await updateIssuer(serverId, PUBKEYX, PUBKEYY, pathLevelDb);

    await saveTreeState(authenTree);

}

export async function registerOperator(userId: string, adminId: string, operator: number) {

    const serverIssuerId = await getIssuerIdByPublicKey(PUBKEYX, PUBKEYY);
    if (GlobalVariables.logTree == true) {
        throw("Await publish!");
    }
    GlobalVariables.logTree = false;
    
    try {        
        
        const newOperatorClaim = zidenjsClaim.entry.newClaim(
            zidenjsClaim.entry.schemaHashFromBigInt(BigInt(authenSchemaHash)),
            zidenjsClaim.entry.withValueData( zidenjsUtils.numToBits(BigInt(operator), 32), zidenjsUtils.numToBits(BigInt(0), 32)),
            zidenjsClaim.entry.withIndexData( zidenjsUtils.hexToBuffer(userId, 32), zidenjsUtils.hexToBuffer(adminId, 32)),
            zidenjsClaim.entry.withIndexID(zidenjsUtils.hexToBuffer(userId, 32))
        );

        const lastClaim = await Claim.find({userId: userId, schemaHash: authenSchemaHash}).limit(1).sort({"version": -1});
        if (lastClaim.length != 0) {
            newOperatorClaim.setVersion(BigInt(lastClaim[0].version! + 1));
        }

        const serverAuthenTree = await getTreeState(serverIssuerId);
        let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
        const serverAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(PUBKEYX), BigInt(PUBKEYY));
        await zidenjsWitness.stateTransition.stateTransitionWitness(
            serverPrivateKey,
            serverAuthClaim,
            serverAuthenTree,
            [newOperatorClaim],
            []
        );
    
        await saveTreeState(serverAuthenTree);
    
        const newClaim = new Claim({
            id: v4(),
            hi: newOperatorClaim.hi().toString(),
            hv: newOperatorClaim.hv().toString(),
            schemaHash: authenSchemaHash,
            expiration: Number(newOperatorClaim.getExpirationDate()),
            updatable: false,
            version: Number(newOperatorClaim.getVersion().toString()),
            revNonce: Number(newOperatorClaim.getRevocationNonce()),
            createAt: Number(Date.now()),
            status: ClaimStatus.ACTIVE,
            userId: userId,
            proofType: ProofType.MTP,
            issuerId: zidenjsUtils.bufferToHex(serverAuthenTree.userID),
            schemaRegistryId: "",
        });
    
        await newClaim.save();
        
        GlobalVariables.logTree = false;
      
        await saveNewOperator(userId, operator, newClaim.id!, adminId);

        return {
            userId: userId,
            adminId: adminId,
            operator: operator,
            claimId: newClaim.id,
            version: newClaim.version,
            revNonce: newClaim.revNonce
        };
    } catch (err: any) {
        GlobalVariables.logTree = false;
        
        throw(err);
    }
}

export async function revokeOperator(operatorId: string, adminId: string) {
    const operator = await Operator.findOne({userId: operatorId, adminId: adminId});
    if (!operator) {
        return;
    }
    if (!operator.activate) {
        return;
    }

    const claim = await getClaimByClaimId(operator.claimId!);
    const revNonce = claim.revNonce;

    const serverIssuerId = await getIssuerIdByPublicKey(PUBKEYX, PUBKEYY);
    if (GlobalVariables.logTree == true) {
        throw("Await publish!");
    }
    GlobalVariables.logTree = false;

    try {
        const serverAuthenTree = await getTreeState(serverIssuerId);
        let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
        const serverAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(PUBKEYX), BigInt(PUBKEYY));
        await zidenjsWitness.stateTransition.stateTransitionWitness(
            serverPrivateKey,
            serverAuthClaim,
            serverAuthenTree,
            [],
            [BigInt(revNonce)]
        );

        await saveTreeState(serverAuthenTree);
        GlobalVariables.logTree = false;

        operator.activate = false;
        await operator.save();
        return;

    } catch (err: any) {
        GlobalVariables.logTree = false;
        throw(err);
    }
}
