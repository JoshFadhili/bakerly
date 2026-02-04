export type CategoryType = "goods" | "categories" | "services";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt?: any;
}
