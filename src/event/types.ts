export interface EventHeader {
  token: string;
  event_type: string;
}

export interface Content {
  encrypt?: string;
  header: EventHeader;
  type: string;
  schema: string;
}

export interface Event<T> {
  header: EventHeader;
  content: T;
}

export interface UrlVerificationContent extends Content {
  token: string;
  challenge: string;
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

export type EventHandler<T> = (event: T) => Promise<Record<string, unknown>>;

export type UnionEventContent = MessageReceiveContent | UrlVerificationContent;

export type UnionEvent =
  | Event<MessageReceiveContent>
  | Event<UrlVerificationContent>;

export type UnionEventHandler =
  | EventHandler<MessageReceiveContent>
  | EventHandler<UrlVerificationContent>;
