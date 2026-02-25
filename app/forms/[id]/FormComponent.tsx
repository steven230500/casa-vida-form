"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

type Question = {
  id: string;
  key: string;
  label: string;
  type: string;
  options: any;
  required: boolean;
  order: number;
  condition: any;
};

type Block = {
  id: string;
  key: string;
  title: string;
  order: number;
  questions: Question[];
};

type FormProps = {
  formId: string;
  title: string;
  description: string;
  blocks: Block[];
};

export default function FormComponent({ form }: { form: FormProps }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [draftId, setDraftId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Basic respondent data
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");

  // 1. Load or Create Draft ID and Answers from Local Storage
  useEffect(() => {
    const savedDraftId = localStorage.getItem(`form_draft_id_${form.formId}`);
    if (savedDraftId) {
      setDraftId(savedDraftId);
    } else {
      const newDraftId = uuidv4();
      setDraftId(newDraftId);
      localStorage.setItem(`form_draft_id_${form.formId}`, newDraftId);
    }

    const savedAnswers = localStorage.getItem(`form_answers_${form.formId}`);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed.answers || {});
        setRespondentName(parsed.name || "");
        setRespondentEmail(parsed.email || "");
      } catch (e) {
        console.error("Failed to parse saved answers");
      }
    }
  }, [form.formId]);

  // 2. Save Answers to Local Storage continuously
  useEffect(() => {
    if (Object.keys(answers).length > 0 || respondentName || respondentEmail) {
      localStorage.setItem(
        `form_answers_${form.formId}`,
        JSON.stringify({
          answers,
          name: respondentName,
          email: respondentEmail,
        }),
      );
    }
  }, [answers, respondentName, respondentEmail, form.formId]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculatePoints100Sum = (questionId: string) => {
    const vals = answers[questionId] || {};
    return Object.values(vals).reduce(
      (acc: number, val: any) => acc + Number(val || 0),
      0,
    ) as number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Pre-submit validation
    for (const block of form.blocks) {
      for (const q of block.questions) {
        if (q.required && !answers[q.id]) {
          setError(`Please answer the required question: "${q.label}"`);
          setIsSubmitting(false);
          return;
        }
        if (q.type === "points100") {
          if (calculatePoints100Sum(q.id) !== 100) {
            setError(`Points must sum to exactly 100 for: "${q.label}"`);
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(
      ([question_id, value]) => {
        // Find question to append type for backend validation hints (optional but good practice)
        const q = form.blocks
          .flatMap((b) => b.questions)
          .find((q) => q.id === question_id);
        return {
          question_id,
          value,
          type: q?.type,
        };
      },
    );

    try {
      const res = await fetch(`/api/responses`, {
        // Using the updated refactored API route (which we named POST /api/responses actually)
        // Note: the task said /api/forms/[id]/submit but we already built /api/responses that takes form_id in the body.
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_id: form.formId,
          draft_id: draftId,
          anonymous: !respondentName && !respondentEmail,
          respondent_name: respondentName,
          respondent_email: respondentEmail,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      // Clear local storage on success
      localStorage.removeItem(`form_draft_id_${form.formId}`);
      localStorage.removeItem(`form_answers_${form.formId}`);

      // Redirect to success
      router.push(`/forms/${form.formId}/success`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (q: Question) => {
    const value = answers[q.id] || "";

    switch (q.type) {
      case "textarea":
        return (
          <textarea
            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
            rows={4}
            value={value}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            required={q.required}
          />
        );
      case "radio":
        return (
          <div className="space-y-2">
            {(q.options as string[]).map((opt) => (
              <label
                key={opt}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  required={q.required && !value}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case "points100":
        const currentSum = calculatePoints100Sum(q.id);
        const options = q.options as string[];
        return (
          <div className="space-y-4">
            <div
              className={`p-2 rounded text-sm font-bold ${currentSum === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              Current Sum: {currentSum} / 100
            </div>
            {options.map((opt) => (
              <div key={opt} className="flex flex-col space-y-1">
                <label className="text-sm font-medium">{opt}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  value={answers[q.id]?.[opt] || ""}
                  onChange={(e) => {
                    const currentVals = answers[q.id] || {};
                    handleAnswerChange(q.id, {
                      ...currentVals,
                      [opt]: parseInt(e.target.value) || 0,
                    });
                  }}
                />
              </div>
            ))}
          </div>
        );
      default: // text
        return (
          <input
            type="text"
            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
            value={value}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            required={q.required}
          />
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-300">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Your Information (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Leave blank to remain anonymous"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {form.blocks.map((block) => (
          <div
            key={block.id}
            className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">
              {block.title}
            </h2>

            <div className="space-y-8">
              {block.questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <label className="block font-medium">
                    {q.label}{" "}
                    {q.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderInput(q)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Response"}
        </button>
      </form>
    </div>
  );
}
