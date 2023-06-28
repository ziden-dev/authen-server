import {utils as zidenjsUtils, auth} from "@zidendev/zidenjs";
import { PRIVATEKEY} from "../common/config/secrets.js";
import Issuer from "../models/Issuer.js";

export async function updateIssuer(issuerId: string, pubkeyX: string, pubkeyY: string, pathDb: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb
        });
        await issuer.save();
    } else {
        checkIssuer.pathDb = pathDb;
        checkIssuer.pubkeyX = pubkeyX;
        checkIssuer.pubkeyY = pubkeyY;
        await checkIssuer.save();
    }
}

export async function getIssuerIdByPublicKey(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        throw("Issuer is not exist!");
    }
    return issuer.issuerId!;
}

export async function checkIssuerExisted(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        return false;
    } else {
        return true;
    }
}

export async function getAuthenIssuerId() {
    let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
    const pubkey = auth.newEDDSAPublicKeyFromPrivateKey(serverPrivateKey);
    const PUBKEYX = pubkey.X.toString(10);
    const PUBKEYY = pubkey.Y.toString(10);

    const issuer = await Issuer.findOne({pubkeyX: PUBKEYX, pubkeyY: PUBKEYY});
    return issuer?.issuerId;
}