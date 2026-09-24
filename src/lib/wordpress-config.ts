import "server-only";

import fs from "fs/promises";
import path from "path";

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

function getFallbackConfig(): WordPressConfig {
    return {
        siteName:
            "AI Boilerplate",

        url:
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

export async function getWordPressConfig(): Promise<WordPressConfig> {
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
        return getFallbackConfig();
    }
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