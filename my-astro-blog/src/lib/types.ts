// src/types.ts
import layoutType from "../layouts/Contents.astro";
import { collections } from "../content.config"
import { getCollection, getEntry } from "astro:content";

const entryItem = await getEntry("root", "intro")
const collectionItem = await getCollection("root")

// Define individual page/component payload signatures
export interface BlogPost {
  title: string;
  date: string;
  tags: string[];
}

// 2. The standard Astro/Vite ESM export shape wrappers
export type GlobModule<T> = {
  default: any;                 // The component export
  frontmatter: T;               // Markdown or MDX yaml data 
};

export type LayoutStyle     = typeof layoutType
export type RootItem        = typeof entryItem
export type CollectionItem  = typeof collectionItem