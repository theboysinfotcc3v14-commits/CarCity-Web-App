declare module 'next' {
  import type { IncomingMessage, ServerResponse } from 'http';
  export interface NextApiRequest extends IncomingMessage {
    query: Partial<{ [key: string]: string | string[] }>;
    cookies: Partial<{ [key: string]: string }>;
    body: any;
    headers: IncomingMessage['headers'];
  }
  export interface NextApiResponse<T = any> extends ServerResponse {
    send(body: T): void;
    json(body: T): void;
    status(statusCode: number): NextApiResponse<T>;
    setHeader(name: string, value: string | number | readonly string[]): this;
  }
}

declare module 'next/server' {
  export class NextResponse extends Response {
    static json<T = any>(body: T, init?: ResponseInit): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
      set(options: {
        name: string;
        value: string;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        path?: string;
        maxAge?: number;
      }): void;
      get(name: string): { name: string; value: string } | undefined;
      delete(name: string): void;
    };
  }

  export class NextRequest extends Request {
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
    };
    nextUrl: URL;
  }
}
