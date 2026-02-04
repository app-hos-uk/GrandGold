declare module 'node-cron' {
  export interface ScheduledTask {
    start: () => void;
    stop: () => void;
    destroy: () => void;
  }

  export interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
  }

  export function schedule(
    cronExpression: string,
    func: () => void,
    options?: ScheduleOptions
  ): ScheduledTask;

  export function validate(cronExpression: string): boolean;
}
