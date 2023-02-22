import dotenv from 'dotenv';
import process from 'process';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/AUTHEN_SERVER";
export const STATE_ADDRESS = process.env.STATE_ADDRESS ?? "0x0"
export const RPC_PROVIDER = process.env.RPC_PROVIDER ?? "https://data-seed-prebsc-1-s1.binance.org:8545/"
export const isProduction = process.env.NODE_ENV == "production";
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "debug";
export const LOG_OUTPUT = process.env.LOG_OUTPUT ?? "dev";
export const PUBKEYX = process.env.PUBKEYX ?? "0";
export const PUBKEYY = process.env.PUBKEYY ?? "0";
export const PRIVATEKEY = process.env.PRIVATEKEY ?? "0";