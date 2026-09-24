import {
    useEffect,
    useState
} from "react";

import type {
    WordPressPage
} from "@/types/content-agent";

export function useWordPressPages() {
    const [pages, setPages] =
        useState<WordPressPage[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadPages() {
            try {
                const response =
                    await fetch(
                        "/api/pages"
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    setError(
                        data.error ||
                        "Could not load WordPress pages"
                    );

                    return;
                }

                setPages(
                    data.pages ?? []
                );
            } catch {
                setError(
                    "Could not load WordPress pages"
                );
            } finally {
                setLoading(false);
            }
        }

        loadPages();
    }, []);

    return {
        pages,
        loading,
        error
    };
}