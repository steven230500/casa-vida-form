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
    { value: "new", label: "New" },
    { value: "reviewed", label: "Reviewed" },
    { value: "followup_pending", label: "Needs Follow-up" },
    { value: "closed", label: "Closed" },
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
      alert("Error saving status. Please try again.");
      // Revert status on failure
      setStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-gray-500">Status:</span>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`text-sm rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-blue-500 focus:border-blue-500 ${isUpdating ? "opacity-50" : ""}`}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {isUpdating && (
        <span className="text-xs text-blue-600 animate-pulse">Saving...</span>
      )}
    </div>
  );
}
