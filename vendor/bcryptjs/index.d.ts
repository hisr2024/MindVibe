export function hash(data: string | Buffer, saltRounds?: number): Promise<string>
export function compare(data: string | Buffer, encrypted: string): Promise<boolean>
