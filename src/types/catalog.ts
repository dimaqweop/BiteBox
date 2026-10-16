import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type HomeCatalog = FunctionReturnType<typeof api.home.getCatalog>;
export type Restaurant = HomeCatalog["popular"][number];
export type Food = HomeCatalog["dishes"][number];
export type Category = HomeCatalog["categories"][number];
