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
  loading: boolean
  uploading: boolean
  errorKey: string | null
}

export const useRecipeStore = defineStore('recipe', {
  state: (): RecipeState => ({
    form: createDefaultForm(),
    recipe: null,
    loading: false,
    uploading: false,
    errorKey: null,
  }),

  actions: {
    resetForm(): void {
      this.form = createDefaultForm()
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
        const recipe = await recipeService.createRecipe(
          recipeService.toCreateRecipePayload(this.form),
        )

        return recipe.id
      } catch (error) {
        this.errorKey = recipeService.getRecipeErrorKey(error)
        return null
      } finally {
        this.loading = false
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
  },
})
