import { defineCollection, type SchemaContext } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

import fs from "node:fs";
import path from "node:path";

const markdownSchema = ({ image }: SchemaContext) => z.object({
	title: z.string(),
	description: z.string(),
	layout: z.string().optional(),
	image_title: image().optional(),
})

const CONTENT_DIRECTORY = "./src/content"

// 2. Initialize the collections registry with root fallback configuration
const dynamicCollections: Record<string, any> = {
  root: defineCollection({
    loader: glob({ pattern: "*.{md,mdx}", base: CONTENT_DIRECTORY }),
    schema: markdownSchema
  })
};

// 3. Scan for subfolders and automatically build collections out of them
if (fs.existsSync(CONTENT_DIRECTORY)) { // first line: if path exists check
  fs.readdirSync(CONTENT_DIRECTORY, { withFileTypes: true }).forEach((file) => {
    if (file.isDirectory()) { // only scan for directory files
      const folderName = file.name;
      
      dynamicCollections[folderName] = defineCollection({
        loader: glob({ pattern: "*.{md,mdx}", base: path.join(CONTENT_DIRECTORY, folderName) }),
        schema: markdownSchema,
      });
    }
  });

  // so hopefully, i wont have to re-edit this again.
}

export const collections = dynamicCollections;