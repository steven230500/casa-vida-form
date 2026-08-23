"use client";

import { useState } from "react";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function parseValue(value: string) {
  if (!value) return { day: undefined, month: undefined, year: undefined };
  const [y, m, d] = value.split("-").map(Number);
  return { day: d, month: m, year: y };
}

// Native <input type="date"> opens on today's month/year, so picking a date
// decades in the past (or future) means clicking back/forward one month at
// a time. Three plain dropdowns let you jump straight to any day/month/year.
//
// Day/month/year are local state rather than derived from `value` on every
// render: while only some of the three are picked there's no valid ISO date
// yet, so an onChange('') round-trip through a controlled `value` prop would
// erase whichever parts were already picked. Pass a `key` from the parent
// (e.g. the question id) if the same instance might need to reset to a
// different saved value later.
export function DatePartsSelect({
  value,
  onChange,
  required,
}: {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const initial = parseValue(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear + 1 - i);
  const maxDay = month && year ? daysInMonth(month, year) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function pick(next: { day?: number; month?: number; year?: number }) {
    const d = next.day ?? day;
    const m = next.month ?? month;
    const y = next.year ?? year;
    setDay(d);
    setMonth(m);
    setYear(y);
    if (d && m && y) {
      const clampedDay = Math.min(d, daysInMonth(m, y));
      onChange(
        `${y}-${String(m).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`,
      );
    } else {
      onChange("");
    }
  }

  const selectClass =
    "w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/50";

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={day ?? ""}
        onChange={(e) => pick({ day: Number(e.target.value) })}
        className={selectClass}
        required={required}
      >
        <option value="">Día</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={month ?? ""}
        onChange={(e) => pick({ month: Number(e.target.value) })}
        className={selectClass}
        required={required}
      >
        <option value="">Mes</option>
        {MONTHS.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={year ?? ""}
        onChange={(e) => pick({ year: Number(e.target.value) })}
        className={selectClass}
        required={required}
      >
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
