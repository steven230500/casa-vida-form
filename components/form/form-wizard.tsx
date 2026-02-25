"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, Send, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProgressIndicator } from "@/components/form/progress-indicator";
import { StepHeader } from "@/components/form/step-header";
import { QuestionCard, QuestionLabel } from "@/components/form/question-card";
import { LoadingScreen } from "@/components/form/loading-screen";
import { SuccessScreen } from "@/components/form/success-screen";
import { v4 as uuidv4 } from "uuid";

type Screen = "landing" | "mode" | "form" | "loading" | "success" | "error";

interface Question {
  id: string;
  key: string;
  label: string;
  type: string;
  options?: any;
  required: boolean;
  order: number;
}

interface Block {
  id: string;
  key: string;
  title: string;
  order: number;
  questions: Question[];
}

interface FormWizardProps {
  formId: string;
  formTitle: string;
  formDescription?: string | null;
  blocks: Block[];
}

export function FormWizard({
  formId,
  formTitle,
  formDescription,
  blocks,
}: FormWizardProps) {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentStep, setCurrentStep] = useState(0);

  // Generic state dictionary: [question_id]: value
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Meta state
  const [mode, setMode] = useState<"anonymous" | "named" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [draftId, setDraftId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const TOTAL_STEPS = blocks.length;

  // Load from local storage
  useEffect(() => {
    const savedDraftId = localStorage.getItem(`form_draft_id_${formId}`);
    if (savedDraftId) {
      setDraftId(savedDraftId);
    } else {
      const newDraftId = uuidv4();
      setDraftId(newDraftId);
      localStorage.setItem(`form_draft_id_${formId}`, newDraftId);
    }

    const savedState = localStorage.getItem(`form_state_${formId}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.currentStep !== undefined)
          setCurrentStep(parsed.currentStep);
        if (
          parsed.screen &&
          parsed.screen !== "success" &&
          parsed.screen !== "loading"
        ) {
          setScreen(parsed.screen);
        }
      } catch (e) {
        console.error("Failed to parse saved form state");
      }
    }
  }, [formId]);

  // Save to local storage
  useEffect(() => {
    if (screen !== "landing" && screen !== "success") {
      localStorage.setItem(
        `form_state_${formId}`,
        JSON.stringify({
          answers,
          mode,
          name,
          email,
          currentStep,
          screen,
        }),
      );
    }
  }, [answers, mode, name, email, currentStep, screen, formId]);

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleNext = useCallback(() => {
    // Validate required fields in the current block
    const currentBlock = blocks[currentStep];
    const missingRequired = currentBlock.questions.find((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        )
          return true;
        if (q.type === "points100") {
          const sum = Object.values(val as Record<string, number>).reduce(
            (a, b) => a + (Number(b) || 0),
            0,
          );
          if (sum !== 100) return true;
        }
      }
      return false;
    });

    if (missingRequired) {
      alert(
        "Por favor completa los campos obligatorios correctamente antes de continuar.",
      );
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, blocks, answers, TOTAL_STEPS]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setScreen("loading");
    setErrorMessage("");

    // Map local answers dict to the array expected by our backend
    const answersToSubmit = Object.entries(answers)
      .map(([qId, val]) => {
        // Find the question type to tag points100 if needed
        let type;
        blocks.forEach((b) => {
          const q = b.questions.find((qy) => qy.id === qId);
          if (q) type = q.type;
        });

        return {
          question_id: qId,
          value: val,
          type: type === "points100" ? "points100" : undefined,
        };
      })
      .filter(
        (a) =>
          a.value !== undefined &&
          a.value !== "" &&
          !(Array.isArray(a.value) && a.value.length === 0),
      );

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_id: formId,
          draft_id: draftId,
          anonymous: mode === "anonymous",
          respondent_name: name || undefined,
          respondent_email: email || undefined,
          answers: answersToSubmit,
          // Since we generalized the form, these fields from the specific Casa Vida schema
          // might be handled differently depending on the questions. We're sending them
          // as regular questions now except if they map directly to these.
          // In a truly generic form, these properties might be deprecated in favor of just generic questions.
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      localStorage.removeItem(`form_draft_id_${formId}`);
      localStorage.removeItem(`form_state_${formId}`);
      setScreen("success");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
      setScreen("error");
    }
  }, [answers, formId, draftId, mode, name, email, blocks]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setMode(null);
    setName("");
    setEmail("");
    setCurrentStep(0);
    setErrorMessage("");
    const newDraftId = uuidv4();
    setDraftId(newDraftId);
    localStorage.setItem(`form_draft_id_${formId}`, newDraftId);
    setScreen("landing");
  }, [formId]);

  // --- Screens ---

  if (screen === "landing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-3xl leading-tight text-foreground text-balance">
              {formTitle}
            </h1>
            {formDescription && (
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {formDescription}
              </p>
            )}
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              strokeWidth={1.5}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">
                Tu información es confidencial
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                Tus respuestas son privadas. Puedes responder de forma anónima
                si lo prefieres.
              </span>
            </div>
          </div>
          <Button
            onClick={() => setScreen("mode")}
            size="lg"
            className="w-full rounded-xl text-base font-medium"
          >
            Empezar
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "mode") {
    return (
      <div className="flex min-h-dvh flex-col px-4 py-8 max-w-md mx-auto w-full">
        <h2 className="text-2xl font-serif mb-6 text-center">
          ¿Cómo deseas responder?
        </h2>

        <div className="space-y-4">
          <div
            onClick={() => setMode("anonymous")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${mode === "anonymous" ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
          >
            <h3 className="font-bold text-lg mb-1">Modo Anónimo</h3>
            <p className="text-sm text-muted-foreground">
              Para responder con total privacidad. No sabremos quién llenó la
              encuesta.
            </p>
          </div>

          <div
            onClick={() => setMode("named")}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${mode === "named" ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
          >
            <h3 className="font-bold text-lg mb-1">Deseo identificarme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para poder recibir acompañamiento o seguimiento.
            </p>

            {mode === "named" && (
              <div className="space-y-3 mt-4 animate-in slide-in-from-top-2 fade-in">
                <Input
                  placeholder="Tu Nombre (Opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Tu Correo (Opcional pero recomendado)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => setScreen("form")}
            disabled={!mode}
            className="w-full rounded-xl py-6 text-lg"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "loading") return <LoadingScreen />;
  if (screen === "success") return <SuccessScreen onReset={handleReset} />;

  if (screen === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Error al enviar</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">{errorMessage}</p>
        <div className="flex space-x-4">
          <Button onClick={() => setScreen("form")} variant="outline">
            Revisar respuestas
          </Button>
          <Button onClick={handleSubmit}>Intentar de nuevo</Button>
        </div>
      </div>
    );
  }

  // Current Step View
  const currentBlock = blocks[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // Render Dynamic Input
  const renderInput = (q: Question) => {
    const val = answers[q.id];

    switch (q.type) {
      case "textarea":
        return (
          <Textarea
            placeholder="Escribe tu respuesta aquí..."
            value={val || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            className="min-h-24 resize-none rounded-lg"
          />
        );

      case "radio":
        return (
          <div className="flex flex-col gap-3">
            {Array.isArray(q.options) &&
              q.options.map((opt: string) => (
                <label
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:bg-muted/50 ${
                    val === opt
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  }`}
                >
                  <div className="flex h-5 items-center">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        val === opt
                          ? "border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {val === opt && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-sm font-medium ${val === opt ? "text-primary" : "text-foreground"}`}
                    >
                      {opt}
                    </span>
                  </div>
                </label>
              ))}
          </div>
        );

      case "checkbox":
        const checkedOptions: string[] = val || [];
        const toggleCheck = (opt: string) => {
          if (checkedOptions.includes(opt)) {
            setAnswer(
              q.id,
              checkedOptions.filter((o) => o !== opt),
            );
          } else {
            setAnswer(q.id, [...checkedOptions, opt]);
          }
        };

        return (
          <div className="flex flex-col gap-3">
            {Array.isArray(q.options) &&
              q.options.map((opt: string) => (
                <label
                  key={opt}
                  onClick={() => toggleCheck(opt)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:bg-muted/50 ${
                    checkedOptions.includes(opt)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  }`}
                >
                  <div className="flex h-5 items-center">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        checkedOptions.includes(opt)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {checkedOptions.includes(opt) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-sm font-medium ${checkedOptions.includes(opt) ? "text-primary" : "text-foreground"}`}
                    >
                      {opt}
                    </span>
                  </div>
                </label>
              ))}
          </div>
        );

      case "points100":
        // Ensure default points record
        const pointsObj = val || {};
        const categories = Array.isArray(q.options)
          ? q.options
          : ["Option 1", "Option 2"];
        const totalPoints = categories.reduce(
          (sum: number, cat: string) => sum + (Number(pointsObj[cat]) || 0),
          0,
        );
        const remaining = 100 - totalPoints;

        return (
          <div className="space-y-4">
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium border ${remaining === 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}
            >
              <span>Puntos restantes por distribuir</span>
              <span className="text-lg font-bold">{remaining}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((cat: string) => {
                const pVal = pointsObj[cat] || 0;
                return (
                  <div
                    key={cat}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                  >
                    <span className="text-sm font-medium">
                      {cat.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        max={100 - (totalPoints - pVal)}
                        value={pVal || ""}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setAnswer(q.id, { ...pointsObj, [cat]: 0 });
                            return;
                          }
                          const sumOfOthers = totalPoints - pVal;
                          const maxAllowed = Math.max(0, 100 - sumOfOthers);
                          const num = Math.min(
                            maxAllowed,
                            Math.max(0, parseInt(e.target.value) || 0),
                          );
                          setAnswer(q.id, { ...pointsObj, [cat]: num });
                        }}
                        className="text-center font-medium"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={val || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
      case "time":
        return (
          <Input
            type="time"
            value={val || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
      case "text":
      default:
        return (
          <Input
            type="text"
            value={val || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur-sm">
        <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <StepHeader
            stepNumber={currentStep + 1}
            totalSteps={TOTAL_STEPS}
            title={currentBlock.title}
            subtitle={""}
          />

          <div className="flex flex-col gap-5">
            {currentBlock.questions.map((q, idx) => (
              <QuestionCard key={q.id}>
                <div className="flex flex-col gap-3">
                  <QuestionLabel number={idx + 1} required={q.required}>
                    {q.label}
                  </QuestionLabel>
                  {renderInput(q)}
                </div>
              </QuestionCard>
            ))}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm shadow-t-lg">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="rounded-xl px-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Anterior</span>
          </Button>

          <div className="flex-1" />

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              className="rounded-xl px-6 text-base font-medium"
            >
              Enviar form
              <Send className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="rounded-xl px-6 text-base font-medium"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
