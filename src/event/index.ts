import * as crypto from "crypto";
import { Request } from "express";

// Assuming utils and decrypt modules are implemented with TypeScript support
import AESCipher from "../decrypt";
import { UnionEventContent, UnionEventHandler } from "./types";

class InvalidEventException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEventException";
  }
}

interface EventManagerConstructParams {
  token: string;
  encryptKey: string;
}

class EventManager {
  private eventCallbackMap: Record<string, UnionEventHandler> = {};
  private token: string = "";
  private encryptKey: string = "";

  constructor({ encryptKey, token }: EventManagerConstructParams) {
    this.token = token;
    this.encryptKey = encryptKey;
  }

  decryptData(data: UnionEventContent): UnionEventContent {
    const { encrypt } = data;
    if (!this.encryptKey || !encrypt) {
      return data;
    }

    const cipher = new AESCipher(this.encryptKey);
    const decryptedString = cipher.decryptString(encrypt);

    try {
      const jsonData = JSON.parse(decryptedString);
      return jsonData;
    } catch (error) {
      throw new Error("Failed to parse decrypted string as JSON");
    }
  }

  validate(req: Request): void {
    const timestamp = req.headers["x-lark-request-timestamp"] as string;
    const nonce = req.headers["x-lark-request-nonce"] as string;
    const signature = req.headers["x-lark-signature"] as string;
    const body = JSON.stringify(req.body);

    const hash = crypto.createHash("sha256");
    hash.update(timestamp + nonce + this.encryptKey + body);
    if (signature !== hash.digest("hex")) {
      throw new InvalidEventException("invalid signature in event");
    }
  }

  register(eventType: string, handler: UnionEventHandler): void {
    this.eventCallbackMap[eventType] = handler;
  }

  getEventHandler(req: Request): UnionEventHandler {
    const eventData = this.decryptData(req.body);
    console.log({ eventData, reqBody: req.body });
    const type = eventData.type || eventData.header.event_type;
    const eventHandler = this.eventCallbackMap[type];
    if (!eventHandler) {
      throw new InvalidEventException("unknown event: " + type);
    }
    return eventHandler;
  }

  getEvent(req: Request): UnionEventContent {
    const eventData = this.decryptData(req.body);
    return eventData;
  }
}

export { EventManager, InvalidEventException };
