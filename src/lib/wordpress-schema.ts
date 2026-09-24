import "server-only";

import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

export type WordPressAcfField = {
    key: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    subFields?: WordPressAcfField[];
};

export type WordPressBlockSchema = {
    title: string;
    fields: WordPressAcfField[];
};

export type WordPressBlockSchemas = Record<
    string,
    WordPressBlockSchema
>;

export async function getWordPressBlockSchema(): Promise<WordPressBlockSchemas> {
    const config =
        await getWordPressConfig();

    const response =
        await fetch(
            `${config.url}/wp-json/inkwell/v1/blocks`,
            {
                headers: {
                    Authorization:
                        getWordPressAuthHeader(
                            config
                        )
                },
                cache:
                    "no-store"
            }
        );

    if (!response.ok) {
        const text =
            await response.text();

        throw new Error(
            `Could not load WordPress block schema (${response.status}): ${text}`
        );
    }

    const data =
        await response.json();

    if (
        !data.success ||
        !data.blocks ||
        typeof data.blocks !==
            "object"
    ) {
        throw new Error(
            "WordPress returned an invalid block schema response"
        );
    }

    return data.blocks as WordPressBlockSchemas;
}