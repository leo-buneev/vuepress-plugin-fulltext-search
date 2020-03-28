# vuepress-plugin-fulltext-search

Adds full-text search capabilities to your vuepress site with a help of flexsearch library.

Many thanks to [Ahmad Mostafa](https://ahmadmostafa.com/2019/12/09/build-better-search-in-vuepress-site/) for the idea.

## Usage

First, install plugin.

```bash
npm i vuepress-plugin-fulltext-search -D
# or
yarn add -D vuepress-plugin-fulltext-search -D
```

Then, enable the plugin in your `docs/.vuepress/config.js`:

```js
// docs/.vuepress/config.js
module.exports = {
  // ...
  plugins: ['fulltext-search'],
}
```

And that is it! Just compile your app and see for yourself.

Webpack alias `@SearchBox` will be replaced with plugin's implementation, so it should work automatically with any
VuePress theme.
