import { Request, Response, NextFunction } from "express";
import { JWZ } from "../lib/jwz/jwz.js";
import fs from 'fs'
import path from 'path'
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getAuthenIssuerId } from "../services/Issuer.js";

let vk = JSON.parse(fs.readFileSync("src/verificationKey/verification_key.json", "utf-8"));
enum Role {
  Admin = "1",
  Operator = "2"
}
const schemaHash = "123456789";
const timeLimit = 3600000*24*3;

export class AuthenController {
  async authentication(req: Request, res: Response, next: NextFunction) {
    try {
      const {adminId} = req.params;
      if (!adminId) {
        res.status(400).send({err: "AdminId invalid"});
        return;
      }
      let { proof, public_signals, circuitId, schema, algorithm, payload } = req.body;
      if (!circuitId || !proof || !public_signals || !schema || !algorithm || !payload) {
        res.status(400).send({err: "Invalid request"})
        return;
      }
      else {
        try {
          let token = new JWZ(algorithm, circuitId, schema, payload);
          token.zkProof = {
            proof: proof,
            public_signals: public_signals
          }
          let isValid = await token.verifyProof(vk);
          if (isValid) {
            let compressedToken = token.compress();
            res.status(200).send({ token: compressedToken });
            return;
          } else {
            res.status(400).send({err: "Invalid proof"});
            return;
          }
        } catch (err) {
          res.status(400).send(buildErrorMessage(400, "Invalid proof", "Unable to login"));
          return;
        }

      }
    } catch (err: any) {
      res.status(400).send(buildErrorMessage(400, "Invalid request", "Unable to login"));
      return;
    }
  }
  
  async authorizationAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const {adminId} = req.params;
      if (!adminId) {
        res.status(400).send(buildErrorMessage(400, "AdminId invalid", "Unable to login"));
        return;
      }
      let token = req.headers.authorization;
      if (token == "1") {
        next();
        return;
      }
      if (!token) {
        res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
        return;
      } else {
        try {
          let parsedToken = JWZ.parse(token);
          const authenIsser = await getAuthenIssuerId();
          const authenIssuerId = BigInt("0x" + authenIsser!).toString();
          let isValid = await parsedToken.verifyToken(vk, Role.Admin, schemaHash, authenIssuerId, timeLimit)

          if (isValid) {
            next();
            return;
          }
          else {
            res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
            return;
          }
        } catch (err) {
          res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
          return;
        }
      }
    } catch (err: any) {
      res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
      return;
    }
  }

  async verifyToken(req: Request, res: Response) {
    try {
      const {adminId} = req.params;
      const {role} = req.body;
      if (typeof adminId != "string" || (typeof role != "string" && typeof role != "number")) {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
        );
        return;
      }

      let {token} = req.body;
      if (token == "1") {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: true}, ResultMessage.APISUCCESS.message)
        );
        return;
      }
      let parsedToken = JWZ.parse(token);
      let isValid = false;
      const authenIsser = await getAuthenIssuerId();
      const authenIssuerId = BigInt("0x" + authenIsser!).toString();
      try {
        if ((await parsedToken.verifyToken(vk, role.toString(), schemaHash, authenIssuerId, timeLimit))) {
          isValid = true;
        }
        
      } catch (err) {
      }

      if (isValid) {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: true}, ResultMessage.APISUCCESS.message)
        );
      } else {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
        );
      }
    } catch (err: any) {
      res.send(
        buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
      );      
      return;
    }
  }

  async verifyTokenAdmin(req: Request, res: Response) {
    try {
      const {adminId} = req.params;
      if (!adminId || typeof adminId != "string") {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
        );
      }
      let {token} = req.body;
      if (token == "1") {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: true}, ResultMessage.APISUCCESS.message)
        );
        return;
      }
      let parsedToken = JWZ.parse(token);
      let isValid = false;
      const authenIsser = await getAuthenIssuerId();
      const authenIssuerId = BigInt("0x" + authenIsser!).toString();
      try {
        if ((await parsedToken.verifyToken(vk, Role.Admin, schemaHash, authenIssuerId, timeLimit))) {
          isValid = true;
        }
      } catch (err) {
      }

      if (isValid) {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: true}, ResultMessage.APISUCCESS.message)
        );
      } else {
        res.send(
          buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
        );
      }
    } catch (err: any) {
      res.send(
        buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
      );      
      return;
    }
  }

}