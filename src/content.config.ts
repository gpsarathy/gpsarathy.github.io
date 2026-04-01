import { defineCollection, z, file } from 'astro:content';

const blog = defineCollection({
	loader: file('src/content/blog/**/*.{md,mdx}'),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

export const collections = { blog };
