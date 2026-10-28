import type {CollectionItem, LayoutStyle, RootItem} from "./types"
import { getCollection, getEntry, render, type RenderResult } from "astro:content";

const defaultLayoutPath = "/src/layouts/Contents.astro"
// Fetches a layout defined under /src/layouts/
export async function fetchLayout(layoutName: string): Promise<LayoutStyle> {
    const layouts = import.meta.glob<LayoutStyle>("/src/layouts/*.astro", {
        import: "default",
    });

    const load = layouts[`/src/layouts/${layoutName}.astro`] ?? layouts[defaultLayoutPath]

    return await load();
}

// Fetches an entry from a content collection.
export async function fetchEntry(collection: string, slug: string): Promise<RootItem> {
    const usedCollection = (collection === "content" ? "root" : collection) as "root"
    
    return await getEntry(usedCollection, slug)
}

// Fetches ALL entries from a content collection
export async function fetchCollection(collection: string): Promise<CollectionItem> {
    const usedCollection = (collection === "content" ? "root" : collection) as "root"
    
    return await getCollection(usedCollection);
}

// Resolve the collection and entry from a catch-all route path.
export async function fetchEntryDynamic(slug?: string): Promise<RootItem>  {
    const [directory, ...entryParts] = slug?.split("/") ?? ["content", "intro"];

    const entrySlug = entryParts.join("/") || "intro";

    return await fetchEntry(directory, entrySlug);
}

export async function fetchContentFromPost(post?: RootItem): Promise<RenderResult["Content"] | undefined> {
    return post ? (await render(post)).Content : undefined
}

export function fetchItemsInit(files: Record<string, string>){
    function getItemUrl(filename: string) {
        const matchingPaths = Object.keys(files).filter((path) =>
            path === filename || path.endsWith(`/${filename}`)
        );

        if (matchingPaths.length === 0) {
            throw new Error(`Item not found: ${filename}`);
        }
        if (matchingPaths.length > 1) {
            throw new Error(`Item filename is ambiguous: ${filename}`);
        }

        return files[matchingPaths[0]];
    }

    return getItemUrl;
}

//
// general functions below.
//

export function getRandomNumber(min: number, max: number){
    return Math.floor(Math.random() * (max - min)) + min
}