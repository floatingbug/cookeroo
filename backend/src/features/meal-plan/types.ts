import type { ObjectId, OptionalId, WithId } from 'mongodb';
import type { RecipeSummary } from '../../types/recipe.js';

export type MealPlanDay =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export type MealPlanMeal = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanEntryInput {
    day: MealPlanDay;
    meal: MealPlanMeal;
    recipeId: string;
}

export interface MealPlanSaveInput {
    entries: MealPlanEntryInput[];
}

export interface MealPlanEntryDocument {
    day: MealPlanDay;
    meal: MealPlanMeal;
    recipeId: ObjectId;
}

export interface MealPlanDocument {
    _id?: ObjectId;
    userId: ObjectId;
    weekStart: string;
    entries: MealPlanEntryDocument[];
    createdAt: Date;
    updatedAt: Date;
}

export type NewMealPlan = OptionalId<MealPlanDocument>;

export type MealPlanRecord = WithId<MealPlanDocument>;

export interface MealPlanMemberDocument {
    _id?: ObjectId;
    ownerId: ObjectId;
    memberId: ObjectId;
    canEdit: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type NewMealPlanMember = OptionalId<MealPlanMemberDocument>;

export type MealPlanMemberRecord = WithId<MealPlanMemberDocument>;

export interface MealPlanInviteDocument {
    _id?: ObjectId;
    tokenHash: string;
    ownerId: ObjectId;
    createdAt: Date;
}

export type NewMealPlanInvite = OptionalId<MealPlanInviteDocument>;

export type MealPlanInviteRecord = WithId<MealPlanInviteDocument>;

export interface MealPlanUserSummary {
    id: string;
    name: string;
}

export interface MealPlanEntryResponse {
    day: MealPlanDay;
    meal: MealPlanMeal;
    recipeId: string;
    recipe: RecipeSummary | null;
}

export interface MealPlanResponse {
    weekStart: string;
    entries: MealPlanEntryResponse[];
    updatedAt: string | null;
    owner: MealPlanUserSummary;
    canEdit: boolean;
}

export interface SharedMealPlanResponse {
    owner: MealPlanUserSummary;
    canEdit: boolean;
}

export interface SharedMealPlanListResponse {
    planners: SharedMealPlanResponse[];
}

export interface MealPlanInviteResponse {
    token: string;
    url: string;
}

export interface MealPlanInvitePreviewResponse {
    owner: MealPlanUserSummary;
}

export interface MealPlanMemberResponse {
    user: MealPlanUserSummary;
    canEdit: boolean;
    joinedAt: string;
}

export interface MealPlanMemberListResponse {
    members: MealPlanMemberResponse[];
}

export interface MealPlanMemberUpdateInput {
    canEdit: boolean;
}

export interface MealPlanAccess {
    ownerId: string;
    canEdit: boolean;
}
