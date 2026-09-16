import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		author: reference("authors"),
	}),
});

const authors = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/authors" }),
	schema: z.object({
		name: z.string(),
		bio: z.string(),
		avatar: z.string(),
		socialLinks: z.array(z.object({
			label: z.string(),
			url: z.url(),
		})),
	}),
});

export const collections = { blog, authors };