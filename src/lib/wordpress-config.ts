import "server-only";

import fs from "fs/promises";
import path from "path";

import {
    get,
    put
} from "@vercel/blob";

export type WordPressConfig = {
    siteName: string;
    url: string;
    username: string;
    applicationPassword: string;
};

export type PublicWordPressConfig = {
    siteName: string;
    url: string;
    username: string;
    hasApplicationPassword: boolean;
};

const CONFIG_DIRECTORY =
    path.join(
        process.cwd(),
        ".data"
    );

const CONFIG_FILE =
    path.join(
        CONFIG_DIRECTORY,
        "wordpress-config.json"
    );

const BLOB_CONFIG_PATH =
    "settings/wordpress-config.json";

function isVercel() {
    return process.env.VERCEL === "1";
}

function getFallbackConfig(): WordPressConfig {
    return {
        siteName:
            process.env.WORDPRESS_SITE_NAME ??
            "AI Boilerplate",

        url:
            process.env.WORDPRESS_URL ??
            "http://ai-boilerplate.local",

        username:
            process.env.WORDPRESS_USERNAME ??
            "",

        applicationPassword:
            process.env.WORDPRESS_APP_PASSWORD ??
            ""
    };
}

function normaliseUrl(
    value: string
) {
    return value
        .trim()
        .replace(
            /\/+$/,
            ""
        );
}

async function readBlobConfig(): Promise<WordPressConfig | null> {
    try {
        const result =
            await get(
                BLOB_CONFIG_PATH,
                {
                    access:
                        "private"
                }
            );

        if (!result) {
            return null;
        }

        const text =
            await new Response(
                result.stream
            ).text();

        const parsed =
            JSON.parse(
                text
            ) as Partial<WordPressConfig>;

        const fallback =
            getFallbackConfig();

        return {
            siteName:
                parsed.siteName?.trim() ||
                fallback.siteName,

            url:
                normaliseUrl(
                    parsed.url ||
                    fallback.url
                ),

            username:
                parsed.username?.trim() ||
                fallback.username,

            applicationPassword:
                parsed.applicationPassword ||
                fallback.applicationPassword
        };
    } catch {
        return null;
    }
}

async function readLocalConfig(): Promise<WordPressConfig | null> {
    try {
        const file =
            await fs.readFile(
                CONFIG_FILE,
                "utf8"
            );

        const parsed =
            JSON.parse(
                file
            ) as Partial<WordPressConfig>;

        const fallback =
            getFallbackConfig();

        return {
            siteName:
                parsed.siteName?.trim() ||
                fallback.siteName,

            url:
                normaliseUrl(
                    parsed.url ||
                    fallback.url
                ),

            username:
                parsed.username?.trim() ||
                fallback.username,

            applicationPassword:
                parsed.applicationPassword ||
                fallback.applicationPassword
        };
    } catch {
        return null;
    }
}

export async function getWordPressConfig(): Promise<WordPressConfig> {
    const fallback =
        getFallbackConfig();

    if (
        isVercel()
    ) {
        const blobConfig =
            await readBlobConfig();

        if (blobConfig) {
            return blobConfig;
        }

        return {
            ...fallback,
            url:
                normaliseUrl(
                    fallback.url
                )
        };
    }

    const localConfig =
        await readLocalConfig();

    if (localConfig) {
        return localConfig;
    }

    return {
        ...fallback,
        url:
            normaliseUrl(
                fallback.url
            )
    };
}

export async function saveWordPressConfig(
    config: WordPressConfig
) {
    const normalisedConfig: WordPressConfig = {
        siteName:
            config.siteName.trim(),

        url:
            normaliseUrl(
                config.url
            ),

        username:
            config.username.trim(),

        applicationPassword:
            config.applicationPassword
    };

    if (
        isVercel()
    ) {
        await put(
            BLOB_CONFIG_PATH,
            JSON.stringify(
                normalisedConfig,
                null,
                4
            ),
            {
                access:
                    "private",
                contentType:
                    "application/json",
                allowOverwrite:
                    true,
                cacheControlMaxAge:
                    60
            }
        );

        return normalisedConfig;
    }

    await fs.mkdir(
        CONFIG_DIRECTORY,
        {
            recursive: true
        }
    );

    await fs.writeFile(
        CONFIG_FILE,
        JSON.stringify(
            normalisedConfig,
            null,
            4
        ),
        "utf8"
    );

    return normalisedConfig;
}

export function getPublicWordPressConfig(
    config: WordPressConfig
): PublicWordPressConfig {
    return {
        siteName:
            config.siteName,

        url:
            config.url,

        username:
            config.username,

        hasApplicationPassword:
            Boolean(
                config.applicationPassword
            )
    };
}

export function getWordPressAuthHeader(
    config: WordPressConfig
) {
    if (
        !config.username ||
        !config.applicationPassword
    ) {
        throw new Error(
            "WordPress credentials are not configured"
        );
    }

    return `Basic ${Buffer.from(
        `${config.username}:${config.applicationPassword}`
    ).toString("base64")}`;
}