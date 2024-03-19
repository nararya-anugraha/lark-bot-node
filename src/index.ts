#!/usr/bin/env node

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import {
  UrlVerificationContent,
  MessageReceiveContent,
  UnionEvent,
} from "./event/types";
import { MessageApiClient } from "./api";
import { EventManager } from "./event";

// Load environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Environment variables
const APP_ID = process.env.APP_ID!;
const APP_SECRET = process.env.APP_SECRET!;
const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN!;
const ENCRYPT_KEY = process.env.ENCRYPT_KEY!;
const LARK_HOST = process.env.LARK_HOST!;

// Initialize your event manager
const eventManager = new EventManager({
  encryptKey: ENCRYPT_KEY,
  token: VERIFICATION_TOKEN,
});

const messageApiClient = new MessageApiClient(APP_ID, APP_SECRET, LARK_HOST);

// Register event handlers
eventManager.register(
  "url_verification",
  async ({ challenge, token }: UrlVerificationContent) => {
    if (token !== VERIFICATION_TOKEN) {
      throw new Error("VERIFICATION_TOKEN is invalid");
    }
    return { challenge };
  },
);

eventManager.register(
  "im.message.receive_v1",
  async (reqData: MessageReceiveContent) => {
    const { event } = reqData;
    const senderId = event.sender.sender_id;
    const message = event.message;
    if (message.message_type !== "text") {
      console.warn("Other types of messages have not been processed yet");
      return {};
    }
    const openId = senderId.open_id;
    const textContent = message.content;
    await messageApiClient.sendTextWithOpenId(openId, textContent);
    return {};
  },
);

// Define the route for receiving events
app.post("/", async (req: Request, res: Response) => {
  try {
    const eventHandler = eventManager.getEventHandler(req);
    const event = eventManager.getEvent(req);
    // @ts-expect-error: generic shenanigans
    const response = await eventHandler(event as UnionEvent);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(400).send("Error");
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
