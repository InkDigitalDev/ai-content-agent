type ContentInputProps = {
    content: string;
    loading: boolean;
    disabled: boolean;
    onChange: (
        value: string
    ) => void;
    onAnalyse: () => void;
};

export default function ContentInput({
    content,
    loading,
    disabled,
    onChange,
    onAnalyse
}: ContentInputProps) {
    const characterCount =
        content.length;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-800">
                    Source content
                </label>

                <span className="text-xs text-zinc-400">
                    {
                        characterCount
                    } characters
                </span>
            </div>

            <textarea
                value={content}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                placeholder="Paste client content, copy or briefing notes here..."
                className="min-h-64 w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />

            <button
                type="button"
                onClick={onAnalyse}
                disabled={
                    loading ||
                    disabled
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
            >
                {loading ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                        Analysing...
                    </>
                ) : (
                    <>
                        <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <path
                                d="M10 2L11.4 6.6L16 8L11.4 9.4L10 14L8.6 9.4L4 8L8.6 6.6L10 2Z"
                                fill="currentColor"
                            />
                            <path
                                d="M15 12L15.7 14.3L18 15L15.7 15.7L15 18L14.3 15.7L12 15L14.3 14.3L15 12Z"
                                fill="currentColor"
                            />
                        </svg>

                        Analyse content
                    </>
                )}
            </button>
        </div>
    );
}