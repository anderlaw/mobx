import typescript from "@rollup/plugin-typescript"
export default {
    input: "./src/learn-entry.ts",
    watch: true,
    output: {
        file: "bundle.js",
        format: "cjs",
        sourcemap: true
    },
    plugins: [typescript()]
}
