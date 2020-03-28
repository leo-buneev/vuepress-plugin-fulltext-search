FlexSearch.prototype.search = function(query, limit, callback, _recall) {
  if (SUPPORT_DOCUMENT && is_object(limit)) {
    if (is_array(limit)) {
      for (let i = 0; i < limit.length; i++) {
        limit[i]['query'] = query
      }
    } else {
      limit['query'] = query
    }

    query = /** @type {Object} */ (limit)
    limit = 1000
  } else if (limit && is_function(limit)) {
    callback = /** @type {?Function} */ (limit)
    limit = 1000
  } else {
    limit || limit === 0 || (limit = 1000)
  }

  if (SUPPORT_WORKER && this.worker) {
    this._current_callback = callback
    this._task_completed = 0
    this._task_result = []

    for (let i = 0; i < this.worker; i++) {
      this._worker[i].postMessage({
        search: true,
        limit: limit,
        content: query,
      })
    }

    return
  }

  let result = []
  let _query = query
  let threshold
  let cursor
  let sort
  let suggest

  if (is_object(query) && (!SUPPORT_DOCUMENT || !is_array(query))) {
    // re-assign properties

    if (SUPPORT_ASYNC) {
      if (!callback) {
        callback = query['callback']

        if (callback) {
          _query['callback'] = null
        }
      }
    }

    sort = SUPPORT_DOCUMENT && query['sort']
    cursor = SUPPORT_PAGINATION && query['page']
    limit = query['limit']
    threshold = query['threshold']
    suggest = SUPPORT_SUGGESTION && query['suggest']
    query = query['query']
  }

  if (SUPPORT_DOCUMENT && this.doc) {
    const doc_idx = this.doc.index
    const where = SUPPORT_WHERE && _query['where']
    const bool_main = (SUPPORT_OPERATOR && _query['bool']) || 'or'
    let field = _query['field']
    let bool = bool_main
    let queries
    let has_not
    let has_and

    if (field) {
      if (!is_array(field)) {
        field = [field]
      }
    } else if (is_array(_query)) {
      queries = _query
      field = []
      bool = []

      // TODO: make some unit tests and check if the fields should be sorted (not > and > or)?

      for (let i = 0; i < _query.length; i++) {
        const current = _query[i]
        const current_bool = (SUPPORT_OPERATOR && current['bool']) || bool_main

        field[i] = current['field']
        bool[i] = current_bool

        if (current_bool === 'not') {
          has_not = true
        } else if (current_bool === 'and') {
          has_and = true
        }
      }
    } else {
      field = this.doc.keys
    }

    const len = field.length

    for (let i = 0; i < len; i++) {
      if (queries) {
        _query = queries[i]
      }

      if (cursor && !is_string(_query)) {
        _query['page'] = null
        _query['limit'] = 0
      }

      result[i] = doc_idx[field[i]].search(_query, 0)
    }

    if (callback) {
      return callback(
        merge_and_sort.call(this, query, bool, result, sort, limit, suggest, where, cursor, has_and, has_not),
      )
    }
    if (SUPPORT_ASYNC && this.async) {
      const self = this

      return new Promise(function(resolve) {
        Promise.all(/** @type {!Iterable<Promise>} */ (result)).then(function(values) {
          resolve(merge_and_sort.call(self, query, bool, values, sort, limit, suggest, where, cursor, has_and, has_not))
        })
      })
    }

    return merge_and_sort.call(this, query, bool, result, sort, limit, suggest, where, cursor, has_and, has_not)
  }

  threshold || (threshold = this.threshold || 0)

  if (!_recall) {
    if (SUPPORT_ASYNC && this.async && typeof importScripts !== 'function') {
      let self = this

      const promise = new Promise(function(resolve) {
        setTimeout(function() {
          resolve(self.search(_query, limit, null, true))
          self = null
        })
      })

      if (callback) {
        promise.then(callback)
      } else {
        return promise
      }

      return this
    }

    if (callback) {
      callback(this.search(_query, limit, null, true))

      return this
    }
  }

  if (PROFILER) {
    profile_start('search')
  }

  if (!query || !is_string(query)) {
    return result
  }

  /** @type {!string|Array<string>} */
  ;(_query = query)

  if (SUPPORT_CACHE && this.cache) {
    // invalidate cache

    if (this._cache_status) {
      const cache = this._cache.get(query)

      if (cache) {
        return cache
      }
    }

    // validate cache
    else {
      this._cache.clear()
      this._cache_status = true
    }
  }

  // encode string

  _query = this.encode(/** @type {string} */ (_query))

  if (!_query.length) {
    return result
  }

  // convert words into single components

  const tokenizer = this.tokenize

  let words = is_function(tokenizer)
    ? tokenizer(_query)
    : // TODO: ngram matches inconsistently, research or remove
      // SUPPORT_ENCODER && (tokenizer === "ngram") ?

      /** @type {!Array<string>} */
      // (ngram(_query))
      // :
      /** @type {string} */
      (_query.split(this.split))

  if (this.filter) {
    words = filter_words(words, this.filter)
  }

  const length = words.length
  let found = true
  const check = []
  const check_words = create_object()

  let ctx_root
  let use_contextual
  let a = 0

  if (length > 1) {
    if (this.depth && this.tokenize === 'strict') {
      use_contextual = true
    } else {
      // Note: sort words by length only in non-contextual mode
      words.sort(sort_by_length_down)
    }
  }

  /*
  if(SUPPORT_WHERE && where){
      const tags = this._tags;
      if(tags){
          for(let i = 0; i < tags.length; i++){
              const current_tag = tags[i];
              const current_where = where[current_tag];
              if(!is_undefined(current_where)){
                  check[check.length] = this._tag[current_tag]["@" + current_where];
                  delete where[current_tag];
              }
          }
          if(get_keys(where).length === 0){
              where = false;
          }
      }
  }
  */

  let ctx_map

  if (!use_contextual || (ctx_map = this._ctx)) {
    const resolution = this.resolution

    // TODO: boost on custom search is actually not possible, move to adding index instead
    // if(SUPPORT_DOCUMENT && boost){
    //
    //     threshold = (threshold || 1) / boost;
    // }

    for (; a < length; a++) {
      let value = words[a]

      if (value) {
        if (use_contextual) {
          if (!ctx_root) {
            if (ctx_map[value]) {
              ctx_root = value
              check_words[value] = 1
            } else if (!suggest) {
              return result
            }
          }

          if (suggest && a === length - 1 && !check.length) {
            // fall back to single-term-strategy

            use_contextual = false
            value = ctx_root || value
            check_words[value] = 0
          } else if (!ctx_root) {
            continue
          }
        }

        if (!check_words[value]) {
          const map_check = []
          let map_found = false
          let count = 0

          const map = use_contextual ? ctx_map[ctx_root] : this._map

          if (map) {
            let map_value

            for (let z = 0; z < resolution - threshold; z++) {
              if ((map_value = map[z] && map[z][value])) {
                map_check[count++] = map_value
                map_found = true
              }
            }
          }

          if (map_found) {
            ctx_root = value

            // not handled by intersection:

            check[check.length] = count > 1 ? map_check.concat.apply([], map_check) : map_check[0]

            // handled by intersection:
            // check[check.length] = map_check;
          } else if (!SUPPORT_SUGGESTION || !suggest) {
            found = false
            break
          }

          check_words[value] = 1
        }
      }
    }
  } else {
    found = false
  }

  if (found) {
    // Not handled by intersection:
    result = /** @type {Array} */ (intersect(check, limit, cursor, SUPPORT_SUGGESTION && suggest))

    // Handled by intersection:
    // result = intersect_3d(check, limit, suggest);
  }

  // store result to cache

  if (SUPPORT_CACHE && this.cache) {
    this._cache.set(query, result)
  }

  if (PROFILER) {
    profile_end('search')
  }

  return result
}
