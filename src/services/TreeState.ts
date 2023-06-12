import {state, utils as zidenjsUtils, claim as zidenjsClaim, queryMTP, Auth, smt, stateTransition, auth} from "@zidendev/zidenjs";
import Issuer from "../models/Issuer.js";
import TreeState from "../models/TreeState.js";
import { createNewLevelDb, openLevelDb } from "./LevelDbManager.js";
import { v4 } from "uuid";
import { PRIVATEKEY} from "../common/config/secrets.js";
import { authenSchemaHash, serverAuthenTreeId } from "../common/config/constant.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import { checkIssuerExisted, getIssuerIdByPublicKey, updateIssuer } from "./Issuer.js";
import Claim from "../models/Claim.js";
import { checkOperatorExisted, saveNewOperator } from "./Operator.js";
import { GlobalVariables } from "../common/config/global.js";
import Operator from "../models/Operator.js";
import { getClaimByClaimId } from "./Claim.js";

export async function saveTreeState(issuerTree: state.State) {
    const issuerId = zidenjsUtils.bufferToHex(issuerTree.userID);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        const newTree = new TreeState({
            revocationNonce: issuerTree.claimRevNonce,
            authRevNonce: issuerTree.authRevNonce,
            userID: issuerId,
            lastestRevocationNonce: issuerTree.claimRevNonce,
            lastestAuthRevNonce: issuerTree.authRevNonce,
            isLockPublish: false,
        });
        await newTree.save();
    } else {
        treeState.revocationNonce = issuerTree.claimRevNonce;
        treeState.authRevNonce = issuerTree.authRevNonce;
        await treeState.save();
    }
}

export async function saveLastStateTransistion(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        return;
    } else {
        treeState.lastestRevocationNonce = treeState.revocationNonce;
        treeState.lastestAuthRevNonce = treeState.authRevNonce;
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
    const authsTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].authsDb,
        await GlobalVariables.levelDb[src].authsDb.getRoot(),
        8
    );

    const claimRevTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].claimRevDb,
        await GlobalVariables.levelDb[src].claimRevDb.getRoot(),
        14
    );

    const claimsTree = new smt.QuinSMT(
        GlobalVariables.levelDb[src].claimsDb,
        await GlobalVariables.levelDb[src].claimsDb.getRoot(),
        14
    );

    const issuerTree = new state.State(
        authsTree,
        claimsTree,
        claimRevTree,
        issuerTreeState.authRevNonce!,
        issuerTreeState.revocationNonce!,
        8,
        14,
        zidenjsUtils.hexToBuffer(issuerId, 31)
    );
    return issuerTree;
}

export async function setupAuthenTree() {
    let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
    const pubkey = auth.newEDDSAPublicKeyFromPrivateKey(serverPrivateKey);
    const PUBKEYX = pubkey.X.toString(10);
    const PUBKEYY = pubkey.Y.toString(10);

    const checkIssuer = await checkIssuerExisted(PUBKEYX, PUBKEYY);
    if (checkIssuer) {
        console.log("AuthenTree setup!");
        return;
    }

    const pathLevelDb = await createNewLevelDb(serverAuthenTreeId);

    const serverAuthClaim: Auth = {
        authHi: BigInt(0),
        pubKey: {
          X: BigInt(PUBKEYX),
          Y: BigInt(PUBKEYY),
        },
    };

    const authenTree = await state.State.generateState(
        [serverAuthClaim],
        GlobalVariables.levelDb[pathLevelDb].authsDb,
        GlobalVariables.levelDb[pathLevelDb].claimsDb,
        GlobalVariables.levelDb[pathLevelDb].claimRevDb,
    );

    const serverId = zidenjsUtils.bufferToHex(authenTree.userID);
    await updateIssuer(serverId, PUBKEYX, PUBKEYY, pathLevelDb);

    await saveTreeState(authenTree);

}

export async function registerOperator(userId: string, adminId: string, operator: number) {
    let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
    const pubkey = auth.newEDDSAPublicKeyFromPrivateKey(serverPrivateKey);
    const PUBKEYX = pubkey.X.toString(10);
    const PUBKEYY = pubkey.Y.toString(10);

    const serverIssuerId = await getIssuerIdByPublicKey(PUBKEYX, PUBKEYY);
    if (GlobalVariables.logTree == true) {
        throw("Await publish!");
    }
    GlobalVariables.logTree = false;
    
    try {        
        
        const newOperatorClaim = zidenjsClaim.newClaim(
            zidenjsClaim.schemaHashFromBigInt(BigInt(authenSchemaHash)),
            zidenjsClaim.withValueData( zidenjsUtils.numToBits(BigInt(operator), 32), zidenjsUtils.numToBits(BigInt(0), 32)),
            zidenjsClaim.withIndexData( zidenjsUtils.hexToBuffer(userId, 32), zidenjsUtils.hexToBuffer(adminId, 32)),
            zidenjsClaim.withIndexID(zidenjsUtils.hexToBuffer(userId, 32))
        );

        const lastClaim = await Claim.find({userId: userId, schemaHash: authenSchemaHash}).limit(1).sort({"version": -1});
        if (lastClaim.length != 0) {
            newOperatorClaim.setVersion(BigInt(lastClaim[0].version! + 1));
        }

        const serverAuthenTree = await getTreeState(serverIssuerId);

        const serverAuthClaim: Auth = {
            authHi: BigInt(0),
            pubKey: {
              X: BigInt(PUBKEYX),
              Y: BigInt(PUBKEYY),
            },
        };
        
        await stateTransition.stateTransitionWitnessWithPrivateKey(
            serverPrivateKey,
            serverAuthClaim,
            serverAuthenTree,
            [],
            [newOperatorClaim],
            [],
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
    let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
    const pubkey = auth.newEDDSAPublicKeyFromPrivateKey(serverPrivateKey);
    const PUBKEYX = pubkey.X.toString(10);
    const PUBKEYY = pubkey.Y.toString(10);

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
         const serverAuthClaim: Auth = {
            authHi: BigInt(0),
            pubKey: {
              X: BigInt(PUBKEYX),
              Y: BigInt(PUBKEYY),
            },
        };

        await stateTransition.stateTransitionWitnessWithPrivateKey(
            serverPrivateKey,
            serverAuthClaim,
            serverAuthenTree,
            [],
            [],
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
