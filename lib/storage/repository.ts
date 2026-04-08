import type { PlanInput, PlanResult, StoredUpload } from "@/lib/types";

export interface Repository {
  saveUpload<T>(upload: Omit<StoredUpload<T>, "id" | "createdAt">): Promise<StoredUpload<T>>;
  getUpload<T>(id: string): Promise<StoredUpload<T> | undefined>;
  savePlan(input: PlanInput, payload: PlanResult): Promise<PlanResult>;
  getPlan(id: string): Promise<PlanResult | undefined>;
}
