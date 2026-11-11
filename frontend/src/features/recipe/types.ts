export interface IngredientForm {
  key: string
  name: string
  quantity: string
  unit: string
  note: string
  isOptional: boolean
}

export interface InstructionForm {
  key: string
  step: number
  description: string
  duration: string
  imageUrl: string
}

export interface RecipeForm {
  title: string
  description: string
  imageUrl: string
  category: string
  cuisine: string
  difficulty: string
  prepTime: string
  cookTime: string
  restTime: string
  servings: string
  servingUnit: string
  tags: string
  ingredients: IngredientForm[]
  instructions: InstructionForm[]
  isPublic: boolean
}
