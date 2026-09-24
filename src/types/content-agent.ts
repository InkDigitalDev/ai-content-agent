export type AcfField = {
    key: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    subFields?: AcfField[];
};

export type BlockSchema = {
    title: string;
    fields: AcfField[];
};

export type BlockValue =
    | string
    | number
    | boolean
    | null
    | BlockFields
    | BlockValue[];

export type BlockFields = {
    [key: string]: BlockValue;
};

export type BlockResult = {
    instanceId: string;
    blockName: string;
    fields: BlockFields;
};

export type AnalysisResult = {
    blocks: BlockResult[];
};

export type WordPressPage = {
    id: number;
    slug: string;
    title: string;
};

export type PageStructureBlock = {
    instanceId: string;
    blockName: string;
    position: number;
    data: Record<string, unknown>;
    schema: BlockSchema | null;
};

export type MediaItem = {
    id: number;
    title: string;
    alt: string;
    url: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
};

export type FieldPath = Array<string | number>;

export type ImagePickerTarget = {
    blockIndex: number;
    path: FieldPath;
    selectedId: number | null;
} | null;