"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createForm,
  updateForm,
  deleteForm,
  createBlock,
  updateBlock,
  deleteBlock,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  QuestionPayload,
} from "@/app/admin/actions";
import {
  Plus,
  Trash2,
  Save,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import ShareLinkCard from "./ShareLinkCard";
import { keyify } from "@/lib/slugify";

type Form = {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  is_active: boolean;
  require_respondent_name: boolean;
};

type Block = {
  id: string;
  form_id: string;
  key: string | null;
  title: string;
  order: number;
};

type Question = {
  id: string;
  form_id: string;
  block_id: string | null;
  key: string;
  label: string;
  type: string;
  options: any;
  required: boolean;
  order: number;
  condition: any;
  active: boolean;
};

const OPTION_BASED_TYPES = ["radio", "checkbox", "select", "points100"];

export default function FormEditorClient({
  initialForm,
  initialBlocks,
  initialQuestions,
  isNew,
}: {
  initialForm: Form | null;
  initialBlocks: Block[];
  initialQuestions: Question[];
  isNew: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Form>>(
    initialForm || {
      title: "",
      description: "",
      is_active: true,
      require_respondent_name: false,
    },
  );
  // Sort blocks by order initially
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.sort((a, b) => a.order - b.order),
  );
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.sort((a, b) => a.order - b.order),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [editingQuestion, setEditingQuestion] =
    useState<Partial<Question> | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);

  // --- FORM HANDLERS ---
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", form.title || "");
    formData.append("description", form.description || "");
    formData.append("is_active", String(form.is_active));
    formData.append(
      "require_respondent_name",
      String(form.require_respondent_name || false),
    );
    if (!isNew) {
      formData.append("slug", form.slug || "");
    }

    try {
      let result;
      if (isNew) {
        result = await createForm(formData);
      } else {
        result = await updateForm(form.id!, formData);
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to edit page if new
        if (isNew && result.data) {
          router.push(`/admin/forms/${result.data.id}`);
        } else {
          // refresh data
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!confirm("¿Estás seguro de eliminar este formulario?")) return;
    setLoading(true);
    const result = await deleteForm(form.id!);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin/forms");
    }
  };

  // --- BLOCK HANDLERS ---
  const openAddBlockModal = () => {
    setNewBlockTitle("");
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = async () => {
    const title = newBlockTitle.trim();
    if (!title) return;
    setBlockSaving(true);

    const order = blocks.length;
    const result = await createBlock(form.id!, title, order);

    if (result.error || !result.data) {
      alert(result.error);
      setBlockSaving(false);
    } else {
      setBlocks([...blocks, result.data]);
      setIsBlockModalOpen(false);
      setNewBlockTitle("");
      setBlockSaving(false);
      router.refresh();
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (
      !confirm("Al eliminar la sección, se perderán las preguntas asociadas.")
    )
      return;
    await deleteBlock(id, form.id!);
    setBlocks(blocks.filter((b) => b.id !== id));
    router.refresh();
  };

  const handleMoveBlock = async (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    if (direction === "up" && index > 0) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index - 1];
      newBlocks[index - 1] = temp;
    } else if (direction === "down" && index < newBlocks.length - 1) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index + 1];
      newBlocks[index + 1] = temp;
    } else {
      return;
    }

    // Update orders
    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks); // Optimistic

    // Send updates for swapped items
    // Ideally we update only the two affected, but updating index logic is cleaner if we just update the ones that changed
    // For simplicity in this v1, we just update the two swapped blocks
    const b1 = newBlocks[index];
    const b2 = direction === "up" ? newBlocks[index + 1] : newBlocks[index - 1]; // original positions swapped
    // actually, simpler: just loop and update all (batch would be better but parallel promises work)
    // minimal: update only the neighbor and current
    // Using Promise.all to update properly
    await Promise.all([
      updateBlock(b1.id, form.id!, b1.title, b1.order),
      updateBlock(b2.id, form.id!, b2.title, b2.order),
    ]);
    router.refresh();
  };

  // --- QUESTION HANDLERS ---
  const openAddQuestionModal = (blockId: string) => {
    const order = questions.filter((q) => q.block_id === blockId).length;
    setEditingQuestion({
      form_id: form.id,
      block_id: blockId,
      type: "text",
      required: false,
      order,
      label: "",
      key: "",
      options: [],
      condition: null,
    });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    // Older questions (e.g. points100 before it had an options editor) can
    // have type=points100 with options=[] - give them a starting pair too
    // instead of an empty list with nothing to edit.
    const needsSeedOptions =
      OPTION_BASED_TYPES.includes(question.type) &&
      (!Array.isArray(question.options) || question.options.length === 0);
    setEditingQuestion({
      ...question,
      options: needsSeedOptions ? ["", ""] : question.options,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.label) {
      alert("Falta la pregunta");
      return;
    }

    // Key is derived from the label, not typed by hand - whoever fills this
    // out has no idea what a "unique identifier" should look like.
    const base = keyify(editingQuestion.label) || "pregunta";
    const takenKeys = new Set(
      questions
        .filter((q) => q.id !== editingQuestion.id)
        .map((q) => q.key),
    );
    let key = base;
    let n = 2;
    while (takenKeys.has(key)) {
      key = `${base}_${n}`;
      n += 1;
    }

    const optionsToSave = Array.isArray(editingQuestion.options)
      ? editingQuestion.options
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt !== "")
      : editingQuestion.options;

    const payload: QuestionPayload = {
      form_id: editingQuestion.form_id!,
      block_id: editingQuestion.block_id!,
      key,
      label: editingQuestion.label,
      type: editingQuestion.type || "text",
      options: optionsToSave,
      required: editingQuestion.required || false,
      order: editingQuestion.order || 0,
      condition:
        editingQuestion.condition?.questionId &&
        editingQuestion.condition?.equals
          ? editingQuestion.condition
          : null,
    };

    let result;
    if (editingQuestion.id) {
      result = await updateQuestion(editingQuestion.id, payload);
    } else {
      result = await createQuestion(payload);
    }

    if (result.error || !result.data) {
      alert(result.error);
    } else {
      const savedQuestion = result.data;
      if (editingQuestion.id) {
        setQuestions(
          questions.map((q) => (q.id === editingQuestion.id ? savedQuestion : q)),
        );
      } else {
        setQuestions([...questions, savedQuestion]);
      }
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
      router.refresh();
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("¿Eliminar pregunta?")) return;
    await deleteQuestion(id, form.id!);
    setQuestions(questions.filter((q) => q.id !== id));
    router.refresh();
  };

  const handleToggleQuestionActive = async (question: Question) => {
    const nextActive = !question.active;
    setQuestions(
      questions.map((q) =>
        q.id === question.id ? { ...q, active: nextActive } : q,
      ),
    );
    await updateQuestion(question.id, {
      form_id: question.form_id,
      active: nextActive,
    });
    router.refresh();
  };

  const handleMoveQuestion = async (
    question: Question,
    direction: "up" | "down",
  ) => {
    // Get questions in this block
    const blockQs = questions
      .filter((q) => q.block_id === question.block_id)
      .sort((a, b) => a.order - b.order);
    const index = blockQs.findIndex((q) => q.id === question.id);

    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blockQs.length - 1) return;

    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = blockQs[neighborIndex];

    // Swap orders
    const tempOrder = question.order;
    question.order = neighbor.order;
    neighbor.order = tempOrder;

    // Update state
    setQuestions([...questions]);

    // Server update
    const p1: QuestionPayload = {
      ...question,
      form_id: question.form_id,
      block_id: question.block_id,
      key: question.key,
      label: question.label,
      type: question.type,
      required: question.required,
    };
    const p2: QuestionPayload = {
      ...neighbor,
      form_id: neighbor.form_id,
      block_id: neighbor.block_id,
      key: neighbor.key,
      label: neighbor.label,
      type: neighbor.type,
      required: neighbor.required,
    };

    await Promise.all([
      updateQuestion(question.id, p1),
      updateQuestion(neighbor.id, p2),
    ]);
    router.refresh();
  };

  // --- OPTIONS LIST (radio / checkbox / select / points100) ---
  const shouldFocusLastOptionRef = useRef(false);
  const lastOptionInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (shouldFocusLastOptionRef.current && lastOptionInputRef.current) {
      lastOptionInputRef.current.focus();
      shouldFocusLastOptionRef.current = false;
    }
  });

  const handleOptionChange = (index: number, value: string) => {
    const opts = Array.isArray(editingQuestion?.options)
      ? [...editingQuestion.options]
      : [];
    opts[index] = value;
    setEditingQuestion({ ...editingQuestion, options: opts });
  };

  const handleAddOption = () => {
    const opts = Array.isArray(editingQuestion?.options)
      ? [...editingQuestion.options]
      : [];
    opts.push("");
    shouldFocusLastOptionRef.current = true;
    setEditingQuestion({ ...editingQuestion, options: opts });
  };

  const handleRemoveOption = (index: number) => {
    const opts = Array.isArray(editingQuestion?.options)
      ? [...editingQuestion.options]
      : [];
    opts.splice(index, 1);
    setEditingQuestion({ ...editingQuestion, options: opts });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* FORM DETAILS CARD */}
      <div className="rounded-t-[2.5rem] rounded-b-2xl border border-foreground/10 bg-muted p-8">
        <form onSubmit={handleSaveForm} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Título del Formulario
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-foreground/40"
                placeholder="Ej: Registro de Voluntarios"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={String(form.is_active)}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.value === "true" })
                }
                className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-foreground/40"
              >
                <option value="true">Activo (Público)</option>
                <option value="false">Inactivo (Oculto)</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-foreground/40"
              placeholder="Instrucciones para el usuario..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.require_respondent_name || false}
              onChange={(e) =>
                setForm({
                  ...form,
                  require_respondent_name: e.target.checked,
                })
              }
              className="rounded border-foreground/25 text-foreground focus:ring-foreground/40 w-4 h-4"
            />
            <span className="text-sm font-medium">
              Nombre obligatorio (no permite responder anónimo)
            </span>
          </label>

          <div className="flex justify-between items-center pt-2">
            {!isNew && (
              <button
                type="button"
                onClick={handleDeleteForm}
                className="text-destructive hover:opacity-80 text-sm font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Formulario
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60 ml-auto"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>
      </div>

      {/* BLOCKS & QUESTIONS EDITOR */}
      {!isNew && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Secciones y Preguntas</h2>
            <button
              onClick={openAddBlockModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus className="w-4 h-4" />
              Nueva Sección
            </button>
          </div>

          {blocks.map((block, blockIndex) => {
            const blockQuestions = questions
              .filter((q) => q.block_id === block.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div
                key={block.id}
                className="rounded-2xl border border-foreground/10 bg-muted p-5"
              >
                <div className="flex items-center justify-between mb-4 border-b border-foreground/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs w-4">
                      {blockIndex + 1}
                    </span>
                    <h3 className="font-semibold text-md">{block.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={blockIndex === 0}
                      onClick={() => handleMoveBlock(blockIndex, "up")}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={blockIndex === blocks.length - 1}
                      onClick={() => handleMoveBlock(blockIndex, "down")}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-foreground/15 mx-1"></div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QUESTIONS LIST */}
                <div className="space-y-3 pl-4">
                  {blockQuestions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between bg-background p-3 rounded-md border border-foreground/10 group ${
                        q.active === false ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            disabled={qIndex === 0}
                            onClick={() => handleMoveQuestion(q, "up")}
                            className="text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-0"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={qIndex === blockQuestions.length - 1}
                            onClick={() => handleMoveQuestion(q, "down")}
                            className="text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-0"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{q.label}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span className="bg-muted px-1.5 rounded">
                              {q.type}
                            </span>
                            <span className="font-mono text-muted-foreground/70">
                              {q.key}
                            </span>
                            {q.required && (
                              <span className="text-destructive font-medium">
                                *Requerido
                              </span>
                            )}
                            {q.active === false && (
                              <span className="text-muted-foreground font-medium">
                                Oculta
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleQuestionActive(q)}
                          className="text-muted-foreground hover:text-foreground p-1"
                          title={q.active === false ? "Mostrar pregunta" : "Ocultar pregunta"}
                        >
                          {q.active === false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditQuestionModal(q)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddQuestionModal(block.id)}
                    className="w-full py-2 border-2 border-dashed border-foreground/15 rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Pregunta
                  </button>
                </div>
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div className="text-center py-10 bg-muted rounded-2xl border border-dashed border-foreground/15">
              <p className="text-muted-foreground">
                No hay secciones creadas.
              </p>
              <button
                onClick={openAddBlockModal}
                className="text-foreground underline underline-offset-4 mt-2 text-sm"
              >
                Crear primera sección
              </button>
            </div>
          )}
        </div>
      )}

      {/* Only worth sharing once there's actually something to fill out */}
      {!isNew && questions.length > 0 && (
        <ShareLinkCard
          formId={form.id!}
          formTitle={form.title || ""}
          formDescription={form.description ?? null}
          formIsActive={Boolean(form.is_active)}
          formRequireRespondentName={Boolean(form.require_respondent_name)}
          slug={form.slug ?? null}
          onSlugChange={(newSlug) => setForm((f) => ({ ...f, slug: newSlug }))}
        />
      )}

      {/* BLOCK MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-foreground/10 shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nueva Sección</h3>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Título de la sección
                </label>
                <input
                  type="text"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveBlock()}
                  className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                  placeholder="Ej: Datos personales"
                  autoFocus
                />
              </div>

              <div className="flex justify-end pt-2 space-x-2">
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBlock}
                  disabled={blockSaving || !newBlockTitle.trim()}
                  className="px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-full disabled:opacity-60"
                >
                  {blockSaving ? "Creando..." : "Crear Sección"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION MODAL */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-foreground/10 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingQuestion.id ? "Editar Pregunta" : "Nueva Pregunta"}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Pregunta (Label)
                </label>
                <input
                  type="text"
                  value={editingQuestion.label}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      label: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                  placeholder="Ej: ¿Cuál es tu nombre?"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Tipo de Respuesta
                  </label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const currentOptionsEmpty =
                        !Array.isArray(editingQuestion.options) ||
                        editingQuestion.options.length === 0;
                      setEditingQuestion({
                        ...editingQuestion,
                        type: newType,
                        options:
                          OPTION_BASED_TYPES.includes(newType) &&
                          currentOptionsEmpty
                            ? ["", ""]
                            : editingQuestion.options,
                      });
                    }}
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                  >
                    <option value="text">Texto Corto</option>
                    <option value="textarea">Texto Largo</option>
                    <option value="radio">Selección Única (Radio)</option>
                    <option value="checkbox">
                      Selección Múltiple (Checkbox)
                    </option>
                    <option value="date">Fecha</option>
                    <option value="time">Hora</option>
                    <option value="points100">
                      Distribución de 100 Puntos
                    </option>
                    <option value="scale">Escala (1-5)</option>
                    <option value="file">Archivo / Foto</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingQuestion.required}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          required: e.target.checked,
                        })
                      }
                      className="rounded border-foreground/25 text-foreground focus:ring-foreground/40 w-4 h-4"
                    />
                    <span className="text-sm font-medium">Es obligatoria</span>
                  </label>
                </div>
              </div>

              {OPTION_BASED_TYPES.includes(editingQuestion.type!) && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {editingQuestion.type === "points100"
                      ? "Categorías"
                      : "Opciones"}
                  </label>
                  <div className="space-y-2">
                    {(Array.isArray(editingQuestion.options)
                      ? editingQuestion.options
                      : []
                    ).map((opt: string, index: number, arr: string[]) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        <input
                          ref={
                            index === arr.length - 1
                              ? lastOptionInputRef
                              : undefined
                          }
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                          className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                          placeholder={
                            editingQuestion.type === "points100"
                              ? `Categoría ${index + 1}`
                              : `Opción ${index + 1}`
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          disabled={arr.length <= 1}
                          className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-25 disabled:hover:text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground hover:opacity-70"
                  >
                    <Plus className="w-4 h-4" />
                    {editingQuestion.type === "points100"
                      ? "Agregar categoría"
                      : "Agregar opción"}
                  </button>
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Mostrar solo si (opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editingQuestion.condition?.questionId || ""}
                    onChange={(e) => {
                      const questionId = e.target.value;
                      setEditingQuestion({
                        ...editingQuestion,
                        condition: questionId
                          ? {
                              questionId,
                              equals: editingQuestion.condition?.equals || "",
                            }
                          : null,
                      });
                    }}
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                  >
                    <option value="">Siempre visible</option>
                    {questions
                      .filter((q) => q.id !== editingQuestion.id)
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.label}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    disabled={!editingQuestion.condition?.questionId}
                    value={editingQuestion.condition?.equals || ""}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        condition: {
                          questionId: editingQuestion.condition!.questionId,
                          equals: e.target.value,
                        },
                      })
                    }
                    placeholder="Responde exactamente..."
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-40"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta pregunta solo aparece si la respuesta elegida arriba
                  coincide exactamente con el texto de la derecha.
                </p>
              </div>

              <div className="flex justify-end pt-4 space-x-2">
                <button
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-full"
                >
                  Guardar Pregunta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
