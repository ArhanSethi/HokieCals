export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameMonth(date: Date, year: number, month: number) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export type CalendarCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
};

/** Sunday-start month grid including leading/trailing days. */
export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: CalendarCell[] = [];
  const cursor = new Date(start);

  for (let i = 0; i < 42; i++) {
    cells.push({
      date: new Date(cursor),
      dateKey: toDateKey(cursor),
      inCurrentMonth: cursor.getMonth() === month,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
