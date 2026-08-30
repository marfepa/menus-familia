import { Recipe, WeeklyPlan, DayOfWeek } from '@/types';

interface GenerationOptions {
  prioritizeFavorites?: boolean;
  quickDinners?: boolean; // Cenas < 30min
  balancedProteins?: boolean;
}

export function generateSmartWeeklyPlan(
  weekStartDate: string,
  recipes: Recipe[],
  options: GenerationOptions = { prioritizeFavorites: true, quickDinners: true, balancedProteins: true }
): WeeklyPlan {
  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  
  if (recipes.length === 0) {
    return {
      id: `plan-${weekStartDate}`,
      weekStartDate,
      days: {
        lunes: {},
        martes: {},
        miercoles: {},
        jueves: {},
        viernes: {},
        sabado: {},
        domingo: {},
      },
    };
  }

  // Separar recetas disponibles para comida y cena
  const lunchCandidates = recipes.filter(r => r.mealType === 'lunch' || r.mealType === 'both');
  const dinnerCandidates = recipes.filter(r => r.mealType === 'dinner' || r.mealType === 'both');

  // Si faltan candidatas específicas, usar todas
  const validLunchPool = lunchCandidates.length > 0 ? lunchCandidates : recipes;
  const validDinnerPool = dinnerCandidates.length > 0 ? dinnerCandidates : recipes;

  const usedRecipeIds = new Set<string>();
  const newDays: Record<DayOfWeek, { lunch?: { recipeId: string }; dinner?: { recipeId: string } }> = {
    lunes: {},
    martes: {},
    miercoles: {},
    jueves: {},
    viernes: {},
    sabado: {},
    domingo: {},
  };

  // Función de puntuación para selección inteligente
  function pickBestRecipe(
    pool: Recipe[],
    isDinner: boolean,
    previousMealRecipe?: Recipe
  ): Recipe {
    // Filtrar aquellas que no se hayan usado aún si es posible
    let available = pool.filter(r => !usedRecipeIds.has(r.id));
    if (available.length === 0) {
      available = [...pool]; // Resetear si ya se usaron todas
    }

    // Filtrar por cenas rápidas si la opción está activa
    if (isDinner && options.quickDinners) {
      const quickOnes = available.filter(r => r.prepTimeMinutes <= 30 || r.tags.includes('Ligero'));
      if (quickOnes.length > 0) {
        available = quickOnes;
      }
    }

    // Evitar repetir la misma categoría de proteína en el mismo día si es posible
    if (previousMealRecipe && options.balancedProteins) {
      const prevTags = previousMealRecipe.tags;
      const filtered = available.filter(r => {
        const hasFishMatch = prevTags.includes('Pescado') && r.tags.includes('Pescado');
        const hasMeatMatch = (prevTags.includes('Carne') || prevTags.includes('Pollo')) && (r.tags.includes('Carne') || r.tags.includes('Pollo'));
        const hasPastaMatch = prevTags.includes('Pasta') && r.tags.includes('Pasta');
        const hasLegumeMatch = prevTags.includes('Legumbres') && r.tags.includes('Legumbres');
        return !(hasFishMatch || hasMeatMatch || hasPastaMatch || hasLegumeMatch);
      });
      if (filtered.length > 0) {
        available = filtered;
      }
    }

    // Priorizar favoritos, recetas rápidas (<20min) y alto en proteína
    const weightedPool: Recipe[] = [];
    available.forEach(r => {
      let weight = 1;
      if (r.favorite && options.prioritizeFavorites) weight += 3;
      if (r.tags.includes('Rápido (<20min)')) weight += 2;
      if (r.tags.includes('AltoEnProteina')) weight += 2;
      if (r.rating >= 4) weight += (r.rating - 3);
      for (let i = 0; i < weight; i++) {
        weightedPool.push(r);
      }
    });

    const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)] || available[0];
    usedRecipeIds.add(selected.id);
    return selected;
  }

  days.forEach(day => {
    // Seleccionar Comida
    const lunchRecipe = pickBestRecipe(validLunchPool, false);
    // Seleccionar Cena (balanceando con la comida)
    const dinnerRecipe = pickBestRecipe(validDinnerPool, true, lunchRecipe);

    newDays[day] = {
      lunch: { recipeId: lunchRecipe.id },
      dinner: { recipeId: dinnerRecipe.id },
    };
  });

  return {
    id: `plan-${weekStartDate}`,
    weekStartDate,
    days: newDays,
  };
}
