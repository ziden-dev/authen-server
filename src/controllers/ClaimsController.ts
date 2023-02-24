import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getClaimByClaimId, getNonRevQueryMTPInput, getQueryMTPInput} from "../services/Claim.js";
import { ClaimStatus, ProofTypeQuery } from "../common/enum/EnumType.js";
import { GlobalVariables } from "../common/config/global.js";

export class ClaimsController {

    public async generateProof(req: Request, res: Response) {
        try {
            const id = req.params["claimId"];
            const type = req.query["type"];
            if (!id) {
                throw("Invalid claimId!");
            }

            const claim = await getClaimByClaimId(id);
            if (claim.status != ClaimStatus.ACTIVE) {
                throw("Claim is not ACTIVE");
            }

            let queryResponse = {};

            if (GlobalVariables.logTree) {
                throw("Await Publish!");
            }

            if (type == ProofTypeQuery.MTP) {
                queryResponse = await getQueryMTPInput(claim.issuerId, claim.hi);
            }

            if (type == ProofTypeQuery.NON_REV_MTP) {
                queryResponse = await getNonRevQueryMTPInput(claim.issuerId, claim.revNonce);
            }

            res.status(200).send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, queryResponse, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}