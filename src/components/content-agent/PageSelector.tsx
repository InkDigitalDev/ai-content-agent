import type {
    WordPressPage
} from "@/types/content-agent";

type PageSelectorProps = {
    pages: WordPressPage[];
    selectedPageId: number | null;
    loading: boolean;
    onChange: (pageId: number) => void;
};

export default function PageSelector({
    pages,
    selectedPageId,
    loading,
    onChange
}: PageSelectorProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
                WordPress page
            </label>

            <div className="relative">
                <select
                    value={
                        selectedPageId ??
                        ""
                    }
                    onChange={(event) =>
                        onChange(
                            Number(
                                event.target.value
                            )
                        )
                    }
                    disabled={loading}
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                    {loading && (
                        <option value="">
                            Loading pages...
                        </option>
                    )}

                    {!loading &&
                        pages.length === 0 && (
                            <option value="">
                                No pages found
                            </option>
                        )}

                    {pages.map(
                        (page) => (
                            <option
                                key={page.id}
                                value={page.id}
                            >
                                {page.title}
                            </option>
                        )
                    )}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4"
                        aria-hidden="true"
                    >
                        <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}