import { Between } from 'typeorm';

export function betweenDates(start: Date, end: Date) {
  return Between(start, end);
}
