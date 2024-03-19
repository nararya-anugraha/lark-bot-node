import axios from "axios";

const TENANT_ACCESS_TOKEN_URI =
  "/open-apis/auth/v3/tenant_access_token/internal";
const MESSAGE_URI = "/open-apis/im/v1/messages";

interface ErrorResponse {
  status: number;
  data: {
    code: number;
    msg: string;
  };
}

class MessageApiClient {
  private appId: string;
  private appSecret: string;
  private larkHost: string;
  private tenantAccessToken: string = "";

  constructor(appId: string, appSecret: string, larkHost: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.larkHost = larkHost;
  }

  async sendTextWithOpenId(openId: string, content: string): Promise<void> {
    await this.send("open_id", openId, "text", content);
  }

  private async send(
    receiveIdType: string,
    receiveId: string,
    msgType: string,
    content: string,
  ): Promise<void> {
    await this.authorizeTenantAccessToken();
    const url = `${this.larkHost}${MESSAGE_URI}?receive_id_type=${receiveIdType}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.tenantAccessToken}`,
    };

    const reqBody = {
      receive_id: receiveId,
      content: content,
      msg_type: msgType,
    };

    try {
      const response = await axios.post(url, reqBody, { headers });
      MessageApiClient.checkErrorResponse(response);
    } catch (error) {
      console.error("Request failed:", error);
      throw new LarkException(-1, "Request failed");
    }
  }

  private async authorizeTenantAccessToken(): Promise<void> {
    const url = `${this.larkHost}${TENANT_ACCESS_TOKEN_URI}`;
    const reqBody = { app_id: this.appId, app_secret: this.appSecret };

    try {
      const response = await axios.post(url, reqBody);
      MessageApiClient.checkErrorResponse(response);
      this.tenantAccessToken = response.data.tenant_access_token;
    } catch (error) {
      console.error("Authorization failed:", error);
      throw new LarkException(-1, "Authorization failed");
    }
  }

  private static checkErrorResponse(response: ErrorResponse): void {
    if (response.status !== 200) {
      console.error("Response error:", response);
      throw new LarkException(response.status, "HTTP status code is not 200");
    }
    const data = response.data;
    if (data.code !== 0) {
      console.error("Response error:", data);
      throw new LarkException(data.code, data.msg);
    }
  }
}

class LarkException extends Error {
  code: number;
  msg: string;

  constructor(code: number = 0, msg: string = "") {
    super(`${code}:${msg}`);
    this.code = code;
    this.msg = msg;
  }
}

export { MessageApiClient, LarkException };
