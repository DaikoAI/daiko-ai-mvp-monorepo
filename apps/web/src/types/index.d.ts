declare module "idle-task" {
  export function setIdleTask(
    task: () => void,
    options?: { priority?: "low" | "high"; revalidateInterval?: number; revalidateWhenExecuted?: boolean },
  ): void;
}
