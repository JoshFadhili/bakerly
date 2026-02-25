export type CategoryType = "goods" | "categories" | "services" | "baking_supplies";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt?: any;
}
