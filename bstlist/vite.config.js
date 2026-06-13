/** @type {import('vite').UserConfig} */
export default {
	root: 'src/main',
	base: './',
	plugins: [
	],
	publicDir: false,
	cacheDir: '../../../node_modules/.vite',
	build: {
		target: 'es2015',
		modulePreload: false,
		outDir: '../../build/vite',
		emptyOutDir: false,
		assetsDir: '.',
		rolldownOptions: {
			output: {
				entryFileNames: "[name].js"
			}
		}
	},
	server: {
		host: 'localhost',
		port: 5173,
		strictPort: false,
		proxy: {
		},
		watch: {
			ignored: /.*\.kt/
		}
	},
}
