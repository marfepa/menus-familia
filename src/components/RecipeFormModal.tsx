'use client';

import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, IngredientCategory, MealType, CATEGORY_LABELS } from '@/types';
import { X, Plus, Trash2, Save, Sparkles } from 'lucide-react';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipeToEdit?: Recipe | null;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recipeToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(25);
  const [servings, setServings] = useState(4);
  const [mealType, setMealType] = useState<MealType>('both');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Media' | 'Avanzada'>('Fácil');
  const [emoji, setEmoji] = useState('🍲');
  const [tagsInput, setTagsInput] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  
  // Campos de optimización familiar & Air-Fryer
  const [kidsNotes, setKidsNotes] = useState('');
  const [isTupperFriendly, setIsTupperFriendly] = useState(false);
  const [batchCooking, setBatchCooking] = useState(false);
  const [fridgeLifeDays, setFridgeLifeDays] = useState<number | undefined>(2);
  const [isAirFryerFriendly, setIsAirFryerFriendly] = useState(false);
  const [airFryerTemperature, setAirFryerTemperature] = useState(190);
  const [airFryerTime, setAirFryerTime] = useState(14);
  const [airFryerShake, setAirFryerShake] = useState(true);

  // Rellenar datos si estamos editando
  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name);
      setDescription(recipeToEdit.description || '');
      setPrepTimeMinutes(recipeToEdit.prepTimeMinutes || 25);
      setServings(recipeToEdit.servings || 4);
      setMealType(recipeToEdit.mealType || 'both');
      setDifficulty(recipeToEdit.difficulty || 'Fácil');
      setEmoji(recipeToEdit.emoji || '🍲');
      setTagsInput(recipeToEdit.tags ? recipeToEdit.tags.join(', ') : '');
      setIngredients(recipeToEdit.ingredients || []);
      setInstructions(recipeToEdit.instructions?.length ? recipeToEdit.instructions : ['']);
      setNotes(recipeToEdit.notes || '');
      setKidsNotes(recipeToEdit.kidsNotes || '');
      setIsTupperFriendly(Boolean(recipeToEdit.isTupperFriendly));
      setBatchCooking(Boolean(recipeToEdit.batchCooking));
      setFridgeLifeDays(recipeToEdit.fridgeLifeDays ?? 2);
      setIsAirFryerFriendly(Boolean(recipeToEdit.isAirFryerFriendly || recipeToEdit.tags?.some(t => /air-?fryer/i.test(t))));
      setAirFryerTemperature(recipeToEdit.airFryerConfig?.temperatureDegrees || 190);
      setAirFryerTime(recipeToEdit.airFryerConfig?.timeMinutes || recipeToEdit.prepTimeMinutes || 14);
      setAirFryerShake(recipeToEdit.airFryerConfig?.shakeHalfway ?? true);
    } else {
      // Nueva receta con defaults limpios
      setName('');
      setDescription('');
      setPrepTimeMinutes(25);
      setServings(4);
      setMealType('both');
      setDifficulty('Fácil');
      setEmoji('🍲');
      setTagsInput('Favorito, Rápido');
      setIngredients([
        { id: 'i-1', name: '', quantity: undefined, unit: '', category: 'fruteria' },
      ]);
      setInstructions(['']);
      setNotes('');
      setKidsNotes('');
      setIsTupperFriendly(false);
      setBatchCooking(false);
      setFridgeLifeDays(2);
      setIsAirFryerFriendly(false);
      setAirFryerTemperature(190);
      setAirFryerTime(14);
      setAirFryerShake(true);
    }
  }, [recipeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: `ing-${Date.now()}-${Math.random()}`, name: '', quantity: undefined, unit: 'g', category: 'despensa' },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: any) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const next = [...instructions];
    next[index] = value;
    setInstructions(next);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (isAirFryerFriendly && !tags.some(t => /air-?fryer/i.test(t))) {
      tags.push('AirFryer');
    }

    const validIngredients = ingredients.filter(i => i.name.trim().length > 0);
    const validInstructions = instructions.filter(i => i.trim().length > 0);

    const recipeData: Recipe = {
      id: recipeToEdit ? recipeToEdit.id : `rec-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      prepTimeMinutes: Number(prepTimeMinutes) || 20,
      servings: Number(servings) || 4,
      mealType,
      difficulty,
      emoji: emoji || '🍲',
      tags,
      ingredients: validIngredients,
      instructions: validInstructions,
      rating: recipeToEdit?.rating || 5,
      favorite: recipeToEdit?.favorite !== undefined ? recipeToEdit.favorite : true,
      notes: notes.trim(),
      kidsNotes: kidsNotes.trim() || undefined,
      isTupperFriendly,
      batchCooking,
      fridgeLifeDays: Number(fridgeLifeDays) || 2,
      isAirFryerFriendly,
      airFryerConfig: isAirFryerFriendly
        ? {
            temperatureDegrees: Number(airFryerTemperature) || 190,
            timeMinutes: Number(airFryerTime) || Number(prepTimeMinutes) || 14,
            shakeHalfway: airFryerShake,
          }
        : undefined,
    };

    onSave(recipeData);
    onClose();
  };

  const emojiList = ['🍲', '🥗', '🍝', '🐟', '🥩', '🍳', '🌮', '🍔', '🥑', '🥣', '🥘', '🍕', '🍣', '🍗', '🍞', '🧀'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{recipeToEdit ? '✏️' : '✨'}</span>
              <span>{recipeToEdit ? 'Editar Receta' : 'Nueva Receta Familiar'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura ingredientes, categorías para la compra y pasos de preparación
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario scrolleable */}
        <form id="recipe-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Fila Principal: Nombre, Emoji, Tipo */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Receta *
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="w-12 h-10 rounded-xl bg-slate-100 border border-slate-200 text-xl flex items-center justify-center hover:bg-slate-200"
                    title="Icono de receta"
                  >
                    {emoji}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lasaña de Verduras y Ricotta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
              </div>
              {/* Selector rápido de emojis */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Icono:</span>
                {emojiList.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 ${
                      emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Descripción corta
              </label>
              <input
                type="text"
                placeholder="Ej: Plato ligero y reconfortante perfecto para los niños"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Metadatos en Grid: Tipo de comida, Tiempo, Raciones, Dificultad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Momento</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="both">Comida o Cena</option>
                  <option value="lunch">Solo Comida</option>
                  <option value="dinner">Solo Cena</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiempo (min)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Raciones base</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dificultad</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Media">Media</option>
                  <option value="Avanzada">Avanzada</option>
                </select>
              </div>
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                placeholder="Ej: Favorito, Pasta, Rápido, Niños, Batch Cooking"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Optimización Familiar & Air-Fryer */}
            <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-slate-50 p-3.5 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-orange-950">
                  <input
                    type="checkbox"
                    checked={isAirFryerFriendly}
                    onChange={(e) => setIsAirFryerFriendly(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 rounded-md border-orange-300"
                  />
                  <span className="flex items-center gap-1">
                    <span>♨️</span>
                    <span>Receta apta / optimizada para Air-Fryer (Freidora de aire)</span>
                  </span>
                </label>
              </div>

              {isAirFryerFriendly && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-orange-900 mb-1">Temperatura (°C)</label>
                    <input
                      type="number"
                      min="100"
                      max="240"
                      step="5"
                      value={airFryerTemperature}
                      onChange={(e) => setAirFryerTemperature(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-orange-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-orange-900 mb-1">Tiempo (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={airFryerTime}
                      onChange={(e) => setAirFryerTime(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-orange-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-orange-900">
                      <input
                        type="checkbox"
                        checked={airFryerShake}
                        onChange={(e) => setAirFryerShake(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 rounded-md border-orange-300"
                      />
                      <span>Agitar cesta a mitad</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Adaptación Niños y BLW */}
              <div className="pt-2 border-t border-orange-200/60">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  👶 Adaptación para Niños Pequeños & BLW (Sólidos)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Desmigar el pescado sin espinas, cortar patata en bastones blandos"
                  value={kidsNotes}
                  onChange={(e) => setKidsNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Toggles Tupper y Cocina x2 */}
              <div className="flex items-center gap-4 pt-1 flex-wrap text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={isTupperFriendly}
                    onChange={(e) => setIsTupperFriendly(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 rounded-md border-slate-300"
                  />
                  <span>💼 Apto Tupper</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={batchCooking}
                    onChange={(e) => setBatchCooking(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 rounded-md border-slate-300"
                  />
                  <span>🔄 Cocina x2 (Batch Cooking)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección de Ingredientes para Lista de la Compra */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  🛒 Ingredientes (Se añadirán a la lista de compra)
                </h3>
                <p className="text-[11px] text-slate-500">Asigna la sección de supermercado adecuada a cada uno</p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir ingrediente
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={ing.id || idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Cebolla)"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    className="flex-2 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Cant."
                    value={ing.quantity !== undefined ? ing.quantity : ''}
                    onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                  <input
                    type="text"
                    placeholder="Ud (g, ml, uds)"
                    value={ing.unit || ''}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => handleIngredientChange(idx, 'category', e.target.value as IngredientCategory)}
                    className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, cat]) => (
                      <option key={catKey} value={catKey}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de Instrucciones Paso a Paso */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                👨‍🍳 Paso a Paso (Preparación)
              </h3>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir paso
              </button>
            </div>

            <div className="space-y-2">
              {instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    placeholder={`Paso ${idx + 1}...`}
                    value={step}
                    onChange={(e) => handleInstructionChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notas / Trucos familiares */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              💡 Consejos familiares o trucos de cocina
            </label>
            <input
              type="text"
              placeholder="Ej: Dejar reposar 5 min antes de cortar, se puede congelar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="recipe-form"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:shadow"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Receta</span>
          </button>
        </div>

      </div>
    </div>
  );
};
