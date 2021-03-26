# vuepress-plugin-fulltext-search

Add full-text search capabilities to your [VuePress](https://vuepress.vuejs.org/) website using the
[Flexsearch](https://github.com/nextapps-de/flexsearch) library.

Many thanks to [Ahmad Mostafa](https://ahmadmostafa.com/2019/12/09/build-better-search-in-vuepress-site/) for the idea.

## Usage

First, install plugin.

```bash
npm i vuepress-plugin-fulltext-search -D
# or
yarn add vuepress-plugin-fulltext-search -D
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

### Search parameters

The `query` URL search parameter can be provided to automatically populate and focus the search box. This is useful for
adding your VuePress website as a custom search engine in browsers. For example:

```none
https://your-website.com?query=hello+world
```

### Excluding pages from search

You can exclude pages from search suggestions by adding `search: false` to a page's frontmatter:

```none
---
search: false
---

<!-- page content -->
```

### Hooks

You can define several hooks to customize behaviour of various search features. For example:

```js
// /docs/.vuepress/searchHooks.js
export default {
  async processSuggestions(suggestions, queryString, queryTerms) {
    if (queryString) {
      // add a suggestion to start a search in an external service
      suggestions.push({
        path: 'https://sourcegraph.com/search?patternType=literal&q=',
        slug: queryString,
        parentPageTitle: 'Sourcegraph',
        title: 'Search code',
        contentStr: 'Search for "' + queryString + '" on Sourcegraph',
        external: true,
      })
    }
    return suggestions
  },

  async onGoToSuggestion(index, suggestion, queryString, queryTerms) {
    // e.g. create an analytics event

    // return true if you want to prevent default navigation
    return true
  },
}

// /docs/.vuepress/config.js
// Important: Because of the way Vuepress build works, you cannot use regular import/require,
// code must be provided as plaintext. Hence syntax below is required with fs.readFileSync
const fs = require('fs')
const { path } = require('@vuepress/shared-utils')

module.exports = {
  plugins: [
    [
      'fulltext-search',
      {
        // provide the contents of a JavaScript file
        hooks: fs.readFileSync(path.resolve(__dirname, './searchHooks.js')),
      },
    ],
  ],
}
```

Supported hooks are:

```ts
/**
 * Augment, adjust, or manipulate the suggestions shown to users.
 */
async function processSuggestions(suggestions: Suggestion[], queryString: string, queryTerms: string[]): Suggestion[]

/**
 * Callback function to call a suggestion.
 */
async function onGoToSuggestion(index: number, suggestion: Suggestion, queryString: string, queryTerms: string[]): Boolean?
```
