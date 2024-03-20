export interface EventHeader {
  app_id: string;
  create_time: string;
  event_id: string;
  event_type: string;
  tenant_key: string;
  token: string;
}

export interface Content {
  encrypt?: string;
  event?: Record<string, unknown>;
  header?: EventHeader;
  schema?: string;
}

export interface UrlVerificationContent extends Content {
  challenge: string;
  type: string;
  token: string;
}

export interface MessageReceiveContent extends Content {
  event: {
    sender: {
      sender_id: {
        open_id: string;
      };
    };
    message: {
      message_type: string;
      content: string;
    };
  };
}

export interface MessageReadContent extends Content {
  event: {
    message_id_list: string[];
    reader: {
      read_time: string;
      reader_id: {
        open_id: string;
        union_id: string;
        user_id: string;
      };
      tenant_key: string;
    };
  };
}

export type EventHandler = (
  content: Content,
) => Promise<Record<string, unknown>>;
