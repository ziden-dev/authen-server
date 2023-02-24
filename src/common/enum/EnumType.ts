export enum ProofTypeQuery {
    MTP = "mtp",
    SIG = "sig",
    NON_REV_MTP = "nonRevMtp"
}

export enum ClaimStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REVIEWING = "REVIEWING",
    REJECT = "REJECT",
    PENDING_REVOKE = "PENDING_REVOKE",
    REVOKED = "REVOKED"
}

export enum ProofType {
    MTP = "mtp",
    SIG = "sig"
}

export enum OperatorType {
    ADMIN = 1,
    OPERATOR = 2,
    VERIFIER = 3
}