"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StatusDropdown({
  responseId,
  currentStatus,
}: {
  responseId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const statuses = [
    { value: "new", label: "Nuevo" },
    { value: "reviewed", label: "Revisado" },
    { value: "followup_pending", label: "Necesita seguimiento" },
    { value: "closed", label: "Cerrado" },
  ];

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const res = await fetch("/api/reviewer/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_id: responseId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el estado. Intenta de nuevo.");
      // Revert status on failure
      setStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-muted-foreground">
        Estado:
      </span>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`text-sm rounded-md border border-foreground/15 bg-background px-2 py-1.5 outline-none focus:border-foreground/40 ${isUpdating ? "opacity-50" : ""}`}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {isUpdating && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Guardando...
        </span>
      )}
    </div>
  );
}
