import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const db = globalThis.prisma || new PrismaClient();
if(process.env.NODE_ENV !== 'production') globalThis.prisma = db;

export default db;