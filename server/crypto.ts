import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

function isValidHexKey(str: string): boolean {
  // Must be exactly 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{64}$/.test(str);
}

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Generate a new key automatically for development convenience
    const generatedKey = crypto.randomBytes(32);
    console.warn("[crypto] WARNING: ENCRYPTION_KEY not set. Using auto-generated key. This will NOT persist across restarts!");
    console.warn("[crypto] Generate a permanent key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    cachedKey = generatedKey;
    return cachedKey;
  }
  
  // Check if the key is a valid 64-character hex string
  if (!isValidHexKey(key)) {
    // For flexibility, hash any non-standard key to produce a consistent 32-byte key
    // This allows users to use any string as their encryption key
    const hash = crypto.createHash('sha256').update(key).digest();
    cachedKey = hash;
    return cachedKey;
  }
  
  // Convert hex string to buffer
  cachedKey = Buffer.from(key, "hex");
  return cachedKey;
}

export function encryptPassword(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decryptPassword(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      return "";
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[crypto] Decryption failed:", error);
    return "";
  }
}
