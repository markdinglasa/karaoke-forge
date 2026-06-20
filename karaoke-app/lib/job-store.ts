// lib/jobStore.ts
// In-memory job state store (suitable for single-instance dev/production)

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  outputPath?: string;
  createdAt: number;
}

// Global map persisted across API route calls in Node.js process
const jobMap = new Map<string, Job>();

export function createJob(id: string): Job {
  const job: Job = {
    id,
    status: "pending",
    progress: 0,
    message: "Initializing...",
    createdAt: Date.now(),
  };
  jobMap.set(id, job);
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): void {
  const existing = jobMap.get(id);
  if (existing) {
    jobMap.set(id, { ...existing, ...updates });
  }
}

export function getJob(id: string): Job | undefined {
  return jobMap.get(id);
}

export function deleteJob(id: string): void {
  jobMap.delete(id);
}
