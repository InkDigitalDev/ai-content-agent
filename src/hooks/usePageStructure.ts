import {
    useEffect,
    useState
} from "react";

import type {
    PageStructureBlock
} from "@/types/content-agent";

export function usePageStructure(
    pageId: number | null
) {
    const [blocks, setBlocks] =
        useState<PageStructureBlock[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!pageId) {
            setBlocks([]);
            setError("");

            return;
        }

        async function loadPageStructure() {
            setLoading(true);
            setError("");
            setBlocks([]);

            try {
                const response =
                    await fetch(
                        `/api/page-structure?pageId=${pageId}`
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    setError(
                        data.error ||
                        "Could not load page components"
                    );

                    return;
                }

                setBlocks(
                    data.blocks ?? []
                );
            } catch {
                setError(
                    "Could not load page components"
                );
            } finally {
                setLoading(false);
            }
        }

        loadPageStructure();
    }, [pageId]);

    return {
        blocks,
        loading,
        error
    };
}