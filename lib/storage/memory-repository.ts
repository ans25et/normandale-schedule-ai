import path from "node:path";
import { promises as fs } from "node:fs";

import type { PlanInput, PlanResult, StoredUpload } from "@/lib/types";
import type { Repository } from "@/lib/storage/repository";

const DATA_DIR = getDataDir();
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const PLANS_DIR = path.join(DATA_DIR, "plans");

class FileBackedRepository implements Repository {
  async saveUpload<T>(upload: Omit<StoredUpload<T>, "id" | "createdAt">): Promise<StoredUpload<T>> {
    await ensureDataDirs();

    const record: StoredUpload<T> = {
      ...upload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(path.join(UPLOADS_DIR, `${record.id}.json`), JSON.stringify(record, null, 2), "utf8");
    return record;
  }

  async getUpload<T>(id: string): Promise<StoredUpload<T> | undefined> {
    try {
      const raw = await fs.readFile(path.join(UPLOADS_DIR, `${id}.json`), "utf8");
      return JSON.parse(raw) as StoredUpload<T>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async savePlan(_input: PlanInput, payload: PlanResult): Promise<PlanResult> {
    await ensureDataDirs();
    await fs.writeFile(path.join(PLANS_DIR, `${payload.id}.json`), JSON.stringify(payload, null, 2), "utf8");
    return payload;
  }

  async getPlan(id: string): Promise<PlanResult | undefined> {
    try {
      const raw = await fs.readFile(path.join(PLANS_DIR, `${id}.json`), "utf8");
      return JSON.parse(raw) as PlanResult;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }
}

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(PLANS_DIR, { recursive: true });
}

const repository = new FileBackedRepository();

export function getRepository(): Repository {
  return repository;
}

function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "normandale-schedule-ai");
  }

  return path.join(process.cwd(), ".data");
}
