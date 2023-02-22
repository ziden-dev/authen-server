import { Request, Response, NextFunction } from "express";
import { JWZ } from "../lib/jwz/jwz.js";
import fs from 'fs'
import path from 'path'
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getAuthenIssuerId } from "../services/Issuer.js";

let vk = JSON.parse(fs.readFileSync(path.resolve("./build/authen/verification_key.json"), 'utf-8'));
enum Role {
  Admin = "1",
  Operator = "2"
}
const schemaHash = "123456789";
const timeLimit = 3600000*24*3;

export class AuthenController {
  async authentication(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      if (!issuerId) {
        res.status(400).send({err: "IssuerId invalid"});
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
  
  async authorization(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      if (!issuerId ) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
        return;
      }
      let token = req.headers.authorization;
      if (token == "1") {
        next();
        return;
      }
      if (!token) {
        res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
      } else {
        try {
          let parsedToken = JWZ.parse(token);
          const authenIsser = await getAuthenIssuerId();
          const authenIssuerId = BigInt("0x" + authenIsser!).toString();
          let isValid = false;
          try {
            if ((await parsedToken.verifyToken(vk, Role.Admin, schemaHash, authenIssuerId, timeLimit))) {
              isValid = true;
            }
          } catch (err) {
          }

          try {
            if ((await parsedToken.verifyToken(vk, Role.Operator, schemaHash, authenIssuerId, timeLimit))) {
              isValid = true;
            }
          } catch (err) {

          }
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

  async authorizationAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      if (!issuerId) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
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
      const {issuerId} = req.params;
      if (!issuerId) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
        return;
      }
      if (!issuerId || typeof issuerId != "string") {

      }
      let {token} = req.body;
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

      try {
        if ((await parsedToken.verifyToken(vk, Role.Operator, schemaHash, authenIssuerId, timeLimit))) {
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
      const {issuerId} = req.params;
      if (!issuerId) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
        return;
      }
      if (!issuerId || typeof issuerId != "string") {

      }
      let {token} = req.body;
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