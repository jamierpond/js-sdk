// Copyright  ©, 2023-present, Lightspark Group, Inc. - All Rights Reserved
import LightsparkException from "../LightsparkException.js";

import { b64decode } from "../utils/base64.js";

export type CryptoInterface = {
  decryptSecretWithNodePassword: (
    cipher: string,
    encryptedSecret: string,
    nodePassword: string
  ) => Promise<ArrayBuffer | null>;

  generateSigningKeyPair: () => Promise<{
    publicKey: CryptoKey | string;
    privateKey: CryptoKey | string;
  }>;

  serializeSigningKey: (
    key: CryptoKey | string,
    format: "pkcs8" | "spki"
  ) => Promise<ArrayBuffer>;

  getNonce: () => Promise<number>;

  sign: (key: CryptoKey | Uint8Array, data: Uint8Array) => Promise<ArrayBuffer>;

  importPrivateSigningKey: (
    keyData: Uint8Array,
    format: "pkcs8" | "spki"
  ) => Promise<CryptoKey | Uint8Array>;
};

const getCrypto = () => {
  let cryptoImplPromise: Promise<typeof crypto>;
  if (typeof crypto !== "undefined") {
    cryptoImplPromise = Promise.resolve(crypto);
  } else {
    cryptoImplPromise = import("crypto").then((nodeCrypto) => {
      return nodeCrypto as typeof crypto;
    });
  }
  return cryptoImplPromise;
};

const getRandomValues32 = async (arr: Uint32Array): Promise<Uint32Array> => {
  if (typeof crypto !== "undefined") {
    return crypto.getRandomValues(arr);
  } else {
    const cryptoImpl = await getCrypto();
    return cryptoImpl.getRandomValues(arr);
  }
};

const deriveKey = async (
  password: string,
  salt: ArrayBuffer,
  iterations: number,
  algorithm: string,
  bit_len: number
): Promise<[CryptoKey, ArrayBuffer]> => {
  const enc = new TextEncoder();
  const cryptoImpl = await getCrypto();
  const password_key = await cryptoImpl.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const derived = await cryptoImpl.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    password_key,
    bit_len
  );

  // Split the derived bytes into a 32 byte AES key and a 16 byte IV
  const key = await cryptoImpl.subtle.importKey(
    "raw",
    derived.slice(0, 32),
    { name: algorithm, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = derived.slice(32);

  return [key, iv];
};

const decrypt = async (
  header_json: string,
  ciphertext: string,
  password: string
): Promise<ArrayBuffer> => {
  var decoded = b64decode(ciphertext);

  var header;
  if (header_json === "AES_256_CBC_PBKDF2_5000_SHA256") {
    header = {
      v: 0,
      i: 5000,
    };
    // Strip "Salted__" prefix
    decoded = decoded.slice(8);
  } else {
    header = JSON.parse(header_json);
  }

  if (header.v < 0 || header.v > 4) {
    throw new LightsparkException(
      "DecryptionError",
      "Unknown version ".concat(header.v)
    );
  }

  const cryptoImpl = await getCrypto();
  const algorithm = header.v < 2 ? "AES-CBC" : "AES-GCM";
  const bit_len = header.v < 4 ? 384 : 352;
  const salt_len = header.v < 4 ? 8 : 16;

  if (header.lsv === 2 || header.v === 3) {
    const salt = decoded.slice(decoded.length - 8, decoded.length);
    const nonce = decoded.slice(0, 12);
    const cipherText = decoded.slice(12, decoded.length - 8);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [key, _iv] = await deriveKey(
      password,
      salt,
      header.i,
      algorithm,
      256
    );
    return await cryptoImpl.subtle.decrypt(
      { name: algorithm, iv: nonce.buffer },
      key,
      cipherText
    );
  } else {
    const salt = decoded.slice(0, salt_len);
    const encrypted = decoded.slice(salt_len);
    const [key, iv] = await deriveKey(
      password,
      salt,
      header.i,
      algorithm,
      bit_len
    );
    return await cryptoImpl.subtle.decrypt(
      { name: algorithm, iv },
      key,
      encrypted
    );
  }
};

async function decryptSecretWithNodePassword(
  cipher: string,
  encryptedSecret: string,
  nodePassword: string
): Promise<ArrayBuffer | null> {
  let decryptedValue: ArrayBuffer | null = null;
  try {
    decryptedValue = await decrypt(cipher, encryptedSecret, nodePassword);
  } catch (ex) {
    // If the password is incorrect, we're likely to get UTF-8 decoding errors.
    // Catch everything and we'll leave the value as the empty string.
    console.error(ex);
  }
  return decryptedValue;
}

const generateSigningKeyPair = async (): Promise<
  CryptoKeyPair | { publicKey: string; privateKey: string }
> => {
  const cryptoImpl = await getCrypto();
  return await cryptoImpl.subtle.generateKey(
    /*algorithm:*/ {
      name: "RSA-PSS",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    /*extractable*/ true,
    /*keyUsages*/ ["sign", "verify"]
  );
};

const serializeSigningKey = async (
  key: CryptoKey | string,
  format: "pkcs8" | "spki"
): Promise<ArrayBuffer> => {
  const cryptoImpl = await getCrypto();
  return await cryptoImpl.subtle.exportKey(
    /*format*/ format,
    /*key*/ key as CryptoKey
  );
};

const getNonce = async () => {
  const cryptoImpl = await getCrypto();
  const nonceSt = await getRandomValues32(new Uint32Array(1));
  return Number(nonceSt);
};

const sign = async (
  key: CryptoKey | Uint8Array,
  data: Uint8Array
): Promise<ArrayBuffer> => {
  const cryptoImpl = await getCrypto();
  return await cryptoImpl.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    key as CryptoKey,
    data
  );
};

const importPrivateSigningKey = async (
  keyData: Uint8Array,
  format: "pkcs8" | "spki"
): Promise<CryptoKey | Uint8Array> => {
  const cryptoImpl = await getCrypto();
  return await cryptoImpl.subtle.importKey(
    /*format*/ format,
    /*keyData*/ keyData,
    /*algorithm*/ {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    /*extractable*/ true,
    /*keyUsages*/ ["sign"]
  );
};

export const DefaultCrypto = {
  decryptSecretWithNodePassword,
  generateSigningKeyPair,
  serializeSigningKey,
  getNonce,
  sign,
  importPrivateSigningKey,
};

export { default as LightsparkSigningException } from "./LightsparkSigningException.js";