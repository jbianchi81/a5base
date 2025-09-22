declare module 'postgres-interval' {
  export interface IntervalObject {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
    toPostgres(): string;
  }

  export default function parsePGinterval(interval?: string): IntervalObject;

}
