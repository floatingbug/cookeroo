import { defineStore } from 'pinia'

import type { Recipe } from '@/shared/api/types'
import * as recipeService from '../services/recipeService'
import type { IngredientForm, InstructionForm, RecipeForm } from '../types'

let nextKey = 0

function createKey(prefix: string): string {
  nextKey += 1

  return `${prefix}-${nextKey}`
}

function createIngredient(): IngredientForm {
  return {
    key: createKey('ingredient'),
    name: '',
    quantity: '',
    unit: 'g',
    note: '',
    isOptional: false,
  }
}

function createInstruction(): InstructionForm {
  return {
    key: createKey('instruction'),
    step: 1,
    description: '',
    duration: '',
    imageUrl: '',
  }
}

function createDefaultForm(): RecipeForm {
  return {
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    cuisine: '',
    difficulty: '',
    prepTime: '',
    cookTime: '',
    restTime: '',
    servings: '1',
    servingUnit: '',
    tags: '',
    ingredients: [createIngredient()],
    instructions: [createInstruction()],
    isPublic: true,
  }
}

interface RecipeState {
  form: RecipeForm
  recipe: Recipe | null
  recipes: Recipe[]
  publicRecipes: Recipe[]
  loading: boolean
  recipesLoading: boolean
  publicRecipesLoading: boolean
  uploading: boolean
  deletingId: string | null
  updating: boolean
  errorKey: string | null
  recipesErrorKey: string | null
  publicRecipesErrorKey: string | null
  deleteErrorKey: string | null
}

export const useRecipeStore = defineStore('recipe', {
  state: (): RecipeState => ({
    form: createDefaultForm(),
    recipe: null,
    recipes: [],
    publicRecipes: [],
    loading: false,
    recipesLoading: false,
    publicRecipesLoading: false,
    uploading: false,
    deletingId: null,
    updating: false,
    errorKey: null,
    recipesErrorKey: null,
    publicRecipesErrorKey: null,
    deleteErrorKey: null,
  }),

  actions: {
    resetForm(): void {
      this.form = createDefaultForm()
      this.errorKey = null
    },

    /** Befüllt das Formular mit den Daten eines bestehenden Rezepts. */
    fillFormFromRecipe(recipe: Recipe): void {
      this.form = {
        title: recipe.title,
        description: recipe.description ?? '',
        imageUrl: recipe.imageUrl ?? '',
        category: recipe.category ?? '',
        cuisine: recipe.cuisine ?? '',
        difficulty: recipe.difficulty ?? '',
        prepTime: String(recipe.prepTime),
        cookTime: String(recipe.cookTime),
        restTime: recipe.restTime === null ? '' : String(recipe.restTime),
        servings: String(recipe.servings),
        servingUnit: recipe.servingUnit ?? '',
        tags: recipe.tags.join(', '),
        ingredients: recipe.ingredients.map((ingredient) => ({
          key: createKey('ingredient'),
          name: ingredient.name,
          quantity: String(ingredient.quantity),
          unit: ingredient.unit,
          note: ingredient.note ?? '',
          isOptional: ingredient.isOptional,
        })),
        instructions: recipe.instructions.map((instruction) => ({
          key: createKey('instruction'),
          step: instruction.step,
          description: instruction.description,
          duration: instruction.duration === null ? '' : String(instruction.duration),
          imageUrl: instruction.imageUrl ?? '',
        })),
        isPublic: recipe.isPublic,
      }
      this.errorKey = null
    },

    addIngredient(): void {
      this.form.ingredients.push(createIngredient())
    },

    removeIngredient(key: string): void {
      if (this.form.ingredients.length <= 1) {
        return
      }

      this.form.ingredients = this.form.ingredients.filter((ingredient) => ingredient.key !== key)
    },

    addInstruction(): void {
      this.form.instructions.push(createInstruction())
      this.renumberInstructions()
    },

    removeInstruction(key: string): void {
      if (this.form.instructions.length <= 1) {
        return
      }

      this.form.instructions = this.form.instructions.filter(
        (instruction) => instruction.key !== key,
      )
      this.renumberInstructions()
    },

    renumberInstructions(): void {
      this.form.instructions.forEach((instruction, index) => {
        instruction.step = index + 1
      })
    },

    async uploadImage(file: File): Promise<string | null> {
      this.uploading = true
      this.errorKey = null

      try {
        return await recipeService.uploadImage(file)
      } catch (error) {
        this.errorKey = recipeService.getUploadErrorKey(error)
        return null
      } finally {
        this.uploading = false
      }
    },

    /** Speichert das Formular und liefert die ID des neuen Rezepts. */
    async submit(): Promise<string | null> {
      const validationErrorKey = recipeService.validateRecipeForm(this.form)

      if (validationErrorKey) {
        this.errorKey = validationErrorKey
        return null
      }

      this.loading = true
      this.errorKey = null

      try {
        const recipe = await recipeService.createRecipe(recipeService.toRecipePayload(this.form))

        return recipe.id
      } catch (error) {
        this.errorKey = recipeService.getRecipeErrorKey(error)
        return null
      } finally {
        this.loading = false
      }
    },

    /** Speichert Änderungen an einem bestehenden Rezept. */
    async updateRecipe(recipeId: string): Promise<boolean> {
      const validationErrorKey = recipeService.validateRecipeForm(this.form)

      if (validationErrorKey) {
        this.errorKey = validationErrorKey
        return false
      }

      this.updating = true
      this.errorKey = null

      try {
        const updated = await recipeService.updateRecipe(
          recipeId,
          recipeService.toRecipePayload(this.form),
        )

        this.recipe = updated
        this.recipes = this.recipes.map((recipe) => (recipe.id === recipeId ? updated : recipe))
        return true
      } catch (error) {
        this.errorKey = recipeService.getRecipeErrorKey(error)
        return false
      } finally {
        this.updating = false
      }
    },

    async loadRecipe(recipeId: string): Promise<boolean> {
      this.loading = true
      this.errorKey = null
      this.recipe = null

      try {
        this.recipe = await recipeService.loadRecipe(recipeId)
        return true
      } catch (error) {
        this.errorKey = recipeService.getRecipeErrorKey(error)
        return false
      } finally {
        this.loading = false
      }
    },

    async loadRecipes(): Promise<boolean> {
      this.recipesLoading = true
      this.recipesErrorKey = null
      this.recipes = []

      try {
        this.recipes = await recipeService.loadRecipes()
        return true
      } catch (error) {
        this.recipesErrorKey = recipeService.getRecipeErrorKey(error)
        return false
      } finally {
        this.recipesLoading = false
      }
    },

    async loadPublicRecipes(): Promise<boolean> {
      this.publicRecipesLoading = true
      this.publicRecipesErrorKey = null
      this.publicRecipes = []

      try {
        this.publicRecipes = await recipeService.loadPublicRecipes()
        return true
      } catch (error) {
        this.publicRecipesErrorKey = recipeService.getRecipeErrorKey(error)
        return false
      } finally {
        this.publicRecipesLoading = false
      }
    },

    async deleteRecipe(recipeId: string): Promise<boolean> {
      this.deletingId = recipeId
      this.deleteErrorKey = null

      try {
        await recipeService.deleteRecipe(recipeId)
        this.recipes = this.recipes.filter((recipe) => recipe.id !== recipeId)

        if (this.recipe?.id === recipeId) {
          this.recipe = null
        }

        return true
      } catch (error) {
        this.deleteErrorKey = recipeService.getDeleteErrorKey(error)
        return false
      } finally {
        this.deletingId = null
      }
    },
  },
})
