import { resolve } from 'node:path'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import * as autoprefixer from 'autoprefixer'
import { globby } from 'globby'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import * as tailwindcss from 'tailwindcss'
import { type PluginOption, defineConfig } from 'vite'

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        (autoprefixer as any).default(),
        tailwindcss.default({
          content: [resolve(process.cwd(), './**/*.{html,tsx,ts,js,jsx}')],
        }),
      ],
    },
  },
  plugins: [
    react(),
    mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }),
    pages({ paths: resolve(process.cwd(), './pages/**/*.{md,mdx,ts,tsx,js,jsx}') }),
  ],
})

////////////////////////////////////////////////////////////////////////////////////
// Plugins

type PagesParameters = { paths: string }

function pages({ paths: glob }: PagesParameters): PluginOption {
  const virtualModuleId = 'virtual:pages'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let paths: string[] = []

  return {
    name: 'pages',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = 'export const pages = ['
        paths.forEach((path) => {
          const type = path.split('.').pop()?.match(/(mdx|md)/) ? 'mdx' : 'jsx'
          const replacer = glob.split('*')[0]
          let pagePath = path.replace(replacer, '').replace(/\.(.*)/, '')
          if (pagePath === 'index') pagePath = ''
          code += `  { lazy: () => import("${path}"), path: "/${pagePath}", type: "${type}" },`
        })
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      paths = await globby(glob)
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
