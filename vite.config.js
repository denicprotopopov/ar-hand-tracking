import fs from 'fs'
import path from 'path'

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        open: !isCodeSandbox, // Open if it's not a CodeSandbox
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, 'server.crt')),
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    }
}
