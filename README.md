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

### Processing Suggestions

You can provide a function in plain-text format to augment suggestions with your own items:

```js
module.exports = {
  plugins: [
    ['fulltext-search', {
      processSuggestions: `export default async function(suggestions, queryString, queryTerms) {
        if (queryString) {
          suggestions.push({
            path: 'https://sourcegraph.com/search?patternType=literal&q=',
            slug: queryString,
            parentPageTitle: 'Sourcegraph',
            title: 'Search code',
            contentStr: 'Search for "' + queryString + '" on Sourcegraph',
            external: true,
          });
        }
        return suggestions;
      }`,
    }],
  ]
}
```

For more complex functions, you can write it in a separate Javascript file and import it like so:

```js
const fs = require('fs');
const { path } = require('@vuepress/shared-utils');

module.exports = {
  plugins: [
    ['fulltext-search', {
      processSuggestions: fs.readFileSync(path.resolve(__dirname, 'processSuggestions.js')),
    }],
  ]
}
```
