# Vendored visual editor dependencies

These files are committed so `/admin/visual/` works without a bundler or a CDN
at runtime.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `grapes.min.js`, `grapes.min.css`, `LICENSE` | [grapesjs](https://www.npmjs.com/package/grapesjs) | 0.23.9 | BSD-3-Clause |
| `markdown-it.min.js`, `LICENSE.markdown-it` | [markdown-it](https://www.npmjs.com/package/markdown-it) | 14.3.0 | MIT |

To update, replace the files from the published npm package and run
`npm run build`, then open the visual editor and check:

- the block palette and canvas load;
- text can be edited in place;
- a page is applied and the CMS form receives the change.
