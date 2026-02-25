"use client";

import { useState } from "react";
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
} from "lucide-react";

type Form = {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
};

type Block = {
  id: string;
  form_id: string;
  title: string;
  order: number;
};

type Question = {
  id: string;
  form_id: string;
  block_id: string;
  key: string;
  label: string;
  type: string;
  options: any;
  required: boolean;
  order: number;
};

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
    initialForm || { title: "", description: "", is_active: true },
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

  // --- FORM HANDLERS ---
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", form.title || "");
    formData.append("description", form.description || "");
    formData.append("is_active", String(form.is_active));

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
  const handleAddBlock = async () => {
    const title = prompt("Título de la nueva sección:");
    if (!title) return;

    const order = blocks.length;
    const result = await createBlock(form.id!, title, order);

    if (result.error) {
      alert(result.error);
    } else {
      setBlocks([...blocks, result.data]);
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
    });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setEditingQuestion({ ...question });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.label || !editingQuestion.key) {
      alert("Faltan datos obligatorios (Pregunta o Key)");
      return;
    }

    let optionsToSave = editingQuestion.options;

    const payload: QuestionPayload = {
      form_id: editingQuestion.form_id!,
      block_id: editingQuestion.block_id!,
      key: editingQuestion.key.toLowerCase().replace(/\s/g, "_"),
      label: editingQuestion.label,
      type: editingQuestion.type || "text",
      options: optionsToSave,
      required: editingQuestion.required || false,
      order: editingQuestion.order || 0,
    };

    let result;
    if (editingQuestion.id) {
      result = await updateQuestion(editingQuestion.id, payload);
    } else {
      result = await createQuestion(payload);
    }

    if (result.error) {
      alert(result.error);
    } else {
      if (editingQuestion.id) {
        setQuestions(
          questions.map((q) => (q.id === editingQuestion.id ? result.data : q)),
        );
      } else {
        setQuestions([...questions, result.data]);
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

  // Helper for Options (Textarea to Array)
  const handleOptionsChange = (text: string) => {
    if (!text) {
      setEditingQuestion({ ...editingQuestion, options: [] });
      return;
    }
    const opts = text.split("\n").filter((line) => line.trim() !== "");
    setEditingQuestion({ ...editingQuestion, options: opts });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* FORM DETAILS CARD */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título del Formulario
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2"
                placeholder="Ej: Registro de Voluntarios"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <select
                value={String(form.is_active)}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.value === "true" })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2"
              >
                <option value="true">Activo (Público)</option>
                <option value="false">Inactivo (Oculto)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2"
              placeholder="Instrucciones para el usuario..."
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            {!isNew && (
              <button
                type="button"
                onClick={handleDeleteForm}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar Formulario
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>

      {/* BLOCKS & QUESTIONS EDITOR */}
      {!isNew && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Secciones y Preguntas
            </h2>
            <button
              onClick={handleAddBlock}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black"
            >
              <Plus className="w-4 h-4 mr-1" />
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
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono text-xs w-4">
                      {blockIndex + 1}
                    </span>
                    <h3 className="font-bold text-md text-gray-800 dark:text-gray-200">
                      {block.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={blockIndex === 0}
                      onClick={() => handleMoveBlock(blockIndex, "up")}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-25"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={blockIndex === blocks.length - 1}
                      onClick={() => handleMoveBlock(blockIndex, "down")}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-25"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-gray-400 hover:text-red-500"
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
                      className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-md border border-gray-100 dark:border-zinc-700 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            disabled={qIndex === 0}
                            onClick={() => handleMoveQuestion(q, "up")}
                            className="text-gray-300 hover:text-gray-500 disabled:opacity-0"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={qIndex === blockQuestions.length - 1}
                            onClick={() => handleMoveQuestion(q, "down")}
                            className="text-gray-300 hover:text-gray-500 disabled:opacity-0"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {q.label}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="bg-gray-200 dark:bg-zinc-700 px-1.5 rounded">
                              {q.type}
                            </span>
                            <span className="font-mono text-gray-400">
                              {q.key}
                            </span>
                            {q.required && (
                              <span className="text-red-500 font-medium">
                                *Requerido
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditQuestionModal(q)}
                          className="text-gray-400 hover:text-blue-500 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddQuestionModal(block.id)}
                    className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-md text-gray-500 hover:text-blue-500 hover:border-blue-200 text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Pregunta
                  </button>
                </div>
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div className="text-center py-10 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No hay secciones creadas.</p>
              <button
                onClick={handleAddBlock}
                className="text-blue-600 hover:underline mt-2 text-sm"
              >
                Crear primera sección
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUESTION MODAL */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingQuestion.id ? "Editar Pregunta" : "Nueva Pregunta"}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="Ej: ¿Cuál es tu nombre?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Identificador Único (Key)
                </label>
                <input
                  type="text"
                  value={editingQuestion.key}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      key: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-mono text-sm"
                  placeholder="Ej: nombre_completo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Debe ser único en el formulario. Se usa para guardar la
                  respuesta.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Respuesta
                  </label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        type: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
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
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingQuestion.required}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          required: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium">Es obligatoria</span>
                  </label>
                </div>
              </div>

              {["radio", "checkbox", "select"].includes(
                editingQuestion.type!,
              ) && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Opciones (una por línea)
                  </label>
                  <textarea
                    value={
                      Array.isArray(editingQuestion.options)
                        ? editingQuestion.options.join("\n")
                        : ""
                    }
                    onChange={(e) => handleOptionsChange(e.target.value)}
                    rows={4}
                    className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-mono text-sm"
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4 space-x-2">
                <button
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
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
