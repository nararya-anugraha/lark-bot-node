import * as crypto from "crypto";

class AESCipher {
  private key: Buffer;
  private static readonly algorithm: string = "aes-256-cbc";

  constructor(key: string) {
    this.key = crypto.createHash("sha256").update(String(key)).digest();
  }

  private static unpad(buffer: Buffer): Buffer {
    const paddingValue = buffer[buffer.length - 1];
    return buffer.slice(0, -paddingValue);
  }

  decrypt(enc: Buffer, iv: Buffer): Buffer {
    const decipher = crypto.createDecipheriv(AESCipher.algorithm, this.key, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  decryptString(enc: string): string {
    const encBuffer = Buffer.from(enc, "base64");
    const iv = encBuffer.slice(0, 16); // The IV is typically the first 16 bytes
    const encryptedText = encBuffer.slice(16); // The encrypted content follows the IV
    const decryptedBuffer = this.decrypt(encryptedText, iv);
    const unpaddedBuffer = AESCipher.unpad(decryptedBuffer);
    return unpaddedBuffer.toString("utf8");
  }
}

export default AESCipher;
