interface ImportMetaEnv {
    readonly VITE_CLERK_PUBLISHABLE_KEY: string
    // add other env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.png' {
    const value: string;
    export default value;
}