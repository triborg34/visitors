// Global fetch availability for Node.js 18+ (types not in @types/node@14)
declare function fetch(input: string, init?: Record<string, unknown>): Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;
