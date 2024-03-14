/*!
 * Javascript GreenDefine library v0.06
 * https://github.com/CindyLinz/JS-GreenDefine
 *
 * Copyright 2012, Cindy Wang (CindyLinz)
 * Licensed under the MIT or GPL Version 2 or GPL Version 3 licenses.
 *
 * Date: 2012.12.21
 */
(function(win, module, thunk, wait, slow, slowing, undef){
    var idle = function(cb){ win.setTimeout(cb, 50) },
        next_slow = function(cont, label){
            if( !slowing || cont ){
                slowing = 1;
                idle(function(){
                    label = slow.pop();
                    while( label && !thunk[label] )
                        label = slow.pop();
                    if( label )
                        thunk[label](1);
                    else
                        slowing = 0;
                });
            }
        },
        hurry = function(label, resolves){
            thunk[label] = function(slowly, i){
                if( slowly )
                    next_slow(1);
                else{
                    thunk[label] = undef;
                    for(i=resolves.length-1; i>=0; --i)
                        if( !wait[resolves[i]] && thunk[resolves[i]] )
                            thunk[resolves[i]]();
                }
            };
        },
        load = function(label,deps,resolves,def){
            thunk[label] = function(slowly){
                thunk[label] = slowly ? function(slowly){ if( slowly ) next_slow(1); else thunk[label] = undef; } : undef;
                def(function(_deps, def, i, load, res){
                    if( typeof _deps === 'function' )
                        def = _deps;
                    load = function(res, i){
                        module[label] = res;
                        if( thunk[label] ){ // slow loading
                            for(i=resolves.length-1; i>=0; --i)
                                if( !--wait[resolves[i]] )
                                    slow.push(resolves[i]);
                            hurry(label, resolves);
                        }
                        else // fast loading
                            for(i=resolves.length-1; i>=0; --i)
                                if( !--wait[resolves[i]] )
                                    thunk[resolves[i]]();
                        if( slowly )
                            next_slow(1);
                    };
                    for(i=deps.length-1; i>=0; --i)
                        deps[i] = module[deps[i]];
                    deps.push(load);
                    res = def.apply(this, deps);
                    if( res !== undef )
                        load(res);
                })
            };
        },
        rdefine = function(label,resolves,def){
            thunk[label] = function(slowly, i, d, undef){
                module[label] = def();
                if( slowly ){
                    for(i=resolves.length-1; i>=0; --i)
                        if( !--wait[resolves[i]] )
                            slow.push(resolves[i]);
                    hurry(label, resolves);
                    next_slow(1);
                }
                else{
                    thunk[label] = undef;
                    for(i=resolves.length-1; i>=0; --i)
                        if( !--wait[resolves[i]] )
                            thunk[resolves[i]]();
                }
            };
        },
        activate = function(defer_label, label, boundary_then_leaves){
            var loads = [], loading = 0;
            thunk[defer_label] = function(slowly, i, _loads, ins){
                thunk[defer_label] = undef;
                ins = module[label];
                module[defer_label].state = 2; // done
                _loads = loads;
                loads = loading = undef;
                for(i=_loads.length-1; i>=0; --i)
                    _loads[i](ins);
                if( slowly )
                    next_slow(1);
            };
            module[defer_label] = function(load, i){
                if( loads ){
                    loads.push(load);
                    module[defer_label].state = 1; // loading
                    if( loading<=1 ){
                        loading = 2;
                        for(i=boundary_then_leaves.length-1; i>=0; --i)
                            if( thunk[boundary_then_leaves[i]] )
                                thunk[boundary_then_leaves[i]]();
                    }
                }
                else
                    load(module[label]);
            };
            module[defer_label].state = 0; // sleeping
            module[defer_label].preload = function(load, i, j){
                if( loads ){
                    loads.push(load);
                    module[defer_label].state = 1; // loading
                    if( !loading ){
                        loading = 1;
                        for(i=0, j=boundary_then_leaves.length; i<j; ++i)
                            if( thunk[boundary_then_leaves[i]] )
                                slow.push(boundary_then_leaves[i]);
                        next_slow();
                    }
                }
                else
                    load(module[label]);
            };
        };
    
////// ls!src/main (sdefine)
load(1,[10,9,8,6],[0],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/main.html', 'ls!router-factory', 'ls!menu-item', 'global!vue-2.6.12,vue-router-3.5.1'], function(tmpl, routerFactory, compMenuItem){
    return function(){
      var vm;
      vm = new Vue({
        el: '#body',
        template: tmpl,
        components: {
          'menu-item': compMenuItem
        },
        data: function(){
          return {
            routeConfig: routerFactory.routeConfig,
            showSideMenu: false,
            switchLangUrl: '',
            vrBtn: false
          };
        },
        computed: {
          menu: function(){
            var i$, ref$, len$, elem, results$ = [];
            for (i$ = 0, len$ = (ref$ = routerFactory.routeConfig[1].item).length; i$ < len$; ++i$) {
              elem = ref$[i$];
              if (!/:/.test(elem.path) && !/google/.test(elem.path)) {
                results$.push(elem);
              }
            }
            return results$;
          }
        },
        methods: {
          openSideMenu: function(){
            this.showSideMenu = true;
          },
          closeSideMenu: function(){
            this.showSideMenu = false;
          },
          setSwitchLangUrl: function(){
            var that;
            if (that = /^(\/2021(-dev)?\/|\/)en\/(.*)/.exec(location.pathname)) {
              this.switchLangUrl = that[1] + that[3];
            } else if (that = /^\/(2021(-dev)?\/|)(.*)/.exec(location.pathname)) {
              this.switchLangUrl = "/" + that[1] + "en/" + that[3];
            }
          }
        },
        watch: {
          $route: function(to, from){
            this.setSwitchLangUrl();
          }
        },
        router: new VueRouter({
          mode: 'history',
          routes: routerFactory.routes
        })
      });
      vm.$router.beforeEach(function(t, f, next){
        if (f.path !== t.path && (/^\/news\/news\/\d+$/.exec(t.path) || f.path.replace(/^(\/[^\/]+\/[^\/]+).*/, '$1') !== t.path.replace(/^(\/[^\/]+\/[^\/]+).*/, '$1'))) {
          scrollTo(0, 0);
        }
        next();
      });
      vm.setSwitchLangUrl();
      vm;
    };
  });
}).call(this);
});

////// global!src/vue-2.6.12,src/vue-router-3.5.1 (global)
/*!
 * Vue.js v2.6.12
 * (c) 2014-2020 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
  window.Vue = factory();
  /*
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
  */
}(this, function () { 'use strict';

  /*  */

  var emptyObject = Object.freeze({});

  // These helpers produce better VM code in JS engines due to their
  // explicitness and function inlining.
  function isUndef (v) {
    return v === undefined || v === null
  }

  function isDef (v) {
    return v !== undefined && v !== null
  }

  function isTrue (v) {
    return v === true
  }

  function isFalse (v) {
    return v === false
  }

  /**
   * Check if value is primitive.
   */
  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }

  /**
   * Quick object check - this is primarily used to tell
   * Objects from primitive values when we know the value
   * is a JSON-compliant type.
   */
  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  var _toString = Object.prototype.toString;

  function toRawType (value) {
    return _toString.call(value).slice(8, -1)
  }

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  function isRegExp (v) {
    return _toString.call(v) === '[object RegExp]'
  }

  /**
   * Check if val is a valid array index.
   */
  function isValidArrayIndex (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }

  function isPromise (val) {
    return (
      isDef(val) &&
      typeof val.then === 'function' &&
      typeof val.catch === 'function'
    )
  }

  /**
   * Convert a value to a string that is actually rendered.
   */
  function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
  }

  /**
   * Convert an input value to a number for persistence.
   * If the conversion fails, return original string.
   */
  function toNumber (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  function makeMap (
    str,
    expectsLowerCase
  ) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? function (val) { return map[val.toLowerCase()]; }
      : function (val) { return map[val]; }
  }

  /**
   * Check if a tag is a built-in tag.
   */
  var isBuiltInTag = makeMap('slot,component', true);

  /**
   * Check if an attribute is a reserved attribute.
   */
  var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

  /**
   * Remove an item from an array.
   */
  function remove (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }

  /**
   * Check whether an object has the property.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key)
  }

  /**
   * Create a cached version of a pure function.
   */
  function cached (fn) {
    var cache = Object.create(null);
    return (function cachedFn (str) {
      var hit = cache[str];
      return hit || (cache[str] = fn(str))
    })
  }

  /**
   * Camelize a hyphen-delimited string.
   */
  var camelizeRE = /-(\w)/g;
  var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
  });

  /**
   * Capitalize a string.
   */
  var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  });

  /**
   * Hyphenate a camelCase string.
   */
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
  });

  /**
   * Simple bind polyfill for environments that do not support it,
   * e.g., PhantomJS 1.x. Technically, we don't need this anymore
   * since native bind is now performant enough in most browsers.
   * But removing it would mean breaking code that was able to run in
   * PhantomJS 1.x, so this must be kept for backward compatibility.
   */

  /* istanbul ignore next */
  function polyfillBind (fn, ctx) {
    function boundFn (a) {
      var l = arguments.length;
      return l
        ? l > 1
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }

    boundFn._length = fn.length;
    return boundFn
  }

  function nativeBind (fn, ctx) {
    return fn.bind(ctx)
  }

  var bind = Function.prototype.bind
    ? nativeBind
    : polyfillBind;

  /**
   * Convert an Array-like object to a real Array.
   */
  function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  }

  /**
   * Mix properties into target object.
   */
  function extend (to, _from) {
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  }

  /**
   * Merge an Array of Objects into a single Object.
   */
  function toObject (arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]) {
        extend(res, arr[i]);
      }
    }
    return res
  }

  /* eslint-disable no-unused-vars */

  /**
   * Perform no operation.
   * Stubbing args to make Flow happy without leaving useless transpiled code
   * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
   */
  function noop (a, b, c) {}

  /**
   * Always return false.
   */
  var no = function (a, b, c) { return false; };

  /* eslint-enable no-unused-vars */

  /**
   * Return the same value.
   */
  var identity = function (_) { return _; };

  /**
   * Generate a string containing static keys from compiler modules.
   */
  function genStaticKeys (modules) {
    return modules.reduce(function (keys, m) {
      return keys.concat(m.staticKeys || [])
    }, []).join(',')
  }

  /**
   * Check if two values are loosely equal - that is,
   * if they are plain objects, do they have the same shape?
   */
  function looseEqual (a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime()
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  }

  /**
   * Return the first index at which a loosely equal value can be
   * found in the array (if value is a plain object, the array must
   * contain an object of the same shape), or -1 if it is not present.
   */
  function looseIndexOf (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (looseEqual(arr[i], val)) { return i }
    }
    return -1
  }

  /**
   * Ensure a function is called only once.
   */
  function once (fn) {
    var called = false;
    return function () {
      if (!called) {
        called = true;
        fn.apply(this, arguments);
      }
    }
  }

  var SSR_ATTR = 'data-server-rendered';

  var ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ];

  var LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated',
    'errorCaptured',
    'serverPrefetch'
  ];

  /*  */



  var config = ({
    /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: Object.create(null),

    /**
     * Whether to suppress warnings.
     */
    silent: false,

    /**
     * Show production mode tip message on boot?
     */
    productionTip: "development" !== 'production',

    /**
     * Whether to enable devtools
     */
    devtools: "development" !== 'production',

    /**
     * Whether to record perf
     */
    performance: false,

    /**
     * Error handler for watcher errors
     */
    errorHandler: null,

    /**
     * Warn handler for watcher warns
     */
    warnHandler: null,

    /**
     * Ignore certain custom elements
     */
    ignoredElements: [],

    /**
     * Custom user key aliases for v-on
     */
    // $flow-disable-line
    keyCodes: Object.create(null),

    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: no,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: no,

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: no,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: noop,

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: identity,

    /**
     * Check if an attribute must be bound using property, e.g. value
     * Platform-dependent.
     */
    mustUseProp: no,

    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: true,

    /**
     * Exposed for legacy reasons
     */
    _lifecycleHooks: LIFECYCLE_HOOKS
  });

  /*  */

  /**
   * unicode letters used for parsing html tags, component names and property paths.
   * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
   * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
   */
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  /**
   * Check if a string starts with $ or _
   */
  function isReserved (str) {
    var c = (str + '').charCodeAt(0);
    return c === 0x24 || c === 0x5F
  }

  /**
   * Define a property.
   */
  function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /**
   * Parse simple path.
   */
  var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
  function parsePath (path) {
    if (bailRE.test(path)) {
      return
    }
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }

  /*  */

  // can we use __proto__?
  var hasProto = '__proto__' in {};

  // Browser environment sniffing
  var inBrowser = typeof window !== 'undefined';
  var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
  var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
  var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
  var isPhantomJS = UA && /phantomjs/.test(UA);
  var isFF = UA && UA.match(/firefox\/(\d+)/);

  // Firefox has a "watch" function on Object.prototype...
  var nativeWatch = ({}).watch;

  var supportsPassive = false;
  if (inBrowser) {
    try {
      var opts = {};
      Object.defineProperty(opts, 'passive', ({
        get: function get () {
          /* istanbul ignore next */
          supportsPassive = true;
        }
      })); // https://github.com/facebook/flow/issues/285
      window.addEventListener('test-passive', null, opts);
    } catch (e) {}
  }

  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  var _isServer;
  var isServerRendering = function () {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
      } else {
        _isServer = false;
      }
    }
    return _isServer
  };

  // detect devtools
  var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

  /* istanbul ignore next */
  function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
  }

  var hasSymbol =
    typeof Symbol !== 'undefined' && isNative(Symbol) &&
    typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

  var _Set;
  /* istanbul ignore if */ // $flow-disable-line
  if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
  } else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = /*@__PURE__*/(function () {
      function Set () {
        this.set = Object.create(null);
      }
      Set.prototype.has = function has (key) {
        return this.set[key] === true
      };
      Set.prototype.add = function add (key) {
        this.set[key] = true;
      };
      Set.prototype.clear = function clear () {
        this.set = Object.create(null);
      };

      return Set;
    }());
  }

  /*  */

  var warn = noop;
  var tip = noop;
  var generateComponentTrace = (noop); // work around flow check
  var formatComponentName = (noop);

  {
    var hasConsole = typeof console !== 'undefined';
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) { return str
      .replace(classifyRE, function (c) { return c.toUpperCase(); })
      .replace(/[-_]/g, ''); };

    warn = function (msg, vm) {
      var trace = vm ? generateComponentTrace(vm) : '';

      if (config.warnHandler) {
        config.warnHandler.call(null, msg, vm, trace);
      } else if (hasConsole && (!config.silent)) {
        console.error(("[Vue warn]: " + msg + trace));
      }
    };

    tip = function (msg, vm) {
      if (hasConsole && (!config.silent)) {
        console.warn("[Vue tip]: " + msg + (
          vm ? generateComponentTrace(vm) : ''
        ));
      }
    };

    formatComponentName = function (vm, includeFile) {
      if (vm.$root === vm) {
        return '<Root>'
      }
      var options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constructor.options
          : vm;
      var name = options.name || options._componentTag;
      var file = options.__file;
      if (!name && file) {
        var match = file.match(/([^/\\]+)\.vue$/);
        name = match && match[1];
      }

      return (
        (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
        (file && includeFile !== false ? (" at " + file) : '')
      )
    };

    var repeat = function (str, n) {
      var res = '';
      while (n) {
        if (n % 2 === 1) { res += str; }
        if (n > 1) { str += str; }
        n >>= 1;
      }
      return res
    };

    generateComponentTrace = function (vm) {
      if (vm._isVue && vm.$parent) {
        var tree = [];
        var currentRecursiveSequence = 0;
        while (vm) {
          if (tree.length > 0) {
            var last = tree[tree.length - 1];
            if (last.constructor === vm.constructor) {
              currentRecursiveSequence++;
              vm = vm.$parent;
              continue
            } else if (currentRecursiveSequence > 0) {
              tree[tree.length - 1] = [last, currentRecursiveSequence];
              currentRecursiveSequence = 0;
            }
          }
          tree.push(vm);
          vm = vm.$parent;
        }
        return '\n\nfound in\n\n' + tree
          .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
              ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
              : formatComponentName(vm))); })
          .join('\n')
      } else {
        return ("\n\n(found in " + (formatComponentName(vm)) + ")")
      }
    };
  }

  /*  */

  var uid = 0;

  /**
   * A dep is an observable that can have multiple
   * directives subscribing to it.
   */
  var Dep = function Dep () {
    this.id = uid++;
    this.subs = [];
  };

  Dep.prototype.addSub = function addSub (sub) {
    this.subs.push(sub);
  };

  Dep.prototype.removeSub = function removeSub (sub) {
    remove(this.subs, sub);
  };

  Dep.prototype.depend = function depend () {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };

  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    var subs = this.subs.slice();
    if (!config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    for (var i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  Dep.target = null;
  var targetStack = [];

  function pushTarget (target) {
    targetStack.push(target);
    Dep.target = target;
  }

  function popTarget () {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  /*  */

  var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  };

  var prototypeAccessors = { child: { configurable: true } };

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  prototypeAccessors.child.get = function () {
    return this.componentInstance
  };

  Object.defineProperties( VNode.prototype, prototypeAccessors );

  var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
  };

  function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val))
  }

  // optimized shallow clone
  // used for static nodes and slot nodes because they may be reused across
  // multiple renders, cloning them avoids errors when DOM manipulations rely
  // on their elm reference.
  function cloneVNode (vnode) {
    var cloned = new VNode(
      vnode.tag,
      vnode.data,
      // #7975
      // clone children array to avoid mutating original in case of cloning
      // a child.
      vnode.children && vnode.children.slice(),
      vnode.text,
      vnode.elm,
      vnode.context,
      vnode.componentOptions,
      vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
  }

  /*
   * not type checking this file because flow doesn't play well with
   * dynamically accessing methods on Array prototype
   */

  var arrayProto = Array.prototype;
  var arrayMethods = Object.create(arrayProto);

  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];

  /**
   * Intercept mutating methods and emit events
   */
  methodsToPatch.forEach(function (method) {
    // cache original method
    var original = arrayProto[method];
    def(arrayMethods, method, function mutator () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var result = original.apply(this, args);
      var ob = this.__ob__;
      var inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      if (inserted) { ob.observeArray(inserted); }
      // notify change
      ob.dep.notify();
      return result
    });
  });

  /*  */

  var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

  /**
   * In some cases we may want to disable observation inside a component's
   * update computation.
   */
  var shouldObserve = true;

  function toggleObserving (value) {
    shouldObserve = value;
  }

  /**
   * Observer class that is attached to each observed
   * object. Once attached, the observer converts the target
   * object's property keys into getter/setters that
   * collect dependencies and dispatch updates.
   */
  var Observer = function Observer (value) {
    this.value = value;
    this.dep = new Dep();
    this.vmCount = 0;
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  };

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      defineReactive$$1(obj, keys[i]);
    }
  };

  /**
   * Observe a list of Array items.
   */
  Observer.prototype.observeArray = function observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  };

  // helpers

  /**
   * Augment a target Object or Array by intercepting
   * the prototype chain using __proto__
   */
  function protoAugment (target, src) {
    /* eslint-disable no-proto */
    target.__proto__ = src;
    /* eslint-enable no-proto */
  }

  /**
   * Augment a target Object or Array by defining
   * hidden properties.
   */
  /* istanbul ignore next */
  function copyAugment (target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      def(target, key, src[key]);
    }
  }

  /**
   * Attempt to create an observer instance for a value,
   * returns the new observer if successfully observed,
   * or the existing observer if the value already has one.
   */
  function observe (value, asRootData) {
    if (!isObject(value) || value instanceof VNode) {
      return
    }
    var ob;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      ob = value.__ob__;
    } else if (
      shouldObserve &&
      !isServerRendering() &&
      (Array.isArray(value) || isPlainObject(value)) &&
      Object.isExtensible(value) &&
      !value._isVue
    ) {
      ob = new Observer(value);
    }
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob
  }

  /**
   * Define a reactive property on an Object.
   */
  function defineReactive$$1 (
    obj,
    key,
    val,
    customSetter,
    shallow
  ) {
    var dep = new Dep();

    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return
    }

    // cater for pre-defined getter/setters
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }

    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter () {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          if (childOb) {
            childOb.dep.depend();
            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }
        return value
      },
      set: function reactiveSetter (newVal) {
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        /* eslint-enable no-self-compare */
        if (customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        if (getter && !setter) { return }
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        childOb = !shallow && observe(newVal);
        dep.notify();
      }
    });
  }

  /**
   * Set a property on an object. Adds the new property and
   * triggers change notification if the property doesn't
   * already exist.
   */
  function set (target, key, val) {
    if (isUndef(target) || isPrimitive(target)
    ) {
      warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val
    }
    if (key in target && !(key in Object.prototype)) {
      target[key] = val;
      return val
    }
    var ob = (target).__ob__;
    if (target._isVue || (ob && ob.vmCount)) {
      warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
      );
      return val
    }
    if (!ob) {
      target[key] = val;
      return val
    }
    defineReactive$$1(ob.value, key, val);
    ob.dep.notify();
    return val
  }

  /**
   * Delete a property and trigger change if necessary.
   */
  function del (target, key) {
    if (isUndef(target) || isPrimitive(target)
    ) {
      warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      target.splice(key, 1);
      return
    }
    var ob = (target).__ob__;
    if (target._isVue || (ob && ob.vmCount)) {
      warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
        '- just set it to null.'
      );
      return
    }
    if (!hasOwn(target, key)) {
      return
    }
    delete target[key];
    if (!ob) {
      return
    }
    ob.dep.notify();
  }

  /**
   * Collect dependencies on array elements when the array is touched, since
   * we cannot intercept array element access like property getters.
   */
  function dependArray (value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
      e = value[i];
      e && e.__ob__ && e.__ob__.dep.depend();
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /*  */

  /**
   * Option overwriting strategies are functions that handle
   * how to merge a parent option value and a child option
   * value into the final value.
   */
  var strats = config.optionMergeStrategies;

  /**
   * Options with restrictions
   */
  {
    strats.el = strats.propsData = function (parent, child, vm, key) {
      if (!vm) {
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      return defaultStrat(parent, child)
    };
  }

  /**
   * Helper that recursively merges two data objects together.
   */
  function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key];
      fromVal = from[key];
      if (!hasOwn(to, key)) {
        set(to, key, fromVal);
      } else if (
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        mergeData(toVal, fromVal);
      }
    }
    return to
  }

  /**
   * Data
   */
  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      // in a Vue.extend merge, both should be functions
      if (!childVal) {
        return parentVal
      }
      if (!parentVal) {
        return childVal
      }
      // when parentVal & childVal are both present,
      // we need to return a function that returns the
      // merged result of both functions... no need to
      // check if parentVal is a function here because
      // it has to be a function to pass previous merges.
      return function mergedDataFn () {
        return mergeData(
          typeof childVal === 'function' ? childVal.call(this, this) : childVal,
          typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
        )
      }
    } else {
      return function mergedInstanceDataFn () {
        // instance merge
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
        if (instanceData) {
          return mergeData(instanceData, defaultData)
        } else {
          return defaultData
        }
      }
    }
  }

  strats.data = function (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
        warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );

        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  /**
   * Hooks and props are merged as arrays.
   */
  function mergeHook (
    parentVal,
    childVal
  ) {
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }

  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

  /**
   * Assets
   *
   * When a vm is present (instance creation), we need to do
   * a three-way merge between constructor options, instance
   * options and parent options.
   */
  function mergeAssets (
    parentVal,
    childVal,
    vm,
    key
  ) {
    var res = Object.create(parentVal || null);
    if (childVal) {
      assertObjectType(key, childVal, vm);
      return extend(res, childVal)
    } else {
      return res
    }
  }

  ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets;
  });

  /**
   * Watchers.
   *
   * Watchers hashes should not overwrite one
   * another, so we merge them as arrays.
   */
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
      var parent = ret[key$1];
      var child = childVal[key$1];
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
  };

  /**
   * Other object hashes.
   */
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
  };
  strats.provide = mergeDataOrFn;

  /**
   * Default strategy.
   */
  var defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };

  /**
   * Validate component names
   */
  function checkComponents (options) {
    for (var key in options.components) {
      validateComponentName(key);
    }
  }

  function validateComponentName (name) {
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
      warn(
        'Invalid component name: "' + name + '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
      );
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + name
      );
    }
  }

  /**
   * Ensure all props option syntax are normalized into the
   * Object-based format.
   */
  function normalizeProps (options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
      i = props.length;
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          name = camelize(val);
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    } else if (isPlainObject(props)) {
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    } else {
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }

  /**
   * Normalize all injections into Object-based format
   */
  function normalizeInject (options, vm) {
    var inject = options.inject;
    if (!inject) { return }
    var normalized = options.inject = {};
    if (Array.isArray(inject)) {
      for (var i = 0; i < inject.length; i++) {
        normalized[inject[i]] = { from: inject[i] };
      }
    } else if (isPlainObject(inject)) {
      for (var key in inject) {
        var val = inject[key];
        normalized[key] = isPlainObject(val)
          ? extend({ from: key }, val)
          : { from: val };
      }
    } else {
      warn(
        "Invalid value for option \"inject\": expected an Array or an Object, " +
        "but got " + (toRawType(inject)) + ".",
        vm
      );
    }
  }

  /**
   * Normalize raw function directives into object format.
   */
  function normalizeDirectives (options) {
    var dirs = options.directives;
    if (dirs) {
      for (var key in dirs) {
        var def$$1 = dirs[key];
        if (typeof def$$1 === 'function') {
          dirs[key] = { bind: def$$1, update: def$$1 };
        }
      }
    }
  }

  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
    }
  }

  /**
   * Merge two option objects into a new one.
   * Core utility used in both instantiation and inheritance.
   */
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    {
      checkComponents(child);
    }

    if (typeof child === 'function') {
      child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm);
      }
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    var options = {};
    var key;
    for (key in parent) {
      mergeField(key);
    }
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }
    function mergeField (key) {
      var strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key], vm, key);
    }
    return options
  }

  /**
   * Resolve an asset.
   * This function is used because child instances need access
   * to assets defined in its ancestor chain.
   */
  function resolveAsset (
    options,
    type,
    id,
    warnMissing
  ) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
      return
    }
    var assets = options[type];
    // check local registration variations first
    if (hasOwn(assets, id)) { return assets[id] }
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if (warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    return res
  }

  /*  */



  function validateProp (
    key,
    propOptions,
    propsData,
    vm
  ) {
    var prop = propOptions[key];
    var absent = !hasOwn(propsData, key);
    var value = propsData[key];
    // boolean casting
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    if (booleanIndex > -1) {
      if (absent && !hasOwn(prop, 'default')) {
        value = false;
      } else if (value === '' || value === hyphenate(key)) {
        // only cast empty string / same name to boolean if
        // boolean has higher priority
        var stringIndex = getTypeIndex(String, prop.type);
        if (stringIndex < 0 || booleanIndex < stringIndex) {
          value = true;
        }
      }
    }
    // check default value
    if (value === undefined) {
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,
      // make sure to observe it.
      var prevShouldObserve = shouldObserve;
      toggleObserving(true);
      observe(value);
      toggleObserving(prevShouldObserve);
    }
    {
      assertProp(prop, key, value, vm, absent);
    }
    return value
  }

  /**
   * Get the default value of a prop.
   */
  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    if (isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }

  /**
   * Assert whether a prop is valid.
   */
  function assertProp (
    prop,
    name,
    value,
    vm,
    absent
  ) {
    if (prop.required && absent) {
      warn(
        'Missing required prop: "' + name + '"',
        vm
      );
      return
    }
    if (value == null && !prop.required) {
      return
    }
    var type = prop.type;
    var valid = !type || type === true;
    var expectedTypes = [];
    if (type) {
      if (!Array.isArray(type)) {
        type = [type];
      }
      for (var i = 0; i < type.length && !valid; i++) {
        var assertedType = assertType(value, type[i]);
        expectedTypes.push(assertedType.expectedType || '');
        valid = assertedType.valid;
      }
    }

    if (!valid) {
      warn(
        getInvalidTypeMessage(name, value, expectedTypes),
        vm
      );
      return
    }
    var validator = prop.validator;
    if (validator) {
      if (!validator(value)) {
        warn(
          'Invalid prop: custom validator check failed for prop "' + name + '".',
          vm
        );
      }
    }
  }

  var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

  function assertType (value, type) {
    var valid;
    var expectedType = getType(type);
    if (simpleCheckRE.test(expectedType)) {
      var t = typeof value;
      valid = t === expectedType.toLowerCase();
      // for primitive wrapper objects
      if (!valid && t === 'object') {
        valid = value instanceof type;
      }
    } else if (expectedType === 'Object') {
      valid = isPlainObject(value);
    } else if (expectedType === 'Array') {
      valid = Array.isArray(value);
    } else {
      valid = value instanceof type;
    }
    return {
      valid: valid,
      expectedType: expectedType
    }
  }

  /**
   * Use function string name to check built-in types,
   * because a simple equality check will fail when running
   * across different vms / iframes.
   */
  function getType (fn) {
    var match = fn && fn.toString().match(/^\s*function (\w+)/);
    return match ? match[1] : ''
  }

  function isSameType (a, b) {
    return getType(a) === getType(b)
  }

  function getTypeIndex (type, expectedTypes) {
    if (!Array.isArray(expectedTypes)) {
      return isSameType(expectedTypes, type) ? 0 : -1
    }
    for (var i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
    return -1
  }

  function getInvalidTypeMessage (name, value, expectedTypes) {
    var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', '));
    var expectedType = expectedTypes[0];
    var receivedType = toRawType(value);
    var expectedValue = styleValue(value, expectedType);
    var receivedValue = styleValue(value, receivedType);
    // check if we need to specify expected value
    if (expectedTypes.length === 1 &&
        isExplicable(expectedType) &&
        !isBoolean(expectedType, receivedType)) {
      message += " with value " + expectedValue;
    }
    message += ", got " + receivedType + " ";
    // check if we need to specify received value
    if (isExplicable(receivedType)) {
      message += "with value " + receivedValue + ".";
    }
    return message
  }

  function styleValue (value, type) {
    if (type === 'String') {
      return ("\"" + value + "\"")
    } else if (type === 'Number') {
      return ("" + (Number(value)))
    } else {
      return ("" + value)
    }
  }

  function isExplicable (value) {
    var explicitTypes = ['string', 'number', 'boolean'];
    return explicitTypes.some(function (elem) { return value.toLowerCase() === elem; })
  }

  function isBoolean () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
  }

  /*  */

  function handleError (err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
      if (vm) {
        var cur = vm;
        while ((cur = cur.$parent)) {
          var hooks = cur.$options.errorCaptured;
          if (hooks) {
            for (var i = 0; i < hooks.length; i++) {
              try {
                var capture = hooks[i].call(cur, err, vm, info) === false;
                if (capture) { return }
              } catch (e) {
                globalHandleError(e, cur, 'errorCaptured hook');
              }
            }
          }
        }
      }
      globalHandleError(err, vm, info);
    } finally {
      popTarget();
    }
  }

  function invokeWithErrorHandling (
    handler,
    context,
    args,
    vm,
    info
  ) {
    var res;
    try {
      res = args ? handler.apply(context, args) : handler.call(context);
      if (res && !res._isVue && isPromise(res) && !res._handled) {
        res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
        // issue #9511
        // avoid catch triggering multiple times when nested calls
        res._handled = true;
      }
    } catch (e) {
      handleError(e, vm, info);
    }
    return res
  }

  function globalHandleError (err, vm, info) {
    if (config.errorHandler) {
      try {
        return config.errorHandler.call(null, err, vm, info)
      } catch (e) {
        // if the user intentionally throws the original error in the handler,
        // do not log it twice
        if (e !== err) {
          logError(e, null, 'config.errorHandler');
        }
      }
    }
    logError(err, vm, info);
  }

  function logError (err, vm, info) {
    {
      warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
      console.error(err);
    } else {
      throw err
    }
  }

  /*  */

  var isUsingMicroTask = false;

  var callbacks = [];
  var pending = false;

  function flushCallbacks () {
    pending = false;
    var copies = callbacks.slice(0);
    callbacks.length = 0;
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // Here we have async deferring wrappers using microtasks.
  // In 2.5 we used (macro) tasks (in combination with microtasks).
  // However, it has subtle problems when state is changed right before repaint
  // (e.g. #6813, out-in transitions).
  // Also, using (macro) tasks in event handler would cause some weird behaviors
  // that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
  // So we now use microtasks everywhere, again.
  // A major drawback of this tradeoff is that there are some scenarios
  // where microtasks have too high a priority and fire in between supposedly
  // sequential events (e.g. #4521, #6690, which have workarounds)
  // or even between bubbling of the same event (#6566).
  var timerFunc;

  // The nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore next, $flow-disable-line */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    timerFunc = function () {
      p.then(flushCallbacks);
      // In problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      if (isIOS) { setTimeout(noop); }
    };
    isUsingMicroTask = true;
  } else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
    isUsingMicroTask = true;
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // Fallback to setImmediate.
    // Technically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.
    timerFunc = function () {
      setImmediate(flushCallbacks);
    };
  } else {
    // Fallback to setTimeout.
    timerFunc = function () {
      setTimeout(flushCallbacks, 0);
    };
  }

  function nextTick (cb, ctx) {
    var _resolve;
    callbacks.push(function () {
      if (cb) {
        try {
          cb.call(ctx);
        } catch (e) {
          handleError(e, ctx, 'nextTick');
        }
      } else if (_resolve) {
        _resolve(ctx);
      }
    });
    if (!pending) {
      pending = true;
      timerFunc();
    }
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }

  /*  */

  var mark;
  var measure;

  {
    var perf = inBrowser && window.performance;
    /* istanbul ignore if */
    if (
      perf &&
      perf.mark &&
      perf.measure &&
      perf.clearMarks &&
      perf.clearMeasures
    ) {
      mark = function (tag) { return perf.mark(tag); };
      measure = function (name, startTag, endTag) {
        perf.measure(name, startTag, endTag);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
        // perf.clearMeasures(name)
      };
    }
  }

  /* not type checking this file because flow doesn't play well with Proxy */

  var initProxy;

  {
    var allowedGlobals = makeMap(
      'Infinity,undefined,NaN,isFinite,isNaN,' +
      'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
      'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
      'require' // for Webpack/Browserify
    );

    var warnNonPresent = function (target, key) {
      warn(
        "Property or method \"" + key + "\" is not defined on the instance but " +
        'referenced during render. Make sure that this property is reactive, ' +
        'either in the data option, or for class-based components, by ' +
        'initializing the property. ' +
        'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
        target
      );
    };

    var warnReservedPrefix = function (target, key) {
      warn(
        "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
        'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
        'prevent conflicts with Vue internals. ' +
        'See: https://vuejs.org/v2/api/#data',
        target
      );
    };

    var hasProxy =
      typeof Proxy !== 'undefined' && isNative(Proxy);

    if (hasProxy) {
      var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
      config.keyCodes = new Proxy(config.keyCodes, {
        set: function set (target, key, value) {
          if (isBuiltInModifier(key)) {
            warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
            return false
          } else {
            target[key] = value;
            return true
          }
        }
      });
    }

    var hasHandler = {
      has: function has (target, key) {
        var has = key in target;
        var isAllowed = allowedGlobals(key) ||
          (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
        if (!has && !isAllowed) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return has || !isAllowed
      }
    };

    var getHandler = {
      get: function get (target, key) {
        if (typeof key === 'string' && !(key in target)) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return target[key]
      }
    };

    initProxy = function initProxy (vm) {
      if (hasProxy) {
        // determine which proxy handler to use
        var options = vm.$options;
        var handlers = options.render && options.render._withStripped
          ? getHandler
          : hasHandler;
        vm._renderProxy = new Proxy(vm, handlers);
      } else {
        vm._renderProxy = vm;
      }
    };
  }

  /*  */

  var seenObjects = new _Set();

  /**
   * Recursively traverse an object to evoke all converted
   * getters, so that every nested property inside the object
   * is collected as a "deep" dependency.
   */
  function traverse (val) {
    _traverse(val, seenObjects);
    seenObjects.clear();
  }

  function _traverse (val, seen) {
    var i, keys;
    var isA = Array.isArray(val);
    if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
      return
    }
    if (val.__ob__) {
      var depId = val.__ob__.dep.id;
      if (seen.has(depId)) {
        return
      }
      seen.add(depId);
    }
    if (isA) {
      i = val.length;
      while (i--) { _traverse(val[i], seen); }
    } else {
      keys = Object.keys(val);
      i = keys.length;
      while (i--) { _traverse(val[keys[i]], seen); }
    }
  }

  /*  */

  var normalizeEvent = cached(function (name) {
    var passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once$$1 ? name.slice(1) : name;
    var capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
      name: name,
      once: once$$1,
      capture: capture,
      passive: passive
    }
  });

  function createFnInvoker (fns, vm) {
    function invoker () {
      var arguments$1 = arguments;

      var fns = invoker.fns;
      if (Array.isArray(fns)) {
        var cloned = fns.slice();
        for (var i = 0; i < cloned.length; i++) {
          invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
        }
      } else {
        // return handler return value for single handlers
        return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
      }
    }
    invoker.fns = fns;
    return invoker
  }

  function updateListeners (
    on,
    oldOn,
    add,
    remove$$1,
    createOnceHandler,
    vm
  ) {
    var name, def$$1, cur, old, event;
    for (name in on) {
      def$$1 = cur = on[name];
      old = oldOn[name];
      event = normalizeEvent(name);
      if (isUndef(cur)) {
        warn(
          "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
          vm
        );
      } else if (isUndef(old)) {
        if (isUndef(cur.fns)) {
          cur = on[name] = createFnInvoker(cur, vm);
        }
        if (isTrue(event.once)) {
          cur = on[name] = createOnceHandler(event.name, cur, event.capture);
        }
        add(event.name, cur, event.capture, event.passive, event.params);
      } else if (cur !== old) {
        old.fns = cur;
        on[name] = old;
      }
    }
    for (name in oldOn) {
      if (isUndef(on[name])) {
        event = normalizeEvent(name);
        remove$$1(event.name, oldOn[name], event.capture);
      }
    }
  }

  /*  */

  function mergeVNodeHook (def, hookKey, hook) {
    if (def instanceof VNode) {
      def = def.data.hook || (def.data.hook = {});
    }
    var invoker;
    var oldHook = def[hookKey];

    function wrappedHook () {
      hook.apply(this, arguments);
      // important: remove merged hook to ensure it's called only once
      // and prevent memory leak
      remove(invoker.fns, wrappedHook);
    }

    if (isUndef(oldHook)) {
      // no existing hook
      invoker = createFnInvoker([wrappedHook]);
    } else {
      /* istanbul ignore if */
      if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
        // already a merged invoker
        invoker = oldHook;
        invoker.fns.push(wrappedHook);
      } else {
        // existing plain hook
        invoker = createFnInvoker([oldHook, wrappedHook]);
      }
    }

    invoker.merged = true;
    def[hookKey] = invoker;
  }

  /*  */

  function extractPropsFromVNodeData (
    data,
    Ctor,
    tag
  ) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    var propOptions = Ctor.options.props;
    if (isUndef(propOptions)) {
      return
    }
    var res = {};
    var attrs = data.attrs;
    var props = data.props;
    if (isDef(attrs) || isDef(props)) {
      for (var key in propOptions) {
        var altKey = hyphenate(key);
        {
          var keyInLowerCase = key.toLowerCase();
          if (
            key !== keyInLowerCase &&
            attrs && hasOwn(attrs, keyInLowerCase)
          ) {
            tip(
              "Prop \"" + keyInLowerCase + "\" is passed to component " +
              (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
              " \"" + key + "\". " +
              "Note that HTML attributes are case-insensitive and camelCased " +
              "props need to use their kebab-case equivalents when using in-DOM " +
              "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
            );
          }
        }
        checkProp(res, props, key, altKey, true) ||
        checkProp(res, attrs, key, altKey, false);
      }
    }
    return res
  }

  function checkProp (
    res,
    hash,
    key,
    altKey,
    preserve
  ) {
    if (isDef(hash)) {
      if (hasOwn(hash, key)) {
        res[key] = hash[key];
        if (!preserve) {
          delete hash[key];
        }
        return true
      } else if (hasOwn(hash, altKey)) {
        res[key] = hash[altKey];
        if (!preserve) {
          delete hash[altKey];
        }
        return true
      }
    }
    return false
  }

  /*  */

  // The template compiler attempts to minimize the need for normalization by
  // statically analyzing the template at compile time.
  //
  // For plain HTML markup, normalization can be completely skipped because the
  // generated render function is guaranteed to return Array<VNode>. There are
  // two cases where extra normalization is needed:

  // 1. When the children contains components - because a functional component
  // may return an Array instead of a single root. In this case, just a simple
  // normalization is needed - if any child is an Array, we flatten the whole
  // thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
  // because functional components already normalize their own children.
  function simpleNormalizeChildren (children) {
    for (var i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  // 2. When the children contains constructs that always generated nested Arrays,
  // e.g. <template>, <slot>, v-for, or when the children is provided by user
  // with hand-written render functions / JSX. In such cases a full normalization
  // is needed to cater to all possible types of children values.
  function normalizeChildren (children) {
    return isPrimitive(children)
      ? [createTextVNode(children)]
      : Array.isArray(children)
        ? normalizeArrayChildren(children)
        : undefined
  }

  function isTextNode (node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
  }

  function normalizeArrayChildren (children, nestedIndex) {
    var res = [];
    var i, c, lastIndex, last;
    for (i = 0; i < children.length; i++) {
      c = children[i];
      if (isUndef(c) || typeof c === 'boolean') { continue }
      lastIndex = res.length - 1;
      last = res[lastIndex];
      //  nested
      if (Array.isArray(c)) {
        if (c.length > 0) {
          c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
          // merge adjacent text nodes
          if (isTextNode(c[0]) && isTextNode(last)) {
            res[lastIndex] = createTextVNode(last.text + (c[0]).text);
            c.shift();
          }
          res.push.apply(res, c);
        }
      } else if (isPrimitive(c)) {
        if (isTextNode(last)) {
          // merge adjacent text nodes
          // this is necessary for SSR hydration because text nodes are
          // essentially merged when rendered to HTML strings
          res[lastIndex] = createTextVNode(last.text + c);
        } else if (c !== '') {
          // convert primitive to vnode
          res.push(createTextVNode(c));
        }
      } else {
        if (isTextNode(c) && isTextNode(last)) {
          // merge adjacent text nodes
          res[lastIndex] = createTextVNode(last.text + c.text);
        } else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) &&
            isDef(c.tag) &&
            isUndef(c.key) &&
            isDef(nestedIndex)) {
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          res.push(c);
        }
      }
    }
    return res
  }

  /*  */

  function initProvide (vm) {
    var provide = vm.$options.provide;
    if (provide) {
      vm._provided = typeof provide === 'function'
        ? provide.call(vm)
        : provide;
    }
  }

  function initInjections (vm) {
    var result = resolveInject(vm.$options.inject, vm);
    if (result) {
      toggleObserving(false);
      Object.keys(result).forEach(function (key) {
        /* istanbul ignore else */
        {
          defineReactive$$1(vm, key, result[key], function () {
            warn(
              "Avoid mutating an injected value directly since the changes will be " +
              "overwritten whenever the provided component re-renders. " +
              "injection being mutated: \"" + key + "\"",
              vm
            );
          });
        }
      });
      toggleObserving(true);
    }
  }

  function resolveInject (inject, vm) {
    if (inject) {
      // inject is :any because flow is not smart enough to figure out cached
      var result = Object.create(null);
      var keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // #6574 in case the inject object is observed...
        if (key === '__ob__') { continue }
        var provideKey = inject[key].from;
        var source = vm;
        while (source) {
          if (source._provided && hasOwn(source._provided, provideKey)) {
            result[key] = source._provided[provideKey];
            break
          }
          source = source.$parent;
        }
        if (!source) {
          if ('default' in inject[key]) {
            var provideDefault = inject[key].default;
            result[key] = typeof provideDefault === 'function'
              ? provideDefault.call(vm)
              : provideDefault;
          } else {
            warn(("Injection \"" + key + "\" not found"), vm);
          }
        }
      }
      return result
    }
  }

  /*  */



  /**
   * Runtime helper for resolving raw children VNodes into a slot object.
   */
  function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
  }

  function isWhitespace (node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
  }

  /*  */

  function normalizeScopedSlots (
    slots,
    normalSlots,
    prevSlots
  ) {
    var res;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var isStable = slots ? !!slots.$stable : !hasNormalSlots;
    var key = slots && slots.$key;
    if (!slots) {
      res = {};
    } else if (slots._normalized) {
      // fast path 1: child component re-render only, parent did not change
      return slots._normalized
    } else if (
      isStable &&
      prevSlots &&
      prevSlots !== emptyObject &&
      key === prevSlots.$key &&
      !hasNormalSlots &&
      !prevSlots.$hasNormal
    ) {
      // fast path 2: stable scoped slots w/ no normal slots to proxy,
      // only need to normalize once
      return prevSlots
    } else {
      res = {};
      for (var key$1 in slots) {
        if (slots[key$1] && key$1[0] !== '$') {
          res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
        }
      }
    }
    // expose normal slots on scopedSlots
    for (var key$2 in normalSlots) {
      if (!(key$2 in res)) {
        res[key$2] = proxyNormalSlot(normalSlots, key$2);
      }
    }
    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    if (slots && Object.isExtensible(slots)) {
      (slots)._normalized = res;
    }
    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);
    return res
  }

  function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      return res && (
        res.length === 0 ||
        (res.length === 1 && res[0].isComment) // #9658
      ) ? undefined
        : res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
  }

  function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
  }

  /*  */

  /**
   * Runtime helper for rendering v-for lists.
   */
  function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      if (hasSymbol && val[Symbol.iterator]) {
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    return ret
  }

  /*  */

  /**
   * Runtime helper for rendering <slot>
   */
  function renderSlot (
    name,
    fallback,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    if (scopedSlotFn) { // scoped slot
      props = props || {};
      if (bindObject) {
        if (!isObject(bindObject)) {
          warn(
            'slot v-bind without argument expects an Object',
            this
          );
        }
        props = extend(extend({}, bindObject), props);
      }
      nodes = scopedSlotFn(props) || fallback;
    } else {
      nodes = this.$slots[name] || fallback;
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }

  /*  */

  /**
   * Runtime helper for resolving filters
   */
  function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  /*  */

  function isKeyNotMatch (expect, actual) {
    if (Array.isArray(expect)) {
      return expect.indexOf(actual) === -1
    } else {
      return expect !== actual
    }
  }

  /**
   * Runtime helper for checking keyCodes from config.
   * exposed as Vue.prototype._k
   * passing in eventKeyName as last argument separately for backwards compat
   */
  function checkKeyCodes (
    eventKeyCode,
    key,
    builtInKeyCode,
    eventKeyName,
    builtInKeyName
  ) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
      return isKeyNotMatch(builtInKeyName, eventKeyName)
    } else if (mappedKeyCode) {
      return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    } else if (eventKeyName) {
      return hyphenate(eventKeyName) !== key
    }
  }

  /*  */

  /**
   * Runtime helper for merging v-bind="object" into a VNode's data.
   */
  function bindObjectProps (
    data,
    tag,
    value,
    asProp,
    isSync
  ) {
    if (value) {
      if (!isObject(value)) {
        warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        var hash;
        var loop = function ( key ) {
          if (
            key === 'class' ||
            key === 'style' ||
            isReservedAttribute(key)
          ) {
            hash = data;
          } else {
            var type = data.attrs && data.attrs.type;
            hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
          }
          var camelizedKey = camelize(key);
          var hyphenatedKey = hyphenate(key);
          if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
            hash[key] = value[key];

            if (isSync) {
              var on = data.on || (data.on = {});
              on[("update:" + key)] = function ($event) {
                value[key] = $event;
              };
            }
          }
        };

        for (var key in value) loop( key );
      }
    }
    return data
  }

  /*  */

  /**
   * Runtime helper for rendering static trees.
   */
  function renderStatic (
    index,
    isInFor
  ) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    if (tree && !isInFor) {
      return tree
    }
    // otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    markStatic(tree, ("__static__" + index), false);
    return tree
  }

  /**
   * Runtime helper for v-once.
   * Effectively it means marking the node as static with a unique key.
   */
  function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  }

  function markStatic (
    tree,
    key,
    isOnce
  ) {
    if (Array.isArray(tree)) {
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }

  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  /*  */

  function bindObjectListeners (data, value) {
    if (value) {
      if (!isPlainObject(value)) {
        warn(
          'v-on without argument expects an Object value',
          this
        );
      } else {
        var on = data.on = data.on ? extend({}, data.on) : {};
        for (var key in value) {
          var existing = on[key];
          var ours = value[key];
          on[key] = existing ? [].concat(existing, ours) : ours;
        }
      }
    }
    return data
  }

  /*  */

  function resolveScopedSlots (
    fns, // see flow/vnode
    res,
    // the following are added in 2.6
    hasDynamicKeys,
    contentHashKey
  ) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) {
          slot.fn.proxy = true;
        }
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }

  /*  */

  function bindDynamicKeys (baseObj, values) {
    for (var i = 0; i < values.length; i += 2) {
      var key = values[i];
      if (typeof key === 'string' && key) {
        baseObj[values[i]] = values[i + 1];
      } else if (key !== '' && key !== null) {
        // null is a special value for explicitly removing a binding
        warn(
          ("Invalid value for dynamic directive argument (expected string or null): " + key),
          this
        );
      }
    }
    return baseObj
  }

  // helper to dynamically append modifier runtime markers to event names.
  // ensure only append when value is already string, otherwise it will be cast
  // to string and cause the type check to miss.
  function prependModifier (value, symbol) {
    return typeof value === 'string' ? symbol + value : value
  }

  /*  */

  function installRenderHelpers (target) {
    target._o = markOnce;
    target._n = toNumber;
    target._s = toString;
    target._l = renderList;
    target._t = renderSlot;
    target._q = looseEqual;
    target._i = looseIndexOf;
    target._m = renderStatic;
    target._f = resolveFilter;
    target._k = checkKeyCodes;
    target._b = bindObjectProps;
    target._v = createTextVNode;
    target._e = createEmptyVNode;
    target._u = resolveScopedSlots;
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
  }

  /*  */

  function FunctionalRenderContext (
    data,
    props,
    children,
    parent,
    Ctor
  ) {
    var this$1 = this;

    var options = Ctor.options;
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    var contextVm;
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      // $flow-disable-line
      contextVm._original = parent;
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent;
      // $flow-disable-line
      parent = parent._original;
    }
    var isCompiled = isTrue(options._compiled);
    var needNormalization = !isCompiled;

    this.data = data;
    this.props = props;
    this.children = children;
    this.parent = parent;
    this.listeners = data.on || emptyObject;
    this.injections = resolveInject(options.inject, parent);
    this.slots = function () {
      if (!this$1.$slots) {
        normalizeScopedSlots(
          data.scopedSlots,
          this$1.$slots = resolveSlots(children, parent)
        );
      }
      return this$1.$slots
    };

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get: function get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }));

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options;
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots();
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
    }

    if (options._scopeId) {
      this._c = function (a, b, c, d) {
        var vnode = createElement(contextVm, a, b, c, d, needNormalization);
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId;
          vnode.fnContext = parent;
        }
        return vnode
      };
    } else {
      this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
    }
  }

  installRenderHelpers(FunctionalRenderContext.prototype);

  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    var options = Ctor.options;
    var props = {};
    var propOptions = options.props;
    if (isDef(propOptions)) {
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    var vnode = options.render.call(null, renderContext._c, renderContext);

    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }

  function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
    // #7817 clone node before setting fnContext, otherwise if the node is reused
    // (e.g. it was from a cached normal slot) the fnContext causes named slots
    // that should not be matched to match.
    var clone = cloneVNode(vnode);
    clone.fnContext = contextVm;
    clone.fnOptions = options;
    {
      (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
    }
    if (data.slot) {
      (clone.data || (clone.data = {})).slot = data.slot;
    }
    return clone
  }

  function mergeProps (to, from) {
    for (var key in from) {
      to[camelize(key)] = from[key];
    }
  }

  /*  */

  /*  */

  /*  */

  /*  */

  // inline hooks to be invoked on component VNodes during patch
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },

    prepatch: function prepatch (oldVnode, vnode) {
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },

    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },

    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {
          componentInstance.$destroy();
        } else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };

  var hooksToMerge = Object.keys(componentVNodeHooks);

  function createComponent (
    Ctor,
    data,
    context,
    children,
    tag
  ) {
    if (isUndef(Ctor)) {
      return
    }

    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    installComponentHooks(data);

    // return a placeholder vnode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );

    return vnode
  }

  function createComponentInstanceForVnode (
    vnode, // we know it's MountedComponentVNode but flow doesn't
    parent // activeInstance in lifecycle state
  ) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    return new vnode.componentOptions.Ctor(options)
  }

  function installComponentHooks (data) {
    var hooks = data.hook || (data.hook = {});
    for (var i = 0; i < hooksToMerge.length; i++) {
      var key = hooksToMerge[i];
      var existing = hooks[key];
      var toMerge = componentVNodeHooks[key];
      if (existing !== toMerge && !(existing && existing._merged)) {
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  }

  function mergeHook$1 (f1, f2) {
    var merged = function (a, b) {
      // flow complains about extra args which is why we use any
      f1(a, b);
      f2(a, b);
    };
    merged._merged = true;
    return merged
  }

  // transform component v-model info (value and callback) into
  // prop and event handler respectively.
  function transformModel (options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input'
    ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
  }

  /*  */

  var SIMPLE_NORMALIZE = 1;
  var ALWAYS_NORMALIZE = 2;

  // wrapper function for providing a more flexible interface
  // without getting yelled at by flow
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
  ) {
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
  }

  function _createElement (
    context,
    tag,
    data,
    children,
    normalizationType
  ) {
    if (isDef(data) && isDef((data).__ob__)) {
      warn(
        "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
        'Always create fresh vnode data objects in each render!',
        context
      );
      return createEmptyVNode()
    }
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    if (!tag) {
      // in case of component :is set to falsy value
      return createEmptyVNode()
    }
    // warn against non-primitive key
    if (isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
      {
        warn(
          'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
          context
        );
      }
    }
    // support single function children as default scoped slot
    if (Array.isArray(children) &&
      typeof children[0] === 'function'
    ) {
      data = data || {};
      data.scopedSlots = { default: children[0] };
      children.length = 0;
    }
    if (normalizationType === ALWAYS_NORMALIZE) {
      children = normalizeChildren(children);
    } else if (normalizationType === SIMPLE_NORMALIZE) {
      children = simpleNormalizeChildren(children);
    }
    var vnode, ns;
    if (typeof tag === 'string') {
      var Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        if (isDef(data) && isDef(data.nativeOn)) {
          warn(
            ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
            context
          );
        }
        vnode = new VNode(
          config.parsePlatformTagName(tag), data, children,
          undefined, undefined, context
        );
      } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    } else {
      // direct component options / constructor
      vnode = createComponent(tag, data, context, children);
    }
    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) {
      if (isDef(ns)) { applyNS(vnode, ns); }
      if (isDef(data)) { registerDeepBindings(data); }
      return vnode
    } else {
      return createEmptyVNode()
    }
  }

  function applyNS (vnode, ns, force) {
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
      // use default namespace inside foreignObject
      ns = undefined;
      force = true;
    }
    if (isDef(vnode.children)) {
      for (var i = 0, l = vnode.children.length; i < l; i++) {
        var child = vnode.children[i];
        if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
          applyNS(child, ns, force);
        }
      }
    }
  }

  // ref #5318
  // necessary to ensure parent re-render when deep bindings like :style and
  // :class are used on slot nodes
  function registerDeepBindings (data) {
    if (isObject(data.style)) {
      traverse(data.style);
    }
    if (isObject(data.class)) {
      traverse(data.class);
    }
  }

  /*  */

  function initRender (vm) {
    vm._vnode = null; // the root of the child tree
    vm._staticTrees = null; // v-once cached trees
    var options = vm.$options;
    var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
    var renderContext = parentVnode && parentVnode.context;
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    {
      defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
        !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
      }, true);
      defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
        !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
      }, true);
    }
  }

  var currentRenderingInstance = null;

  function renderMixin (Vue) {
    // install runtime convenience helpers
    installRenderHelpers(Vue.prototype);

    Vue.prototype.$nextTick = function (fn) {
      return nextTick(fn, this)
    };

    Vue.prototype._render = function () {
      var vm = this;
      var ref = vm.$options;
      var render = ref.render;
      var _parentVnode = ref._parentVnode;

      if (_parentVnode) {
        vm.$scopedSlots = normalizeScopedSlots(
          _parentVnode.data.scopedSlots,
          vm.$slots,
          vm.$scopedSlots
        );
      }

      // set parent vnode. this allows render functions to have access
      // to the data on the placeholder node.
      vm.$vnode = _parentVnode;
      // render self
      var vnode;
      try {
        // There's no need to maintain a stack because all render fns are called
        // separately from one another. Nested component's render fns are called
        // when parent component is patched.
        currentRenderingInstance = vm;
        vnode = render.call(vm._renderProxy, vm.$createElement);
      } catch (e) {
        handleError(e, vm, "render");
        // return error render result,
        // or previous vnode to prevent render error causing blank component
        /* istanbul ignore else */
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      } finally {
        currentRenderingInstance = null;
      }
      // if the returned array contains only a single node, allow it
      if (Array.isArray(vnode) && vnode.length === 1) {
        vnode = vnode[0];
      }
      // return empty vnode in case the render function errored out
      if (!(vnode instanceof VNode)) {
        if (Array.isArray(vnode)) {
          warn(
            'Multiple root nodes returned from render function. Render function ' +
            'should return a single root node.',
            vm
          );
        }
        vnode = createEmptyVNode();
      }
      // set parent
      vnode.parent = _parentVnode;
      return vnode
    };
  }

  /*  */

  function ensureCtor (comp, base) {
    if (
      comp.__esModule ||
      (hasSymbol && comp[Symbol.toStringTag] === 'Module')
    ) {
      comp = comp.default;
    }
    return isObject(comp)
      ? base.extend(comp)
      : comp
  }

  function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }

  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    var owner = currentRenderingInstance;
    if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
      // already pending
      factory.owners.push(owner);
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }

    if (owner && !isDef(factory.owners)) {
      var owners = factory.owners = [owner];
      var sync = true;
      var timerLoading = null;
      var timerTimeout = null

      ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

      var forceRender = function (renderCompleted) {
        for (var i = 0, l = owners.length; i < l; i++) {
          (owners[i]).$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
          if (timerLoading !== null) {
            clearTimeout(timerLoading);
            timerLoading = null;
          }
          if (timerTimeout !== null) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
          }
        }
      };

      var resolve = once(function (res) {
        // cache resolved
        factory.resolved = ensureCtor(res, baseCtor);
        // invoke callbacks only if this is not a synchronous resolve
        // (async resolves are shimmed as synchronous during SSR)
        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });

      var reject = once(function (reason) {
        warn(
          "Failed to resolve async component: " + (String(factory)) +
          (reason ? ("\nReason: " + reason) : '')
        );
        if (isDef(factory.errorComp)) {
          factory.error = true;
          forceRender(true);
        }
      });

      var res = factory(resolve, reject);

      if (isObject(res)) {
        if (isPromise(res)) {
          // () => Promise
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        } else if (isPromise(res.component)) {
          res.component.then(resolve, reject);

          if (isDef(res.error)) {
            factory.errorComp = ensureCtor(res.error, baseCtor);
          }

          if (isDef(res.loading)) {
            factory.loadingComp = ensureCtor(res.loading, baseCtor);
            if (res.delay === 0) {
              factory.loading = true;
            } else {
              timerLoading = setTimeout(function () {
                timerLoading = null;
                if (isUndef(factory.resolved) && isUndef(factory.error)) {
                  factory.loading = true;
                  forceRender(false);
                }
              }, res.delay || 200);
            }
          }

          if (isDef(res.timeout)) {
            timerTimeout = setTimeout(function () {
              timerTimeout = null;
              if (isUndef(factory.resolved)) {
                reject(
                  "timeout (" + (res.timeout) + "ms)"
                );
              }
            }, res.timeout);
          }
        }
      }

      sync = false;
      // return in case resolved synchronously
      return factory.loading
        ? factory.loadingComp
        : factory.resolved
    }
  }

  /*  */

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  /*  */

  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }

  /*  */

  /*  */

  function initEvents (vm) {
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
      updateComponentListeners(vm, listeners);
    }
  }

  var target;

  function add (event, fn) {
    target.$on(event, fn);
  }

  function remove$1 (event, fn) {
    target.$off(event, fn);
  }

  function createOnceHandler (event, fn) {
    var _target = target;
    return function onceHandler () {
      var res = fn.apply(null, arguments);
      if (res !== null) {
        _target.$off(event, onceHandler);
      }
    }
  }

  function updateComponentListeners (
    vm,
    listeners,
    oldListeners
  ) {
    target = vm;
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
  }

  function eventsMixin (Vue) {
    var hookRE = /^hook:/;
    Vue.prototype.$on = function (event, fn) {
      var vm = this;
      if (Array.isArray(event)) {
        for (var i = 0, l = event.length; i < l; i++) {
          vm.$on(event[i], fn);
        }
      } else {
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // optimize hook:event cost by using a boolean flag marked at registration
        // instead of a hash lookup
        if (hookRE.test(event)) {
          vm._hasHookEvent = true;
        }
      }
      return vm
    };

    Vue.prototype.$once = function (event, fn) {
      var vm = this;
      function on () {
        vm.$off(event, on);
        fn.apply(vm, arguments);
      }
      on.fn = fn;
      vm.$on(event, on);
      return vm
    };

    Vue.prototype.$off = function (event, fn) {
      var vm = this;
      // all
      if (!arguments.length) {
        vm._events = Object.create(null);
        return vm
      }
      // array of events
      if (Array.isArray(event)) {
        for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
          vm.$off(event[i$1], fn);
        }
        return vm
      }
      // specific event
      var cbs = vm._events[event];
      if (!cbs) {
        return vm
      }
      if (!fn) {
        vm._events[event] = null;
        return vm
      }
      // specific handler
      var cb;
      var i = cbs.length;
      while (i--) {
        cb = cbs[i];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i, 1);
          break
        }
      }
      return vm
    };

    Vue.prototype.$emit = function (event) {
      var vm = this;
      {
        var lowerCaseEvent = event.toLowerCase();
        if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
          tip(
            "Event \"" + lowerCaseEvent + "\" is emitted in component " +
            (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
            "Note that HTML attributes are case-insensitive and you cannot use " +
            "v-on to listen to camelCase events when using in-DOM templates. " +
            "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
          );
        }
      }
      var cbs = vm._events[event];
      if (cbs) {
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        var args = toArray(arguments, 1);
        var info = "event handler for \"" + event + "\"";
        for (var i = 0, l = cbs.length; i < l; i++) {
          invokeWithErrorHandling(cbs[i], vm, args, vm, info);
        }
      }
      return vm
    };
  }

  /*  */

  var activeInstance = null;
  var isUpdatingChildComponent = false;

  function setActiveInstance(vm) {
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    return function () {
      activeInstance = prevActiveInstance;
    }
  }

  function initLifecycle (vm) {
    var options = vm.$options;

    // locate first non-abstract parent
    var parent = options.parent;
    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }
      parent.$children.push(vm);
    }

    vm.$parent = parent;
    vm.$root = parent ? parent.$root : vm;

    vm.$children = [];
    vm.$refs = {};

    vm._watcher = null;
    vm._inactive = null;
    vm._directInactive = false;
    vm._isMounted = false;
    vm._isDestroyed = false;
    vm._isBeingDestroyed = false;
  }

  function lifecycleMixin (Vue) {
    Vue.prototype._update = function (vnode, hydrating) {
      var vm = this;
      var prevEl = vm.$el;
      var prevVnode = vm._vnode;
      var restoreActiveInstance = setActiveInstance(vm);
      vm._vnode = vnode;
      // Vue.prototype.__patch__ is injected in entry points
      // based on the rendering backend used.
      if (!prevVnode) {
        // initial render
        vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
      } else {
        // updates
        vm.$el = vm.__patch__(prevVnode, vnode);
      }
      restoreActiveInstance();
      // update __vue__ reference
      if (prevEl) {
        prevEl.__vue__ = null;
      }
      if (vm.$el) {
        vm.$el.__vue__ = vm;
      }
      // if parent is an HOC, update its $el as well
      if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el;
      }
      // updated hook is called by the scheduler to ensure that children are
      // updated in a parent's updated hook.
    };

    Vue.prototype.$forceUpdate = function () {
      var vm = this;
      if (vm._watcher) {
        vm._watcher.update();
      }
    };

    Vue.prototype.$destroy = function () {
      var vm = this;
      if (vm._isBeingDestroyed) {
        return
      }
      callHook(vm, 'beforeDestroy');
      vm._isBeingDestroyed = true;
      // remove self from parent
      var parent = vm.$parent;
      if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
        remove(parent.$children, vm);
      }
      // teardown watchers
      if (vm._watcher) {
        vm._watcher.teardown();
      }
      var i = vm._watchers.length;
      while (i--) {
        vm._watchers[i].teardown();
      }
      // remove reference from data ob
      // frozen object may not have observer.
      if (vm._data.__ob__) {
        vm._data.__ob__.vmCount--;
      }
      // call the last hook...
      vm._isDestroyed = true;
      // invoke destroy hooks on current rendered tree
      vm.__patch__(vm._vnode, null);
      // fire destroyed hook
      callHook(vm, 'destroyed');
      // turn off all instance listeners.
      vm.$off();
      // remove __vue__ reference
      if (vm.$el) {
        vm.$el.__vue__ = null;
      }
      // release circular reference (#6759)
      if (vm.$vnode) {
        vm.$vnode.parent = null;
      }
    };
  }

  function mountComponent (
    vm,
    el,
    hydrating
  ) {
    vm.$el = el;
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode;
      {
        /* istanbul ignore if */
        if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
          vm.$options.el || el) {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'compiler is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          );
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          );
        }
      }
    }
    callHook(vm, 'beforeMount');

    var updateComponent;
    /* istanbul ignore if */
    if (config.performance && mark) {
      updateComponent = function () {
        var name = vm._name;
        var id = vm._uid;
        var startTag = "vue-perf-start:" + id;
        var endTag = "vue-perf-end:" + id;

        mark(startTag);
        var vnode = vm._render();
        mark(endTag);
        measure(("vue " + name + " render"), startTag, endTag);

        mark(startTag);
        vm._update(vnode, hydrating);
        mark(endTag);
        measure(("vue " + name + " patch"), startTag, endTag);
      };
    } else {
      updateComponent = function () {
        vm._update(vm._render(), hydrating);
      };
    }

    // we set this to vm._watcher inside the watcher's constructor
    // since the watcher's initial patch may call $forceUpdate (e.g. inside child
    // component's mounted hook), which relies on vm._watcher being already defined
    new Watcher(vm, updateComponent, noop, {
      before: function before () {
        if (vm._isMounted && !vm._isDestroyed) {
          callHook(vm, 'beforeUpdate');
        }
      }
    }, true /* isRenderWatcher */);
    hydrating = false;

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true;
      callHook(vm, 'mounted');
    }
    return vm
  }

  function updateChildComponent (
    vm,
    propsData,
    listeners,
    parentVnode,
    renderChildren
  ) {
    {
      isUpdatingChildComponent = true;
    }

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    var newScopedSlots = parentVnode.data.scopedSlots;
    var oldScopedSlots = vm.$scopedSlots;
    var hasDynamicScopedSlot = !!(
      (newScopedSlots && !newScopedSlots.$stable) ||
      (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
      (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    var needsForceUpdate = !!(
      renderChildren ||               // has new static slots
      vm.$options._renderChildren ||  // has old static slots
      hasDynamicScopedSlot
    );

    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render

    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    vm.$listeners = listeners || emptyObject;

    // update props
    if (propsData && vm.$options.props) {
      toggleObserving(false);
      var props = vm._props;
      var propKeys = vm.$options._propKeys || [];
      for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        var propOptions = vm.$options.props; // wtf flow?
        props[key] = validateProp(key, propOptions, propsData, vm);
      }
      toggleObserving(true);
      // keep a copy of raw propsData
      vm.$options.propsData = propsData;
    }

    // update listeners
    listeners = listeners || emptyObject;
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    if (needsForceUpdate) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      vm.$forceUpdate();
    }

    {
      isUpdatingChildComponent = false;
    }
  }

  function isInInactiveTree (vm) {
    while (vm && (vm = vm.$parent)) {
      if (vm._inactive) { return true }
    }
    return false
  }

  function activateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = false;
      if (isInInactiveTree(vm)) {
        return
      }
    } else if (vm._directInactive) {
      return
    }
    if (vm._inactive || vm._inactive === null) {
      vm._inactive = false;
      for (var i = 0; i < vm.$children.length; i++) {
        activateChildComponent(vm.$children[i]);
      }
      callHook(vm, 'activated');
    }
  }

  function deactivateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return
      }
    }
    if (!vm._inactive) {
      vm._inactive = true;
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      callHook(vm, 'deactivated');
    }
  }

  function callHook (vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget();
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        invokeWithErrorHandling(handlers[i], vm, null, vm, info);
      }
    }
    if (vm._hasHookEvent) {
      vm.$emit('hook:' + hook);
    }
    popTarget();
  }

  /*  */

  var MAX_UPDATE_COUNT = 100;

  var queue = [];
  var activatedChildren = [];
  var has = {};
  var circular = {};
  var waiting = false;
  var flushing = false;
  var index = 0;

  /**
   * Reset the scheduler's state.
   */
  function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0;
    has = {};
    {
      circular = {};
    }
    waiting = flushing = false;
  }

  // Async edge case #6566 requires saving the timestamp when event listeners are
  // attached. However, calling performance.now() has a perf overhead especially
  // if the page has thousands of event listeners. Instead, we take a timestamp
  // every time the scheduler flushes and use that for all event listeners
  // attached during that flush.
  var currentFlushTimestamp = 0;

  // Async edge case fix requires storing an event listener's attach timestamp.
  var getNow = Date.now;

  // Determine what event timestamp the browser is using. Annoyingly, the
  // timestamp can either be hi-res (relative to page load) or low-res
  // (relative to UNIX epoch), so in order to compare time we have to use the
  // same timestamp type when saving the flush timestamp.
  // All IE versions use low-res event timestamps, and have problematic clock
  // implementations (#9632)
  if (inBrowser && !isIE) {
    var performance = window.performance;
    if (
      performance &&
      typeof performance.now === 'function' &&
      getNow() > document.createEvent('Event').timeStamp
    ) {
      // if the event timestamp, although evaluated AFTER the Date.now(), is
      // smaller than it, it means the event is using a hi-res timestamp,
      // and we need to use the hi-res version for event listener timestamps as
      // well.
      getNow = function () { return performance.now(); };
    }
  }

  /**
   * Flush both queues and run the watchers.
   */
  function flushSchedulerQueue () {
    currentFlushTimestamp = getNow();
    flushing = true;
    var watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort(function (a, b) { return a.id - b.id; });

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
      watcher = queue[index];
      if (watcher.before) {
        watcher.before();
      }
      id = watcher.id;
      has[id] = null;
      watcher.run();
      // in dev build, check and stop circular updates.
      if (has[id] != null) {
        circular[id] = (circular[id] || 0) + 1;
        if (circular[id] > MAX_UPDATE_COUNT) {
          warn(
            'You may have an infinite update loop ' + (
              watcher.user
                ? ("in watcher with expression \"" + (watcher.expression) + "\"")
                : "in a component render function."
            ),
            watcher.vm
          );
          break
        }
      }
    }

    // keep copies of post queues before resetting state
    var activatedQueue = activatedChildren.slice();
    var updatedQueue = queue.slice();

    resetSchedulerState();

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue);
    callUpdatedHooks(updatedQueue);

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
      devtools.emit('flush');
    }
  }

  function callUpdatedHooks (queue) {
    var i = queue.length;
    while (i--) {
      var watcher = queue[i];
      var vm = watcher.vm;
      if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'updated');
      }
    }
  }

  /**
   * Queue a kept-alive component that was activated during patch.
   * The queue will be processed after the entire tree has been patched.
   */
  function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false;
    activatedChildren.push(vm);
  }

  function callActivatedHooks (queue) {
    for (var i = 0; i < queue.length; i++) {
      queue[i]._inactive = true;
      activateChildComponent(queue[i], true /* true */);
    }
  }

  /**
   * Push a watcher into the watcher queue.
   * Jobs with duplicate IDs will be skipped unless it's
   * pushed when the queue is being flushed.
   */
  function queueWatcher (watcher) {
    var id = watcher.id;
    if (has[id] == null) {
      has[id] = true;
      if (!flushing) {
        queue.push(watcher);
      } else {
        // if already flushing, splice the watcher based on its id
        // if already past its id, it will be run next immediately.
        var i = queue.length - 1;
        while (i > index && queue[i].id > watcher.id) {
          i--;
        }
        queue.splice(i + 1, 0, watcher);
      }
      // queue the flush
      if (!waiting) {
        waiting = true;

        if (!config.async) {
          flushSchedulerQueue();
          return
        }
        nextTick(flushSchedulerQueue);
      }
    }
  }

  /*  */



  var uid$2 = 0;

  /**
   * A watcher parses an expression, collects dependencies,
   * and fires callback when the expression value changes.
   * This is used for both the $watch() api and directives.
   */
  var Watcher = function Watcher (
    vm,
    expOrFn,
    cb,
    options,
    isRenderWatcher
  ) {
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid$2; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    this.expression = expOrFn.toString();
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
        warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get();
  };

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  Watcher.prototype.get = function get () {
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value);
      }
      popTarget();
      this.cleanupDeps();
    }
    return value
  };

  /**
   * Add a dependency to this directive.
   */
  Watcher.prototype.addDep = function addDep (dep) {
    var id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  };

  /**
   * Clean up for dependency collection.
   */
  Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var i = this.deps.length;
    while (i--) {
      var dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    var tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  Watcher.prototype.update = function update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true;
    } else if (this.sync) {
      this.run();
    } else {
      queueWatcher(this);
    }
  };

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  Watcher.prototype.run = function run () {
    if (this.active) {
      var value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        var oldValue = this.value;
        this.value = value;
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue);
          } catch (e) {
            handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
          }
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  };

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  Watcher.prototype.evaluate = function evaluate () {
    this.value = this.get();
    this.dirty = false;
  };

  /**
   * Depend on all deps collected by this watcher.
   */
  Watcher.prototype.depend = function depend () {
    var i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  };

  /**
   * Remove self from all dependencies' subscriber list.
   */
  Watcher.prototype.teardown = function teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      var i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  };

  /*  */

  var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
  };

  function proxy (target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter () {
      return this[sourceKey][key]
    };
    sharedPropertyDefinition.set = function proxySetter (val) {
      this[sourceKey][key] = val;
    };
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  function initState (vm) {
    vm._watchers = [];
    var opts = vm.$options;
    if (opts.props) { initProps(vm, opts.props); }
    if (opts.methods) { initMethods(vm, opts.methods); }
    if (opts.data) {
      initData(vm);
    } else {
      observe(vm._data = {}, true /* asRootData */);
    }
    if (opts.computed) { initComputed(vm, opts.computed); }
    if (opts.watch && opts.watch !== nativeWatch) {
      initWatch(vm, opts.watch);
    }
  }

  function initProps (vm, propsOptions) {
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    var keys = vm.$options._propKeys = [];
    var isRoot = !vm.$parent;
    // root instance props should be converted
    if (!isRoot) {
      toggleObserving(false);
    }
    var loop = function ( key ) {
      keys.push(key);
      var value = validateProp(key, propsOptions, propsData, vm);
      /* istanbul ignore else */
      {
        var hyphenatedKey = hyphenate(key);
        if (isReservedAttribute(hyphenatedKey) ||
            config.isReservedAttr(hyphenatedKey)) {
          warn(
            ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
            vm
          );
        }
        defineReactive$$1(props, key, value, function () {
          if (!isRoot && !isUpdatingChildComponent) {
            warn(
              "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              "value. Prop being mutated: \"" + key + "\"",
              vm
            );
          }
        });
      }
      // static props are already proxied on the component's prototype
      // during Vue.extend(). We only need to proxy props defined at
      // instantiation here.
      if (!(key in vm)) {
        proxy(vm, "_props", key);
      }
    };

    for (var key in propsOptions) loop( key );
    toggleObserving(true);
  }

  function initData (vm) {
    var data = vm.$options.data;
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {};
    if (!isPlainObject(data)) {
      data = {};
      warn(
        'data functions should return an object:\n' +
        'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
    }
    // proxy data on instance
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      {
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      if (props && hasOwn(props, key)) {
        warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
      } else if (!isReserved(key)) {
        proxy(vm, "_data", key);
      }
    }
    // observe data
    observe(data, true /* asRootData */);
  }

  function getData (data, vm) {
    // #7573 disable dep collection when invoking data getters
    pushTarget();
    try {
      return data.call(vm, vm)
    } catch (e) {
      handleError(e, vm, "data()");
      return {}
    } finally {
      popTarget();
    }
  }

  var computedWatcherOptions = { lazy: true };

  function initComputed (vm, computed) {
    // $flow-disable-line
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    var isSSR = isServerRendering();

    for (var key in computed) {
      var userDef = computed[key];
      var getter = typeof userDef === 'function' ? userDef : userDef.get;
      if (getter == null) {
        warn(
          ("Getter is missing for computed property \"" + key + "\"."),
          vm
        );
      }

      if (!isSSR) {
        // create internal watcher for the computed property.
        watchers[key] = new Watcher(
          vm,
          getter || noop,
          noop,
          computedWatcherOptions
        );
      }

      // component-defined computed properties are already defined on the
      // component prototype. We only need to define computed properties defined
      // at instantiation here.
      if (!(key in vm)) {
        defineComputed(vm, key, userDef);
      } else {
        if (key in vm.$data) {
          warn(("The computed property \"" + key + "\" is already defined in data."), vm);
        } else if (vm.$options.props && key in vm.$options.props) {
          warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
        }
      }
    }
  }

  function defineComputed (
    target,
    key,
    userDef
  ) {
    var shouldCache = !isServerRendering();
    if (typeof userDef === 'function') {
      sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key)
        : createGetterInvoker(userDef);
      sharedPropertyDefinition.set = noop;
    } else {
      sharedPropertyDefinition.get = userDef.get
        ? shouldCache && userDef.cache !== false
          ? createComputedGetter(key)
          : createGetterInvoker(userDef.get)
        : noop;
      sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (sharedPropertyDefinition.set === noop) {
      sharedPropertyDefinition.set = function () {
        warn(
          ("Computed property \"" + key + "\" was assigned to but it has no setter."),
          this
        );
      };
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  function createComputedGetter (key) {
    return function computedGetter () {
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate();
        }
        if (Dep.target) {
          watcher.depend();
        }
        return watcher.value
      }
    }
  }

  function createGetterInvoker(fn) {
    return function computedGetter () {
      return fn.call(this, this)
    }
  }

  function initMethods (vm, methods) {
    var props = vm.$options.props;
    for (var key in methods) {
      {
        if (typeof methods[key] !== 'function') {
          warn(
            "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
            "Did you reference the function correctly?",
            vm
          );
        }
        if (props && hasOwn(props, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a prop."),
            vm
          );
        }
        if ((key in vm) && isReserved(key)) {
          warn(
            "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
            "Avoid defining component methods that start with _ or $."
          );
        }
      }
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
  }

  function initWatch (vm, watch) {
    for (var key in watch) {
      var handler = watch[key];
      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  function createWatcher (
    vm,
    expOrFn,
    handler,
    options
  ) {
    if (isPlainObject(handler)) {
      options = handler;
      handler = handler.handler;
    }
    if (typeof handler === 'string') {
      handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options)
  }

  function stateMixin (Vue) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    var dataDef = {};
    dataDef.get = function () { return this._data };
    var propsDef = {};
    propsDef.get = function () { return this._props };
    {
      dataDef.set = function () {
        warn(
          'Avoid replacing instance root $data. ' +
          'Use nested data properties instead.',
          this
        );
      };
      propsDef.set = function () {
        warn("$props is readonly.", this);
      };
    }
    Object.defineProperty(Vue.prototype, '$data', dataDef);
    Object.defineProperty(Vue.prototype, '$props', propsDef);

    Vue.prototype.$set = set;
    Vue.prototype.$delete = del;

    Vue.prototype.$watch = function (
      expOrFn,
      cb,
      options
    ) {
      var vm = this;
      if (isPlainObject(cb)) {
        return createWatcher(vm, expOrFn, cb, options)
      }
      options = options || {};
      options.user = true;
      var watcher = new Watcher(vm, expOrFn, cb, options);
      if (options.immediate) {
        try {
          cb.call(vm, watcher.value);
        } catch (error) {
          handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
        }
      }
      return function unwatchFn () {
        watcher.teardown();
      }
    };
  }

  /*  */

  var uid$3 = 0;

  function initMixin (Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
      // a uid
      vm._uid = uid$3++;

      var startTag, endTag;
      /* istanbul ignore if */
      if (config.performance && mark) {
        startTag = "vue-perf-start:" + (vm._uid);
        endTag = "vue-perf-end:" + (vm._uid);
        mark(startTag);
      }

      // a flag to avoid this being observed
      vm._isVue = true;
      // merge options
      if (options && options._isComponent) {
        // optimize internal component instantiation
        // since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        initInternalComponent(vm, options);
      } else {
        vm.$options = mergeOptions(
          resolveConstructorOptions(vm.constructor),
          options || {},
          vm
        );
      }
      /* istanbul ignore else */
      {
        initProxy(vm);
      }
      // expose real self
      vm._self = vm;
      initLifecycle(vm);
      initEvents(vm);
      initRender(vm);
      callHook(vm, 'beforeCreate');
      initInjections(vm); // resolve injections before data/props
      initState(vm);
      initProvide(vm); // resolve provide after data/props
      callHook(vm, 'created');

      /* istanbul ignore if */
      if (config.performance && mark) {
        vm._name = formatComponentName(vm, false);
        mark(endTag);
        measure(("vue " + (vm._name) + " init"), startTag, endTag);
      }

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
  }

  function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    // doing this because it's faster than dynamic enumeration.
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
  }

  function resolveConstructorOptions (Ctor) {
    var options = Ctor.options;
    if (Ctor.super) {
      var superOptions = resolveConstructorOptions(Ctor.super);
      var cachedSuperOptions = Ctor.superOptions;
      if (superOptions !== cachedSuperOptions) {
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions;
        // check if there are any late-modified/attached options (#4976)
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        if (modifiedOptions) {
          extend(Ctor.extendOptions, modifiedOptions);
        }
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }

  function resolveModifiedOptions (Ctor) {
    var modified;
    var latest = Ctor.options;
    var sealed = Ctor.sealedOptions;
    for (var key in latest) {
      if (latest[key] !== sealed[key]) {
        if (!modified) { modified = {}; }
        modified[key] = latest[key];
      }
    }
    return modified
  }

  function Vue (options) {
    if (!(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }

  initMixin(Vue);
  stateMixin(Vue);
  eventsMixin(Vue);
  lifecycleMixin(Vue);
  renderMixin(Vue);

  /*  */

  function initUse (Vue) {
    Vue.use = function (plugin) {
      var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
      if (installedPlugins.indexOf(plugin) > -1) {
        return this
      }

      // additional parameters
      var args = toArray(arguments, 1);
      args.unshift(this);
      if (typeof plugin.install === 'function') {
        plugin.install.apply(plugin, args);
      } else if (typeof plugin === 'function') {
        plugin.apply(null, args);
      }
      installedPlugins.push(plugin);
      return this
    };
  }

  /*  */

  function initMixin$1 (Vue) {
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this
    };
  }

  /*  */

  function initExtend (Vue) {
    /**
     * Each instance constructor, including Vue, has a unique
     * cid. This enables us to create wrapped "child
     * constructors" for prototypal inheritance and cache them.
     */
    Vue.cid = 0;
    var cid = 1;

    /**
     * Class inheritance
     */
    Vue.extend = function (extendOptions) {
      extendOptions = extendOptions || {};
      var Super = this;
      var SuperId = Super.cid;
      var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
      if (cachedCtors[SuperId]) {
        return cachedCtors[SuperId]
      }

      var name = extendOptions.name || Super.options.name;
      if (name) {
        validateComponentName(name);
      }

      var Sub = function VueComponent (options) {
        this._init(options);
      };
      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
      Sub.cid = cid++;
      Sub.options = mergeOptions(
        Super.options,
        extendOptions
      );
      Sub['super'] = Super;

      // For props and computed properties, we define the proxy getters on
      // the Vue instances at extension time, on the extended prototype. This
      // avoids Object.defineProperty calls for each instance created.
      if (Sub.options.props) {
        initProps$1(Sub);
      }
      if (Sub.options.computed) {
        initComputed$1(Sub);
      }

      // allow further extension/mixin/plugin usage
      Sub.extend = Super.extend;
      Sub.mixin = Super.mixin;
      Sub.use = Super.use;

      // create asset registers, so extended classes
      // can have their private assets too.
      ASSET_TYPES.forEach(function (type) {
        Sub[type] = Super[type];
      });
      // enable recursive self-lookup
      if (name) {
        Sub.options.components[name] = Sub;
      }

      // keep a reference to the super options at extension time.
      // later at instantiation we can check if Super's options have
      // been updated.
      Sub.superOptions = Super.options;
      Sub.extendOptions = extendOptions;
      Sub.sealedOptions = extend({}, Sub.options);

      // cache constructor
      cachedCtors[SuperId] = Sub;
      return Sub
    };
  }

  function initProps$1 (Comp) {
    var props = Comp.options.props;
    for (var key in props) {
      proxy(Comp.prototype, "_props", key);
    }
  }

  function initComputed$1 (Comp) {
    var computed = Comp.options.computed;
    for (var key in computed) {
      defineComputed(Comp.prototype, key, computed[key]);
    }
  }

  /*  */

  function initAssetRegisters (Vue) {
    /**
     * Create asset registration methods.
     */
    ASSET_TYPES.forEach(function (type) {
      Vue[type] = function (
        id,
        definition
      ) {
        if (!definition) {
          return this.options[type + 's'][id]
        } else {
          /* istanbul ignore if */
          if (type === 'component') {
            validateComponentName(id);
          }
          if (type === 'component' && isPlainObject(definition)) {
            definition.name = definition.name || id;
            definition = this.options._base.extend(definition);
          }
          if (type === 'directive' && typeof definition === 'function') {
            definition = { bind: definition, update: definition };
          }
          this.options[type + 's'][id] = definition;
          return definition
        }
      };
    });
  }

  /*  */



  function getComponentName (opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
  }

  function matches (pattern, name) {
    if (Array.isArray(pattern)) {
      return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
      return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
      return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
  }

  function pruneCache (keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache;
    var keys = keepAliveInstance.keys;
    var _vnode = keepAliveInstance._vnode;
    for (var key in cache) {
      var cachedNode = cache[key];
      if (cachedNode) {
        var name = getComponentName(cachedNode.componentOptions);
        if (name && !filter(name)) {
          pruneCacheEntry(cache, key, keys, _vnode);
        }
      }
    }
  }

  function pruneCacheEntry (
    cache,
    key,
    keys,
    current
  ) {
    var cached$$1 = cache[key];
    if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
      cached$$1.componentInstance.$destroy();
    }
    cache[key] = null;
    remove(keys, key);
  }

  var patternTypes = [String, RegExp, Array];

  var KeepAlive = {
    name: 'keep-alive',
    abstract: true,

    props: {
      include: patternTypes,
      exclude: patternTypes,
      max: [String, Number]
    },

    created: function created () {
      this.cache = Object.create(null);
      this.keys = [];
    },

    destroyed: function destroyed () {
      for (var key in this.cache) {
        pruneCacheEntry(this.cache, key, this.keys);
      }
    },

    mounted: function mounted () {
      var this$1 = this;

      this.$watch('include', function (val) {
        pruneCache(this$1, function (name) { return matches(val, name); });
      });
      this.$watch('exclude', function (val) {
        pruneCache(this$1, function (name) { return !matches(val, name); });
      });
    },

    render: function render () {
      var slot = this.$slots.default;
      var vnode = getFirstComponentChild(slot);
      var componentOptions = vnode && vnode.componentOptions;
      if (componentOptions) {
        // check pattern
        var name = getComponentName(componentOptions);
        var ref = this;
        var include = ref.include;
        var exclude = ref.exclude;
        if (
          // not included
          (include && (!name || !matches(include, name))) ||
          // excluded
          (exclude && name && matches(exclude, name))
        ) {
          return vnode
        }

        var ref$1 = this;
        var cache = ref$1.cache;
        var keys = ref$1.keys;
        var key = vnode.key == null
          // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
          : vnode.key;
        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance;
          // make current key freshest
          remove(keys, key);
          keys.push(key);
        } else {
          cache[key] = vnode;
          keys.push(key);
          // prune oldest entry
          if (this.max && keys.length > parseInt(this.max)) {
            pruneCacheEntry(cache, keys[0], keys, this._vnode);
          }
        }

        vnode.data.keepAlive = true;
      }
      return vnode || (slot && slot[0])
    }
  };

  var builtInComponents = {
    KeepAlive: KeepAlive
  };

  /*  */

  function initGlobalAPI (Vue) {
    // config
    var configDef = {};
    configDef.get = function () { return config; };
    {
      configDef.set = function () {
        warn(
          'Do not replace the Vue.config object, set individual fields instead.'
        );
      };
    }
    Object.defineProperty(Vue, 'config', configDef);

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    Vue.util = {
      warn: warn,
      extend: extend,
      mergeOptions: mergeOptions,
      defineReactive: defineReactive$$1
    };

    Vue.set = set;
    Vue.delete = del;
    Vue.nextTick = nextTick;

    // 2.6 explicit observable API
    Vue.observable = function (obj) {
      observe(obj);
      return obj
    };

    Vue.options = Object.create(null);
    ASSET_TYPES.forEach(function (type) {
      Vue.options[type + 's'] = Object.create(null);
    });

    // this is used to identify the "base" constructor to extend all plain-object
    // components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue;

    extend(Vue.options.components, builtInComponents);

    initUse(Vue);
    initMixin$1(Vue);
    initExtend(Vue);
    initAssetRegisters(Vue);
  }

  initGlobalAPI(Vue);

  Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
  });

  Object.defineProperty(Vue.prototype, '$ssrContext', {
    get: function get () {
      /* istanbul ignore next */
      return this.$vnode && this.$vnode.ssrContext
    }
  });

  // expose FunctionalRenderContext for ssr runtime helper installation
  Object.defineProperty(Vue, 'FunctionalRenderContext', {
    value: FunctionalRenderContext
  });

  Vue.version = '2.6.12';

  /*  */

  // these are reserved for web because they are directly compiled away
  // during template compilation
  var isReservedAttr = makeMap('style,class');

  // attributes that should be using props for binding
  var acceptValue = makeMap('input,textarea,option,select,progress');
  var mustUseProp = function (tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  };

  var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

  var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

  var convertEnumeratedValue = function (key, value) {
    return isFalsyAttrValue(value) || value === 'false'
      ? 'false'
      // allow arbitrary string value for contenteditable
      : key === 'contenteditable' && isValidContentEditableValue(value)
        ? value
        : 'true'
  };

  var isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,translate,' +
    'truespeed,typemustmatch,visible'
  );

  var xlinkNS = 'http://www.w3.org/1999/xlink';

  var isXlink = function (name) {
    return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
  };

  var getXlinkProp = function (name) {
    return isXlink(name) ? name.slice(6, name.length) : ''
  };

  var isFalsyAttrValue = function (val) {
    return val == null || val === false
  };

  /*  */

  function genClassForVnode (vnode) {
    var data = vnode.data;
    var parentNode = vnode;
    var childNode = vnode;
    while (isDef(childNode.componentInstance)) {
      childNode = childNode.componentInstance._vnode;
      if (childNode && childNode.data) {
        data = mergeClassData(childNode.data, data);
      }
    }
    while (isDef(parentNode = parentNode.parent)) {
      if (parentNode && parentNode.data) {
        data = mergeClassData(data, parentNode.data);
      }
    }
    return renderClass(data.staticClass, data.class)
  }

  function mergeClassData (child, parent) {
    return {
      staticClass: concat(child.staticClass, parent.staticClass),
      class: isDef(child.class)
        ? [child.class, parent.class]
        : parent.class
    }
  }

  function renderClass (
    staticClass,
    dynamicClass
  ) {
    if (isDef(staticClass) || isDef(dynamicClass)) {
      return concat(staticClass, stringifyClass(dynamicClass))
    }
    /* istanbul ignore next */
    return ''
  }

  function concat (a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
  }

  function stringifyClass (value) {
    if (Array.isArray(value)) {
      return stringifyArray(value)
    }
    if (isObject(value)) {
      return stringifyObject(value)
    }
    if (typeof value === 'string') {
      return value
    }
    /* istanbul ignore next */
    return ''
  }

  function stringifyArray (value) {
    var res = '';
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
        if (res) { res += ' '; }
        res += stringified;
      }
    }
    return res
  }

  function stringifyObject (value) {
    var res = '';
    for (var key in value) {
      if (value[key]) {
        if (res) { res += ' '; }
        res += key;
      }
    }
    return res
  }

  /*  */

  var namespaceMap = {
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
  };

  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
  );

  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  );

  var isPreTag = function (tag) { return tag === 'pre'; };

  var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag)
  };

  function getTagNamespace (tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
  }

  var unknownElementCache = Object.create(null);
  function isUnknownElement (tag) {
    /* istanbul ignore if */
    if (!inBrowser) {
      return true
    }
    if (isReservedTag(tag)) {
      return false
    }
    tag = tag.toLowerCase();
    /* istanbul ignore if */
    if (unknownElementCache[tag] != null) {
      return unknownElementCache[tag]
    }
    var el = document.createElement(tag);
    if (tag.indexOf('-') > -1) {
      // http://stackoverflow.com/a/28210364/1070244
      return (unknownElementCache[tag] = (
        el.constructor === window.HTMLUnknownElement ||
        el.constructor === window.HTMLElement
      ))
    } else {
      return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
    }
  }

  var isTextInputType = makeMap('text,number,password,search,email,tel,url');

  /*  */

  /**
   * Query an element selector if it's not an element already.
   */
  function query (el) {
    if (typeof el === 'string') {
      var selected = document.querySelector(el);
      if (!selected) {
        warn(
          'Cannot find element: ' + el
        );
        return document.createElement('div')
      }
      return selected
    } else {
      return el
    }
  }

  /*  */

  function createElement$1 (tagName, vnode) {
    var elm = document.createElement(tagName);
    if (tagName !== 'select') {
      return elm
    }
    // false or null will remove the attribute but undefined will not
    if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
      elm.setAttribute('multiple', 'multiple');
    }
    return elm
  }

  function createElementNS (namespace, tagName) {
    return document.createElementNS(namespaceMap[namespace], tagName)
  }

  function createTextNode (text) {
    return document.createTextNode(text)
  }

  function createComment (text) {
    return document.createComment(text)
  }

  function insertBefore (parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  function removeChild (node, child) {
    node.removeChild(child);
  }

  function appendChild (node, child) {
    node.appendChild(child);
  }

  function parentNode (node) {
    return node.parentNode
  }

  function nextSibling (node) {
    return node.nextSibling
  }

  function tagName (node) {
    return node.tagName
  }

  function setTextContent (node, text) {
    node.textContent = text;
  }

  function setStyleScope (node, scopeId) {
    node.setAttribute(scopeId, '');
  }

  var nodeOps = /*#__PURE__*/Object.freeze({
    createElement: createElement$1,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    setStyleScope: setStyleScope
  });

  /*  */

  var ref = {
    create: function create (_, vnode) {
      registerRef(vnode);
    },
    update: function update (oldVnode, vnode) {
      if (oldVnode.data.ref !== vnode.data.ref) {
        registerRef(oldVnode, true);
        registerRef(vnode);
      }
    },
    destroy: function destroy (vnode) {
      registerRef(vnode, true);
    }
  };

  function registerRef (vnode, isRemoval) {
    var key = vnode.data.ref;
    if (!isDef(key)) { return }

    var vm = vnode.context;
    var ref = vnode.componentInstance || vnode.elm;
    var refs = vm.$refs;
    if (isRemoval) {
      if (Array.isArray(refs[key])) {
        remove(refs[key], ref);
      } else if (refs[key] === ref) {
        refs[key] = undefined;
      }
    } else {
      if (vnode.data.refInFor) {
        if (!Array.isArray(refs[key])) {
          refs[key] = [ref];
        } else if (refs[key].indexOf(ref) < 0) {
          // $flow-disable-line
          refs[key].push(ref);
        }
      } else {
        refs[key] = ref;
      }
    }
  }

  /**
   * Virtual DOM patching algorithm based on Snabbdom by
   * Simon Friis Vindum (@paldepind)
   * Licensed under the MIT License
   * https://github.com/paldepind/snabbdom/blob/master/LICENSE
   *
   * modified by Evan You (@yyx990803)
   *
   * Not type-checking this because this file is perf-critical and the cost
   * of making flow understand it is not worth it.
   */

  var emptyNode = new VNode('', {}, []);

  var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

  function sameVnode (a, b) {
    return (
      a.key === b.key && (
        (
          a.tag === b.tag &&
          a.isComment === b.isComment &&
          isDef(a.data) === isDef(b.data) &&
          sameInputType(a, b)
        ) || (
          isTrue(a.isAsyncPlaceholder) &&
          a.asyncFactory === b.asyncFactory &&
          isUndef(b.asyncFactory.error)
        )
      )
    )
  }

  function sameInputType (a, b) {
    if (a.tag !== 'input') { return true }
    var i;
    var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
    var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
  }

  function createKeyToOldIdx (children, beginIdx, endIdx) {
    var i, key;
    var map = {};
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key;
      if (isDef(key)) { map[key] = i; }
    }
    return map
  }

  function createPatchFunction (backend) {
    var i, j;
    var cbs = {};

    var modules = backend.modules;
    var nodeOps = backend.nodeOps;

    for (i = 0; i < hooks.length; ++i) {
      cbs[hooks[i]] = [];
      for (j = 0; j < modules.length; ++j) {
        if (isDef(modules[j][hooks[i]])) {
          cbs[hooks[i]].push(modules[j][hooks[i]]);
        }
      }
    }

    function emptyNodeAt (elm) {
      return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb (childElm, listeners) {
      function remove$$1 () {
        if (--remove$$1.listeners === 0) {
          removeNode(childElm);
        }
      }
      remove$$1.listeners = listeners;
      return remove$$1
    }

    function removeNode (el) {
      var parent = nodeOps.parentNode(el);
      // element may have already been removed due to v-html / v-text
      if (isDef(parent)) {
        nodeOps.removeChild(parent, el);
      }
    }

    function isUnknownElement$$1 (vnode, inVPre) {
      return (
        !inVPre &&
        !vnode.ns &&
        !(
          config.ignoredElements.length &&
          config.ignoredElements.some(function (ignore) {
            return isRegExp(ignore)
              ? ignore.test(vnode.tag)
              : ignore === vnode.tag
          })
        ) &&
        config.isUnknownElement(vnode.tag)
      )
    }

    var creatingElmInVPre = 0;

    function createElm (
      vnode,
      insertedVnodeQueue,
      parentElm,
      refElm,
      nested,
      ownerArray,
      index
    ) {
      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      vnode.isRootInsert = !nested; // for transition enter check
      if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
        return
      }

      var data = vnode.data;
      var children = vnode.children;
      var tag = vnode.tag;
      if (isDef(tag)) {
        {
          if (data && data.pre) {
            creatingElmInVPre++;
          }
          if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            );
          }
        }

        vnode.elm = vnode.ns
          ? nodeOps.createElementNS(vnode.ns, tag)
          : nodeOps.createElement(tag, vnode);
        setScope(vnode);

        /* istanbul ignore if */
        {
          createChildren(vnode, children, insertedVnodeQueue);
          if (isDef(data)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          insert(parentElm, vnode.elm, refElm);
        }

        if (data && data.pre) {
          creatingElmInVPre--;
        }
      } else if (isTrue(vnode.isComment)) {
        vnode.elm = nodeOps.createComment(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      } else {
        vnode.elm = nodeOps.createTextNode(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      }
    }

    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i = vnode.data;
      if (isDef(i)) {
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        if (isDef(i = i.hook) && isDef(i = i.init)) {
          i(vnode, false /* hydrating */);
        }
        // after calling the init hook, if the vnode is a child component
        // it should've created a child instance and mounted it. the child
        // component also has set the placeholder vnode's elm.
        // in that case we can just return the element and be done.
        if (isDef(vnode.componentInstance)) {
          initComponent(vnode, insertedVnodeQueue);
          insert(parentElm, vnode.elm, refElm);
          if (isTrue(isReactivated)) {
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
          }
          return true
        }
      }
    }

    function initComponent (vnode, insertedVnodeQueue) {
      if (isDef(vnode.data.pendingInsert)) {
        insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
        vnode.data.pendingInsert = null;
      }
      vnode.elm = vnode.componentInstance.$el;
      if (isPatchable(vnode)) {
        invokeCreateHooks(vnode, insertedVnodeQueue);
        setScope(vnode);
      } else {
        // empty component root.
        // skip all element-related modules except for ref (#3455)
        registerRef(vnode);
        // make sure to invoke the insert hook
        insertedVnodeQueue.push(vnode);
      }
    }

    function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i;
      // hack for #4339: a reactivated component with inner transition
      // does not trigger because the inner node's created hooks are not called
      // again. It's not ideal to involve module-specific logic in here but
      // there doesn't seem to be a better way to do it.
      var innerNode = vnode;
      while (innerNode.componentInstance) {
        innerNode = innerNode.componentInstance._vnode;
        if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
          for (i = 0; i < cbs.activate.length; ++i) {
            cbs.activate[i](emptyNode, innerNode);
          }
          insertedVnodeQueue.push(innerNode);
          break
        }
      }
      // unlike a newly created component,
      // a reactivated keep-alive component doesn't insert itself
      insert(parentElm, vnode.elm, refElm);
    }

    function insert (parent, elm, ref$$1) {
      if (isDef(parent)) {
        if (isDef(ref$$1)) {
          if (nodeOps.parentNode(ref$$1) === parent) {
            nodeOps.insertBefore(parent, elm, ref$$1);
          }
        } else {
          nodeOps.appendChild(parent, elm);
        }
      }
    }

    function createChildren (vnode, children, insertedVnodeQueue) {
      if (Array.isArray(children)) {
        {
          checkDuplicateKeys(children);
        }
        for (var i = 0; i < children.length; ++i) {
          createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
        }
      } else if (isPrimitive(vnode.text)) {
        nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
      }
    }

    function isPatchable (vnode) {
      while (vnode.componentInstance) {
        vnode = vnode.componentInstance._vnode;
      }
      return isDef(vnode.tag)
    }

    function invokeCreateHooks (vnode, insertedVnodeQueue) {
      for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
        cbs.create[i$1](emptyNode, vnode);
      }
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (isDef(i.create)) { i.create(emptyNode, vnode); }
        if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
      }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope (vnode) {
      var i;
      if (isDef(i = vnode.fnScopeId)) {
        nodeOps.setStyleScope(vnode.elm, i);
      } else {
        var ancestor = vnode;
        while (ancestor) {
          if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
            nodeOps.setStyleScope(vnode.elm, i);
          }
          ancestor = ancestor.parent;
        }
      }
      // for slot content they should also get the scopeId from the host instance.
      if (isDef(i = activeInstance) &&
        i !== vnode.context &&
        i !== vnode.fnContext &&
        isDef(i = i.$options._scopeId)
      ) {
        nodeOps.setStyleScope(vnode.elm, i);
      }
    }

    function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
      for (; startIdx <= endIdx; ++startIdx) {
        createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
      }
    }

    function invokeDestroyHook (vnode) {
      var i, j;
      var data = vnode.data;
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
        for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
      }
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }

    function removeVnodes (vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        var ch = vnodes[startIdx];
        if (isDef(ch)) {
          if (isDef(ch.tag)) {
            removeAndInvokeRemoveHook(ch);
            invokeDestroyHook(ch);
          } else { // Text node
            removeNode(ch.elm);
          }
        }
      }
    }

    function removeAndInvokeRemoveHook (vnode, rm) {
      if (isDef(rm) || isDef(vnode.data)) {
        var i;
        var listeners = cbs.remove.length + 1;
        if (isDef(rm)) {
          // we have a recursively passed down rm callback
          // increase the listeners count
          rm.listeners += listeners;
        } else {
          // directly removing
          rm = createRmCb(vnode.elm, listeners);
        }
        // recursively invoke hooks on child component root node
        if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
          removeAndInvokeRemoveHook(i, rm);
        }
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](vnode, rm);
        }
        if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
          i(vnode, rm);
        } else {
          rm();
        }
      } else {
        removeNode(vnode.elm);
      }
    }

    function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
      var oldStartIdx = 0;
      var newStartIdx = 0;
      var oldEndIdx = oldCh.length - 1;
      var oldStartVnode = oldCh[0];
      var oldEndVnode = oldCh[oldEndIdx];
      var newEndIdx = newCh.length - 1;
      var newStartVnode = newCh[0];
      var newEndVnode = newCh[newEndIdx];
      var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

      // removeOnly is a special flag used only by <transition-group>
      // to ensure removed elements stay in correct relative positions
      // during leaving transitions
      var canMove = !removeOnly;

      {
        checkDuplicateKeys(newCh);
      }

      while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
          patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
          patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {
          if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
          idxInOld = isDef(newStartVnode.key)
            ? oldKeyToIdx[newStartVnode.key]
            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
          if (isUndef(idxInOld)) { // New element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          } else {
            vnodeToMove = oldCh[idxInOld];
            if (sameVnode(vnodeToMove, newStartVnode)) {
              patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
              oldCh[idxInOld] = undefined;
              canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
            } else {
              // same key but different element. treat as new element
              createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            }
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
      if (oldStartIdx > oldEndIdx) {
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else if (newStartIdx > newEndIdx) {
        removeVnodes(oldCh, oldStartIdx, oldEndIdx);
      }
    }

    function checkDuplicateKeys (children) {
      var seenKeys = {};
      for (var i = 0; i < children.length; i++) {
        var vnode = children[i];
        var key = vnode.key;
        if (isDef(key)) {
          if (seenKeys[key]) {
            warn(
              ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
              vnode.context
            );
          } else {
            seenKeys[key] = true;
          }
        }
      }
    }

    function findIdxInOld (node, oldCh, start, end) {
      for (var i = start; i < end; i++) {
        var c = oldCh[i];
        if (isDef(c) && sameVnode(node, c)) { return i }
      }
    }

    function patchVnode (
      oldVnode,
      vnode,
      insertedVnodeQueue,
      ownerArray,
      index,
      removeOnly
    ) {
      if (oldVnode === vnode) {
        return
      }

      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // clone reused vnode
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      var elm = vnode.elm = oldVnode.elm;

      if (isTrue(oldVnode.isAsyncPlaceholder)) {
        if (isDef(vnode.asyncFactory.resolved)) {
          hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
        } else {
          vnode.isAsyncPlaceholder = true;
        }
        return
      }

      // reuse element for static trees.
      // note we only do this if the vnode is cloned -
      // if the new node is not cloned it means the render functions have been
      // reset by the hot-reload-api and we need to do a proper re-render.
      if (isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
      ) {
        vnode.componentInstance = oldVnode.componentInstance;
        return
      }

      var i;
      var data = vnode.data;
      if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
        i(oldVnode, vnode);
      }

      var oldCh = oldVnode.children;
      var ch = vnode.children;
      if (isDef(data) && isPatchable(vnode)) {
        for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
        if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
      }
      if (isUndef(vnode.text)) {
        if (isDef(oldCh) && isDef(ch)) {
          if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
        } else if (isDef(ch)) {
          {
            checkDuplicateKeys(ch);
          }
          if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
          addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
        } else if (isDef(oldCh)) {
          removeVnodes(oldCh, 0, oldCh.length - 1);
        } else if (isDef(oldVnode.text)) {
          nodeOps.setTextContent(elm, '');
        }
      } else if (oldVnode.text !== vnode.text) {
        nodeOps.setTextContent(elm, vnode.text);
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
      }
    }

    function invokeInsertHook (vnode, queue, initial) {
      // delay insert hooks for component root nodes, invoke them after the
      // element is really inserted
      if (isTrue(initial) && isDef(vnode.parent)) {
        vnode.parent.data.pendingInsert = queue;
      } else {
        for (var i = 0; i < queue.length; ++i) {
          queue[i].data.hook.insert(queue[i]);
        }
      }
    }

    var hydrationBailed = false;
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    // Note: style is excluded because it relies on initial clone for future
    // deep updates (#7063).
    var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
      var i;
      var tag = vnode.tag;
      var data = vnode.data;
      var children = vnode.children;
      inVPre = inVPre || (data && data.pre);
      vnode.elm = elm;

      if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
        vnode.isAsyncPlaceholder = true;
        return true
      }
      // assert node match
      {
        if (!assertNodeMatch(elm, vnode, inVPre)) {
          return false
        }
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
        if (isDef(i = vnode.componentInstance)) {
          // child component. it should have hydrated its own tree.
          initComponent(vnode, insertedVnodeQueue);
          return true
        }
      }
      if (isDef(tag)) {
        if (isDef(children)) {
          // empty element, allow client to pick up and populate children
          if (!elm.hasChildNodes()) {
            createChildren(vnode, children, insertedVnodeQueue);
          } else {
            // v-html and domProps: innerHTML
            if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
              if (i !== elm.innerHTML) {
                /* istanbul ignore if */
                if (typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('server innerHTML: ', i);
                  console.warn('client innerHTML: ', elm.innerHTML);
                }
                return false
              }
            } else {
              // iterate and compare children lists
              var childrenMatch = true;
              var childNode = elm.firstChild;
              for (var i$1 = 0; i$1 < children.length; i$1++) {
                if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                  childrenMatch = false;
                  break
                }
                childNode = childNode.nextSibling;
              }
              // if childNode is not null, it means the actual childNodes list is
              // longer than the virtual children list.
              if (!childrenMatch || childNode) {
                /* istanbul ignore if */
                if (typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
                }
                return false
              }
            }
          }
        }
        if (isDef(data)) {
          var fullInvoke = false;
          for (var key in data) {
            if (!isRenderedModule(key)) {
              fullInvoke = true;
              invokeCreateHooks(vnode, insertedVnodeQueue);
              break
            }
          }
          if (!fullInvoke && data['class']) {
            // ensure collecting deps for deep class bindings for future updates
            traverse(data['class']);
          }
        }
      } else if (elm.data !== vnode.text) {
        elm.data = vnode.text;
      }
      return true
    }

    function assertNodeMatch (node, vnode, inVPre) {
      if (isDef(vnode.tag)) {
        return vnode.tag.indexOf('vue-component') === 0 || (
          !isUnknownElement$$1(vnode, inVPre) &&
          vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
        )
      } else {
        return node.nodeType === (vnode.isComment ? 8 : 3)
      }
    }

    return function patch (oldVnode, vnode, hydrating, removeOnly) {
      if (isUndef(vnode)) {
        if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
        return
      }

      var isInitialPatch = false;
      var insertedVnodeQueue = [];

      if (isUndef(oldVnode)) {
        // empty mount (likely as component), create new root element
        isInitialPatch = true;
        createElm(vnode, insertedVnodeQueue);
      } else {
        var isRealElement = isDef(oldVnode.nodeType);
        if (!isRealElement && sameVnode(oldVnode, vnode)) {
          // patch existing root node
          patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
        } else {
          if (isRealElement) {
            // mounting to a real element
            // check if this is server-rendered content and if we can perform
            // a successful hydration.
            if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
              oldVnode.removeAttribute(SSR_ATTR);
              hydrating = true;
            }
            if (isTrue(hydrating)) {
              if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                invokeInsertHook(vnode, insertedVnodeQueue, true);
                return oldVnode
              } else {
                warn(
                  'The client-side rendered virtual DOM tree is not matching ' +
                  'server-rendered content. This is likely caused by incorrect ' +
                  'HTML markup, for example nesting block-level elements inside ' +
                  '<p>, or missing <tbody>. Bailing hydration and performing ' +
                  'full client-side render.'
                );
              }
            }
            // either not server-rendered, or hydration failed.
            // create an empty node and replace it
            oldVnode = emptyNodeAt(oldVnode);
          }

          // replacing existing element
          var oldElm = oldVnode.elm;
          var parentElm = nodeOps.parentNode(oldElm);

          // create new node
          createElm(
            vnode,
            insertedVnodeQueue,
            // extremely rare edge case: do not insert if old element is in a
            // leaving transition. Only happens when combining transition +
            // keep-alive + HOCs. (#4590)
            oldElm._leaveCb ? null : parentElm,
            nodeOps.nextSibling(oldElm)
          );

          // update parent placeholder node element, recursively
          if (isDef(vnode.parent)) {
            var ancestor = vnode.parent;
            var patchable = isPatchable(vnode);
            while (ancestor) {
              for (var i = 0; i < cbs.destroy.length; ++i) {
                cbs.destroy[i](ancestor);
              }
              ancestor.elm = vnode.elm;
              if (patchable) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                  cbs.create[i$1](emptyNode, ancestor);
                }
                // #6513
                // invoke insert hooks that may have been merged by create hooks.
                // e.g. for directives that uses the "inserted" hook.
                var insert = ancestor.data.hook.insert;
                if (insert.merged) {
                  // start at index 1 to avoid re-invoking component mounted hook
                  for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                    insert.fns[i$2]();
                  }
                }
              } else {
                registerRef(ancestor);
              }
              ancestor = ancestor.parent;
            }
          }

          // destroy old node
          if (isDef(parentElm)) {
            removeVnodes([oldVnode], 0, 0);
          } else if (isDef(oldVnode.tag)) {
            invokeDestroyHook(oldVnode);
          }
        }
      }

      invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
      return vnode.elm
    }
  }

  /*  */

  var directives = {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives (vnode) {
      updateDirectives(vnode, emptyNode);
    }
  };

  function updateDirectives (oldVnode, vnode) {
    if (oldVnode.data.directives || vnode.data.directives) {
      _update(oldVnode, vnode);
    }
  }

  function _update (oldVnode, vnode) {
    var isCreate = oldVnode === emptyNode;
    var isDestroy = vnode === emptyNode;
    var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
    var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

    var dirsWithInsert = [];
    var dirsWithPostpatch = [];

    var key, oldDir, dir;
    for (key in newDirs) {
      oldDir = oldDirs[key];
      dir = newDirs[key];
      if (!oldDir) {
        // new directive, bind
        callHook$1(dir, 'bind', vnode, oldVnode);
        if (dir.def && dir.def.inserted) {
          dirsWithInsert.push(dir);
        }
      } else {
        // existing directive, update
        dir.oldValue = oldDir.value;
        dir.oldArg = oldDir.arg;
        callHook$1(dir, 'update', vnode, oldVnode);
        if (dir.def && dir.def.componentUpdated) {
          dirsWithPostpatch.push(dir);
        }
      }
    }

    if (dirsWithInsert.length) {
      var callInsert = function () {
        for (var i = 0; i < dirsWithInsert.length; i++) {
          callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
        }
      };
      if (isCreate) {
        mergeVNodeHook(vnode, 'insert', callInsert);
      } else {
        callInsert();
      }
    }

    if (dirsWithPostpatch.length) {
      mergeVNodeHook(vnode, 'postpatch', function () {
        for (var i = 0; i < dirsWithPostpatch.length; i++) {
          callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
        }
      });
    }

    if (!isCreate) {
      for (key in oldDirs) {
        if (!newDirs[key]) {
          // no longer present, unbind
          callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
        }
      }
    }
  }

  var emptyModifiers = Object.create(null);

  function normalizeDirectives$1 (
    dirs,
    vm
  ) {
    var res = Object.create(null);
    if (!dirs) {
      // $flow-disable-line
      return res
    }
    var i, dir;
    for (i = 0; i < dirs.length; i++) {
      dir = dirs[i];
      if (!dir.modifiers) {
        // $flow-disable-line
        dir.modifiers = emptyModifiers;
      }
      res[getRawDirName(dir)] = dir;
      dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
    }
    // $flow-disable-line
    return res
  }

  function getRawDirName (dir) {
    return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
  }

  function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
    var fn = dir.def && dir.def[hook];
    if (fn) {
      try {
        fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
      } catch (e) {
        handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
      }
    }
  }

  var baseModules = [
    ref,
    directives
  ];

  /*  */

  function updateAttrs (oldVnode, vnode) {
    var opts = vnode.componentOptions;
    if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
      return
    }
    if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
      return
    }
    var key, cur, old;
    var elm = vnode.elm;
    var oldAttrs = oldVnode.data.attrs || {};
    var attrs = vnode.data.attrs || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(attrs.__ob__)) {
      attrs = vnode.data.attrs = extend({}, attrs);
    }

    for (key in attrs) {
      cur = attrs[key];
      old = oldAttrs[key];
      if (old !== cur) {
        setAttr(elm, key, cur);
      }
    }
    // #4391: in IE9, setting type can reset value for input[type=radio]
    // #6666: IE/Edge forces progress value down to 1 before setting a max
    /* istanbul ignore if */
    if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
      setAttr(elm, 'value', attrs.value);
    }
    for (key in oldAttrs) {
      if (isUndef(attrs[key])) {
        if (isXlink(key)) {
          elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
        } else if (!isEnumeratedAttr(key)) {
          elm.removeAttribute(key);
        }
      }
    }
  }

  function setAttr (el, key, value) {
    if (el.tagName.indexOf('-') > -1) {
      baseSetAttr(el, key, value);
    } else if (isBooleanAttr(key)) {
      // set attribute for blank value
      // e.g. <option disabled>Select one</option>
      if (isFalsyAttrValue(value)) {
        el.removeAttribute(key);
      } else {
        // technically allowfullscreen is a boolean attribute for <iframe>,
        // but Flash expects a value of "true" when used on <embed> tag
        value = key === 'allowfullscreen' && el.tagName === 'EMBED'
          ? 'true'
          : key;
        el.setAttribute(key, value);
      }
    } else if (isEnumeratedAttr(key)) {
      el.setAttribute(key, convertEnumeratedValue(key, value));
    } else if (isXlink(key)) {
      if (isFalsyAttrValue(value)) {
        el.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else {
        el.setAttributeNS(xlinkNS, key, value);
      }
    } else {
      baseSetAttr(el, key, value);
    }
  }

  function baseSetAttr (el, key, value) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // #7138: IE10 & 11 fires input event when setting placeholder on
      // <textarea>... block the first input event and remove the blocker
      // immediately.
      /* istanbul ignore if */
      if (
        isIE && !isIE9 &&
        el.tagName === 'TEXTAREA' &&
        key === 'placeholder' && value !== '' && !el.__ieph
      ) {
        var blocker = function (e) {
          e.stopImmediatePropagation();
          el.removeEventListener('input', blocker);
        };
        el.addEventListener('input', blocker);
        // $flow-disable-line
        el.__ieph = true; /* IE placeholder patched */
      }
      el.setAttribute(key, value);
    }
  }

  var attrs = {
    create: updateAttrs,
    update: updateAttrs
  };

  /*  */

  function updateClass (oldVnode, vnode) {
    var el = vnode.elm;
    var data = vnode.data;
    var oldData = oldVnode.data;
    if (
      isUndef(data.staticClass) &&
      isUndef(data.class) && (
        isUndef(oldData) || (
          isUndef(oldData.staticClass) &&
          isUndef(oldData.class)
        )
      )
    ) {
      return
    }

    var cls = genClassForVnode(vnode);

    // handle transition classes
    var transitionClass = el._transitionClasses;
    if (isDef(transitionClass)) {
      cls = concat(cls, stringifyClass(transitionClass));
    }

    // set the class
    if (cls !== el._prevClass) {
      el.setAttribute('class', cls);
      el._prevClass = cls;
    }
  }

  var klass = {
    create: updateClass,
    update: updateClass
  };

  /*  */

  var validDivisionCharRE = /[\w).+\-_$\]]/;

  function parseFilters (exp) {
    var inSingle = false;
    var inDouble = false;
    var inTemplateString = false;
    var inRegex = false;
    var curly = 0;
    var square = 0;
    var paren = 0;
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters;

    for (i = 0; i < exp.length; i++) {
      prev = c;
      c = exp.charCodeAt(i);
      if (inSingle) {
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) {
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) {
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) {
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        c === 0x7C && // pipe
        exp.charCodeAt(i + 1) !== 0x7C &&
        exp.charCodeAt(i - 1) !== 0x7C &&
        !curly && !square && !paren
      ) {
        if (expression === undefined) {
          // first filter, end of expression
          lastFilterIndex = i + 1;
          expression = exp.slice(0, i).trim();
        } else {
          pushFilter();
        }
      } else {
        switch (c) {
          case 0x22: inDouble = true; break         // "
          case 0x27: inSingle = true; break         // '
          case 0x60: inTemplateString = true; break // `
          case 0x28: paren++; break                 // (
          case 0x29: paren--; break                 // )
          case 0x5B: square++; break                // [
          case 0x5D: square--; break                // ]
          case 0x7B: curly++; break                 // {
          case 0x7D: curly--; break                 // }
        }
        if (c === 0x2f) { // /
          var j = i - 1;
          var p = (void 0);
          // find first non-whitespace prev char
          for (; j >= 0; j--) {
            p = exp.charAt(j);
            if (p !== ' ') { break }
          }
          if (!p || !validDivisionCharRE.test(p)) {
            inRegex = true;
          }
        }
      }
    }

    if (expression === undefined) {
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      pushFilter();
    }

    function pushFilter () {
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }

    if (filters) {
      for (i = 0; i < filters.length; i++) {
        expression = wrapFilter(expression, filters[i]);
      }
    }

    return expression
  }

  function wrapFilter (exp, filter) {
    var i = filter.indexOf('(');
    if (i < 0) {
      // _f: resolveFilter
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      var name = filter.slice(0, i);
      var args = filter.slice(i + 1);
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
  }

  /*  */



  /* eslint-disable no-unused-vars */
  function baseWarn (msg, range) {
    console.error(("[Vue compiler]: " + msg));
  }
  /* eslint-enable no-unused-vars */

  function pluckModuleFunction (
    modules,
    key
  ) {
    return modules
      ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
      : []
  }

  function addProp (el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // add a raw attr (use this in preTransforms)
  function addRawAttr (el, name, value, range) {
    el.attrsMap[name] = value;
    el.attrsList.push(rangeSetItem({ name: name, value: value }, range));
  }

  function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range
  ) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
      name: name,
      rawName: rawName,
      value: value,
      arg: arg,
      isDynamicArg: isDynamicArg,
      modifiers: modifiers
    }, range));
    el.plain = false;
  }

  function prependModifierMarker (symbol, name, dynamic) {
    return dynamic
      ? ("_p(" + name + ",\"" + symbol + "\")")
      : symbol + name // mark the event as captured
  }

  function addHandler (
    el,
    name,
    value,
    modifiers,
    important,
    warn,
    range,
    dynamic
  ) {
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    if (
      warn &&
      modifiers.prevent && modifiers.passive
    ) {
      warn(
        'passive and prevent can\'t be used together. ' +
        'Passive handler can\'t prevent default event.',
        range
      );
    }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    if (modifiers.right) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      } else if (name === 'click') {
        name = 'contextmenu';
        delete modifiers.right;
      }
    } else if (modifiers.middle) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === 'click') {
        name = 'mouseup';
      }
    }

    // check capture modifier
    if (modifiers.capture) {
      delete modifiers.capture;
      name = prependModifierMarker('!', name, dynamic);
    }
    if (modifiers.once) {
      delete modifiers.once;
      name = prependModifierMarker('~', name, dynamic);
    }
    /* istanbul ignore if */
    if (modifiers.passive) {
      delete modifiers.passive;
      name = prependModifierMarker('&', name, dynamic);
    }

    var events;
    if (modifiers.native) {
      delete modifiers.native;
      events = el.nativeEvents || (el.nativeEvents = {});
    } else {
      events = el.events || (el.events = {});
    }

    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    if (modifiers !== emptyObject) {
      newHandler.modifiers = modifiers;
    }

    var handlers = events[name];
    /* istanbul ignore if */
    if (Array.isArray(handlers)) {
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) {
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      events[name] = newHandler;
    }

    el.plain = false;
  }

  function getRawBindingAttr (
    el,
    name
  ) {
    return el.rawAttrsMap[':' + name] ||
      el.rawAttrsMap['v-bind:' + name] ||
      el.rawAttrsMap[name]
  }

  function getBindingAttr (
    el,
    name,
    getStatic
  ) {
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) {
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
  }

  // note: this only removes the attr from the Array (attrsList) so that it
  // doesn't get processed by processAttrs.
  // By default it does NOT remove it from the map (attrsMap) because the map is
  // needed during codegen.
  function getAndRemoveAttr (
    el,
    name,
    removeFromMap
  ) {
    var val;
    if ((val = el.attrsMap[name]) != null) {
      var list = el.attrsList;
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          list.splice(i, 1);
          break
        }
      }
    }
    if (removeFromMap) {
      delete el.attrsMap[name];
    }
    return val
  }

  function getAndRemoveAttrByRegex (
    el,
    name
  ) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      var attr = list[i];
      if (name.test(attr.name)) {
        list.splice(i, 1);
        return attr
      }
    }
  }

  function rangeSetItem (
    item,
    range
  ) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item
  }

  /*  */

  /**
   * Cross-platform code generation for component v-model
   */
  function genComponentModel (
    el,
    value,
    modifiers
  ) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
      valueExpression =
        "(typeof " + baseValueExpression + " === 'string'" +
        "? " + baseValueExpression + ".trim()" +
        ": " + baseValueExpression + ")";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
      value: ("(" + value + ")"),
      expression: JSON.stringify(value),
      callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
  }

  /**
   * Cross-platform codegen helper for generating v-model value assignment code.
   */
  function genAssignmentCode (
    value,
    assignment
  ) {
    var res = parseModel(value);
    if (res.key === null) {
      return (value + "=" + assignment)
    } else {
      return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
  }

  /**
   * Parse a v-model expression into a base path and a final key segment.
   * Handles both dot-path and possible square brackets.
   *
   * Possible cases:
   *
   * - test
   * - test[key]
   * - test[test1[key]]
   * - test["a"][key]
   * - xxx.test[a[a].test1[key]]
   * - test.xxx.a["asa"][test1[key]]
   *
   */

  var len, str, chr, index$1, expressionPos, expressionEndPos;



  function parseModel (val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace)
    val = val.trim();
    len = val.length;

    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      index$1 = val.lastIndexOf('.');
      if (index$1 > -1) {
        return {
          exp: val.slice(0, index$1),
          key: '"' + val.slice(index$1 + 1) + '"'
        }
      } else {
        return {
          exp: val,
          key: null
        }
      }
    }

    str = val;
    index$1 = expressionPos = expressionEndPos = 0;

    while (!eof()) {
      chr = next();
      /* istanbul ignore if */
      if (isStringStart(chr)) {
        parseString(chr);
      } else if (chr === 0x5B) {
        parseBracket(chr);
      }
    }

    return {
      exp: val.slice(0, expressionPos),
      key: val.slice(expressionPos + 1, expressionEndPos)
    }
  }

  function next () {
    return str.charCodeAt(++index$1)
  }

  function eof () {
    return index$1 >= len
  }

  function isStringStart (chr) {
    return chr === 0x22 || chr === 0x27
  }

  function parseBracket (chr) {
    var inBracket = 1;
    expressionPos = index$1;
    while (!eof()) {
      chr = next();
      if (isStringStart(chr)) {
        parseString(chr);
        continue
      }
      if (chr === 0x5B) { inBracket++; }
      if (chr === 0x5D) { inBracket--; }
      if (inBracket === 0) {
        expressionEndPos = index$1;
        break
      }
    }
  }

  function parseString (chr) {
    var stringQuote = chr;
    while (!eof()) {
      chr = next();
      if (chr === stringQuote) {
        break
      }
    }
  }

  /*  */

  var warn$1;

  // in some cases, the event used has to be determined at runtime
  // so we used some reserved tokens during compile.
  var RANGE_TOKEN = '__r';
  var CHECKBOX_RADIO_TOKEN = '__c';

  function model (
    el,
    dir,
    _warn
  ) {
    warn$1 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;

    {
      // inputs with type="file" are read only and setting the input's
      // value will throw an error.
      if (tag === 'input' && type === 'file') {
        warn$1(
          "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
          "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap['v-model']
        );
      }
    }

    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else if (tag === 'select') {
      genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
      genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "v-model is not supported on this element type. " +
        'If you are working with contenteditable, it\'s recommended to ' +
        'wrap a library dedicated for that purpose inside a custom component.',
        el.rawAttrsMap['v-model']
      );
    }

    // ensure runtime directive metadata
    return true
  }

  function genCheckboxModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
      "Array.isArray(" + value + ")" +
      "?_i(" + value + "," + valueBinding + ")>-1" + (
        trueValueBinding === 'true'
          ? (":(" + value + ")")
          : (":_q(" + value + "," + trueValueBinding + ")")
      )
    );
    addHandler(el, 'change',
      "var $$a=" + value + "," +
          '$$el=$event.target,' +
          "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
      'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
            '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
      "}else{" + (genAssignmentCode(value, '$$c')) + "}",
      null, true
    );
  }

  function genRadioModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
  }

  function genSelect (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var selectedVal = "Array.prototype.filter" +
      ".call($event.target.options,function(o){return o.selected})" +
      ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
      "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
    var code = "var $$selectedVal = " + selectedVal + ";";
    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
  }

  function genDefaultModel (
    el,
    value,
    modifiers
  ) {
    var type = el.attrsMap.type;

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    {
      var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
      var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
        warn$1(
          binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
          'because the latter already expands to a value binding internally',
          el.rawAttrsMap[binding]
        );
      }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }

    addProp(el, 'value', ("(" + value + ")"));
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  /*  */

  // normalize v-model event tokens that can only be determined at runtime.
  // it's important to place the event as the first in the array because
  // the whole point is ensuring the v-model callback gets called before
  // user-attached handlers.
  function normalizeEvents (on) {
    /* istanbul ignore if */
    if (isDef(on[RANGE_TOKEN])) {
      // IE input[type=range] only supports `change` event
      var event = isIE ? 'change' : 'input';
      on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
      delete on[RANGE_TOKEN];
    }
    // This was originally intended to fix #4521 but no longer necessary
    // after 2.5. Keeping it for backwards compat with generated code from < 2.4
    /* istanbul ignore if */
    if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
      on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
      delete on[CHECKBOX_RADIO_TOKEN];
    }
  }

  var target$1;

  function createOnceHandler$1 (event, handler, capture) {
    var _target = target$1; // save current target element in closure
    return function onceHandler () {
      var res = handler.apply(null, arguments);
      if (res !== null) {
        remove$2(event, onceHandler, capture, _target);
      }
    }
  }

  // #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
  // implementation and does not fire microtasks in between event propagation, so
  // safe to exclude.
  var useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53);

  function add$1 (
    name,
    handler,
    capture,
    passive
  ) {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (useMicrotaskFix) {
      var attachedTimestamp = currentFlushTimestamp;
      var original = handler;
      handler = original._wrapper = function (e) {
        if (
          // no bubbling, should always fire.
          // this is just a safety net in case event.timeStamp is unreliable in
          // certain weird environments...
          e.target === e.currentTarget ||
          // event is fired after handler attachment
          e.timeStamp >= attachedTimestamp ||
          // bail for environments that have buggy event.timeStamp implementations
          // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
          // #9681 QtWebEngine event.timeStamp is negative value
          e.timeStamp <= 0 ||
          // #9448 bail if event is fired in another document in a multi-page
          // electron/nw.js app, since event.timeStamp will be using a different
          // starting reference
          e.target.ownerDocument !== document
        ) {
          return original.apply(this, arguments)
        }
      };
    }
    target$1.addEventListener(
      name,
      handler,
      supportsPassive
        ? { capture: capture, passive: passive }
        : capture
    );
  }

  function remove$2 (
    name,
    handler,
    capture,
    _target
  ) {
    (_target || target$1).removeEventListener(
      name,
      handler._wrapper || handler,
      capture
    );
  }

  function updateDOMListeners (oldVnode, vnode) {
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
      return
    }
    var on = vnode.data.on || {};
    var oldOn = oldVnode.data.on || {};
    target$1 = vnode.elm;
    normalizeEvents(on);
    updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
    target$1 = undefined;
  }

  var events = {
    create: updateDOMListeners,
    update: updateDOMListeners
  };

  /*  */

  var svgContainer;

  function updateDOMProps (oldVnode, vnode) {
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
      return
    }
    var key, cur;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.domProps || {};
    var props = vnode.data.domProps || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(props.__ob__)) {
      props = vnode.data.domProps = extend({}, props);
    }

    for (key in oldProps) {
      if (!(key in props)) {
        elm[key] = '';
      }
    }

    for (key in props) {
      cur = props[key];
      // ignore children if the node has textContent or innerHTML,
      // as these will throw away existing DOM nodes and cause removal errors
      // on subsequent patches (#3360)
      if (key === 'textContent' || key === 'innerHTML') {
        if (vnode.children) { vnode.children.length = 0; }
        if (cur === oldProps[key]) { continue }
        // #6601 work around Chrome version <= 55 bug where single textNode
        // replaced by innerHTML/textContent retains its parentNode property
        if (elm.childNodes.length === 1) {
          elm.removeChild(elm.childNodes[0]);
        }
      }

      if (key === 'value' && elm.tagName !== 'PROGRESS') {
        // store value as _value as well since
        // non-string values will be stringified
        elm._value = cur;
        // avoid resetting cursor position when value is the same
        var strCur = isUndef(cur) ? '' : String(cur);
        if (shouldUpdateValue(elm, strCur)) {
          elm.value = strCur;
        }
      } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
        // IE doesn't support innerHTML for SVG elements
        svgContainer = svgContainer || document.createElement('div');
        svgContainer.innerHTML = "<svg>" + cur + "</svg>";
        var svg = svgContainer.firstChild;
        while (elm.firstChild) {
          elm.removeChild(elm.firstChild);
        }
        while (svg.firstChild) {
          elm.appendChild(svg.firstChild);
        }
      } else if (
        // skip the update if old and new VDOM state is the same.
        // `value` is handled separately because the DOM value may be temporarily
        // out of sync with VDOM state due to focus, composition and modifiers.
        // This  #4521 by skipping the unnecessary `checked` update.
        cur !== oldProps[key]
      ) {
        // some property updates can throw
        // e.g. `value` on <progress> w/ non-finite value
        try {
          elm[key] = cur;
        } catch (e) {}
      }
    }
  }

  // check platforms/web/util/attrs.js acceptValue


  function shouldUpdateValue (elm, checkVal) {
    return (!elm.composing && (
      elm.tagName === 'OPTION' ||
      isNotInFocusAndDirty(elm, checkVal) ||
      isDirtyWithModifiers(elm, checkVal)
    ))
  }

  function isNotInFocusAndDirty (elm, checkVal) {
    // return true when textbox (.number and .trim) loses focus and its value is
    // not equal to the updated value
    var notInFocus = true;
    // #6157
    // work around IE bug when accessing document.activeElement in an iframe
    try { notInFocus = document.activeElement !== elm; } catch (e) {}
    return notInFocus && elm.value !== checkVal
  }

  function isDirtyWithModifiers (elm, newVal) {
    var value = elm.value;
    var modifiers = elm._vModifiers; // injected by v-model runtime
    if (isDef(modifiers)) {
      if (modifiers.number) {
        return toNumber(value) !== toNumber(newVal)
      }
      if (modifiers.trim) {
        return value.trim() !== newVal.trim()
      }
    }
    return value !== newVal
  }

  var domProps = {
    create: updateDOMProps,
    update: updateDOMProps
  };

  /*  */

  var parseStyleText = cached(function (cssText) {
    var res = {};
    var listDelimiter = /;(?![^(]*\))/g;
    var propertyDelimiter = /:(.+)/;
    cssText.split(listDelimiter).forEach(function (item) {
      if (item) {
        var tmp = item.split(propertyDelimiter);
        tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return res
  });

  // merge static and dynamic style data on the same vnode
  function normalizeStyleData (data) {
    var style = normalizeStyleBinding(data.style);
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
      ? extend(data.staticStyle, style)
      : style
  }

  // normalize possible array / string values into Object
  function normalizeStyleBinding (bindingStyle) {
    if (Array.isArray(bindingStyle)) {
      return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
      return parseStyleText(bindingStyle)
    }
    return bindingStyle
  }

  /**
   * parent component style should be after child's
   * so that parent component's style could override it
   */
  function getStyle (vnode, checkChild) {
    var res = {};
    var styleData;

    if (checkChild) {
      var childNode = vnode;
      while (childNode.componentInstance) {
        childNode = childNode.componentInstance._vnode;
        if (
          childNode && childNode.data &&
          (styleData = normalizeStyleData(childNode.data))
        ) {
          extend(res, styleData);
        }
      }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
      extend(res, styleData);
    }

    var parentNode = vnode;
    while ((parentNode = parentNode.parent)) {
      if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
        extend(res, styleData);
      }
    }
    return res
  }

  /*  */

  var cssVarRE = /^--/;
  var importantRE = /\s*!important$/;
  var setProp = function (el, name, val) {
    /* istanbul ignore if */
    if (cssVarRE.test(name)) {
      el.style.setProperty(name, val);
    } else if (importantRE.test(val)) {
      el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
    } else {
      var normalizedName = normalize(name);
      if (Array.isArray(val)) {
        // Support values array created by autoprefixer, e.g.
        // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
        // Set them one by one, and the browser will only set those it can recognize
        for (var i = 0, len = val.length; i < len; i++) {
          el.style[normalizedName] = val[i];
        }
      } else {
        el.style[normalizedName] = val;
      }
    }
  };

  var vendorNames = ['Webkit', 'Moz', 'ms'];

  var emptyStyle;
  var normalize = cached(function (prop) {
    emptyStyle = emptyStyle || document.createElement('div').style;
    prop = camelize(prop);
    if (prop !== 'filter' && (prop in emptyStyle)) {
      return prop
    }
    var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (var i = 0; i < vendorNames.length; i++) {
      var name = vendorNames[i] + capName;
      if (name in emptyStyle) {
        return name
      }
    }
  });

  function updateStyle (oldVnode, vnode) {
    var data = vnode.data;
    var oldData = oldVnode.data;

    if (isUndef(data.staticStyle) && isUndef(data.style) &&
      isUndef(oldData.staticStyle) && isUndef(oldData.style)
    ) {
      return
    }

    var cur, name;
    var el = vnode.elm;
    var oldStaticStyle = oldData.staticStyle;
    var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

    // if static style exists, stylebinding already merged into it when doing normalizeStyleData
    var oldStyle = oldStaticStyle || oldStyleBinding;

    var style = normalizeStyleBinding(vnode.data.style) || {};

    // store normalized style under a different key for next diff
    // make sure to clone it if it's reactive, since the user likely wants
    // to mutate it.
    vnode.data.normalizedStyle = isDef(style.__ob__)
      ? extend({}, style)
      : style;

    var newStyle = getStyle(vnode, true);

    for (name in oldStyle) {
      if (isUndef(newStyle[name])) {
        setProp(el, name, '');
      }
    }
    for (name in newStyle) {
      cur = newStyle[name];
      if (cur !== oldStyle[name]) {
        // ie9 setting to null has no effect, must use empty string
        setProp(el, name, cur == null ? '' : cur);
      }
    }
  }

  var style = {
    create: updateStyle,
    update: updateStyle
  };

  /*  */

  var whitespaceRE = /\s+/;

  /**
   * Add class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function addClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.add(c); });
      } else {
        el.classList.add(cls);
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      if (cur.indexOf(' ' + cls + ' ') < 0) {
        el.setAttribute('class', (cur + cls).trim());
      }
    }
  }

  /**
   * Remove class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function removeClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.remove(c); });
      } else {
        el.classList.remove(cls);
      }
      if (!el.classList.length) {
        el.removeAttribute('class');
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      var tar = ' ' + cls + ' ';
      while (cur.indexOf(tar) >= 0) {
        cur = cur.replace(tar, ' ');
      }
      cur = cur.trim();
      if (cur) {
        el.setAttribute('class', cur);
      } else {
        el.removeAttribute('class');
      }
    }
  }

  /*  */

  function resolveTransition (def$$1) {
    if (!def$$1) {
      return
    }
    /* istanbul ignore else */
    if (typeof def$$1 === 'object') {
      var res = {};
      if (def$$1.css !== false) {
        extend(res, autoCssTransition(def$$1.name || 'v'));
      }
      extend(res, def$$1);
      return res
    } else if (typeof def$$1 === 'string') {
      return autoCssTransition(def$$1)
    }
  }

  var autoCssTransition = cached(function (name) {
    return {
      enterClass: (name + "-enter"),
      enterToClass: (name + "-enter-to"),
      enterActiveClass: (name + "-enter-active"),
      leaveClass: (name + "-leave"),
      leaveToClass: (name + "-leave-to"),
      leaveActiveClass: (name + "-leave-active")
    }
  });

  var hasTransition = inBrowser && !isIE9;
  var TRANSITION = 'transition';
  var ANIMATION = 'animation';

  // Transition property/event sniffing
  var transitionProp = 'transition';
  var transitionEndEvent = 'transitionend';
  var animationProp = 'animation';
  var animationEndEvent = 'animationend';
  if (hasTransition) {
    /* istanbul ignore if */
    if (window.ontransitionend === undefined &&
      window.onwebkittransitionend !== undefined
    ) {
      transitionProp = 'WebkitTransition';
      transitionEndEvent = 'webkitTransitionEnd';
    }
    if (window.onanimationend === undefined &&
      window.onwebkitanimationend !== undefined
    ) {
      animationProp = 'WebkitAnimation';
      animationEndEvent = 'webkitAnimationEnd';
    }
  }

  // binding to window is necessary to make hot reload work in IE in strict mode
  var raf = inBrowser
    ? window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : setTimeout
    : /* istanbul ignore next */ function (fn) { return fn(); };

  function nextFrame (fn) {
    raf(function () {
      raf(fn);
    });
  }

  function addTransitionClass (el, cls) {
    var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
    if (transitionClasses.indexOf(cls) < 0) {
      transitionClasses.push(cls);
      addClass(el, cls);
    }
  }

  function removeTransitionClass (el, cls) {
    if (el._transitionClasses) {
      remove(el._transitionClasses, cls);
    }
    removeClass(el, cls);
  }

  function whenTransitionEnds (
    el,
    expectedType,
    cb
  ) {
    var ref = getTransitionInfo(el, expectedType);
    var type = ref.type;
    var timeout = ref.timeout;
    var propCount = ref.propCount;
    if (!type) { return cb() }
    var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
    var ended = 0;
    var end = function () {
      el.removeEventListener(event, onEnd);
      cb();
    };
    var onEnd = function (e) {
      if (e.target === el) {
        if (++ended >= propCount) {
          end();
        }
      }
    };
    setTimeout(function () {
      if (ended < propCount) {
        end();
      }
    }, timeout + 1);
    el.addEventListener(event, onEnd);
  }

  var transformRE = /\b(transform|all)(,|$)/;

  function getTransitionInfo (el, expectedType) {
    var styles = window.getComputedStyle(el);
    // JSDOM may return undefined for transition properties
    var transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
    var transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
    var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    var animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
    var animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
    var animationTimeout = getTimeout(animationDelays, animationDurations);

    var type;
    var timeout = 0;
    var propCount = 0;
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
      if (transitionTimeout > 0) {
        type = TRANSITION;
        timeout = transitionTimeout;
        propCount = transitionDurations.length;
      }
    } else if (expectedType === ANIMATION) {
      if (animationTimeout > 0) {
        type = ANIMATION;
        timeout = animationTimeout;
        propCount = animationDurations.length;
      }
    } else {
      timeout = Math.max(transitionTimeout, animationTimeout);
      type = timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null;
      propCount = type
        ? type === TRANSITION
          ? transitionDurations.length
          : animationDurations.length
        : 0;
    }
    var hasTransform =
      type === TRANSITION &&
      transformRE.test(styles[transitionProp + 'Property']);
    return {
      type: type,
      timeout: timeout,
      propCount: propCount,
      hasTransform: hasTransform
    }
  }

  function getTimeout (delays, durations) {
    /* istanbul ignore next */
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }

    return Math.max.apply(null, durations.map(function (d, i) {
      return toMs(d) + toMs(delays[i])
    }))
  }

  // Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
  // in a locale-dependent way, using a comma instead of a dot.
  // If comma is not replaced with a dot, the input will be rounded down (i.e. acting
  // as a floor function) causing unexpected behaviors
  function toMs (s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000
  }

  /*  */

  function enter (vnode, toggleDisplay) {
    var el = vnode.elm;

    // call leave callback now
    if (isDef(el._leaveCb)) {
      el._leaveCb.cancelled = true;
      el._leaveCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data)) {
      return
    }

    /* istanbul ignore if */
    if (isDef(el._enterCb) || el.nodeType !== 1) {
      return
    }

    var css = data.css;
    var type = data.type;
    var enterClass = data.enterClass;
    var enterToClass = data.enterToClass;
    var enterActiveClass = data.enterActiveClass;
    var appearClass = data.appearClass;
    var appearToClass = data.appearToClass;
    var appearActiveClass = data.appearActiveClass;
    var beforeEnter = data.beforeEnter;
    var enter = data.enter;
    var afterEnter = data.afterEnter;
    var enterCancelled = data.enterCancelled;
    var beforeAppear = data.beforeAppear;
    var appear = data.appear;
    var afterAppear = data.afterAppear;
    var appearCancelled = data.appearCancelled;
    var duration = data.duration;

    // activeInstance will always be the <transition> component managing this
    // transition. One edge case to check is when the <transition> is placed
    // as the root node of a child component. In that case we need to check
    // <transition>'s parent for appear check.
    var context = activeInstance;
    var transitionNode = activeInstance.$vnode;
    while (transitionNode && transitionNode.parent) {
      context = transitionNode.context;
      transitionNode = transitionNode.parent;
    }

    var isAppear = !context._isMounted || !vnode.isRootInsert;

    if (isAppear && !appear && appear !== '') {
      return
    }

    var startClass = isAppear && appearClass
      ? appearClass
      : enterClass;
    var activeClass = isAppear && appearActiveClass
      ? appearActiveClass
      : enterActiveClass;
    var toClass = isAppear && appearToClass
      ? appearToClass
      : enterToClass;

    var beforeEnterHook = isAppear
      ? (beforeAppear || beforeEnter)
      : beforeEnter;
    var enterHook = isAppear
      ? (typeof appear === 'function' ? appear : enter)
      : enter;
    var afterEnterHook = isAppear
      ? (afterAppear || afterEnter)
      : afterEnter;
    var enterCancelledHook = isAppear
      ? (appearCancelled || enterCancelled)
      : enterCancelled;

    var explicitEnterDuration = toNumber(
      isObject(duration)
        ? duration.enter
        : duration
    );

    if (explicitEnterDuration != null) {
      checkDuration(explicitEnterDuration, 'enter', vnode);
    }

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(enterHook);

    var cb = el._enterCb = once(function () {
      if (expectsCSS) {
        removeTransitionClass(el, toClass);
        removeTransitionClass(el, activeClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, startClass);
        }
        enterCancelledHook && enterCancelledHook(el);
      } else {
        afterEnterHook && afterEnterHook(el);
      }
      el._enterCb = null;
    });

    if (!vnode.data.show) {
      // remove pending leave element on enter by injecting an insert hook
      mergeVNodeHook(vnode, 'insert', function () {
        var parent = el.parentNode;
        var pendingNode = parent && parent._pending && parent._pending[vnode.key];
        if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb
        ) {
          pendingNode.elm._leaveCb();
        }
        enterHook && enterHook(el, cb);
      });
    }

    // start enter transition
    beforeEnterHook && beforeEnterHook(el);
    if (expectsCSS) {
      addTransitionClass(el, startClass);
      addTransitionClass(el, activeClass);
      nextFrame(function () {
        removeTransitionClass(el, startClass);
        if (!cb.cancelled) {
          addTransitionClass(el, toClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitEnterDuration)) {
              setTimeout(cb, explicitEnterDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }

    if (vnode.data.show) {
      toggleDisplay && toggleDisplay();
      enterHook && enterHook(el, cb);
    }

    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }

  function leave (vnode, rm) {
    var el = vnode.elm;

    // call enter callback now
    if (isDef(el._enterCb)) {
      el._enterCb.cancelled = true;
      el._enterCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data) || el.nodeType !== 1) {
      return rm()
    }

    /* istanbul ignore if */
    if (isDef(el._leaveCb)) {
      return
    }

    var css = data.css;
    var type = data.type;
    var leaveClass = data.leaveClass;
    var leaveToClass = data.leaveToClass;
    var leaveActiveClass = data.leaveActiveClass;
    var beforeLeave = data.beforeLeave;
    var leave = data.leave;
    var afterLeave = data.afterLeave;
    var leaveCancelled = data.leaveCancelled;
    var delayLeave = data.delayLeave;
    var duration = data.duration;

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(leave);

    var explicitLeaveDuration = toNumber(
      isObject(duration)
        ? duration.leave
        : duration
    );

    if (isDef(explicitLeaveDuration)) {
      checkDuration(explicitLeaveDuration, 'leave', vnode);
    }

    var cb = el._leaveCb = once(function () {
      if (el.parentNode && el.parentNode._pending) {
        el.parentNode._pending[vnode.key] = null;
      }
      if (expectsCSS) {
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, leaveClass);
        }
        leaveCancelled && leaveCancelled(el);
      } else {
        rm();
        afterLeave && afterLeave(el);
      }
      el._leaveCb = null;
    });

    if (delayLeave) {
      delayLeave(performLeave);
    } else {
      performLeave();
    }

    function performLeave () {
      // the delayed leave may have already been cancelled
      if (cb.cancelled) {
        return
      }
      // record leaving element
      if (!vnode.data.show && el.parentNode) {
        (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
      }
      beforeLeave && beforeLeave(el);
      if (expectsCSS) {
        addTransitionClass(el, leaveClass);
        addTransitionClass(el, leaveActiveClass);
        nextFrame(function () {
          removeTransitionClass(el, leaveClass);
          if (!cb.cancelled) {
            addTransitionClass(el, leaveToClass);
            if (!userWantsControl) {
              if (isValidDuration(explicitLeaveDuration)) {
                setTimeout(cb, explicitLeaveDuration);
              } else {
                whenTransitionEnds(el, type, cb);
              }
            }
          }
        });
      }
      leave && leave(el, cb);
      if (!expectsCSS && !userWantsControl) {
        cb();
      }
    }
  }

  // only used in dev mode
  function checkDuration (val, name, vnode) {
    if (typeof val !== 'number') {
      warn(
        "<transition> explicit " + name + " duration is not a valid number - " +
        "got " + (JSON.stringify(val)) + ".",
        vnode.context
      );
    } else if (isNaN(val)) {
      warn(
        "<transition> explicit " + name + " duration is NaN - " +
        'the duration expression might be incorrect.',
        vnode.context
      );
    }
  }

  function isValidDuration (val) {
    return typeof val === 'number' && !isNaN(val)
  }

  /**
   * Normalize a transition hook's argument length. The hook may be:
   * - a merged hook (invoker) with the original in .fns
   * - a wrapped component method (check ._length)
   * - a plain function (.length)
   */
  function getHookArgumentsLength (fn) {
    if (isUndef(fn)) {
      return false
    }
    var invokerFns = fn.fns;
    if (isDef(invokerFns)) {
      // invoker
      return getHookArgumentsLength(
        Array.isArray(invokerFns)
          ? invokerFns[0]
          : invokerFns
      )
    } else {
      return (fn._length || fn.length) > 1
    }
  }

  function _enter (_, vnode) {
    if (vnode.data.show !== true) {
      enter(vnode);
    }
  }

  var transition = inBrowser ? {
    create: _enter,
    activate: _enter,
    remove: function remove$$1 (vnode, rm) {
      /* istanbul ignore else */
      if (vnode.data.show !== true) {
        leave(vnode, rm);
      } else {
        rm();
      }
    }
  } : {};

  var platformModules = [
    attrs,
    klass,
    events,
    domProps,
    style,
    transition
  ];

  /*  */

  // the directive module should be applied last, after all
  // built-in modules have been applied.
  var modules = platformModules.concat(baseModules);

  var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

  /**
   * Not type checking this file because flow doesn't like attaching
   * properties to Elements.
   */

  /* istanbul ignore if */
  if (isIE9) {
    // http://www.matts411.com/post/internet-explorer-9-oninput/
    document.addEventListener('selectionchange', function () {
      var el = document.activeElement;
      if (el && el.vmodel) {
        trigger(el, 'input');
      }
    });
  }

  var directive = {
    inserted: function inserted (el, binding, vnode, oldVnode) {
      if (vnode.tag === 'select') {
        // #6903
        if (oldVnode.elm && !oldVnode.elm._vOptions) {
          mergeVNodeHook(vnode, 'postpatch', function () {
            directive.componentUpdated(el, binding, vnode);
          });
        } else {
          setSelected(el, binding, vnode.context);
        }
        el._vOptions = [].map.call(el.options, getValue);
      } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
        el._vModifiers = binding.modifiers;
        if (!binding.modifiers.lazy) {
          el.addEventListener('compositionstart', onCompositionStart);
          el.addEventListener('compositionend', onCompositionEnd);
          // Safari < 10.2 & UIWebView doesn't fire compositionend when
          // switching focus before confirming composition choice
          // this also fixes the issue where some browsers e.g. iOS Chrome
          // fires "change" instead of "input" on autocomplete.
          el.addEventListener('change', onCompositionEnd);
          /* istanbul ignore if */
          if (isIE9) {
            el.vmodel = true;
          }
        }
      }
    },

    componentUpdated: function componentUpdated (el, binding, vnode) {
      if (vnode.tag === 'select') {
        setSelected(el, binding, vnode.context);
        // in case the options rendered by v-for have changed,
        // it's possible that the value is out-of-sync with the rendered options.
        // detect such cases and filter out values that no longer has a matching
        // option in the DOM.
        var prevOptions = el._vOptions;
        var curOptions = el._vOptions = [].map.call(el.options, getValue);
        if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
          // trigger change event if
          // no matching option found for at least one value
          var needReset = el.multiple
            ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
            : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
          if (needReset) {
            trigger(el, 'change');
          }
        }
      }
    }
  };

  function setSelected (el, binding, vm) {
    actuallySetSelected(el, binding, vm);
    /* istanbul ignore if */
    if (isIE || isEdge) {
      setTimeout(function () {
        actuallySetSelected(el, binding, vm);
      }, 0);
    }
  }

  function actuallySetSelected (el, binding, vm) {
    var value = binding.value;
    var isMultiple = el.multiple;
    if (isMultiple && !Array.isArray(value)) {
      warn(
        "<select multiple v-model=\"" + (binding.expression) + "\"> " +
        "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
        vm
      );
      return
    }
    var selected, option;
    for (var i = 0, l = el.options.length; i < l; i++) {
      option = el.options[i];
      if (isMultiple) {
        selected = looseIndexOf(value, getValue(option)) > -1;
        if (option.selected !== selected) {
          option.selected = selected;
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) {
            el.selectedIndex = i;
          }
          return
        }
      }
    }
    if (!isMultiple) {
      el.selectedIndex = -1;
    }
  }

  function hasNoMatchingOption (value, options) {
    return options.every(function (o) { return !looseEqual(o, value); })
  }

  function getValue (option) {
    return '_value' in option
      ? option._value
      : option.value
  }

  function onCompositionStart (e) {
    e.target.composing = true;
  }

  function onCompositionEnd (e) {
    // prevent triggering an input event for no reason
    if (!e.target.composing) { return }
    e.target.composing = false;
    trigger(e.target, 'input');
  }

  function trigger (el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  }

  /*  */

  // recursively search for possible transition defined inside the component root
  function locateNode (vnode) {
    return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
      ? locateNode(vnode.componentInstance._vnode)
      : vnode
  }

  var show = {
    bind: function bind (el, ref, vnode) {
      var value = ref.value;

      vnode = locateNode(vnode);
      var transition$$1 = vnode.data && vnode.data.transition;
      var originalDisplay = el.__vOriginalDisplay =
        el.style.display === 'none' ? '' : el.style.display;
      if (value && transition$$1) {
        vnode.data.show = true;
        enter(vnode, function () {
          el.style.display = originalDisplay;
        });
      } else {
        el.style.display = value ? originalDisplay : 'none';
      }
    },

    update: function update (el, ref, vnode) {
      var value = ref.value;
      var oldValue = ref.oldValue;

      /* istanbul ignore if */
      if (!value === !oldValue) { return }
      vnode = locateNode(vnode);
      var transition$$1 = vnode.data && vnode.data.transition;
      if (transition$$1) {
        vnode.data.show = true;
        if (value) {
          enter(vnode, function () {
            el.style.display = el.__vOriginalDisplay;
          });
        } else {
          leave(vnode, function () {
            el.style.display = 'none';
          });
        }
      } else {
        el.style.display = value ? el.__vOriginalDisplay : 'none';
      }
    },

    unbind: function unbind (
      el,
      binding,
      vnode,
      oldVnode,
      isDestroy
    ) {
      if (!isDestroy) {
        el.style.display = el.__vOriginalDisplay;
      }
    }
  };

  var platformDirectives = {
    model: directive,
    show: show
  };

  /*  */

  var transitionProps = {
    name: String,
    appear: Boolean,
    css: Boolean,
    mode: String,
    type: String,
    enterClass: String,
    leaveClass: String,
    enterToClass: String,
    leaveToClass: String,
    enterActiveClass: String,
    leaveActiveClass: String,
    appearClass: String,
    appearActiveClass: String,
    appearToClass: String,
    duration: [Number, String, Object]
  };

  // in case the child is also an abstract component, e.g. <keep-alive>
  // we want to recursively retrieve the real component to be rendered
  function getRealChild (vnode) {
    var compOptions = vnode && vnode.componentOptions;
    if (compOptions && compOptions.Ctor.options.abstract) {
      return getRealChild(getFirstComponentChild(compOptions.children))
    } else {
      return vnode
    }
  }

  function extractTransitionData (comp) {
    var data = {};
    var options = comp.$options;
    // props
    for (var key in options.propsData) {
      data[key] = comp[key];
    }
    // events.
    // extract listeners and pass them directly to the transition methods
    var listeners = options._parentListeners;
    for (var key$1 in listeners) {
      data[camelize(key$1)] = listeners[key$1];
    }
    return data
  }

  function placeholder (h, rawChild) {
    if (/\d-keep-alive$/.test(rawChild.tag)) {
      return h('keep-alive', {
        props: rawChild.componentOptions.propsData
      })
    }
  }

  function hasParentTransition (vnode) {
    while ((vnode = vnode.parent)) {
      if (vnode.data.transition) {
        return true
      }
    }
  }

  function isSameChild (child, oldChild) {
    return oldChild.key === child.key && oldChild.tag === child.tag
  }

  var isNotTextNode = function (c) { return c.tag || isAsyncPlaceholder(c); };

  var isVShowDirective = function (d) { return d.name === 'show'; };

  var Transition = {
    name: 'transition',
    props: transitionProps,
    abstract: true,

    render: function render (h) {
      var this$1 = this;

      var children = this.$slots.default;
      if (!children) {
        return
      }

      // filter out text nodes (possible whitespaces)
      children = children.filter(isNotTextNode);
      /* istanbul ignore if */
      if (!children.length) {
        return
      }

      // warn multiple elements
      if (children.length > 1) {
        warn(
          '<transition> can only be used on a single element. Use ' +
          '<transition-group> for lists.',
          this.$parent
        );
      }

      var mode = this.mode;

      // warn invalid mode
      if (mode && mode !== 'in-out' && mode !== 'out-in'
      ) {
        warn(
          'invalid <transition> mode: ' + mode,
          this.$parent
        );
      }

      var rawChild = children[0];

      // if this is a component root node and the component's
      // parent container node also has transition, skip.
      if (hasParentTransition(this.$vnode)) {
        return rawChild
      }

      // apply transition data to child
      // use getRealChild() to ignore abstract components e.g. keep-alive
      var child = getRealChild(rawChild);
      /* istanbul ignore if */
      if (!child) {
        return rawChild
      }

      if (this._leaving) {
        return placeholder(h, rawChild)
      }

      // ensure a key that is unique to the vnode type and to this transition
      // component instance. This key will be used to remove pending leaving nodes
      // during entering.
      var id = "__transition-" + (this._uid) + "-";
      child.key = child.key == null
        ? child.isComment
          ? id + 'comment'
          : id + child.tag
        : isPrimitive(child.key)
          ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
          : child.key;

      var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
      var oldRawChild = this._vnode;
      var oldChild = getRealChild(oldRawChild);

      // mark v-show
      // so that the transition module can hand over the control to the directive
      if (child.data.directives && child.data.directives.some(isVShowDirective)) {
        child.data.show = true;
      }

      if (
        oldChild &&
        oldChild.data &&
        !isSameChild(child, oldChild) &&
        !isAsyncPlaceholder(oldChild) &&
        // #6687 component root is a comment node
        !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
      ) {
        // replace old child transition data with fresh one
        // important for dynamic transitions!
        var oldData = oldChild.data.transition = extend({}, data);
        // handle transition mode
        if (mode === 'out-in') {
          // return placeholder node and queue update when leave finishes
          this._leaving = true;
          mergeVNodeHook(oldData, 'afterLeave', function () {
            this$1._leaving = false;
            this$1.$forceUpdate();
          });
          return placeholder(h, rawChild)
        } else if (mode === 'in-out') {
          if (isAsyncPlaceholder(child)) {
            return oldRawChild
          }
          var delayedLeave;
          var performLeave = function () { delayedLeave(); };
          mergeVNodeHook(data, 'afterEnter', performLeave);
          mergeVNodeHook(data, 'enterCancelled', performLeave);
          mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
        }
      }

      return rawChild
    }
  };

  /*  */

  var props = extend({
    tag: String,
    moveClass: String
  }, transitionProps);

  delete props.mode;

  var TransitionGroup = {
    props: props,

    beforeMount: function beforeMount () {
      var this$1 = this;

      var update = this._update;
      this._update = function (vnode, hydrating) {
        var restoreActiveInstance = setActiveInstance(this$1);
        // force removing pass
        this$1.__patch__(
          this$1._vnode,
          this$1.kept,
          false, // hydrating
          true // removeOnly (!important, avoids unnecessary moves)
        );
        this$1._vnode = this$1.kept;
        restoreActiveInstance();
        update.call(this$1, vnode, hydrating);
      };
    },

    render: function render (h) {
      var tag = this.tag || this.$vnode.data.tag || 'span';
      var map = Object.create(null);
      var prevChildren = this.prevChildren = this.children;
      var rawChildren = this.$slots.default || [];
      var children = this.children = [];
      var transitionData = extractTransitionData(this);

      for (var i = 0; i < rawChildren.length; i++) {
        var c = rawChildren[i];
        if (c.tag) {
          if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
            children.push(c);
            map[c.key] = c
            ;(c.data || (c.data = {})).transition = transitionData;
          } else {
            var opts = c.componentOptions;
            var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
            warn(("<transition-group> children must be keyed: <" + name + ">"));
          }
        }
      }

      if (prevChildren) {
        var kept = [];
        var removed = [];
        for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
          var c$1 = prevChildren[i$1];
          c$1.data.transition = transitionData;
          c$1.data.pos = c$1.elm.getBoundingClientRect();
          if (map[c$1.key]) {
            kept.push(c$1);
          } else {
            removed.push(c$1);
          }
        }
        this.kept = h(tag, null, kept);
        this.removed = removed;
      }

      return h(tag, null, children)
    },

    updated: function updated () {
      var children = this.prevChildren;
      var moveClass = this.moveClass || ((this.name || 'v') + '-move');
      if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
        return
      }

      // we divide the work into three loops to avoid mixing DOM reads and writes
      // in each iteration - which helps prevent layout thrashing.
      children.forEach(callPendingCbs);
      children.forEach(recordPosition);
      children.forEach(applyTranslation);

      // force reflow to put everything in position
      // assign to this to avoid being removed in tree-shaking
      // $flow-disable-line
      this._reflow = document.body.offsetHeight;

      children.forEach(function (c) {
        if (c.data.moved) {
          var el = c.elm;
          var s = el.style;
          addTransitionClass(el, moveClass);
          s.transform = s.WebkitTransform = s.transitionDuration = '';
          el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
            if (e && e.target !== el) {
              return
            }
            if (!e || /transform$/.test(e.propertyName)) {
              el.removeEventListener(transitionEndEvent, cb);
              el._moveCb = null;
              removeTransitionClass(el, moveClass);
            }
          });
        }
      });
    },

    methods: {
      hasMove: function hasMove (el, moveClass) {
        /* istanbul ignore if */
        if (!hasTransition) {
          return false
        }
        /* istanbul ignore if */
        if (this._hasMove) {
          return this._hasMove
        }
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        var clone = el.cloneNode();
        if (el._transitionClasses) {
          el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
        }
        addClass(clone, moveClass);
        clone.style.display = 'none';
        this.$el.appendChild(clone);
        var info = getTransitionInfo(clone);
        this.$el.removeChild(clone);
        return (this._hasMove = info.hasTransform)
      }
    }
  };

  function callPendingCbs (c) {
    /* istanbul ignore if */
    if (c.elm._moveCb) {
      c.elm._moveCb();
    }
    /* istanbul ignore if */
    if (c.elm._enterCb) {
      c.elm._enterCb();
    }
  }

  function recordPosition (c) {
    c.data.newPos = c.elm.getBoundingClientRect();
  }

  function applyTranslation (c) {
    var oldPos = c.data.pos;
    var newPos = c.data.newPos;
    var dx = oldPos.left - newPos.left;
    var dy = oldPos.top - newPos.top;
    if (dx || dy) {
      c.data.moved = true;
      var s = c.elm.style;
      s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
      s.transitionDuration = '0s';
    }
  }

  var platformComponents = {
    Transition: Transition,
    TransitionGroup: TransitionGroup
  };

  /*  */

  // install platform specific utils
  Vue.config.mustUseProp = mustUseProp;
  Vue.config.isReservedTag = isReservedTag;
  Vue.config.isReservedAttr = isReservedAttr;
  Vue.config.getTagNamespace = getTagNamespace;
  Vue.config.isUnknownElement = isUnknownElement;

  // install platform runtime directives & components
  extend(Vue.options.directives, platformDirectives);
  extend(Vue.options.components, platformComponents);

  // install platform patch function
  Vue.prototype.__patch__ = inBrowser ? patch : noop;

  // public mount method
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && inBrowser ? query(el) : undefined;
    return mountComponent(this, el, hydrating)
  };

  // devtools global hook
  /* istanbul ignore next */
  if (inBrowser) {
    setTimeout(function () {
      if (config.devtools) {
        if (devtools) {
          devtools.emit('init', Vue);
        } else {
          console[console.info ? 'info' : 'log'](
            'Download the Vue Devtools extension for a better development experience:\n' +
            'https://github.com/vuejs/vue-devtools'
          );
        }
      }
      if (config.productionTip !== false &&
        typeof console !== 'undefined'
      ) {
        console[console.info ? 'info' : 'log'](
          "You are running Vue in development mode.\n" +
          "Make sure to turn on production mode when deploying for production.\n" +
          "See more tips at https://vuejs.org/guide/deployment.html"
        );
      }
    }, 0);
  }

  /*  */

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

  var buildRegex = cached(function (delimiters) {
    var open = delimiters[0].replace(regexEscapeRE, '\\$&');
    var close = delimiters[1].replace(regexEscapeRE, '\\$&');
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  });



  function parseText (
    text,
    delimiters
  ) {
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    if (!tagRE.test(text)) {
      return
    }
    var tokens = [];
    var rawTokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match, index, tokenValue;
    while ((match = tagRE.exec(text))) {
      index = match.index;
      // push text token
      if (index > lastIndex) {
        rawTokens.push(tokenValue = text.slice(lastIndex, index));
        tokens.push(JSON.stringify(tokenValue));
      }
      // tag token
      var exp = parseFilters(match[1].trim());
      tokens.push(("_s(" + exp + ")"));
      rawTokens.push({ '@binding': exp });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      rawTokens.push(tokenValue = text.slice(lastIndex));
      tokens.push(JSON.stringify(tokenValue));
    }
    return {
      expression: tokens.join('+'),
      tokens: rawTokens
    }
  }

  /*  */

  function transformNode (el, options) {
    var warn = options.warn || baseWarn;
    var staticClass = getAndRemoveAttr(el, 'class');
    if (staticClass) {
      var res = parseText(staticClass, options.delimiters);
      if (res) {
        warn(
          "class=\"" + staticClass + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div class="{{ val }}">, use <div :class="val">.',
          el.rawAttrsMap['class']
        );
      }
    }
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass);
    }
    var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    if (classBinding) {
      el.classBinding = classBinding;
    }
  }

  function genData (el) {
    var data = '';
    if (el.staticClass) {
      data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
      data += "class:" + (el.classBinding) + ",";
    }
    return data
  }

  var klass$1 = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData
  };

  /*  */

  function transformNode$1 (el, options) {
    var warn = options.warn || baseWarn;
    var staticStyle = getAndRemoveAttr(el, 'style');
    if (staticStyle) {
      /* istanbul ignore if */
      {
        var res = parseText(staticStyle, options.delimiters);
        if (res) {
          warn(
            "style=\"" + staticStyle + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div style="{{ val }}">, use <div :style="val">.',
            el.rawAttrsMap['style']
          );
        }
      }
      el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    }

    var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    if (styleBinding) {
      el.styleBinding = styleBinding;
    }
  }

  function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
      data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
      data += "style:(" + (el.styleBinding) + "),";
    }
    return data
  }

  var style$1 = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1
  };

  /*  */

  var decoder;

  var he = {
    decode: function decode (html) {
      decoder = decoder || document.createElement('div');
      decoder.innerHTML = html;
      return decoder.textContent
    }
  };

  /*  */

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
  );

  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  );

  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
  );

  /**
   * Not type-checking this file because it's mostly vendor code.
   */

  // Regular Expressions for parsing tags and attributes
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
  var startTagOpen = new RegExp(("^<" + qnameCapture));
  var startTagClose = /^\s*(\/?)>/;
  var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
  var doctype = /^<!DOCTYPE [^>]+>/i;
  // #7298: escape - to avoid being passed as HTML comment when inlined in page
  var comment = /^<!\--/;
  var conditionalComment = /^<!\[/;

  // Special Elements (can contain anything)
  var isPlainTextElement = makeMap('script,style,textarea', true);
  var reCache = {};

  var decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
  };
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

  // #5992
  var isIgnoreNewlineTag = makeMap('pre,textarea', true);
  var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

  function decodeAttr (value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) { return decodingMap[match]; })
  }

  function parseHTML (html, options) {
    var stack = [];
    var expectHTML = options.expectHTML;
    var isUnaryTag$$1 = options.isUnaryTag || no;
    var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
    var index = 0;
    var last, lastTag;
    while (html) {
      last = html;
      // Make sure we're not in a plaintext content element like script/style
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf('<');
        if (textEnd === 0) {
          // Comment:
          if (comment.test(html)) {
            var commentEnd = html.indexOf('-->');

            if (commentEnd >= 0) {
              if (options.shouldKeepComment) {
                options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
              }
              advance(commentEnd + 3);
              continue
            }
          }

          // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
          if (conditionalComment.test(html)) {
            var conditionalEnd = html.indexOf(']>');

            if (conditionalEnd >= 0) {
              advance(conditionalEnd + 2);
              continue
            }
          }

          // Doctype:
          var doctypeMatch = html.match(doctype);
          if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            continue
          }

          // End tag:
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index;
            advance(endTagMatch[0].length);
            parseEndTag(endTagMatch[1], curIndex, index);
            continue
          }

          // Start tag:
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            handleStartTag(startTagMatch);
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1);
            }
            continue
          }
        }

        var text = (void 0), rest = (void 0), next = (void 0);
        if (textEnd >= 0) {
          rest = html.slice(textEnd);
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            // < in plain text, be forgiving and treat it as text
            next = rest.indexOf('<', 1);
            if (next < 0) { break }
            textEnd += next;
            rest = html.slice(textEnd);
          }
          text = html.substring(0, textEnd);
        }

        if (textEnd < 0) {
          text = html;
        }

        if (text) {
          advance(text.length);
        }

        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
      } else {
        var endTagLength = 0;
        var stackedTag = lastTag.toLowerCase();
        var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
        var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
          endTagLength = endTag.length;
          if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
            text = text
              .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
          }
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1);
          }
          if (options.chars) {
            options.chars(text);
          }
          return ''
        });
        index += html.length - rest$1.length;
        html = rest$1;
        parseEndTag(stackedTag, index - endTagLength, index);
      }

      if (html === last) {
        options.chars && options.chars(html);
        if (!stack.length && options.warn) {
          options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
        }
        break
      }
    }

    // Clean up any remaining tags
    parseEndTag();

    function advance (n) {
      index += n;
      html = html.substring(n);
    }

    function parseStartTag () {
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          tagName: start[1],
          attrs: [],
          start: index
        };
        advance(start[0].length);
        var end, attr;
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        if (end) {
          match.unarySlash = end[1];
          advance(end[0].length);
          match.end = index;
          return match
        }
      }
    }

    function handleStartTag (match) {
      var tagName = match.tagName;
      var unarySlash = match.unarySlash;

      if (expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag);
        }
        if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      var unary = isUnaryTag$$1(tagName) || !!unarySlash;

      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var args = match.attrs[i];
        var value = args[3] || args[4] || args[5] || '';
        var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;
        attrs[i] = {
          name: args[1],
          value: decodeAttr(value, shouldDecodeNewlines)
        };
        if (options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
      }

      if (!unary) {
        stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
        lastTag = tagName;
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    function parseEndTag (tagName, start, end) {
      var pos, lowerCasedTagName;
      if (start == null) { start = index; }
      if (end == null) { end = index; }

      // Find the closest opened tag of the same type
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          if (i > pos || !tagName &&
            options.warn
          ) {
            options.warn(
              ("tag <" + (stack[i].tag) + "> has no matching end tag."),
              { start: stack[i].start, end: stack[i].end }
            );
          }
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      } else if (lowerCasedTagName === 'br') {
        if (options.start) {
          options.start(tagName, [], true, start, end);
        }
      } else if (lowerCasedTagName === 'p') {
        if (options.start) {
          options.start(tagName, [], false, start, end);
        }
        if (options.end) {
          options.end(tagName, start, end);
        }
      }
    }
  }

  /*  */

  var onRE = /^@|^v-on:/;
  var dirRE = /^v-|^@|^:|^#/;
  var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  var stripParensRE = /^\(|\)$/g;
  var dynamicArgRE = /^\[.*\]$/;

  var argRE = /:(.*)$/;
  var bindRE = /^:|^\.|^v-bind:/;
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;

  var slotRE = /^v-slot(:|$)|^#/;

  var lineBreakRE = /[\r\n]/;
  var whitespaceRE$1 = /\s+/g;

  var invalidAttributeRE = /[\s"'<>\/=]/;

  var decodeHTMLCached = cached(he.decode);

  var emptySlotScopeToken = "_empty_";

  // configurable state
  var warn$2;
  var delimiters;
  var transforms;
  var preTransforms;
  var postTransforms;
  var platformIsPreTag;
  var platformMustUseProp;
  var platformGetTagNamespace;
  var maybeComponent;

  function createASTElement (
    tag,
    attrs,
    parent
  ) {
    return {
      type: 1,
      tag: tag,
      attrsList: attrs,
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      parent: parent,
      children: []
    }
  }

  /**
   * Convert HTML string to AST.
   */
  function parse (
    template,
    options
  ) {
    warn$2 = options.warn || baseWarn;

    platformIsPreTag = options.isPreTag || no;
    platformMustUseProp = options.mustUseProp || no;
    platformGetTagNamespace = options.getTagNamespace || no;
    var isReservedTag = options.isReservedTag || no;
    maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };

    transforms = pluckModuleFunction(options.modules, 'transformNode');
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

    delimiters = options.delimiters;

    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    var root;
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;

    function warnOnce (msg, range) {
      if (!warned) {
        warned = true;
        warn$2(msg, range);
      }
    }

    function closeElement (element) {
      trimEndingWhitespace(element);
      if (!inVPre && !element.processed) {
        element = processElement(element, options);
      }
      // tree management
      if (!stack.length && element !== root) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          {
            checkRootConstraints(element);
          }
          addIfCondition(root, {
            exp: element.elseif,
            block: element
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
            "If you are using v-if on multiple elements, " +
            "use v-else-if to chain them instead.",
            { start: element.start }
          );
        }
      }
      if (currentParent && !element.forbidden) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else {
          if (element.slotScope) {
            // scoped slot
            // keep it in the children list so that v-else(-if) conditions can
            // find it as the prev node.
            var name = element.slotTarget || '"default"'
            ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
          }
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }

      // final children cleanup
      // filter out scoped slots
      element.children = element.children.filter(function (c) { return !(c).slotScope; });
      // remove trailing whitespace node again
      trimEndingWhitespace(element);

      // check pre state
      if (element.pre) {
        inVPre = false;
      }
      if (platformIsPreTag(element.tag)) {
        inPre = false;
      }
      // apply post-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        postTransforms[i](element, options);
      }
    }

    function trimEndingWhitespace (el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode;
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          lastNode.type === 3 &&
          lastNode.text === ' '
        ) {
          el.children.pop();
        }
      }
    }

    function checkRootConstraints (el) {
      if (el.tag === 'slot' || el.tag === 'template') {
        warnOnce(
          "Cannot use <" + (el.tag) + "> as component root element because it may " +
          'contain multiple nodes.',
          { start: el.start }
        );
      }
      if (el.attrsMap.hasOwnProperty('v-for')) {
        warnOnce(
          'Cannot use v-for on stateful component root element because ' +
          'it renders multiple elements.',
          el.rawAttrsMap['v-for']
        );
      }
    }

    parseHTML(template, {
      warn: warn$2,
      expectHTML: options.expectHTML,
      isUnaryTag: options.isUnaryTag,
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      shouldKeepComment: options.comments,
      outputSourceRange: options.outputSourceRange,
      start: function start (tag, attrs, unary, start$1, end) {
        // check namespace.
        // inherit parent ns if there is one
        var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

        // handle IE svg bug
        /* istanbul ignore if */
        if (isIE && ns === 'svg') {
          attrs = guardIESVGBug(attrs);
        }

        var element = createASTElement(tag, attrs, currentParent);
        if (ns) {
          element.ns = ns;
        }

        {
          if (options.outputSourceRange) {
            element.start = start$1;
            element.end = end;
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr;
              return cumulated
            }, {});
          }
          attrs.forEach(function (attr) {
            if (invalidAttributeRE.test(attr.name)) {
              warn$2(
                "Invalid dynamic argument expression: attribute names cannot contain " +
                "spaces, quotes, <, >, / or =.",
                {
                  start: attr.start + attr.name.indexOf("["),
                  end: attr.start + attr.name.length
                }
              );
            }
          });
        }

        if (isForbiddenTag(element) && !isServerRendering()) {
          element.forbidden = true;
          warn$2(
            'Templates should only be responsible for mapping the state to the ' +
            'UI. Avoid placing tags with side-effects in your templates, such as ' +
            "<" + tag + ">" + ', as they will not be parsed.',
            { start: element.start }
          );
        }

        // apply pre-transforms
        for (var i = 0; i < preTransforms.length; i++) {
          element = preTransforms[i](element, options) || element;
        }

        if (!inVPre) {
          processPre(element);
          if (element.pre) {
            inVPre = true;
          }
        }
        if (platformIsPreTag(element.tag)) {
          inPre = true;
        }
        if (inVPre) {
          processRawAttrs(element);
        } else if (!element.processed) {
          // structural directives
          processFor(element);
          processIf(element);
          processOnce(element);
        }

        if (!root) {
          root = element;
          {
            checkRootConstraints(root);
          }
        }

        if (!unary) {
          currentParent = element;
          stack.push(element);
        } else {
          closeElement(element);
        }
      },

      end: function end (tag, start, end$1) {
        var element = stack[stack.length - 1];
        // pop stack
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        if (options.outputSourceRange) {
          element.end = end$1;
        }
        closeElement(element);
      },

      chars: function chars (text, start, end) {
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce(
                'Component template requires a root element, rather than just text.',
                { start: start }
              );
            } else if ((text = text.trim())) {
              warnOnce(
                ("text \"" + text + "\" outside root element will be ignored."),
                { start: start }
              );
            }
          }
          return
        }
        // IE textarea placeholder bug
        /* istanbul ignore if */
        if (isIE &&
          currentParent.tag === 'textarea' &&
          currentParent.attrsMap.placeholder === text
        ) {
          return
        }
        var children = currentParent.children;
        if (inPre || text.trim()) {
          text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = '';
        } else if (whitespaceOption) {
          if (whitespaceOption === 'condense') {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            text = lineBreakRE.test(text) ? '' : ' ';
          } else {
            text = ' ';
          }
        } else {
          text = preserveWhitespace ? ' ' : '';
        }
        if (text) {
          if (!inPre && whitespaceOption === 'condense') {
            // condense consecutive whitespaces into single space
            text = text.replace(whitespaceRE$1, ' ');
          }
          var res;
          var child;
          if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text
            };
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            child = {
              type: 3,
              text: text
            };
          }
          if (child) {
            if (options.outputSourceRange) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },
      comment: function comment (text, start, end) {
        // adding anything as a sibling to the root node is forbidden
        // comments should still be allowed, but ignored
        if (currentParent) {
          var child = {
            type: 3,
            text: text,
            isComment: true
          };
          if (options.outputSourceRange) {
            child.start = start;
            child.end = end;
          }
          currentParent.children.push(child);
        }
      }
    });
    return root
  }

  function processPre (el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
      el.pre = true;
    }
  }

  function processRawAttrs (el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
      var attrs = el.attrs = new Array(len);
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value)
        };
        if (list[i].start != null) {
          attrs[i].start = list[i].start;
          attrs[i].end = list[i].end;
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      el.plain = true;
    }
  }

  function processElement (
    element,
    options
  ) {
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    element.plain = (
      !element.key &&
      !element.scopedSlots &&
      !element.attrsList.length
    );

    processRef(element);
    processSlotContent(element);
    processSlotOutlet(element);
    processComponent(element);
    for (var i = 0; i < transforms.length; i++) {
      element = transforms[i](element, options) || element;
    }
    processAttrs(element);
    return element
  }

  function processKey (el) {
    var exp = getBindingAttr(el, 'key');
    if (exp) {
      {
        if (el.tag === 'template') {
          warn$2(
            "<template> cannot be keyed. Place the key on real elements instead.",
            getRawBindingAttr(el, 'key')
          );
        }
        if (el.for) {
          var iterator = el.iterator2 || el.iterator1;
          var parent = el.parent;
          if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
            warn$2(
              "Do not use v-for index as key on <transition-group> children, " +
              "this is the same as not using keys.",
              getRawBindingAttr(el, 'key'),
              true /* tip */
            );
          }
        }
      }
      el.key = exp;
    }
  }

  function processRef (el) {
    var ref = getBindingAttr(el, 'ref');
    if (ref) {
      el.ref = ref;
      el.refInFor = checkInFor(el);
    }
  }

  function processFor (el) {
    var exp;
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
      var res = parseFor(exp);
      if (res) {
        extend(el, res);
      } else {
        warn$2(
          ("Invalid v-for expression: " + exp),
          el.rawAttrsMap['v-for']
        );
      }
    }
  }



  function parseFor (exp) {
    var inMatch = exp.match(forAliasRE);
    if (!inMatch) { return }
    var res = {};
    res.for = inMatch[2].trim();
    var alias = inMatch[1].trim().replace(stripParensRE, '');
    var iteratorMatch = alias.match(forIteratorRE);
    if (iteratorMatch) {
      res.alias = alias.replace(forIteratorRE, '').trim();
      res.iterator1 = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.iterator2 = iteratorMatch[2].trim();
      }
    } else {
      res.alias = alias;
    }
    return res
  }

  function processIf (el) {
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
      el.if = exp;
      addIfCondition(el, {
        exp: exp,
        block: el
      });
    } else {
      if (getAndRemoveAttr(el, 'v-else') != null) {
        el.else = true;
      }
      var elseif = getAndRemoveAttr(el, 'v-else-if');
      if (elseif) {
        el.elseif = elseif;
      }
    }
  }

  function processIfConditions (el, parent) {
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
      addIfCondition(prev, {
        exp: el.elseif,
        block: el
      });
    } else {
      warn$2(
        "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
        "used on element <" + (el.tag) + "> without corresponding v-if.",
        el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
      );
    }
  }

  function findPrevElement (children) {
    var i = children.length;
    while (i--) {
      if (children[i].type === 1) {
        return children[i]
      } else {
        if (children[i].text !== ' ') {
          warn$2(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
            "will be ignored.",
            children[i]
          );
        }
        children.pop();
      }
    }
  }

  function addIfCondition (el, condition) {
    if (!el.ifConditions) {
      el.ifConditions = [];
    }
    el.ifConditions.push(condition);
  }

  function processOnce (el) {
    var once$$1 = getAndRemoveAttr(el, 'v-once');
    if (once$$1 != null) {
      el.once = true;
    }
  }

  // handle content being passed to a component as slot,
  // e.g. <template slot="xxx">, <div slot-scope="xxx">
  function processSlotContent (el) {
    var slotScope;
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope');
      /* istanbul ignore if */
      if (slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          el.rawAttrsMap['scope'],
          true
        );
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if (el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          el.rawAttrsMap['slot-scope'],
          true
        );
      }
      el.slotScope = slotScope;
    }

    // slot="xxx"
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
      }
    }

    // 2.6 v-slot syntax
    {
      if (el.tag === 'template') {
        // v-slot on <template>
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding) {
          {
            if (el.slotTarget || el.slotScope) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            if (el.parent && !maybeComponent(el.parent)) {
              warn$2(
                "<template v-slot> can only appear at the root level inside " +
                "the receiving component",
                el
              );
            }
          }
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          el.slotTarget = name;
          el.slotTargetDynamic = dynamic;
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // v-slot on component, denotes default slot
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding$1) {
          {
            if (!maybeComponent(el)) {
              warn$2(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            if (el.slotScope || el.slotTarget) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            if (el.scopedSlots) {
              warn$2(
                "To avoid scope ambiguity, the default slot should also use " +
                "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          var slots = el.scopedSlots || (el.scopedSlots = {});
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          var slotContainer = slots[name$1] = createASTElement('template', [], el);
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;
          slotContainer.children = el.children.filter(function (c) {
            if (!c.slotScope) {
              c.parent = slotContainer;
              return true
            }
          });
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          el.children = [];
          // mark el non-plain so data gets generated
          el.plain = false;
        }
      }
    }
  }

  function getSlotName (binding) {
    var name = binding.name.replace(slotRE, '');
    if (!name) {
      if (binding.name[0] !== '#') {
        name = 'default';
      } else {
        warn$2(
          "v-slot shorthand syntax requires a slot name.",
          binding
        );
      }
    }
    return dynamicArgRE.test(name)
      // dynamic [name]
      ? { name: name.slice(1, -1), dynamic: true }
      // static name
      : { name: ("\"" + name + "\""), dynamic: false }
  }

  // handle <slot/> outlets
  function processSlotOutlet (el) {
    if (el.tag === 'slot') {
      el.slotName = getBindingAttr(el, 'name');
      if (el.key) {
        warn$2(
          "`key` does not work on <slot> because slots are abstract outlets " +
          "and can possibly expand into multiple elements. " +
          "Use the key on a wrapping element instead.",
          getRawBindingAttr(el, 'key')
        );
      }
    }
  }

  function processComponent (el) {
    var binding;
    if ((binding = getBindingAttr(el, 'is'))) {
      el.component = binding;
    }
    if (getAndRemoveAttr(el, 'inline-template') != null) {
      el.inlineTemplate = true;
    }
  }

  function processAttrs (el) {
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
      name = rawName = list[i].name;
      value = list[i].value;
      if (dirRE.test(name)) {
        // mark element as dynamic
        el.hasBindings = true;
        // modifiers
        modifiers = parseModifiers(name.replace(dirRE, ''));
        // support .foo shorthand syntax for the .prop modifier
        if (modifiers) {
          name = name.replace(modifierRE, '');
        }
        if (bindRE.test(name)) { // v-bind
          name = name.replace(bindRE, '');
          value = parseFilters(value);
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          if (
            value.trim().length === 0
          ) {
            warn$2(
              ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
            );
          }
          if (modifiers) {
            if (modifiers.prop && !isDynamic) {
              name = camelize(name);
              if (name === 'innerHtml') { name = 'innerHTML'; }
            }
            if (modifiers.camel && !isDynamic) {
              name = camelize(name);
            }
            if (modifiers.sync) {
              syncGen = genAssignmentCode(value, "$event");
              if (!isDynamic) {
                addHandler(
                  el,
                  ("update:" + (camelize(name))),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i]
                );
                if (hyphenate(name) !== camelize(name)) {
                  addHandler(
                    el,
                    ("update:" + (hyphenate(name))),
                    syncGen,
                    null,
                    false,
                    warn$2,
                    list[i]
                  );
                }
              } else {
                // handler w/ dynamic event name
                addHandler(
                  el,
                  ("\"update:\"+(" + name + ")"),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i],
                  true // dynamic
                );
              }
            }
          }
          if ((modifiers && modifiers.prop) || (
            !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
          )) {
            addProp(el, name, value, list[i], isDynamic);
          } else {
            addAttr(el, name, value, list[i], isDynamic);
          }
        } else if (onRE.test(name)) { // v-on
          name = name.replace(onRE, '');
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
        } else { // normal directives
          name = name.replace(dirRE, '');
          // parse arg
          var argMatch = name.match(argRE);
          var arg = argMatch && argMatch[1];
          isDynamic = false;
          if (arg) {
            name = name.slice(0, -(arg.length + 1));
            if (dynamicArgRE.test(arg)) {
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
          if (name === 'model') {
            checkForAliasModel(el, value);
          }
        }
      } else {
        // literal attribute
        {
          var res = parseText(value, delimiters);
          if (res) {
            warn$2(
              name + "=\"" + value + "\": " +
              'Interpolation inside attributes has been removed. ' +
              'Use v-bind or the colon shorthand instead. For example, ' +
              'instead of <div id="{{ val }}">, use <div :id="val">.',
              list[i]
            );
          }
        }
        addAttr(el, name, JSON.stringify(value), list[i]);
        // #6887 firefox doesn't update muted state if set via attribute
        // even immediately after element creation
        if (!el.component &&
            name === 'muted' &&
            platformMustUseProp(el.tag, el.attrsMap.type, name)) {
          addProp(el, name, 'true', list[i]);
        }
      }
    }
  }

  function checkInFor (el) {
    var parent = el;
    while (parent) {
      if (parent.for !== undefined) {
        return true
      }
      parent = parent.parent;
    }
    return false
  }

  function parseModifiers (name) {
    var match = name.match(modifierRE);
    if (match) {
      var ret = {};
      match.forEach(function (m) { ret[m.slice(1)] = true; });
      return ret
    }
  }

  function makeAttrsMap (attrs) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
      if (
        map[attrs[i].name] && !isIE && !isEdge
      ) {
        warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
      }
      map[attrs[i].name] = attrs[i].value;
    }
    return map
  }

  // for script (e.g. type="x/template") or style, do not decode content
  function isTextTag (el) {
    return el.tag === 'script' || el.tag === 'style'
  }

  function isForbiddenTag (el) {
    return (
      el.tag === 'style' ||
      (el.tag === 'script' && (
        !el.attrsMap.type ||
        el.attrsMap.type === 'text/javascript'
      ))
    )
  }

  var ieNSBug = /^xmlns:NS\d+/;
  var ieNSPrefix = /^NS\d+:/;

  /* istanbul ignore next */
  function guardIESVGBug (attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!ieNSBug.test(attr.name)) {
        attr.name = attr.name.replace(ieNSPrefix, '');
        res.push(attr);
      }
    }
    return res
  }

  function checkForAliasModel (el, value) {
    var _el = el;
    while (_el) {
      if (_el.for && _el.alias === value) {
        warn$2(
          "<" + (el.tag) + " v-model=\"" + value + "\">: " +
          "You are binding v-model directly to a v-for iteration alias. " +
          "This will not be able to modify the v-for source array because " +
          "writing to the alias is like modifying a function local variable. " +
          "Consider using an array of objects and use v-model on an object property instead.",
          el.rawAttrsMap['v-model']
        );
      }
      _el = _el.parent;
    }
  }

  /*  */

  function preTransformNode (el, options) {
    if (el.tag === 'input') {
      var map = el.attrsMap;
      if (!map['v-model']) {
        return
      }

      var typeBinding;
      if (map[':type'] || map['v-bind:type']) {
        typeBinding = getBindingAttr(el, 'type');
      }
      if (!map.type && !typeBinding && map['v-bind']) {
        typeBinding = "(" + (map['v-bind']) + ").type";
      }

      if (typeBinding) {
        var ifCondition = getAndRemoveAttr(el, 'v-if', true);
        var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
        var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
        var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
        // 1. checkbox
        var branch0 = cloneASTElement(el);
        // process for on the main node
        processFor(branch0);
        addRawAttr(branch0, 'type', 'checkbox');
        processElement(branch0, options);
        branch0.processed = true; // prevent it from double-processed
        branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
        addIfCondition(branch0, {
          exp: branch0.if,
          block: branch0
        });
        // 2. add radio else-if condition
        var branch1 = cloneASTElement(el);
        getAndRemoveAttr(branch1, 'v-for', true);
        addRawAttr(branch1, 'type', 'radio');
        processElement(branch1, options);
        addIfCondition(branch0, {
          exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
          block: branch1
        });
        // 3. other
        var branch2 = cloneASTElement(el);
        getAndRemoveAttr(branch2, 'v-for', true);
        addRawAttr(branch2, ':type', typeBinding);
        processElement(branch2, options);
        addIfCondition(branch0, {
          exp: ifCondition,
          block: branch2
        });

        if (hasElse) {
          branch0.else = true;
        } else if (elseIfCondition) {
          branch0.elseif = elseIfCondition;
        }

        return branch0
      }
    }
  }

  function cloneASTElement (el) {
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
  }

  var model$1 = {
    preTransformNode: preTransformNode
  };

  var modules$1 = [
    klass$1,
    style$1,
    model$1
  ];

  /*  */

  function text (el, dir) {
    if (dir.value) {
      addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  /*  */

  function html (el, dir) {
    if (dir.value) {
      addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  var directives$1 = {
    model: model,
    text: text,
    html: html
  };

  /*  */

  var baseOptions = {
    expectHTML: true,
    modules: modules$1,
    directives: directives$1,
    isPreTag: isPreTag,
    isUnaryTag: isUnaryTag,
    mustUseProp: mustUseProp,
    canBeLeftOpenTag: canBeLeftOpenTag,
    isReservedTag: isReservedTag,
    getTagNamespace: getTagNamespace,
    staticKeys: genStaticKeys(modules$1)
  };

  /*  */

  var isStaticKey;
  var isPlatformReservedTag;

  var genStaticKeysCached = cached(genStaticKeys$1);

  /**
   * Goal of the optimizer: walk the generated template AST tree
   * and detect sub-trees that are purely static, i.e. parts of
   * the DOM that never needs to change.
   *
   * Once we detect these sub-trees, we can:
   *
   * 1. Hoist them into constants, so that we no longer need to
   *    create fresh nodes for them on each re-render;
   * 2. Completely skip them in the patching process.
   */
  function optimize (root, options) {
    if (!root) { return }
    isStaticKey = genStaticKeysCached(options.staticKeys || '');
    isPlatformReservedTag = options.isReservedTag || no;
    // first pass: mark all non-static nodes.
    markStatic$1(root);
    // second pass: mark static roots.
    markStaticRoots(root, false);
  }

  function genStaticKeys$1 (keys) {
    return makeMap(
      'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
      (keys ? ',' + keys : '')
    )
  }

  function markStatic$1 (node) {
    node.static = isStatic(node);
    if (node.type === 1) {
      // do not make component slot content static. this avoids
      // 1. components not able to mutate slot nodes
      // 2. static slot content fails for hot-reloading
      if (
        !isPlatformReservedTag(node.tag) &&
        node.tag !== 'slot' &&
        node.attrsMap['inline-template'] == null
      ) {
        return
      }
      for (var i = 0, l = node.children.length; i < l; i++) {
        var child = node.children[i];
        markStatic$1(child);
        if (!child.static) {
          node.static = false;
        }
      }
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          var block = node.ifConditions[i$1].block;
          markStatic$1(block);
          if (!block.static) {
            node.static = false;
          }
        }
      }
    }
  }

  function markStaticRoots (node, isInFor) {
    if (node.type === 1) {
      if (node.static || node.once) {
        node.staticInFor = isInFor;
      }
      // For a node to qualify as a static root, it should have children that
      // are not just static text. Otherwise the cost of hoisting out will
      // outweigh the benefits and it's better off to just always render it fresh.
      if (node.static && node.children.length && !(
        node.children.length === 1 &&
        node.children[0].type === 3
      )) {
        node.staticRoot = true;
        return
      } else {
        node.staticRoot = false;
      }
      if (node.children) {
        for (var i = 0, l = node.children.length; i < l; i++) {
          markStaticRoots(node.children[i], isInFor || !!node.for);
        }
      }
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          markStaticRoots(node.ifConditions[i$1].block, isInFor);
        }
      }
    }
  }

  function isStatic (node) {
    if (node.type === 2) { // expression
      return false
    }
    if (node.type === 3) { // text
      return true
    }
    return !!(node.pre || (
      !node.hasBindings && // no dynamic bindings
      !node.if && !node.for && // not v-if or v-for or v-else
      !isBuiltInTag(node.tag) && // not a built-in
      isPlatformReservedTag(node.tag) && // not a component
      !isDirectChildOfTemplateFor(node) &&
      Object.keys(node).every(isStaticKey)
    ))
  }

  function isDirectChildOfTemplateFor (node) {
    while (node.parent) {
      node = node.parent;
      if (node.tag !== 'template') {
        return false
      }
      if (node.for) {
        return true
      }
    }
    return false
  }

  /*  */

  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // KeyboardEvent.keyCode aliases
  var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
  };

  // KeyboardEvent.key aliases
  var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
  };

  // #4868: modifiers that prevent the execution of the listener
  // need to explicitly return null so that we can determine whether to remove
  // the listener for .once
  var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

  var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
  };

  function genHandlers (
    events,
    isNative
  ) {
    var prefix = isNative ? 'nativeOn:' : 'on:';
    var staticHandlers = "";
    var dynamicHandlers = "";
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        dynamicHandlers += name + "," + handlerCode + ",";
      } else {
        staticHandlers += "\"" + name + "\":" + handlerCode + ",";
      }
    }
    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
    if (dynamicHandlers) {
      return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
      return prefix + staticHandlers
    }
  }

  function genHandler (handler) {
    if (!handler) {
      return 'function(){}'
    }

    if (Array.isArray(handler)) {
      return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + "($event)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ")($event)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
  }

  function genKeyFilter (keys) {
    return (
      // make sure the key filters only apply to KeyboardEvents
      // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
      // key events that do not have keyCode property...
      "if(!$event.type.indexOf('key')&&" +
      (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
  }

  function genFilterCode (key) {
    var keyVal = parseInt(key, 10);
    if (keyVal) {
      return ("$event.keyCode!==" + keyVal)
    }
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
      "_k($event.keyCode," +
      (JSON.stringify(key)) + "," +
      (JSON.stringify(keyCode)) + "," +
      "$event.key," +
      "" + (JSON.stringify(keyName)) +
      ")"
    )
  }

  /*  */

  function on (el, dir) {
    if (dir.modifiers) {
      warn("v-on without argument does not support modifiers.");
    }
    el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
  }

  /*  */

  function bind$1 (el, dir) {
    el.wrapData = function (code) {
      return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
    };
  }

  /*  */

  var baseDirectives = {
    on: on,
    bind: bind$1,
    cloak: noop
  };

  /*  */





  var CodegenState = function CodegenState (options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
    var isReservedTag = options.isReservedTag || no;
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    this.onceId = 0;
    this.staticRenderFns = [];
    this.pre = false;
  };



  function generate (
    ast,
    options
  ) {
    var state = new CodegenState(options);
    var code = ast ? genElement(ast, state) : '_c("div")';
    return {
      render: ("with(this){return " + code + "}"),
      staticRenderFns: state.staticRenderFns
    }
  }

  function genElement (el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }

    if (el.staticRoot && !el.staticProcessed) {
      return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
      return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
      return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
      return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
      return genSlot(el, state)
    } else {
      // component or element
      var code;
      if (el.component) {
        code = genComponent(el.component, el, state);
      } else {
        var data;
        if (!el.plain || (el.pre && state.maybeComponent(el))) {
          data = genData$2(el, state);
        }

        var children = el.inlineTemplate ? null : genChildren(el, state, true);
        code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
      }
      // module transforms
      for (var i = 0; i < state.transforms.length; i++) {
        code = state.transforms[i](el, code);
      }
      return code
    }
  }

  // hoist static sub-trees out
  function genStatic (el, state) {
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
      state.pre = el.pre;
    }
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
  }

  // v-once
  function genOnce (el, state) {
    el.onceProcessed = true;
    if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.staticInFor) {
      var key = '';
      var parent = el.parent;
      while (parent) {
        if (parent.for) {
          key = parent.key;
          break
        }
        parent = parent.parent;
      }
      if (!key) {
        state.warn(
          "v-once can only be used inside v-for that is keyed. ",
          el.rawAttrsMap['v-once']
        );
        return genElement(el, state)
      }
      return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
      return genStatic(el, state)
    }
  }

  function genIf (
    el,
    state,
    altGen,
    altEmpty
  ) {
    el.ifProcessed = true; // avoid recursion
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
  }

  function genIfConditions (
    conditions,
    state,
    altGen,
    altEmpty
  ) {
    if (!conditions.length) {
      return altEmpty || '_e()'
    }

    var condition = conditions.shift();
    if (condition.exp) {
      return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
      return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once
          ? genOnce(el, state)
          : genElement(el, state)
    }
  }

  function genFor (
    el,
    state,
    altGen,
    altHelper
  ) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    if (state.maybeComponent(el) &&
      el.tag !== 'slot' &&
      el.tag !== 'template' &&
      !el.key
    ) {
      state.warn(
        "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
        "v-for should have explicit keys. " +
        "See https://vuejs.org/guide/list.html#key for more info.",
        el.rawAttrsMap['v-for'],
        true /* tip */
      );
    }

    el.forProcessed = true; // avoid recursion
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
  }

  function genData$2 (el, state) {
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    var dirs = genDirectives(el, state);
    if (dirs) { data += dirs + ','; }

    // key
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // ref
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // pre
    if (el.pre) {
      data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }

  function genDirectives (el, state) {
    var dirs = el.directives;
    if (!dirs) { return }
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      var gen = state.directives[dir.name];
      if (gen) {
        // compile-time directive that manipulates AST.
        // returns true if it also needs a runtime counterpart.
        needRuntime = !!gen(el, dir, state.warn);
      }
      if (needRuntime) {
        hasRuntime = true;
        res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
      }
    }
    if (hasRuntime) {
      return res.slice(0, -1) + ']'
    }
  }

  function genInlineTemplate (el, state) {
    var ast = el.children[0];
    if (el.children.length !== 1 || ast.type !== 1) {
      state.warn(
        'Inline-template components must have exactly one child element.',
        { start: el.start }
      );
    }
    if (ast && ast.type === 1) {
      var inlineRenderFns = generate(ast, state.options);
      return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
  }

  function genScopedSlots (
    el,
    slots,
    state
  ) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
      var slot = slots[key];
      return (
        slot.slotTargetDynamic ||
        slot.if ||
        slot.for ||
        containsSlotChild(slot) // is passing down slot from parent which may be dynamic
      )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    if (!needsForceUpdate) {
      var parent = el.parent;
      while (parent) {
        if (
          (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
          parent.for
        ) {
          needsForceUpdate = true;
          break
        }
        if (parent.if) {
          needsKey = true;
        }
        parent = parent.parent;
      }
    }

    var generatedSlots = Object.keys(slots)
      .map(function (key) { return genScopedSlot(slots[key], state); })
      .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
  }

  function hash(str) {
    var hash = 5381;
    var i = str.length;
    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
  }

  function containsSlotChild (el) {
    if (el.type === 1) {
      if (el.tag === 'slot') {
        return true
      }
      return el.children.some(containsSlotChild)
    }
    return false
  }

  function genScopedSlot (
    el,
    state
  ) {
    var isLegacySyntax = el.attrsMap['slot-scope'];
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
      return genIf(el, state, genScopedSlot, "null")
    }
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genScopedSlot)
    }
    var slotScope = el.slotScope === emptySlotScopeToken
      ? ""
      : String(el.slotScope);
    var fn = "function(" + slotScope + "){" +
      "return " + (el.tag === 'template'
        ? el.if && isLegacySyntax
          ? ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined")
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)) + "}";
    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";
    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
  }

  function genChildren (
    el,
    state,
    checkSkip,
    altGenElement,
    altGenNode
  ) {
    var children = el.children;
    if (children.length) {
      var el$1 = children[0];
      // optimize single v-for
      if (children.length === 1 &&
        el$1.for &&
        el$1.tag !== 'template' &&
        el$1.tag !== 'slot'
      ) {
        var normalizationType = checkSkip
          ? state.maybeComponent(el$1) ? ",1" : ",0"
          : "";
        return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
      }
      var normalizationType$1 = checkSkip
        ? getNormalizationType(children, state.maybeComponent)
        : 0;
      var gen = altGenNode || genNode;
      return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
  }

  // determine the normalization needed for the children array.
  // 0: no normalization needed
  // 1: simple normalization needed (possible 1-level deep nested array)
  // 2: full normalization needed
  function getNormalizationType (
    children,
    maybeComponent
  ) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.type !== 1) {
        continue
      }
      if (needsNormalization(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
        res = 2;
        break
      }
      if (maybeComponent(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
        res = 1;
      }
    }
    return res
  }

  function needsNormalization (el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
  }

  function genNode (node, state) {
    if (node.type === 1) {
      return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
      return genComment(node)
    } else {
      return genText(node)
    }
  }

  function genText (text) {
    return ("_v(" + (text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
  }

  function genComment (comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
  }

  function genSlot (el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state);
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind$$1 = el.attrsMap['v-bind'];
    if ((attrs || bind$$1) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind$$1) {
      res += (attrs ? '' : ',null') + "," + bind$$1;
    }
    return res + ')'
  }

  // componentName is el.component, take it as argument to shun flow's pessimistic refinement
  function genComponent (
    componentName,
    el,
    state
  ) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
  }

  function genProps (props) {
    var staticProps = "";
    var dynamicProps = "";
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value = transformSpecialNewlines(prop.value);
      if (prop.dynamic) {
        dynamicProps += (prop.name) + "," + value + ",";
      } else {
        staticProps += "\"" + (prop.name) + "\":" + value + ",";
      }
    }
    staticProps = "{" + (staticProps.slice(0, -1)) + "}";
    if (dynamicProps) {
      return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
      return staticProps
    }
  }

  // #3895, #4268
  function transformSpecialNewlines (text) {
    return text
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  /*  */



  // these keywords should not appear inside expressions, but operators like
  // typeof, instanceof and in are allowed
  var prohibitedKeywordRE = new RegExp('\\b' + (
    'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
    'super,throw,while,yield,delete,export,import,return,switch,default,' +
    'extends,finally,continue,debugger,function,arguments'
  ).split(',').join('\\b|\\b') + '\\b');

  // these unary operators should not be used as property/method names
  var unaryOperatorsRE = new RegExp('\\b' + (
    'delete,typeof,void'
  ).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

  // strip strings in expressions
  var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

  // detect problematic expressions in a template
  function detectErrors (ast, warn) {
    if (ast) {
      checkNode(ast, warn);
    }
  }

  function checkNode (node, warn) {
    if (node.type === 1) {
      for (var name in node.attrsMap) {
        if (dirRE.test(name)) {
          var value = node.attrsMap[name];
          if (value) {
            var range = node.rawAttrsMap[name];
            if (name === 'v-for') {
              checkFor(node, ("v-for=\"" + value + "\""), warn, range);
            } else if (name === 'v-slot' || name[0] === '#') {
              checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
            } else if (onRE.test(name)) {
              checkEvent(value, (name + "=\"" + value + "\""), warn, range);
            } else {
              checkExpression(value, (name + "=\"" + value + "\""), warn, range);
            }
          }
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn);
        }
      }
    } else if (node.type === 2) {
      checkExpression(node.expression, node.text, warn, node);
    }
  }

  function checkEvent (exp, text, warn, range) {
    var stripped = exp.replace(stripStringRE, '');
    var keywordMatch = stripped.match(unaryOperatorsRE);
    if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
      warn(
        "avoid using JavaScript unary operator as property name: " +
        "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
        range
      );
    }
    checkExpression(exp, text, warn, range);
  }

  function checkFor (node, text, warn, range) {
    checkExpression(node.for || '', text, warn, range);
    checkIdentifier(node.alias, 'v-for alias', text, warn, range);
    checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
    checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
  }

  function checkIdentifier (
    ident,
    type,
    text,
    warn,
    range
  ) {
    if (typeof ident === 'string') {
      try {
        new Function(("var " + ident + "=_"));
      } catch (e) {
        warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
      }
    }
  }

  function checkExpression (exp, text, warn, range) {
    try {
      new Function(("return " + exp));
    } catch (e) {
      var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
      if (keywordMatch) {
        warn(
          "avoid using JavaScript keyword as property name: " +
          "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
          range
        );
      } else {
        warn(
          "invalid expression: " + (e.message) + " in\n\n" +
          "    " + exp + "\n\n" +
          "  Raw expression: " + (text.trim()) + "\n",
          range
        );
      }
    }
  }

  function checkFunctionParameterExpression (exp, text, warn, range) {
    try {
      new Function(exp, '');
    } catch (e) {
      warn(
        "invalid function parameter expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }

  /*  */

  var range = 2;

  function generateCodeFrame (
    source,
    start,
    end
  ) {
    if ( start === void 0 ) start = 0;
    if ( end === void 0 ) end = source.length;

    var lines = source.split(/\r?\n/);
    var count = 0;
    var res = [];
    for (var i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (var j = i - range; j <= i + range || end > count; j++) {
          if (j < 0 || j >= lines.length) { continue }
          res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
          var lineLength = lines[j].length;
          if (j === i) {
            // push underline
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push("   |  " + repeat$1("^", length$1));
            }
            count += lineLength + 1;
          }
        }
        break
      }
    }
    return res.join('\n')
  }

  function repeat$1 (str, n) {
    var result = '';
    if (n > 0) {
      while (true) { // eslint-disable-line
        if (n & 1) { result += str; }
        n >>>= 1;
        if (n <= 0) { break }
        str += str;
      }
    }
    return result
  }

  /*  */



  function createFunction (code, errors) {
    try {
      return new Function(code)
    } catch (err) {
      errors.push({ err: err, code: code });
      return noop
    }
  }

  function createCompileToFunctionFn (compile) {
    var cache = Object.create(null);

    return function compileToFunctions (
      template,
      options,
      vm
    ) {
      options = extend({}, options);
      var warn$$1 = options.warn || warn;
      delete options.warn;

      /* istanbul ignore if */
      {
        // detect possible CSP restriction
        try {
          new Function('return 1');
        } catch (e) {
          if (e.toString().match(/unsafe-eval|CSP/)) {
            warn$$1(
              'It seems you are using the standalone build of Vue.js in an ' +
              'environment with Content Security Policy that prohibits unsafe-eval. ' +
              'The template compiler cannot work in this environment. Consider ' +
              'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
              'templates into render functions.'
            );
          }
        }
      }

      // check cache
      var key = options.delimiters
        ? String(options.delimiters) + template
        : template;
      if (cache[key]) {
        return cache[key]
      }

      // compile
      var compiled = compile(template, options);

      // check compilation errors/tips
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$$1(
                "Error compiling template:\n\n" + (e.msg) + "\n\n" +
                generateCodeFrame(template, e.start, e.end),
                vm
              );
            });
          } else {
            warn$$1(
              "Error compiling template:\n\n" + template + "\n\n" +
              compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
          } else {
            compiled.tips.forEach(function (msg) { return tip(msg, vm); });
          }
        }
      }

      // turn code into functions
      var res = {};
      var fnGenErrors = [];
      res.render = createFunction(compiled.render, fnGenErrors);
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors)
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$$1(
            "Failed to generate render function:\n\n" +
            fnGenErrors.map(function (ref) {
              var err = ref.err;
              var code = ref.code;

              return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
            vm
          );
        }
      }

      return (cache[key] = res)
    }
  }

  /*  */

  function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
      function compile (
        template,
        options
      ) {
        var finalOptions = Object.create(baseOptions);
        var errors = [];
        var tips = [];

        var warn = function (msg, range, tip) {
          (tip ? tips : errors).push(msg);
        };

        if (options) {
          if (options.outputSourceRange) {
            // $flow-disable-line
            var leadingSpaceLength = template.match(/^\s*/)[0].length;

            warn = function (msg, range, tip) {
              var data = { msg: msg };
              if (range) {
                if (range.start != null) {
                  data.start = range.start + leadingSpaceLength;
                }
                if (range.end != null) {
                  data.end = range.end + leadingSpaceLength;
                }
              }
              (tip ? tips : errors).push(data);
            };
          }
          // merge custom modules
          if (options.modules) {
            finalOptions.modules =
              (baseOptions.modules || []).concat(options.modules);
          }
          // merge custom directives
          if (options.directives) {
            finalOptions.directives = extend(
              Object.create(baseOptions.directives || null),
              options.directives
            );
          }
          // copy other options
          for (var key in options) {
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        finalOptions.warn = warn;

        var compiled = baseCompile(template.trim(), finalOptions);
        {
          detectErrors(compiled.ast, warn);
        }
        compiled.errors = errors;
        compiled.tips = tips;
        return compiled
      }

      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile)
      }
    }
  }

  /*  */

  // `createCompilerCreator` allows creating compilers that use alternative
  // parser/optimizer/codegen, e.g the SSR optimizing compiler.
  // Here we just export a default compiler using the default parts.
  var createCompiler = createCompilerCreator(function baseCompile (
    template,
    options
  ) {
    var ast = parse(template.trim(), options);
    if (options.optimize !== false) {
      optimize(ast, options);
    }
    var code = generate(ast, options);
    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  });

  /*  */

  var ref$1 = createCompiler(baseOptions);
  var compile = ref$1.compile;
  var compileToFunctions = ref$1.compileToFunctions;

  /*  */

  // check whether current browser encodes a char inside attribute values
  var div;
  function getShouldDecode (href) {
    div = div || document.createElement('div');
    div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
    return div.innerHTML.indexOf('&#10;') > 0
  }

  // #3663: IE encodes newlines inside attribute values while other browsers don't
  var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
  // #6828: chrome encodes content in a[href]
  var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

  /*  */

  var idToTemplate = cached(function (id) {
    var el = query(id);
    return el && el.innerHTML
  });

  var mount = Vue.prototype.$mount;
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && query(el);

    /* istanbul ignore if */
    if (el === document.body || el === document.documentElement) {
      warn(
        "Do not mount Vue to <html> or <body> - mount to normal elements instead."
      );
      return this
    }

    var options = this.$options;
    // resolve template/el and convert to render function
    if (!options.render) {
      var template = options.template;
      if (template) {
        if (typeof template === 'string') {
          if (template.charAt(0) === '#') {
            template = idToTemplate(template);
            /* istanbul ignore if */
            if (!template) {
              warn(
                ("Template element not found or is empty: " + (options.template)),
                this
              );
            }
          }
        } else if (template.nodeType) {
          template = template.innerHTML;
        } else {
          {
            warn('invalid template option:' + template, this);
          }
          return this
        }
      } else if (el) {
        template = getOuterHTML(el);
      }
      if (template) {
        /* istanbul ignore if */
        if (config.performance && mark) {
          mark('compile');
        }

        var ref = compileToFunctions(template, {
          outputSourceRange: "development" !== 'production',
          shouldDecodeNewlines: shouldDecodeNewlines,
          shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        }, this);
        var render = ref.render;
        var staticRenderFns = ref.staticRenderFns;
        options.render = render;
        options.staticRenderFns = staticRenderFns;

        /* istanbul ignore if */
        if (config.performance && mark) {
          mark('compile end');
          measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
        }
      }
    }
    return mount.call(this, el, hydrating)
  };

  /**
   * Get outerHTML of elements, taking care
   * of SVG elements in IE as well.
   */
  function getOuterHTML (el) {
    if (el.outerHTML) {
      return el.outerHTML
    } else {
      var container = document.createElement('div');
      container.appendChild(el.cloneNode(true));
      return container.innerHTML
    }
  }

  Vue.compile = compileToFunctions;

  return Vue;

}));
/*!
  * vue-router v3.5.1
  * (c) 2021 Evan You
  * @license MIT
  */
(function (global, factory) {
  window.VueRouter = factory();
  /*
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.VueRouter = factory());
  */
}(this, (function () { 'use strict';

  /*  */

  function assert (condition, message) {
    if (!condition) {
      throw new Error(("[vue-router] " + message))
    }
  }

  function warn (condition, message) {
    if ( !condition) {
      typeof console !== 'undefined' && console.warn(("[vue-router] " + message));
    }
  }

  function extend (a, b) {
    for (var key in b) {
      a[key] = b[key];
    }
    return a
  }

  /*  */

  var encodeReserveRE = /[!'()*]/g;
  var encodeReserveReplacer = function (c) { return '%' + c.charCodeAt(0).toString(16); };
  var commaRE = /%2C/g;

  // fixed encodeURIComponent which is more conformant to RFC3986:
  // - escapes [!'()*]
  // - preserve commas
  var encode = function (str) { return encodeURIComponent(str)
      .replace(encodeReserveRE, encodeReserveReplacer)
      .replace(commaRE, ','); };

  function decode (str) {
    try {
      return decodeURIComponent(str)
    } catch (err) {
      {
        warn(false, ("Error decoding \"" + str + "\". Leaving it intact."));
      }
    }
    return str
  }

  function resolveQuery (
    query,
    extraQuery,
    _parseQuery
  ) {
    if ( extraQuery === void 0 ) extraQuery = {};

    var parse = _parseQuery || parseQuery;
    var parsedQuery;
    try {
      parsedQuery = parse(query || '');
    } catch (e) {
       warn(false, e.message);
      parsedQuery = {};
    }
    for (var key in extraQuery) {
      var value = extraQuery[key];
      parsedQuery[key] = Array.isArray(value)
        ? value.map(castQueryParamValue)
        : castQueryParamValue(value);
    }
    return parsedQuery
  }

  var castQueryParamValue = function (value) { return (value == null || typeof value === 'object' ? value : String(value)); };

  function parseQuery (query) {
    var res = {};

    query = query.trim().replace(/^(\?|#|&)/, '');

    if (!query) {
      return res
    }

    query.split('&').forEach(function (param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = decode(parts.shift());
      var val = parts.length > 0 ? decode(parts.join('=')) : null;

      if (res[key] === undefined) {
        res[key] = val;
      } else if (Array.isArray(res[key])) {
        res[key].push(val);
      } else {
        res[key] = [res[key], val];
      }
    });

    return res
  }

  function stringifyQuery (obj) {
    var res = obj
      ? Object.keys(obj)
        .map(function (key) {
          var val = obj[key];

          if (val === undefined) {
            return ''
          }

          if (val === null) {
            return encode(key)
          }

          if (Array.isArray(val)) {
            var result = [];
            val.forEach(function (val2) {
              if (val2 === undefined) {
                return
              }
              if (val2 === null) {
                result.push(encode(key));
              } else {
                result.push(encode(key) + '=' + encode(val2));
              }
            });
            return result.join('&')
          }

          return encode(key) + '=' + encode(val)
        })
        .filter(function (x) { return x.length > 0; })
        .join('&')
      : null;
    return res ? ("?" + res) : ''
  }

  /*  */

  var trailingSlashRE = /\/?$/;

  function createRoute (
    record,
    location,
    redirectedFrom,
    router
  ) {
    var stringifyQuery = router && router.options.stringifyQuery;

    var query = location.query || {};
    try {
      query = clone(query);
    } catch (e) {}

    var route = {
      name: location.name || (record && record.name),
      meta: (record && record.meta) || {},
      path: location.path || '/',
      hash: location.hash || '',
      query: query,
      params: location.params || {},
      fullPath: getFullPath(location, stringifyQuery),
      matched: record ? formatMatch(record) : []
    };
    if (redirectedFrom) {
      route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery);
    }
    return Object.freeze(route)
  }

  function clone (value) {
    if (Array.isArray(value)) {
      return value.map(clone)
    } else if (value && typeof value === 'object') {
      var res = {};
      for (var key in value) {
        res[key] = clone(value[key]);
      }
      return res
    } else {
      return value
    }
  }

  // the starting route that represents the initial state
  var START = createRoute(null, {
    path: '/'
  });

  function formatMatch (record) {
    var res = [];
    while (record) {
      res.unshift(record);
      record = record.parent;
    }
    return res
  }

  function getFullPath (
    ref,
    _stringifyQuery
  ) {
    var path = ref.path;
    var query = ref.query; if ( query === void 0 ) query = {};
    var hash = ref.hash; if ( hash === void 0 ) hash = '';

    var stringify = _stringifyQuery || stringifyQuery;
    return (path || '/') + stringify(query) + hash
  }

  function isSameRoute (a, b, onlyPath) {
    if (b === START) {
      return a === b
    } else if (!b) {
      return false
    } else if (a.path && b.path) {
      return a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') && (onlyPath ||
        a.hash === b.hash &&
        isObjectEqual(a.query, b.query))
    } else if (a.name && b.name) {
      return (
        a.name === b.name &&
        (onlyPath || (
          a.hash === b.hash &&
        isObjectEqual(a.query, b.query) &&
        isObjectEqual(a.params, b.params))
        )
      )
    } else {
      return false
    }
  }

  function isObjectEqual (a, b) {
    if ( a === void 0 ) a = {};
    if ( b === void 0 ) b = {};

    // handle null value #1566
    if (!a || !b) { return a === b }
    var aKeys = Object.keys(a).sort();
    var bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) {
      return false
    }
    return aKeys.every(function (key, i) {
      var aVal = a[key];
      var bKey = bKeys[i];
      if (bKey !== key) { return false }
      var bVal = b[key];
      // query values can be null and undefined
      if (aVal == null || bVal == null) { return aVal === bVal }
      // check nested equality
      if (typeof aVal === 'object' && typeof bVal === 'object') {
        return isObjectEqual(aVal, bVal)
      }
      return String(aVal) === String(bVal)
    })
  }

  function isIncludedRoute (current, target) {
    return (
      current.path.replace(trailingSlashRE, '/').indexOf(
        target.path.replace(trailingSlashRE, '/')
      ) === 0 &&
      (!target.hash || current.hash === target.hash) &&
      queryIncludes(current.query, target.query)
    )
  }

  function queryIncludes (current, target) {
    for (var key in target) {
      if (!(key in current)) {
        return false
      }
    }
    return true
  }

  function handleRouteEntered (route) {
    for (var i = 0; i < route.matched.length; i++) {
      var record = route.matched[i];
      for (var name in record.instances) {
        var instance = record.instances[name];
        var cbs = record.enteredCbs[name];
        if (!instance || !cbs) { continue }
        delete record.enteredCbs[name];
        for (var i$1 = 0; i$1 < cbs.length; i$1++) {
          if (!instance._isBeingDestroyed) { cbs[i$1](instance); }
        }
      }
    }
  }

  var View = {
    name: 'RouterView',
    functional: true,
    props: {
      name: {
        type: String,
        default: 'default'
      }
    },
    render: function render (_, ref) {
      var props = ref.props;
      var children = ref.children;
      var parent = ref.parent;
      var data = ref.data;

      // used by devtools to display a router-view badge
      data.routerView = true;

      // directly use parent context's createElement() function
      // so that components rendered by router-view can resolve named slots
      var h = parent.$createElement;
      var name = props.name;
      var route = parent.$route;
      var cache = parent._routerViewCache || (parent._routerViewCache = {});

      // determine current view depth, also check to see if the tree
      // has been toggled inactive but kept-alive.
      var depth = 0;
      var inactive = false;
      while (parent && parent._routerRoot !== parent) {
        var vnodeData = parent.$vnode ? parent.$vnode.data : {};
        if (vnodeData.routerView) {
          depth++;
        }
        if (vnodeData.keepAlive && parent._directInactive && parent._inactive) {
          inactive = true;
        }
        parent = parent.$parent;
      }
      data.routerViewDepth = depth;

      // render previous view if the tree is inactive and kept-alive
      if (inactive) {
        var cachedData = cache[name];
        var cachedComponent = cachedData && cachedData.component;
        if (cachedComponent) {
          // #2301
          // pass props
          if (cachedData.configProps) {
            fillPropsinData(cachedComponent, data, cachedData.route, cachedData.configProps);
          }
          return h(cachedComponent, data, children)
        } else {
          // render previous empty view
          return h()
        }
      }

      var matched = route.matched[depth];
      var component = matched && matched.components[name];

      // render empty node if no matched route or no config component
      if (!matched || !component) {
        cache[name] = null;
        return h()
      }

      // cache component
      cache[name] = { component: component };

      // attach instance registration hook
      // this will be called in the instance's injected lifecycle hooks
      data.registerRouteInstance = function (vm, val) {
        // val could be undefined for unregistration
        var current = matched.instances[name];
        if (
          (val && current !== vm) ||
          (!val && current === vm)
        ) {
          matched.instances[name] = val;
        }
      }

      // also register instance in prepatch hook
      // in case the same component instance is reused across different routes
      ;(data.hook || (data.hook = {})).prepatch = function (_, vnode) {
        matched.instances[name] = vnode.componentInstance;
      };

      // register instance in init hook
      // in case kept-alive component be actived when routes changed
      data.hook.init = function (vnode) {
        if (vnode.data.keepAlive &&
          vnode.componentInstance &&
          vnode.componentInstance !== matched.instances[name]
        ) {
          matched.instances[name] = vnode.componentInstance;
        }

        // if the route transition has already been confirmed then we weren't
        // able to call the cbs during confirmation as the component was not
        // registered yet, so we call it here.
        handleRouteEntered(route);
      };

      var configProps = matched.props && matched.props[name];
      // save route and configProps in cache
      if (configProps) {
        extend(cache[name], {
          route: route,
          configProps: configProps
        });
        fillPropsinData(component, data, route, configProps);
      }

      return h(component, data, children)
    }
  };

  function fillPropsinData (component, data, route, configProps) {
    // resolve props
    var propsToPass = data.props = resolveProps(route, configProps);
    if (propsToPass) {
      // clone to prevent mutation
      propsToPass = data.props = extend({}, propsToPass);
      // pass non-declared props as attrs
      var attrs = data.attrs = data.attrs || {};
      for (var key in propsToPass) {
        if (!component.props || !(key in component.props)) {
          attrs[key] = propsToPass[key];
          delete propsToPass[key];
        }
      }
    }
  }

  function resolveProps (route, config) {
    switch (typeof config) {
      case 'undefined':
        return
      case 'object':
        return config
      case 'function':
        return config(route)
      case 'boolean':
        return config ? route.params : undefined
      default:
        {
          warn(
            false,
            "props in \"" + (route.path) + "\" is a " + (typeof config) + ", " +
            "expecting an object, function or boolean."
          );
        }
    }
  }

  /*  */

  function resolvePath (
    relative,
    base,
    append
  ) {
    var firstChar = relative.charAt(0);
    if (firstChar === '/') {
      return relative
    }

    if (firstChar === '?' || firstChar === '#') {
      return base + relative
    }

    var stack = base.split('/');

    // remove trailing segment if:
    // - not appending
    // - appending to trailing slash (last segment is empty)
    if (!append || !stack[stack.length - 1]) {
      stack.pop();
    }

    // resolve relative path
    var segments = relative.replace(/^\//, '').split('/');
    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i];
      if (segment === '..') {
        stack.pop();
      } else if (segment !== '.') {
        stack.push(segment);
      }
    }

    // ensure leading slash
    if (stack[0] !== '') {
      stack.unshift('');
    }

    return stack.join('/')
  }

  function parsePath (path) {
    var hash = '';
    var query = '';

    var hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
      hash = path.slice(hashIndex);
      path = path.slice(0, hashIndex);
    }

    var queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      query = path.slice(queryIndex + 1);
      path = path.slice(0, queryIndex);
    }

    return {
      path: path,
      query: query,
      hash: hash
    }
  }

  function cleanPath (path) {
    return path.replace(/\/\//g, '/')
  }

  var isarray = Array.isArray || function (arr) {
    return Object.prototype.toString.call(arr) == '[object Array]';
  };

  /**
   * Expose `pathToRegexp`.
   */
  var pathToRegexp_1 = pathToRegexp;
  var parse_1 = parse;
  var compile_1 = compile;
  var tokensToFunction_1 = tokensToFunction;
  var tokensToRegExp_1 = tokensToRegExp;

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
    // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
    '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
  ].join('|'), 'g');

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string}  str
   * @param  {Object=} options
   * @return {!Array}
   */
  function parse (str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = options && options.delimiter || '/';
    var res;

    while ((res = PATH_REGEXP.exec(str)) != null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1];
        continue
      }

      var next = str[index];
      var prefix = res[2];
      var name = res[3];
      var capture = res[4];
      var group = res[5];
      var modifier = res[6];
      var asterisk = res[7];

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path);
        path = '';
      }

      var partial = prefix != null && next != null && next !== prefix;
      var repeat = modifier === '+' || modifier === '*';
      var optional = modifier === '?' || modifier === '*';
      var delimiter = res[2] || defaultDelimiter;
      var pattern = capture || group;

      tokens.push({
        name: name || key++,
        prefix: prefix || '',
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        asterisk: !!asterisk,
        pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
      });
    }

    // Match any characters still remaining.
    if (index < str.length) {
      path += str.substr(index);
    }

    // If the path exists, push it onto the end.
    if (path) {
      tokens.push(path);
    }

    return tokens
  }

  /**
   * Compile a string to a template function for the path.
   *
   * @param  {string}             str
   * @param  {Object=}            options
   * @return {!function(Object=, Object=)}
   */
  function compile (str, options) {
    return tokensToFunction(parse(str, options), options)
  }

  /**
   * Prettier encoding of URI path segments.
   *
   * @param  {string}
   * @return {string}
   */
  function encodeURIComponentPretty (str) {
    return encodeURI(str).replace(/[\/?#]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase()
    })
  }

  /**
   * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
   *
   * @param  {string}
   * @return {string}
   */
  function encodeAsterisk (str) {
    return encodeURI(str).replace(/[?#]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase()
    })
  }

  /**
   * Expose a method for transforming tokens into the path function.
   */
  function tokensToFunction (tokens, options) {
    // Compile all the tokens into regexps.
    var matches = new Array(tokens.length);

    // Compile all the patterns before compilation.
    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] === 'object') {
        matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$', flags(options));
      }
    }

    return function (obj, opts) {
      var path = '';
      var data = obj || {};
      var options = opts || {};
      var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          path += token;

          continue
        }

        var value = data[token.name];
        var segment;

        if (value == null) {
          if (token.optional) {
            // Prepend partial segment prefixes.
            if (token.partial) {
              path += token.prefix;
            }

            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to be defined')
          }
        }

        if (isarray(value)) {
          if (!token.repeat) {
            throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
          }

          if (value.length === 0) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to not be empty')
            }
          }

          for (var j = 0; j < value.length; j++) {
            segment = encode(value[j]);

            if (!matches[i].test(segment)) {
              throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
            }

            path += (j === 0 ? token.prefix : token.delimiter) + segment;
          }

          continue
        }

        segment = token.asterisk ? encodeAsterisk(value) : encode(value);

        if (!matches[i].test(segment)) {
          throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
        }

        path += token.prefix + segment;
      }

      return path
    }
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$\/()])/g, '\\$1')
  }

  /**
   * Attach the keys as a property of the regexp.
   *
   * @param  {!RegExp} re
   * @param  {Array}   keys
   * @return {!RegExp}
   */
  function attachKeys (re, keys) {
    re.keys = keys;
    return re
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options && options.sensitive ? '' : 'i'
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {!Array}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g);

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          asterisk: false,
          pattern: null
        });
      }
    }

    return attachKeys(path, keys)
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array}   keys
   * @param  {!Object} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

    return attachKeys(regexp, keys)
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {!Array}  keys
   * @param  {!Object} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}          tokens
   * @param  {(Array|Object)=} keys
   * @param  {Object=}         options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, keys, options) {
    if (!isarray(keys)) {
      options = /** @type {!Object} */ (keys || options);
      keys = [];
    }

    options = options || {};

    var strict = options.strict;
    var end = options.end !== false;
    var route = '';

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
      } else {
        var prefix = escapeString(token.prefix);
        var capture = '(?:' + token.pattern + ')';

        keys.push(token);

        if (token.repeat) {
          capture += '(?:' + prefix + capture + ')*';
        }

        if (token.optional) {
          if (!token.partial) {
            capture = '(?:' + prefix + '(' + capture + '))?';
          } else {
            capture = prefix + '(' + capture + ')?';
          }
        } else {
          capture = prefix + '(' + capture + ')';
        }

        route += capture;
      }
    }

    var delimiter = escapeString(options.delimiter || '/');
    var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

    // In non-strict mode we allow a slash at the end of match. If the path to
    // match already ends with a slash, we remove it for consistency. The slash
    // is valid at the end of a path match, not in the middle. This is important
    // in non-ending mode, where "/test/" shouldn't match "/test//route".
    if (!strict) {
      route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
    }

    if (end) {
      route += '$';
    } else {
      // In non-ending mode, we need the capturing groups to match as much as
      // possible by using a positive lookahead to the end or next path segment.
      route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
    }

    return attachKeys(new RegExp('^' + route, flags(options)), keys)
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {(Array|Object)=}       keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    if (!isarray(keys)) {
      options = /** @type {!Object} */ (keys || options);
      keys = [];
    }

    options = options || {};

    if (path instanceof RegExp) {
      return regexpToRegexp(path, /** @type {!Array} */ (keys))
    }

    if (isarray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
    }

    return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
  }
  pathToRegexp_1.parse = parse_1;
  pathToRegexp_1.compile = compile_1;
  pathToRegexp_1.tokensToFunction = tokensToFunction_1;
  pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

  /*  */

  // $flow-disable-line
  var regexpCompileCache = Object.create(null);

  function fillParams (
    path,
    params,
    routeMsg
  ) {
    params = params || {};
    try {
      var filler =
        regexpCompileCache[path] ||
        (regexpCompileCache[path] = pathToRegexp_1.compile(path));

      // Fix #2505 resolving asterisk routes { name: 'not-found', params: { pathMatch: '/not-found' }}
      // and fix #3106 so that you can work with location descriptor object having params.pathMatch equal to empty string
      if (typeof params.pathMatch === 'string') { params[0] = params.pathMatch; }

      return filler(params, { pretty: true })
    } catch (e) {
      {
        // Fix #3072 no warn if `pathMatch` is string
        warn(typeof params.pathMatch === 'string', ("missing param for " + routeMsg + ": " + (e.message)));
      }
      return ''
    } finally {
      // delete the 0 if it was added
      delete params[0];
    }
  }

  /*  */

  function normalizeLocation (
    raw,
    current,
    append,
    router
  ) {
    var next = typeof raw === 'string' ? { path: raw } : raw;
    // named target
    if (next._normalized) {
      return next
    } else if (next.name) {
      next = extend({}, raw);
      var params = next.params;
      if (params && typeof params === 'object') {
        next.params = extend({}, params);
      }
      return next
    }

    // relative params
    if (!next.path && next.params && current) {
      next = extend({}, next);
      next._normalized = true;
      var params$1 = extend(extend({}, current.params), next.params);
      if (current.name) {
        next.name = current.name;
        next.params = params$1;
      } else if (current.matched.length) {
        var rawPath = current.matched[current.matched.length - 1].path;
        next.path = fillParams(rawPath, params$1, ("path " + (current.path)));
      } else {
        warn(false, "relative params navigation requires a current route.");
      }
      return next
    }

    var parsedPath = parsePath(next.path || '');
    var basePath = (current && current.path) || '/';
    var path = parsedPath.path
      ? resolvePath(parsedPath.path, basePath, append || next.append)
      : basePath;

    var query = resolveQuery(
      parsedPath.query,
      next.query,
      router && router.options.parseQuery
    );

    var hash = next.hash || parsedPath.hash;
    if (hash && hash.charAt(0) !== '#') {
      hash = "#" + hash;
    }

    return {
      _normalized: true,
      path: path,
      query: query,
      hash: hash
    }
  }

  /*  */

  // work around weird flow bug
  var toTypes = [String, Object];
  var eventTypes = [String, Array];

  var noop = function () {};

  var warnedCustomSlot;
  var warnedTagProp;
  var warnedEventProp;

  var Link = {
    name: 'RouterLink',
    props: {
      to: {
        type: toTypes,
        required: true
      },
      tag: {
        type: String,
        default: 'a'
      },
      custom: Boolean,
      exact: Boolean,
      exactPath: Boolean,
      append: Boolean,
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      ariaCurrentValue: {
        type: String,
        default: 'page'
      },
      event: {
        type: eventTypes,
        default: 'click'
      }
    },
    render: function render (h) {
      var this$1 = this;

      var router = this.$router;
      var current = this.$route;
      var ref = router.resolve(
        this.to,
        current,
        this.append
      );
      var location = ref.location;
      var route = ref.route;
      var href = ref.href;

      var classes = {};
      var globalActiveClass = router.options.linkActiveClass;
      var globalExactActiveClass = router.options.linkExactActiveClass;
      // Support global empty active class
      var activeClassFallback =
        globalActiveClass == null ? 'router-link-active' : globalActiveClass;
      var exactActiveClassFallback =
        globalExactActiveClass == null
          ? 'router-link-exact-active'
          : globalExactActiveClass;
      var activeClass =
        this.activeClass == null ? activeClassFallback : this.activeClass;
      var exactActiveClass =
        this.exactActiveClass == null
          ? exactActiveClassFallback
          : this.exactActiveClass;

      var compareTarget = route.redirectedFrom
        ? createRoute(null, normalizeLocation(route.redirectedFrom), null, router)
        : route;

      classes[exactActiveClass] = isSameRoute(current, compareTarget, this.exactPath);
      classes[activeClass] = this.exact || this.exactPath
        ? classes[exactActiveClass]
        : isIncludedRoute(current, compareTarget);

      var ariaCurrentValue = classes[exactActiveClass] ? this.ariaCurrentValue : null;

      var handler = function (e) {
        if (guardEvent(e)) {
          if (this$1.replace) {
            router.replace(location, noop);
          } else {
            router.push(location, noop);
          }
        }
      };

      var on = { click: guardEvent };
      if (Array.isArray(this.event)) {
        this.event.forEach(function (e) {
          on[e] = handler;
        });
      } else {
        on[this.event] = handler;
      }

      var data = { class: classes };

      var scopedSlot =
        !this.$scopedSlots.$hasNormal &&
        this.$scopedSlots.default &&
        this.$scopedSlots.default({
          href: href,
          route: route,
          navigate: handler,
          isActive: classes[activeClass],
          isExactActive: classes[exactActiveClass]
        });

      if (scopedSlot) {
        if ( !this.custom) {
          !warnedCustomSlot && warn(false, 'In Vue Router 4, the v-slot API will by default wrap its content with an <a> element. Use the custom prop to remove this warning:\n<router-link v-slot="{ navigate, href }" custom></router-link>\n');
          warnedCustomSlot = true;
        }
        if (scopedSlot.length === 1) {
          return scopedSlot[0]
        } else if (scopedSlot.length > 1 || !scopedSlot.length) {
          {
            warn(
              false,
              ("<router-link> with to=\"" + (this.to) + "\" is trying to use a scoped slot but it didn't provide exactly one child. Wrapping the content with a span element.")
            );
          }
          return scopedSlot.length === 0 ? h() : h('span', {}, scopedSlot)
        }
      }

      {
        if ('tag' in this.$options.propsData && !warnedTagProp) {
          warn(
            false,
            "<router-link>'s tag prop is deprecated and has been removed in Vue Router 4. Use the v-slot API to remove this warning: https://next.router.vuejs.org/guide/migration/#removal-of-event-and-tag-props-in-router-link."
          );
          warnedTagProp = true;
        }
        if ('event' in this.$options.propsData && !warnedEventProp) {
          warn(
            false,
            "<router-link>'s event prop is deprecated and has been removed in Vue Router 4. Use the v-slot API to remove this warning: https://next.router.vuejs.org/guide/migration/#removal-of-event-and-tag-props-in-router-link."
          );
          warnedEventProp = true;
        }
      }

      if (this.tag === 'a') {
        data.on = on;
        data.attrs = { href: href, 'aria-current': ariaCurrentValue };
      } else {
        // find the first <a> child and apply listener and href
        var a = findAnchor(this.$slots.default);
        if (a) {
          // in case the <a> is a static node
          a.isStatic = false;
          var aData = (a.data = extend({}, a.data));
          aData.on = aData.on || {};
          // transform existing events in both objects into arrays so we can push later
          for (var event in aData.on) {
            var handler$1 = aData.on[event];
            if (event in on) {
              aData.on[event] = Array.isArray(handler$1) ? handler$1 : [handler$1];
            }
          }
          // append new listeners for router-link
          for (var event$1 in on) {
            if (event$1 in aData.on) {
              // on[event] is always a function
              aData.on[event$1].push(on[event$1]);
            } else {
              aData.on[event$1] = handler;
            }
          }

          var aAttrs = (a.data.attrs = extend({}, a.data.attrs));
          aAttrs.href = href;
          aAttrs['aria-current'] = ariaCurrentValue;
        } else {
          // doesn't have <a> child, apply listener to self
          data.on = on;
        }
      }

      return h(this.tag, data, this.$slots.default)
    }
  };

  function guardEvent (e) {
    // don't redirect with control keys
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) { return }
    // don't redirect when preventDefault called
    if (e.defaultPrevented) { return }
    // don't redirect on right click
    if (e.button !== undefined && e.button !== 0) { return }
    // don't redirect if `target="_blank"`
    if (e.currentTarget && e.currentTarget.getAttribute) {
      var target = e.currentTarget.getAttribute('target');
      if (/\b_blank\b/i.test(target)) { return }
    }
    // this may be a Weex event which doesn't have this method
    if (e.preventDefault) {
      e.preventDefault();
    }
    return true
  }

  function findAnchor (children) {
    if (children) {
      var child;
      for (var i = 0; i < children.length; i++) {
        child = children[i];
        if (child.tag === 'a') {
          return child
        }
        if (child.children && (child = findAnchor(child.children))) {
          return child
        }
      }
    }
  }

  var _Vue;

  function install (Vue) {
    if (install.installed && _Vue === Vue) { return }
    install.installed = true;

    _Vue = Vue;

    var isDef = function (v) { return v !== undefined; };

    var registerInstance = function (vm, callVal) {
      var i = vm.$options._parentVnode;
      if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
        i(vm, callVal);
      }
    };

    Vue.mixin({
      beforeCreate: function beforeCreate () {
        if (isDef(this.$options.router)) {
          this._routerRoot = this;
          this._router = this.$options.router;
          this._router.init(this);
          Vue.util.defineReactive(this, '_route', this._router.history.current);
        } else {
          this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
        }
        registerInstance(this, this);
      },
      destroyed: function destroyed () {
        registerInstance(this);
      }
    });

    Object.defineProperty(Vue.prototype, '$router', {
      get: function get () { return this._routerRoot._router }
    });

    Object.defineProperty(Vue.prototype, '$route', {
      get: function get () { return this._routerRoot._route }
    });

    Vue.component('RouterView', View);
    Vue.component('RouterLink', Link);

    var strats = Vue.config.optionMergeStrategies;
    // use the same hook merging strategy for route hooks
    strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
  }

  /*  */

  var inBrowser = typeof window !== 'undefined';

  /*  */

  function createRouteMap (
    routes,
    oldPathList,
    oldPathMap,
    oldNameMap,
    parentRoute
  ) {
    // the path list is used to control path matching priority
    var pathList = oldPathList || [];
    // $flow-disable-line
    var pathMap = oldPathMap || Object.create(null);
    // $flow-disable-line
    var nameMap = oldNameMap || Object.create(null);

    routes.forEach(function (route) {
      addRouteRecord(pathList, pathMap, nameMap, route, parentRoute);
    });

    // ensure wildcard routes are always at the end
    for (var i = 0, l = pathList.length; i < l; i++) {
      if (pathList[i] === '*') {
        pathList.push(pathList.splice(i, 1)[0]);
        l--;
        i--;
      }
    }

    {
      // warn if routes do not include leading slashes
      var found = pathList
      // check for missing leading slash
        .filter(function (path) { return path && path.charAt(0) !== '*' && path.charAt(0) !== '/'; });

      if (found.length > 0) {
        var pathNames = found.map(function (path) { return ("- " + path); }).join('\n');
        warn(false, ("Non-nested routes must include a leading slash character. Fix the following routes: \n" + pathNames));
      }
    }

    return {
      pathList: pathList,
      pathMap: pathMap,
      nameMap: nameMap
    }
  }

  function addRouteRecord (
    pathList,
    pathMap,
    nameMap,
    route,
    parent,
    matchAs
  ) {
    var path = route.path;
    var name = route.name;
    {
      assert(path != null, "\"path\" is required in a route configuration.");
      assert(
        typeof route.component !== 'string',
        "route config \"component\" for path: " + (String(
          path || name
        )) + " cannot be a " + "string id. Use an actual component instead."
      );

      warn(
        // eslint-disable-next-line no-control-regex
        !/[^\u0000-\u007F]+/.test(path),
        "Route with path \"" + path + "\" contains unencoded characters, make sure " +
          "your path is correctly encoded before passing it to the router. Use " +
          "encodeURI to encode static segments of your path."
      );
    }

    var pathToRegexpOptions =
      route.pathToRegexpOptions || {};
    var normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict);

    if (typeof route.caseSensitive === 'boolean') {
      pathToRegexpOptions.sensitive = route.caseSensitive;
    }

    var record = {
      path: normalizedPath,
      regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
      components: route.components || { default: route.component },
      alias: route.alias
        ? typeof route.alias === 'string'
          ? [route.alias]
          : route.alias
        : [],
      instances: {},
      enteredCbs: {},
      name: name,
      parent: parent,
      matchAs: matchAs,
      redirect: route.redirect,
      beforeEnter: route.beforeEnter,
      meta: route.meta || {},
      props:
        route.props == null
          ? {}
          : route.components
            ? route.props
            : { default: route.props }
    };

    if (route.children) {
      // Warn if route is named, does not redirect and has a default child route.
      // If users navigate to this route by name, the default child will
      // not be rendered (GH Issue #629)
      {
        if (
          route.name &&
          !route.redirect &&
          route.children.some(function (child) { return /^\/?$/.test(child.path); })
        ) {
          warn(
            false,
            "Named Route '" + (route.name) + "' has a default child route. " +
              "When navigating to this named route (:to=\"{name: '" + (route.name) + "'\"), " +
              "the default child route will not be rendered. Remove the name from " +
              "this route and use the name of the default child route for named " +
              "links instead."
          );
        }
      }
      route.children.forEach(function (child) {
        var childMatchAs = matchAs
          ? cleanPath((matchAs + "/" + (child.path)))
          : undefined;
        addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
      });
    }

    if (!pathMap[record.path]) {
      pathList.push(record.path);
      pathMap[record.path] = record;
    }

    if (route.alias !== undefined) {
      var aliases = Array.isArray(route.alias) ? route.alias : [route.alias];
      for (var i = 0; i < aliases.length; ++i) {
        var alias = aliases[i];
        if ( alias === path) {
          warn(
            false,
            ("Found an alias with the same value as the path: \"" + path + "\". You have to remove that alias. It will be ignored in development.")
          );
          // skip in dev to make it work
          continue
        }

        var aliasRoute = {
          path: alias,
          children: route.children
        };
        addRouteRecord(
          pathList,
          pathMap,
          nameMap,
          aliasRoute,
          parent,
          record.path || '/' // matchAs
        );
      }
    }

    if (name) {
      if (!nameMap[name]) {
        nameMap[name] = record;
      } else if ( !matchAs) {
        warn(
          false,
          "Duplicate named routes definition: " +
            "{ name: \"" + name + "\", path: \"" + (record.path) + "\" }"
        );
      }
    }
  }

  function compileRouteRegex (
    path,
    pathToRegexpOptions
  ) {
    var regex = pathToRegexp_1(path, [], pathToRegexpOptions);
    {
      var keys = Object.create(null);
      regex.keys.forEach(function (key) {
        warn(
          !keys[key.name],
          ("Duplicate param keys in route with path: \"" + path + "\"")
        );
        keys[key.name] = true;
      });
    }
    return regex
  }

  function normalizePath (
    path,
    parent,
    strict
  ) {
    if (!strict) { path = path.replace(/\/$/, ''); }
    if (path[0] === '/') { return path }
    if (parent == null) { return path }
    return cleanPath(((parent.path) + "/" + path))
  }

  /*  */



  function createMatcher (
    routes,
    router
  ) {
    var ref = createRouteMap(routes);
    var pathList = ref.pathList;
    var pathMap = ref.pathMap;
    var nameMap = ref.nameMap;

    function addRoutes (routes) {
      createRouteMap(routes, pathList, pathMap, nameMap);
    }

    function addRoute (parentOrRoute, route) {
      var parent = (typeof parentOrRoute !== 'object') ? nameMap[parentOrRoute] : undefined;
      // $flow-disable-line
      createRouteMap([route || parentOrRoute], pathList, pathMap, nameMap, parent);

      // add aliases of parent
      if (parent) {
        createRouteMap(
          // $flow-disable-line route is defined if parent is
          parent.alias.map(function (alias) { return ({ path: alias, children: [route] }); }),
          pathList,
          pathMap,
          nameMap,
          parent
        );
      }
    }

    function getRoutes () {
      return pathList.map(function (path) { return pathMap[path]; })
    }

    function match (
      raw,
      currentRoute,
      redirectedFrom
    ) {
      var location = normalizeLocation(raw, currentRoute, false, router);
      var name = location.name;

      if (name) {
        var record = nameMap[name];
        {
          warn(record, ("Route with name '" + name + "' does not exist"));
        }
        if (!record) { return _createRoute(null, location) }
        var paramNames = record.regex.keys
          .filter(function (key) { return !key.optional; })
          .map(function (key) { return key.name; });

        if (typeof location.params !== 'object') {
          location.params = {};
        }

        if (currentRoute && typeof currentRoute.params === 'object') {
          for (var key in currentRoute.params) {
            if (!(key in location.params) && paramNames.indexOf(key) > -1) {
              location.params[key] = currentRoute.params[key];
            }
          }
        }

        location.path = fillParams(record.path, location.params, ("named route \"" + name + "\""));
        return _createRoute(record, location, redirectedFrom)
      } else if (location.path) {
        location.params = {};
        for (var i = 0; i < pathList.length; i++) {
          var path = pathList[i];
          var record$1 = pathMap[path];
          if (matchRoute(record$1.regex, location.path, location.params)) {
            return _createRoute(record$1, location, redirectedFrom)
          }
        }
      }
      // no match
      return _createRoute(null, location)
    }

    function redirect (
      record,
      location
    ) {
      var originalRedirect = record.redirect;
      var redirect = typeof originalRedirect === 'function'
        ? originalRedirect(createRoute(record, location, null, router))
        : originalRedirect;

      if (typeof redirect === 'string') {
        redirect = { path: redirect };
      }

      if (!redirect || typeof redirect !== 'object') {
        {
          warn(
            false, ("invalid redirect option: " + (JSON.stringify(redirect)))
          );
        }
        return _createRoute(null, location)
      }

      var re = redirect;
      var name = re.name;
      var path = re.path;
      var query = location.query;
      var hash = location.hash;
      var params = location.params;
      query = re.hasOwnProperty('query') ? re.query : query;
      hash = re.hasOwnProperty('hash') ? re.hash : hash;
      params = re.hasOwnProperty('params') ? re.params : params;

      if (name) {
        // resolved named direct
        var targetRecord = nameMap[name];
        {
          assert(targetRecord, ("redirect failed: named route \"" + name + "\" not found."));
        }
        return match({
          _normalized: true,
          name: name,
          query: query,
          hash: hash,
          params: params
        }, undefined, location)
      } else if (path) {
        // 1. resolve relative redirect
        var rawPath = resolveRecordPath(path, record);
        // 2. resolve params
        var resolvedPath = fillParams(rawPath, params, ("redirect route with path \"" + rawPath + "\""));
        // 3. rematch with existing query and hash
        return match({
          _normalized: true,
          path: resolvedPath,
          query: query,
          hash: hash
        }, undefined, location)
      } else {
        {
          warn(false, ("invalid redirect option: " + (JSON.stringify(redirect))));
        }
        return _createRoute(null, location)
      }
    }

    function alias (
      record,
      location,
      matchAs
    ) {
      var aliasedPath = fillParams(matchAs, location.params, ("aliased route with path \"" + matchAs + "\""));
      var aliasedMatch = match({
        _normalized: true,
        path: aliasedPath
      });
      if (aliasedMatch) {
        var matched = aliasedMatch.matched;
        var aliasedRecord = matched[matched.length - 1];
        location.params = aliasedMatch.params;
        return _createRoute(aliasedRecord, location)
      }
      return _createRoute(null, location)
    }

    function _createRoute (
      record,
      location,
      redirectedFrom
    ) {
      if (record && record.redirect) {
        return redirect(record, redirectedFrom || location)
      }
      if (record && record.matchAs) {
        return alias(record, location, record.matchAs)
      }
      return createRoute(record, location, redirectedFrom, router)
    }

    return {
      match: match,
      addRoute: addRoute,
      getRoutes: getRoutes,
      addRoutes: addRoutes
    }
  }

  function matchRoute (
    regex,
    path,
    params
  ) {
    var m = path.match(regex);

    if (!m) {
      return false
    } else if (!params) {
      return true
    }

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = regex.keys[i - 1];
      if (key) {
        // Fix #1994: using * with props: true generates a param named 0
        params[key.name || 'pathMatch'] = typeof m[i] === 'string' ? decode(m[i]) : m[i];
      }
    }

    return true
  }

  function resolveRecordPath (path, record) {
    return resolvePath(path, record.parent ? record.parent.path : '/', true)
  }

  /*  */

  // use User Timing api (if present) for more accurate key precision
  var Time =
    inBrowser && window.performance && window.performance.now
      ? window.performance
      : Date;

  function genStateKey () {
    return Time.now().toFixed(3)
  }

  var _key = genStateKey();

  function getStateKey () {
    return _key
  }

  function setStateKey (key) {
    return (_key = key)
  }

  /*  */

  var positionStore = Object.create(null);

  function setupScroll () {
    // Prevent browser scroll behavior on History popstate
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Fix for #1585 for Firefox
    // Fix for #2195 Add optional third attribute to workaround a bug in safari https://bugs.webkit.org/show_bug.cgi?id=182678
    // Fix for #2774 Support for apps loaded from Windows file shares not mapped to network drives: replaced location.origin with
    // window.location.protocol + '//' + window.location.host
    // location.host contains the port and location.hostname doesn't
    var protocolAndPath = window.location.protocol + '//' + window.location.host;
    var absolutePath = window.location.href.replace(protocolAndPath, '');
    // preserve existing history state as it could be overriden by the user
    var stateCopy = extend({}, window.history.state);
    stateCopy.key = getStateKey();
    window.history.replaceState(stateCopy, '', absolutePath);
    window.addEventListener('popstate', handlePopState);
    return function () {
      window.removeEventListener('popstate', handlePopState);
    }
  }

  function handleScroll (
    router,
    to,
    from,
    isPop
  ) {
    if (!router.app) {
      return
    }

    var behavior = router.options.scrollBehavior;
    if (!behavior) {
      return
    }

    {
      assert(typeof behavior === 'function', "scrollBehavior must be a function");
    }

    // wait until re-render finishes before scrolling
    router.app.$nextTick(function () {
      var position = getScrollPosition();
      var shouldScroll = behavior.call(
        router,
        to,
        from,
        isPop ? position : null
      );

      if (!shouldScroll) {
        return
      }

      if (typeof shouldScroll.then === 'function') {
        shouldScroll
          .then(function (shouldScroll) {
            scrollToPosition((shouldScroll), position);
          })
          .catch(function (err) {
            {
              assert(false, err.toString());
            }
          });
      } else {
        scrollToPosition(shouldScroll, position);
      }
    });
  }

  function saveScrollPosition () {
    var key = getStateKey();
    if (key) {
      positionStore[key] = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    }
  }

  function handlePopState (e) {
    saveScrollPosition();
    if (e.state && e.state.key) {
      setStateKey(e.state.key);
    }
  }

  function getScrollPosition () {
    var key = getStateKey();
    if (key) {
      return positionStore[key]
    }
  }

  function getElementPosition (el, offset) {
    var docEl = document.documentElement;
    var docRect = docEl.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    return {
      x: elRect.left - docRect.left - offset.x,
      y: elRect.top - docRect.top - offset.y
    }
  }

  function isValidPosition (obj) {
    return isNumber(obj.x) || isNumber(obj.y)
  }

  function normalizePosition (obj) {
    return {
      x: isNumber(obj.x) ? obj.x : window.pageXOffset,
      y: isNumber(obj.y) ? obj.y : window.pageYOffset
    }
  }

  function normalizeOffset (obj) {
    return {
      x: isNumber(obj.x) ? obj.x : 0,
      y: isNumber(obj.y) ? obj.y : 0
    }
  }

  function isNumber (v) {
    return typeof v === 'number'
  }

  var hashStartsWithNumberRE = /^#\d/;

  function scrollToPosition (shouldScroll, position) {
    var isObject = typeof shouldScroll === 'object';
    if (isObject && typeof shouldScroll.selector === 'string') {
      // getElementById would still fail if the selector contains a more complicated query like #main[data-attr]
      // but at the same time, it doesn't make much sense to select an element with an id and an extra selector
      var el = hashStartsWithNumberRE.test(shouldScroll.selector) // $flow-disable-line
        ? document.getElementById(shouldScroll.selector.slice(1)) // $flow-disable-line
        : document.querySelector(shouldScroll.selector);

      if (el) {
        var offset =
          shouldScroll.offset && typeof shouldScroll.offset === 'object'
            ? shouldScroll.offset
            : {};
        offset = normalizeOffset(offset);
        position = getElementPosition(el, offset);
      } else if (isValidPosition(shouldScroll)) {
        position = normalizePosition(shouldScroll);
      }
    } else if (isObject && isValidPosition(shouldScroll)) {
      position = normalizePosition(shouldScroll);
    }

    if (position) {
      // $flow-disable-line
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          left: position.x,
          top: position.y,
          // $flow-disable-line
          behavior: shouldScroll.behavior
        });
      } else {
        window.scrollTo(position.x, position.y);
      }
    }
  }

  /*  */

  var supportsPushState =
    inBrowser &&
    (function () {
      var ua = window.navigator.userAgent;

      if (
        (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
        ua.indexOf('Mobile Safari') !== -1 &&
        ua.indexOf('Chrome') === -1 &&
        ua.indexOf('Windows Phone') === -1
      ) {
        return false
      }

      return window.history && typeof window.history.pushState === 'function'
    })();

  function pushState (url, replace) {
    saveScrollPosition();
    // try...catch the pushState call to get around Safari
    // DOM Exception 18 where it limits to 100 pushState calls
    var history = window.history;
    try {
      if (replace) {
        // preserve existing history state as it could be overriden by the user
        var stateCopy = extend({}, history.state);
        stateCopy.key = getStateKey();
        history.replaceState(stateCopy, '', url);
      } else {
        history.pushState({ key: setStateKey(genStateKey()) }, '', url);
      }
    } catch (e) {
      window.location[replace ? 'replace' : 'assign'](url);
    }
  }

  function replaceState (url) {
    pushState(url, true);
  }

  /*  */

  function runQueue (queue, fn, cb) {
    var step = function (index) {
      if (index >= queue.length) {
        cb();
      } else {
        if (queue[index]) {
          fn(queue[index], function () {
            step(index + 1);
          });
        } else {
          step(index + 1);
        }
      }
    };
    step(0);
  }

  // When changing thing, also edit router.d.ts
  var NavigationFailureType = {
    redirected: 2,
    aborted: 4,
    cancelled: 8,
    duplicated: 16
  };

  function createNavigationRedirectedError (from, to) {
    return createRouterError(
      from,
      to,
      NavigationFailureType.redirected,
      ("Redirected when going from \"" + (from.fullPath) + "\" to \"" + (stringifyRoute(
        to
      )) + "\" via a navigation guard.")
    )
  }

  function createNavigationDuplicatedError (from, to) {
    var error = createRouterError(
      from,
      to,
      NavigationFailureType.duplicated,
      ("Avoided redundant navigation to current location: \"" + (from.fullPath) + "\".")
    );
    // backwards compatible with the first introduction of Errors
    error.name = 'NavigationDuplicated';
    return error
  }

  function createNavigationCancelledError (from, to) {
    return createRouterError(
      from,
      to,
      NavigationFailureType.cancelled,
      ("Navigation cancelled from \"" + (from.fullPath) + "\" to \"" + (to.fullPath) + "\" with a new navigation.")
    )
  }

  function createNavigationAbortedError (from, to) {
    return createRouterError(
      from,
      to,
      NavigationFailureType.aborted,
      ("Navigation aborted from \"" + (from.fullPath) + "\" to \"" + (to.fullPath) + "\" via a navigation guard.")
    )
  }

  function createRouterError (from, to, type, message) {
    var error = new Error(message);
    error._isRouter = true;
    error.from = from;
    error.to = to;
    error.type = type;

    return error
  }

  var propertiesToLog = ['params', 'query', 'hash'];

  function stringifyRoute (to) {
    if (typeof to === 'string') { return to }
    if ('path' in to) { return to.path }
    var location = {};
    propertiesToLog.forEach(function (key) {
      if (key in to) { location[key] = to[key]; }
    });
    return JSON.stringify(location, null, 2)
  }

  function isError (err) {
    return Object.prototype.toString.call(err).indexOf('Error') > -1
  }

  function isNavigationFailure (err, errorType) {
    return (
      isError(err) &&
      err._isRouter &&
      (errorType == null || err.type === errorType)
    )
  }

  /*  */

  function resolveAsyncComponents (matched) {
    return function (to, from, next) {
      var hasAsync = false;
      var pending = 0;
      var error = null;

      flatMapComponents(matched, function (def, _, match, key) {
        // if it's a function and doesn't have cid attached,
        // assume it's an async component resolve function.
        // we are not using Vue's default async resolving mechanism because
        // we want to halt the navigation until the incoming component has been
        // resolved.
        if (typeof def === 'function' && def.cid === undefined) {
          hasAsync = true;
          pending++;

          var resolve = once(function (resolvedDef) {
            if (isESModule(resolvedDef)) {
              resolvedDef = resolvedDef.default;
            }
            // save resolved on async factory in case it's used elsewhere
            def.resolved = typeof resolvedDef === 'function'
              ? resolvedDef
              : _Vue.extend(resolvedDef);
            match.components[key] = resolvedDef;
            pending--;
            if (pending <= 0) {
              next();
            }
          });

          var reject = once(function (reason) {
            var msg = "Failed to resolve async component " + key + ": " + reason;
             warn(false, msg);
            if (!error) {
              error = isError(reason)
                ? reason
                : new Error(msg);
              next(error);
            }
          });

          var res;
          try {
            res = def(resolve, reject);
          } catch (e) {
            reject(e);
          }
          if (res) {
            if (typeof res.then === 'function') {
              res.then(resolve, reject);
            } else {
              // new syntax in Vue 2.3
              var comp = res.component;
              if (comp && typeof comp.then === 'function') {
                comp.then(resolve, reject);
              }
            }
          }
        }
      });

      if (!hasAsync) { next(); }
    }
  }

  function flatMapComponents (
    matched,
    fn
  ) {
    return flatten(matched.map(function (m) {
      return Object.keys(m.components).map(function (key) { return fn(
        m.components[key],
        m.instances[key],
        m, key
      ); })
    }))
  }

  function flatten (arr) {
    return Array.prototype.concat.apply([], arr)
  }

  var hasSymbol =
    typeof Symbol === 'function' &&
    typeof Symbol.toStringTag === 'symbol';

  function isESModule (obj) {
    return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
  }

  // in Webpack 2, require.ensure now also returns a Promise
  // so the resolve/reject functions may get called an extra time
  // if the user uses an arrow function shorthand that happens to
  // return that Promise.
  function once (fn) {
    var called = false;
    return function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      if (called) { return }
      called = true;
      return fn.apply(this, args)
    }
  }

  /*  */

  var History = function History (router, base) {
    this.router = router;
    this.base = normalizeBase(base);
    // start with a route object that stands for "nowhere"
    this.current = START;
    this.pending = null;
    this.ready = false;
    this.readyCbs = [];
    this.readyErrorCbs = [];
    this.errorCbs = [];
    this.listeners = [];
  };

  History.prototype.listen = function listen (cb) {
    this.cb = cb;
  };

  History.prototype.onReady = function onReady (cb, errorCb) {
    if (this.ready) {
      cb();
    } else {
      this.readyCbs.push(cb);
      if (errorCb) {
        this.readyErrorCbs.push(errorCb);
      }
    }
  };

  History.prototype.onError = function onError (errorCb) {
    this.errorCbs.push(errorCb);
  };

  History.prototype.transitionTo = function transitionTo (
    location,
    onComplete,
    onAbort
  ) {
      var this$1 = this;

    var route;
    // catch redirect option https://github.com/vuejs/vue-router/issues/3201
    try {
      route = this.router.match(location, this.current);
    } catch (e) {
      this.errorCbs.forEach(function (cb) {
        cb(e);
      });
      // Exception should still be thrown
      throw e
    }
    var prev = this.current;
    this.confirmTransition(
      route,
      function () {
        this$1.updateRoute(route);
        onComplete && onComplete(route);
        this$1.ensureURL();
        this$1.router.afterHooks.forEach(function (hook) {
          hook && hook(route, prev);
        });

        // fire ready cbs once
        if (!this$1.ready) {
          this$1.ready = true;
          this$1.readyCbs.forEach(function (cb) {
            cb(route);
          });
        }
      },
      function (err) {
        if (onAbort) {
          onAbort(err);
        }
        if (err && !this$1.ready) {
          // Initial redirection should not mark the history as ready yet
          // because it's triggered by the redirection instead
          // https://github.com/vuejs/vue-router/issues/3225
          // https://github.com/vuejs/vue-router/issues/3331
          if (!isNavigationFailure(err, NavigationFailureType.redirected) || prev !== START) {
            this$1.ready = true;
            this$1.readyErrorCbs.forEach(function (cb) {
              cb(err);
            });
          }
        }
      }
    );
  };

  History.prototype.confirmTransition = function confirmTransition (route, onComplete, onAbort) {
      var this$1 = this;

    var current = this.current;
    this.pending = route;
    var abort = function (err) {
      // changed after adding errors with
      // https://github.com/vuejs/vue-router/pull/3047 before that change,
      // redirect and aborted navigation would produce an err == null
      if (!isNavigationFailure(err) && isError(err)) {
        if (this$1.errorCbs.length) {
          this$1.errorCbs.forEach(function (cb) {
            cb(err);
          });
        } else {
          warn(false, 'uncaught error during route navigation:');
          console.error(err);
        }
      }
      onAbort && onAbort(err);
    };
    var lastRouteIndex = route.matched.length - 1;
    var lastCurrentIndex = current.matched.length - 1;
    if (
      isSameRoute(route, current) &&
      // in the case the route map has been dynamically appended to
      lastRouteIndex === lastCurrentIndex &&
      route.matched[lastRouteIndex] === current.matched[lastCurrentIndex]
    ) {
      this.ensureURL();
      return abort(createNavigationDuplicatedError(current, route))
    }

    var ref = resolveQueue(
      this.current.matched,
      route.matched
    );
      var updated = ref.updated;
      var deactivated = ref.deactivated;
      var activated = ref.activated;

    var queue = [].concat(
      // in-component leave guards
      extractLeaveGuards(deactivated),
      // global before hooks
      this.router.beforeHooks,
      // in-component update hooks
      extractUpdateHooks(updated),
      // in-config enter guards
      activated.map(function (m) { return m.beforeEnter; }),
      // async components
      resolveAsyncComponents(activated)
    );

    var iterator = function (hook, next) {
      if (this$1.pending !== route) {
        return abort(createNavigationCancelledError(current, route))
      }
      try {
        hook(route, current, function (to) {
          if (to === false) {
            // next(false) -> abort navigation, ensure current URL
            this$1.ensureURL(true);
            abort(createNavigationAbortedError(current, route));
          } else if (isError(to)) {
            this$1.ensureURL(true);
            abort(to);
          } else if (
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({ path: '/' }) -> redirect
            abort(createNavigationRedirectedError(current, route));
            if (typeof to === 'object' && to.replace) {
              this$1.replace(to);
            } else {
              this$1.push(to);
            }
          } else {
            // confirm transition and pass on the value
            next(to);
          }
        });
      } catch (e) {
        abort(e);
      }
    };

    runQueue(queue, iterator, function () {
      // wait until async components are resolved before
      // extracting in-component enter guards
      var enterGuards = extractEnterGuards(activated);
      var queue = enterGuards.concat(this$1.router.resolveHooks);
      runQueue(queue, iterator, function () {
        if (this$1.pending !== route) {
          return abort(createNavigationCancelledError(current, route))
        }
        this$1.pending = null;
        onComplete(route);
        if (this$1.router.app) {
          this$1.router.app.$nextTick(function () {
            handleRouteEntered(route);
          });
        }
      });
    });
  };

  History.prototype.updateRoute = function updateRoute (route) {
    this.current = route;
    this.cb && this.cb(route);
  };

  History.prototype.setupListeners = function setupListeners () {
    // Default implementation is empty
  };

  History.prototype.teardown = function teardown () {
    // clean up event listeners
    // https://github.com/vuejs/vue-router/issues/2341
    this.listeners.forEach(function (cleanupListener) {
      cleanupListener();
    });
    this.listeners = [];

    // reset current history route
    // https://github.com/vuejs/vue-router/issues/3294
    this.current = START;
    this.pending = null;
  };

  function normalizeBase (base) {
    if (!base) {
      if (inBrowser) {
        // respect <base> tag
        var baseEl = document.querySelector('base');
        base = (baseEl && baseEl.getAttribute('href')) || '/';
        // strip full URL origin
        base = base.replace(/^https?:\/\/[^\/]+/, '');
      } else {
        base = '/';
      }
    }
    // make sure there's the starting slash
    if (base.charAt(0) !== '/') {
      base = '/' + base;
    }
    // remove trailing slash
    return base.replace(/\/$/, '')
  }

  function resolveQueue (
    current,
    next
  ) {
    var i;
    var max = Math.max(current.length, next.length);
    for (i = 0; i < max; i++) {
      if (current[i] !== next[i]) {
        break
      }
    }
    return {
      updated: next.slice(0, i),
      activated: next.slice(i),
      deactivated: current.slice(i)
    }
  }

  function extractGuards (
    records,
    name,
    bind,
    reverse
  ) {
    var guards = flatMapComponents(records, function (def, instance, match, key) {
      var guard = extractGuard(def, name);
      if (guard) {
        return Array.isArray(guard)
          ? guard.map(function (guard) { return bind(guard, instance, match, key); })
          : bind(guard, instance, match, key)
      }
    });
    return flatten(reverse ? guards.reverse() : guards)
  }

  function extractGuard (
    def,
    key
  ) {
    if (typeof def !== 'function') {
      // extend now so that global mixins are applied.
      def = _Vue.extend(def);
    }
    return def.options[key]
  }

  function extractLeaveGuards (deactivated) {
    return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
  }

  function extractUpdateHooks (updated) {
    return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
  }

  function bindGuard (guard, instance) {
    if (instance) {
      return function boundRouteGuard () {
        return guard.apply(instance, arguments)
      }
    }
  }

  function extractEnterGuards (
    activated
  ) {
    return extractGuards(
      activated,
      'beforeRouteEnter',
      function (guard, _, match, key) {
        return bindEnterGuard(guard, match, key)
      }
    )
  }

  function bindEnterGuard (
    guard,
    match,
    key
  ) {
    return function routeEnterGuard (to, from, next) {
      return guard(to, from, function (cb) {
        if (typeof cb === 'function') {
          if (!match.enteredCbs[key]) {
            match.enteredCbs[key] = [];
          }
          match.enteredCbs[key].push(cb);
        }
        next(cb);
      })
    }
  }

  /*  */

  var HTML5History = /*@__PURE__*/(function (History) {
    function HTML5History (router, base) {
      History.call(this, router, base);

      this._startLocation = getLocation(this.base);
    }

    if ( History ) HTML5History.__proto__ = History;
    HTML5History.prototype = Object.create( History && History.prototype );
    HTML5History.prototype.constructor = HTML5History;

    HTML5History.prototype.setupListeners = function setupListeners () {
      var this$1 = this;

      if (this.listeners.length > 0) {
        return
      }

      var router = this.router;
      var expectScroll = router.options.scrollBehavior;
      var supportsScroll = supportsPushState && expectScroll;

      if (supportsScroll) {
        this.listeners.push(setupScroll());
      }

      var handleRoutingEvent = function () {
        var current = this$1.current;

        // Avoiding first `popstate` event dispatched in some browsers but first
        // history route not updated since async guard at the same time.
        var location = getLocation(this$1.base);
        if (this$1.current === START && location === this$1._startLocation) {
          return
        }

        this$1.transitionTo(location, function (route) {
          if (supportsScroll) {
            handleScroll(router, route, current, true);
          }
        });
      };
      window.addEventListener('popstate', handleRoutingEvent);
      this.listeners.push(function () {
        window.removeEventListener('popstate', handleRoutingEvent);
      });
    };

    HTML5History.prototype.go = function go (n) {
      window.history.go(n);
    };

    HTML5History.prototype.push = function push (location, onComplete, onAbort) {
      var this$1 = this;

      var ref = this;
      var fromRoute = ref.current;
      this.transitionTo(location, function (route) {
        pushState(cleanPath(this$1.base + route.fullPath));
        handleScroll(this$1.router, route, fromRoute, false);
        onComplete && onComplete(route);
      }, onAbort);
    };

    HTML5History.prototype.replace = function replace (location, onComplete, onAbort) {
      var this$1 = this;

      var ref = this;
      var fromRoute = ref.current;
      this.transitionTo(location, function (route) {
        replaceState(cleanPath(this$1.base + route.fullPath));
        handleScroll(this$1.router, route, fromRoute, false);
        onComplete && onComplete(route);
      }, onAbort);
    };

    HTML5History.prototype.ensureURL = function ensureURL (push) {
      if (getLocation(this.base) !== this.current.fullPath) {
        var current = cleanPath(this.base + this.current.fullPath);
        push ? pushState(current) : replaceState(current);
      }
    };

    HTML5History.prototype.getCurrentLocation = function getCurrentLocation () {
      return getLocation(this.base)
    };

    return HTML5History;
  }(History));

  function getLocation (base) {
    var path = window.location.pathname;
    if (base && path.toLowerCase().indexOf(base.toLowerCase()) === 0) {
      path = path.slice(base.length);
    }
    return (path || '/') + window.location.search + window.location.hash
  }

  /*  */

  var HashHistory = /*@__PURE__*/(function (History) {
    function HashHistory (router, base, fallback) {
      History.call(this, router, base);
      // check history fallback deeplinking
      if (fallback && checkFallback(this.base)) {
        return
      }
      ensureSlash();
    }

    if ( History ) HashHistory.__proto__ = History;
    HashHistory.prototype = Object.create( History && History.prototype );
    HashHistory.prototype.constructor = HashHistory;

    // this is delayed until the app mounts
    // to avoid the hashchange listener being fired too early
    HashHistory.prototype.setupListeners = function setupListeners () {
      var this$1 = this;

      if (this.listeners.length > 0) {
        return
      }

      var router = this.router;
      var expectScroll = router.options.scrollBehavior;
      var supportsScroll = supportsPushState && expectScroll;

      if (supportsScroll) {
        this.listeners.push(setupScroll());
      }

      var handleRoutingEvent = function () {
        var current = this$1.current;
        if (!ensureSlash()) {
          return
        }
        this$1.transitionTo(getHash(), function (route) {
          if (supportsScroll) {
            handleScroll(this$1.router, route, current, true);
          }
          if (!supportsPushState) {
            replaceHash(route.fullPath);
          }
        });
      };
      var eventType = supportsPushState ? 'popstate' : 'hashchange';
      window.addEventListener(
        eventType,
        handleRoutingEvent
      );
      this.listeners.push(function () {
        window.removeEventListener(eventType, handleRoutingEvent);
      });
    };

    HashHistory.prototype.push = function push (location, onComplete, onAbort) {
      var this$1 = this;

      var ref = this;
      var fromRoute = ref.current;
      this.transitionTo(
        location,
        function (route) {
          pushHash(route.fullPath);
          handleScroll(this$1.router, route, fromRoute, false);
          onComplete && onComplete(route);
        },
        onAbort
      );
    };

    HashHistory.prototype.replace = function replace (location, onComplete, onAbort) {
      var this$1 = this;

      var ref = this;
      var fromRoute = ref.current;
      this.transitionTo(
        location,
        function (route) {
          replaceHash(route.fullPath);
          handleScroll(this$1.router, route, fromRoute, false);
          onComplete && onComplete(route);
        },
        onAbort
      );
    };

    HashHistory.prototype.go = function go (n) {
      window.history.go(n);
    };

    HashHistory.prototype.ensureURL = function ensureURL (push) {
      var current = this.current.fullPath;
      if (getHash() !== current) {
        push ? pushHash(current) : replaceHash(current);
      }
    };

    HashHistory.prototype.getCurrentLocation = function getCurrentLocation () {
      return getHash()
    };

    return HashHistory;
  }(History));

  function checkFallback (base) {
    var location = getLocation(base);
    if (!/^\/#/.test(location)) {
      window.location.replace(cleanPath(base + '/#' + location));
      return true
    }
  }

  function ensureSlash () {
    var path = getHash();
    if (path.charAt(0) === '/') {
      return true
    }
    replaceHash('/' + path);
    return false
  }

  function getHash () {
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    var href = window.location.href;
    var index = href.indexOf('#');
    // empty path
    if (index < 0) { return '' }

    href = href.slice(index + 1);

    return href
  }

  function getUrl (path) {
    var href = window.location.href;
    var i = href.indexOf('#');
    var base = i >= 0 ? href.slice(0, i) : href;
    return (base + "#" + path)
  }

  function pushHash (path) {
    if (supportsPushState) {
      pushState(getUrl(path));
    } else {
      window.location.hash = path;
    }
  }

  function replaceHash (path) {
    if (supportsPushState) {
      replaceState(getUrl(path));
    } else {
      window.location.replace(getUrl(path));
    }
  }

  /*  */

  var AbstractHistory = /*@__PURE__*/(function (History) {
    function AbstractHistory (router, base) {
      History.call(this, router, base);
      this.stack = [];
      this.index = -1;
    }

    if ( History ) AbstractHistory.__proto__ = History;
    AbstractHistory.prototype = Object.create( History && History.prototype );
    AbstractHistory.prototype.constructor = AbstractHistory;

    AbstractHistory.prototype.push = function push (location, onComplete, onAbort) {
      var this$1 = this;

      this.transitionTo(
        location,
        function (route) {
          this$1.stack = this$1.stack.slice(0, this$1.index + 1).concat(route);
          this$1.index++;
          onComplete && onComplete(route);
        },
        onAbort
      );
    };

    AbstractHistory.prototype.replace = function replace (location, onComplete, onAbort) {
      var this$1 = this;

      this.transitionTo(
        location,
        function (route) {
          this$1.stack = this$1.stack.slice(0, this$1.index).concat(route);
          onComplete && onComplete(route);
        },
        onAbort
      );
    };

    AbstractHistory.prototype.go = function go (n) {
      var this$1 = this;

      var targetIndex = this.index + n;
      if (targetIndex < 0 || targetIndex >= this.stack.length) {
        return
      }
      var route = this.stack[targetIndex];
      this.confirmTransition(
        route,
        function () {
          var prev = this$1.current;
          this$1.index = targetIndex;
          this$1.updateRoute(route);
          this$1.router.afterHooks.forEach(function (hook) {
            hook && hook(route, prev);
          });
        },
        function (err) {
          if (isNavigationFailure(err, NavigationFailureType.duplicated)) {
            this$1.index = targetIndex;
          }
        }
      );
    };

    AbstractHistory.prototype.getCurrentLocation = function getCurrentLocation () {
      var current = this.stack[this.stack.length - 1];
      return current ? current.fullPath : '/'
    };

    AbstractHistory.prototype.ensureURL = function ensureURL () {
      // noop
    };

    return AbstractHistory;
  }(History));

  /*  */

  var VueRouter = function VueRouter (options) {
    if ( options === void 0 ) options = {};

    this.app = null;
    this.apps = [];
    this.options = options;
    this.beforeHooks = [];
    this.resolveHooks = [];
    this.afterHooks = [];
    this.matcher = createMatcher(options.routes || [], this);

    var mode = options.mode || 'hash';
    this.fallback =
      mode === 'history' && !supportsPushState && options.fallback !== false;
    if (this.fallback) {
      mode = 'hash';
    }
    if (!inBrowser) {
      mode = 'abstract';
    }
    this.mode = mode;

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base);
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback);
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base);
        break
      default:
        {
          assert(false, ("invalid mode: " + mode));
        }
    }
  };

  var prototypeAccessors = { currentRoute: { configurable: true } };

  VueRouter.prototype.match = function match (raw, current, redirectedFrom) {
    return this.matcher.match(raw, current, redirectedFrom)
  };

  prototypeAccessors.currentRoute.get = function () {
    return this.history && this.history.current
  };

  VueRouter.prototype.init = function init (app /* Vue component instance */) {
      var this$1 = this;

    
      assert(
        install.installed,
        "not installed. Make sure to call `Vue.use(VueRouter)` " +
          "before creating root instance."
      );

    this.apps.push(app);

    // set up app destroyed handler
    // https://github.com/vuejs/vue-router/issues/2639
    app.$once('hook:destroyed', function () {
      // clean out app from this.apps array once destroyed
      var index = this$1.apps.indexOf(app);
      if (index > -1) { this$1.apps.splice(index, 1); }
      // ensure we still have a main app or null if no apps
      // we do not release the router so it can be reused
      if (this$1.app === app) { this$1.app = this$1.apps[0] || null; }

      if (!this$1.app) { this$1.history.teardown(); }
    });

    // main app previously initialized
    // return as we don't need to set up new history listener
    if (this.app) {
      return
    }

    this.app = app;

    var history = this.history;

    if (history instanceof HTML5History || history instanceof HashHistory) {
      var handleInitialScroll = function (routeOrError) {
        var from = history.current;
        var expectScroll = this$1.options.scrollBehavior;
        var supportsScroll = supportsPushState && expectScroll;

        if (supportsScroll && 'fullPath' in routeOrError) {
          handleScroll(this$1, routeOrError, from, false);
        }
      };
      var setupListeners = function (routeOrError) {
        history.setupListeners();
        handleInitialScroll(routeOrError);
      };
      history.transitionTo(
        history.getCurrentLocation(),
        setupListeners,
        setupListeners
      );
    }

    history.listen(function (route) {
      this$1.apps.forEach(function (app) {
        app._route = route;
      });
    });
  };

  VueRouter.prototype.beforeEach = function beforeEach (fn) {
    return registerHook(this.beforeHooks, fn)
  };

  VueRouter.prototype.beforeResolve = function beforeResolve (fn) {
    return registerHook(this.resolveHooks, fn)
  };

  VueRouter.prototype.afterEach = function afterEach (fn) {
    return registerHook(this.afterHooks, fn)
  };

  VueRouter.prototype.onReady = function onReady (cb, errorCb) {
    this.history.onReady(cb, errorCb);
  };

  VueRouter.prototype.onError = function onError (errorCb) {
    this.history.onError(errorCb);
  };

  VueRouter.prototype.push = function push (location, onComplete, onAbort) {
      var this$1 = this;

    // $flow-disable-line
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise(function (resolve, reject) {
        this$1.history.push(location, resolve, reject);
      })
    } else {
      this.history.push(location, onComplete, onAbort);
    }
  };

  VueRouter.prototype.replace = function replace (location, onComplete, onAbort) {
      var this$1 = this;

    // $flow-disable-line
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise(function (resolve, reject) {
        this$1.history.replace(location, resolve, reject);
      })
    } else {
      this.history.replace(location, onComplete, onAbort);
    }
  };

  VueRouter.prototype.go = function go (n) {
    this.history.go(n);
  };

  VueRouter.prototype.back = function back () {
    this.go(-1);
  };

  VueRouter.prototype.forward = function forward () {
    this.go(1);
  };

  VueRouter.prototype.getMatchedComponents = function getMatchedComponents (to) {
    var route = to
      ? to.matched
        ? to
        : this.resolve(to).route
      : this.currentRoute;
    if (!route) {
      return []
    }
    return [].concat.apply(
      [],
      route.matched.map(function (m) {
        return Object.keys(m.components).map(function (key) {
          return m.components[key]
        })
      })
    )
  };

  VueRouter.prototype.resolve = function resolve (
    to,
    current,
    append
  ) {
    current = current || this.history.current;
    var location = normalizeLocation(to, current, append, this);
    var route = this.match(location, current);
    var fullPath = route.redirectedFrom || route.fullPath;
    var base = this.history.base;
    var href = createHref(base, fullPath, this.mode);
    return {
      location: location,
      route: route,
      href: href,
      // for backwards compat
      normalizedTo: location,
      resolved: route
    }
  };

  VueRouter.prototype.getRoutes = function getRoutes () {
    return this.matcher.getRoutes()
  };

  VueRouter.prototype.addRoute = function addRoute (parentOrRoute, route) {
    this.matcher.addRoute(parentOrRoute, route);
    if (this.history.current !== START) {
      this.history.transitionTo(this.history.getCurrentLocation());
    }
  };

  VueRouter.prototype.addRoutes = function addRoutes (routes) {
    {
      warn(false, 'router.addRoutes() is deprecated and has been removed in Vue Router 4. Use router.addRoute() instead.');
    }
    this.matcher.addRoutes(routes);
    if (this.history.current !== START) {
      this.history.transitionTo(this.history.getCurrentLocation());
    }
  };

  Object.defineProperties( VueRouter.prototype, prototypeAccessors );

  function registerHook (list, fn) {
    list.push(fn);
    return function () {
      var i = list.indexOf(fn);
      if (i > -1) { list.splice(i, 1); }
    }
  }

  function createHref (base, fullPath, mode) {
    var path = mode === 'hash' ? '#' + fullPath : fullPath;
    return base ? cleanPath(base + '/' + path) : path
  }

  VueRouter.install = install;
  VueRouter.version = '3.5.1';
  VueRouter.isNavigationFailure = isNavigationFailure;
  VueRouter.NavigationFailureType = NavigationFailureType;
  VueRouter.START_LOCATION = START;

  if (inBrowser && window.Vue) {
    window.Vue.use(VueRouter);
  }

  return VueRouter;

})));
;

////// ls!src/menu-item (sdefine)
load(8,[12],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/menu-item.html'], function(tmpl){
    return {
      template: tmpl,
      props: ['item', 'no-active', 'active-class'],
      computed: {
        myActiveClass: function(){
          var ref$;
          return (ref$ = this.activeClass) != null ? ref$ : 'side_active';
        },
        active: function(){
          var ref$;
          if (this.noActive != null) {
            return false;
          }
          return 0 === (this.$route.path + "/").indexOf(((ref$ = this.item.activeFullPath) != null
            ? ref$
            : this.item.fullPath) + "/");
        },
        liClass: function(){
          var x$;
          x$ = {};
          x$[this.myActiveClass] = this.active;
          return x$;
        }
      }
    };
  });
}).call(this);
});

////// ls!src/router-factory (sdefine)
load(9,[141,140,139,138,21,15,137,15,136,15,135,15,134,15,133,15,132,15,131,15,130,15,129,128,127,127,126,21,15,125,15,124,15,123,15,122,15,121,15,120,15,119,15,118,117,116,15,115,15,114,15,113,15,112,15,111,15,110,15,109,15,108,15,107,15,106,15,105,15,104,15,103,15,102,15,101,15,100,15,99,15,98,15,97,15,96,15,95,15,94,15,93,15,92,15,91,15,90,15,89,88,87,86,85,15,84,15,83,15,82,15,81,15,80,15,79,15,78,15,77,15,76,15,75,15,74,15,73,15,72,15,71,15,70,15,69,15,68,15,67,15,66,15,65,15,64,15,63,15,62,15,61,15,60,15,59,15,58,15,57,15,56,15,55,15,54,15,53,15,52,51,50,15,50,15,52,51,50,15,50,15,52,51,50,15,50,15,52,51,50,15,50,15,52,51,50,15,50,15,52,51,50,15,50,15,50,15,21,15,49,48,47,15,46,15,45,15,44,15,43,15,42,15,41,15,40,15,39,15,38,15,37,15,36,15,35,15,34,15,33,15,32,15,31,15,30,15,29,15,28,27,21,15,26,25,24,23,22,21,15,20,15,19,15,18,15,17,15,16,15,14,13],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  var routeConfig, r, f, extractTemplateList, loadingList;
  routeConfig = [
    {
      path: '',
      comp: 'index',
      label: '首頁',
      labelEn: 'Home'
    }, {
      tmpl: 'content-page',
      comp: 'content-page',
      item: [
        {
          path: 'about',
          label: '展館介紹',
          labelEn: 'About',
          group: ['關於展館|About', [0, 1], 2, 3, 4],
          redir: 'operator',
          item: [
            {
              path: 'operator',
              tmpl: 'operator',
              label: '經營者',
              labelEn: 'Operator'
            }, {
              path: 'introduction',
              tmpl: 'introduction',
              label: '展館介紹',
              labelEn: 'About Us'
            }, {
              path: 'floors',
              tmpl: 'floors',
              label: '樓層立體圖',
              labelEn: 'Floor Plans',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1'
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2'
                }
              ]
            }, {
              path: 'arts',
              tmpl: 'arts',
              label: '公共藝術',
              labelEn: 'Artworks',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1'
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2'
                }
              ]
            }, {
              path: 'contact',
              tmpl: 'contact',
              comp: 'contact',
              label: '聯絡我們',
              labelEn: 'Contact Us'
            }
          ]
        }, {
          path: ':age(event|event-past)',
          comp: 'event',
          label: '展會活動',
          labelEn: "What's on"
        }, {
          path: 'event',
          comp: 'event',
          label: '展會活動',
          labelEn: "What's on"
        }, {
          path: 'event/:id(\\d+)',
          comp: 'event0',
          label: '展會活動詳情'
        }, {
          path: 'venue',
          label: '租借場地',
          labelEn: 'Organising',
          group: function(menu, ajax){
            ajax.getCache('/2021/api/app-category', function(it){
              var list, i$, ref$, len$, i, item, j$, ref1$, len1$, c;
              console.warn('get-cache-app-category!');
              if (it.list) {
                list = ['展覽場地', [0, 1], '會議室', [2, 3, 4], '公共及其他空間', [5, 6, 7], '廣告刊登與拍攝', [8, 9, 10, 11], '表單文件下載', []];
                for (i$ = 0, len$ = (ref$ = menu.item).length; i$ < len$; ++i$) {
                  i = i$;
                  item = ref$[i$];
                  if (i >= 12) {
                    for (j$ = 0, len1$ = (ref1$ = it.list).length; j$ < len1$; ++j$) {
                      c = ref1$[j$];
                      if (c.show && !c.is_en) {
                        if (item.path === c.path) {
                          item.label = c.name;
                          item.category = c.id | 0;
                          list[list.length - 1].push(i);
                          break;
                        }
                      }
                    }
                  }
                }
                menu.group = list;
              }
            });
          },
          groupEn: function(menu, ajax){
            ajax.getCache('/2021/api/app-category', function(it){
              var list, i$, ref$, len$, i, item, j$, ref1$, len1$, c;
              if (it.list) {
                list = ['Showgrounds', [0, 1], 'Conference Rooms', [2, 3, 4], 'Space', [5, 6, 7], 'Advertising and Shooting', [8, 9, 10, 11], 'Documentation', []];
                for (i$ = 0, len$ = (ref$ = menu.item).length; i$ < len$; ++i$) {
                  i = i$;
                  item = ref$[i$];
                  if (i >= 12) {
                    for (j$ = 0, len1$ = (ref1$ = it.list).length; j$ < len1$; ++j$) {
                      c = ref1$[j$];
                      if (c.show && c.is_en) {
                        if (item.path === c.path) {
                          item.label = c.name;
                          item.category = c.id | 0;
                          list[list.length - 1].push(i);
                          break;
                        }
                      }
                    }
                  }
                }
                menu.groupEn = list;
              }
            });
          },
          redir: 'showgrounds',
          item: [
            {
              path: 'showgrounds',
              tmpl: 'showgrounds',
              label: '場地介紹',
              labelEn: 'Overview',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "樓",
                        labelEn: r + "F"
                      });
                    }
                    return results$;
                  }())
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "樓",
                        labelEn: r + "F"
                      });
                    }
                    return results$;
                  }())
                }
              ]
            }, {
              path: 'showgrounds-query/:hall',
              defaultPath: 'showgrounds-query/1',
              comp: 'showgrounds-query',
              tmpl: 'showgrounds-query',
              label: '活動場租試算',
              labelEn: 'Rental Calculator'
            }, {
              path: 'room-info',
              tmpl: 'room-info',
              label: '基本資訊',
              labelEn: 'Overview',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  redir: '3',
                  item: [
                    {
                      path: '3',
                      tmpl: '3',
                      label: '3樓',
                      labelEn: '3F'
                    }, {
                      path: '4',
                      tmpl: '4',
                      label: '4樓',
                      labelEn: '4F',
                      redir: '401',
                      item: (function(){
                        var i$, ref$, len$, results$ = [];
                        for (i$ = 0, len$ = (ref$ = [401, 402, 403, 404]).length; i$ < len$; ++i$) {
                          r = ref$[i$];
                          results$.push({
                            path: r + "",
                            tmpl: r + "",
                            label: r + ""
                          });
                        }
                        return results$;
                      }())
                    }, {
                      path: '5',
                      tmpl: '5',
                      label: '5樓',
                      labelEn: '5F',
                      redir: '500',
                      item: (function(){
                        var i$, ref$, len$, results$ = [];
                        for (i$ = 0, len$ = (ref$ = [500, 501, 502, 503, 504, 505, 506, 507]).length; i$ < len$; ++i$) {
                          r = ref$[i$];
                          results$.push({
                            path: r + "",
                            tmpl: r + "",
                            label: r + ""
                          });
                        }
                        return results$;
                      }())
                    }
                  ]
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  redir: '7',
                  item: [
                    {
                      path: '4',
                      tmpl: '4',
                      label: '4樓',
                      labelEn: '4F'
                    }, {
                      path: '6',
                      tmpl: '6',
                      label: '6樓',
                      labelEn: '6F',
                      redir: '601',
                      item: (function(){
                        var i$, ref$, len$, results$ = [];
                        for (i$ = 0, len$ = (ref$ = [601, 602, 603]).length; i$ < len$; ++i$) {
                          r = ref$[i$];
                          results$.push({
                            path: r + "",
                            tmpl: r + "",
                            label: r + ""
                          });
                        }
                        return results$;
                      }())
                    }, {
                      path: '7',
                      tmpl: '7',
                      label: '7樓',
                      labelEn: '7F',
                      redir: '701',
                      item: (function(){
                        var i$, ref$, len$, results$ = [];
                        for (i$ = 0, len$ = (ref$ = [701, 702, 703]).length; i$ < len$; ++i$) {
                          r = ref$[i$];
                          results$.push({
                            path: r + "",
                            tmpl: r + "",
                            label: r + ""
                          });
                        }
                        return results$;
                      }())
                    }
                  ]
                }
              ]
            }, {
              path: 'room-query/:hall',
              defaultPath: 'room-query/1',
              comp: 'room-query',
              tmpl: 'room-query',
              label: '查詢場地&場租試算',
              labelEn: 'Rental Calculator'
            }, {
              path: 'room-streaming',
              tmpl: 'room-streaming',
              comp: 'room-streaming',
              label: '直播服務',
              labelEn: 'Webcast Services'
            }, {
              path: 'public-space',
              tmpl: 'public-space',
              label: '公共空間',
              labelEn: 'Public Space',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "樓"
                      });
                    }
                    return results$;
                  }())
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "樓"
                      });
                    }
                    return results$;
                  }())
                }
              ]
            }, {
              path: 'vip-room',
              tmpl: 'vip-room',
              label: '貴賓室及新聞中心',
              labelEn: 'VIP Rooms & Press Center',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "F"
                      });
                    }
                    return results$;
                  }())
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4, 7]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "F"
                      });
                    }
                    return results$;
                  }())
                }
              ]
            }, {
              path: 'other-room',
              tmpl: 'other-room',
              label: '多功能空間',
              labelEn: 'Function Rooms',
              redir: '1',
              item: [
                {
                  path: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  tmpl: '1',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4, 5]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "F"
                      });
                    }
                    return results$;
                  }())
                }, {
                  path: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  tmpl: '2',
                  redir: '1',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = [1, 4]).length; i$ < len$; ++i$) {
                      r = ref$[i$];
                      results$.push({
                        path: r + "",
                        tmpl: r + "",
                        label: r + "F"
                      });
                    }
                    return results$;
                  }())
                }
              ]
            }, {
              path: 'ad',
              tmpl: 'ad',
              label: '廣告點位',
              labelEn: 'Temporary Advertisements',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1'
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2'
                }
              ]
            }, {
              path: 'ad-lcd-bulletin-board',
              tmpl: 'ad-lcd-bulletin-board',
              label: '電子看板',
              labelEn: 'LCD Bulletin Boards',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1'
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2'
                }
              ]
            }, {
              path: 'ad-led200',
              tmpl: 'ad-led200',
              label: '200吋LED',
              labelEn: '200-inch LED Display'
            }, {
              path: 'ad-shoot',
              tmpl: 'ad-shoot',
              label: '廣告拍攝',
              labelEn: 'Advertisements Shooting',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1'
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2'
                }
              ]
            }, {
              path: 'app-exhibition',
              tmpl: 'app',
              comp: 'app',
              label: '展覽申請專區',
              labelEn: 'For Exhibitions',
              category: 1,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r + "館",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }, {
              path: 'app-event',
              tmpl: 'app',
              comp: 'app',
              label: '活動申請專區',
              labelEn: 'For Events',
              category: 2,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r + "館",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }, {
              path: 'app-ad',
              tmpl: 'app',
              comp: 'app',
              label: '廣告申請專區',
              labelEn: 'For Advertisements',
              category: 3,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r + "館",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }, {
              path: 'app-room',
              tmpl: 'app',
              comp: 'app',
              label: '會議室申請專區',
              labelEn: 'For Conference Rooms',
              category: 4,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r + "館",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }, {
              path: 'app-safety',
              tmpl: 'app',
              comp: 'app',
              label: '職安管理及保險',
              labelEn: 'Occupational Safety and Insurance',
              category: 5,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r + "館",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }, {
              path: 'app-year-end-party',
              tmpl: 'app',
              comp: 'app',
              label: '尾牙專區',
              category: 11,
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2, 7]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: ':hall',
                    activePath: r + "",
                    defaultPath: r + "",
                    tmpl: '../../empty',
                    label: r <= 2 ? r + "館" : "2館星光會議中心",
                    labelEn: "TaiNEX " + r
                  });
                }
                return results$;
              }())
            }
          ]
        }, {
          path: 'service',
          label: '設施與服務',
          labelEn: 'Services & Facilities',
          group: [0, 1, 2, 3],
          redir: 'contractors/1/tea',
          item: [
            {
              path: 'contractors/:hall/:service',
              defaultPath: 'contractors/1/tea',
              comp: 'contractors',
              tmpl: 'contractors',
              label: '廠商配合服務',
              labelEn: 'Contractor Services'
            }, {
              path: 'facilities',
              tmpl: 'facilities',
              label: '公共設施',
              labelEn: 'Amenities',
              redir: '1',
              item: [
                {
                  path: '1',
                  tmpl: '1',
                  label: '1館',
                  labelEn: 'TaiNEX 1',
                  redir: '1F',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = ['B1', '1F', '3F', '4F', '5F', '6F']).length; i$ < len$; ++i$) {
                      f = ref$[i$];
                      results$.push({
                        path: f + "",
                        tmpl: f + "",
                        label: f + ""
                      });
                    }
                    return results$;
                  }())
                }, {
                  path: '2',
                  tmpl: '2',
                  label: '2館',
                  labelEn: 'TaiNEX 2',
                  redir: '1F',
                  item: (function(){
                    var i$, ref$, len$, results$ = [];
                    for (i$ = 0, len$ = (ref$ = ['1F', '4F', '7F']).length; i$ < len$; ++i$) {
                      f = ref$[i$];
                      results$.push({
                        path: f + "",
                        tmpl: f + "",
                        label: f + ""
                      });
                    }
                    return results$;
                  }())
                }
              ]
            }, {
              path: 'transportation',
              tmpl: 'transportation',
              label: '交通資訊',
              labelEn: 'Transportation',
              redir: 'drive',
              item: [
                {
                  path: 'bus',
                  tmpl: 'bus',
                  label: '搭乘公車',
                  labelEn: 'Bus'
                }, {
                  path: 'drive',
                  tmpl: 'drive',
                  label: '自行開車',
                  labelEn: 'Driving'
                }, {
                  path: 'mrt',
                  tmpl: 'mrt',
                  label: '搭乘捷運',
                  labelEn: 'Metro'
                }, {
                  path: 'hsr',
                  tmpl: 'hsr',
                  label: '搭乘高鐵',
                  labelEn: 'Railway'
                }, {
                  path: 'airport',
                  tmpl: 'airport',
                  label: '機場',
                  labelEn: 'Airport'
                }, {
                  path: 'parking-garage',
                  tmpl: 'parking-garage',
                  label: '停車場',
                  labelEn: 'Parking Area'
                }
              ]
            }, {
              path: 'food/:hall',
              defaultPath: 'food/1',
              tmpl: 'food',
              comp: 'food',
              label: '餐飲服務',
              labelEn: 'Food & Beverage '
            }
          ]
        }, {
          path: 'news',
          label: '媒體中心',
          labelEn: 'Media Center',
          group: [0, 1, 2, 3],
          redir: 'news/0/0/0',
          item: [
            {
              path: 'news/:category/:hall/:year',
              comp: 'news',
              label: '最新消息',
              labelEn: 'News',
              defaultPath: 'news/0/0/0'
            }, {
              path: 'video/:hall',
              defaultPath: 'video/1',
              comp: 'video',
              label: '展館影音',
              labelEn: 'Video'
            }, {
              path: 'photo/:hall',
              defaultPath: 'photo/1',
              comp: 'photo',
              label: '展館照片',
              labelEn: 'Images'
            }, {
              path: 'download/:hall',
              defaultPath: 'download/1',
              comp: 'download',
              label: '圖檔下載專區',
              labelEn: 'Download'
            }
          ]
        }, {
          path: 'news/news/:id',
          comp: 'news0',
          label: '最新消息內容'
        }, {
          path: 'social-responsibility',
          label: 'ESG',
          labelEn: 'ESG',
          group: ['ESG', [0, 1, 2]],
          groupEn: ['ESG （Environmental, Social, Governance） ', [0, 1]],
          redir: 'iso20121',
          item: [
            {
              path: 'iso20121',
              tmpl: 'iso20121',
              label: 'ISO 20121'
            }, {
              path: 'friendly',
              tmpl: 'friendly',
              label: '敦親睦鄰計畫',
              labelEn: 'What we do '
            }, {
              path: 'license',
              tmpl: 'license',
              label: '建築相關設施合格認證',
              labelEn: 'Certificates',
              redir: '1',
              item: (function(){
                var i$, ref$, len$, results$ = [];
                for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
                  r = ref$[i$];
                  results$.push({
                    path: r + "",
                    tmpl: r + "",
                    label: r + "館",
                    labelEn: "TaiNEX" + r
                  });
                }
                return results$;
              }())
            }
          ]
        }, {
          path: 'google',
          label: '網站搜尋',
          labelEn: 'Website search',
          tmpl: 'google',
          comp: 'google'
        }
      ]
    }
  ];
  extractTemplateList = function(config, path, out){
    var i$, len$, elem, that, elemPath;
    console.warn('extract', path);
    for (i$ = 0, len$ = config.length; i$ < len$; ++i$) {
      elem = config[i$];
      if ((that = elem.tmpl) != null) {
        out.push("text!template" + path + "/" + that + ".html");
      } else if (elem.group != null) {
        out.push("text!template/side-menu.html");
      }
      if ((that = elem.comp) != null) {
        out.push("ls!" + that);
      } else {
        out.push('ls!simple');
      }
      elemPath = (that = elem.path) != null ? path + "/" + that : path;
      if ((that = elem.item) != null) {
        extractTemplateList(that, elemPath, out);
      }
    }
    return out;
  };
  loadingList = extractTemplateList(routeConfig, [], []);
  define(['ls!build-route'].concat(loadingList), function(buildRoute){
    var loadedList, res$, i$, to$, routes;
    res$ = [];
    for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
      res$.push(arguments[i$]);
    }
    loadedList = res$;
    routes = buildRoute(routeConfig, loadedList);
    console.warn('routes', JSON.parse(JSON.stringify(routes)));
    console.warn('route-config', JSON.parse(JSON.stringify(routeConfig)));
    return {
      routes: routes,
      routeConfig: routeConfig
    };
  });
}).call(this);
});

////// text!src/template/main.html (rvalue)
module[10]="<div>\n\t<div v-if='$route.path==\"/\"' class=\"pin_Bg\"><img src=\"images/bee.svg\" alt=\"\"></div>\n\t<div class=\"fish_icon\"><a href='//chatbot.taiwantrade.com/Webhook/?apiKey=870d6941817cf9af1a8d&eservice=tainex2' target=\"_blank\"><img src=\"images/tbo.svg\"></a></div>\n\t<div class=\"side_tab\">\n\t\t<div class=\"ne_box\" onmouseover='this.classList.add(\"active\")' onmouseout='this.classList.remove(\"active\")'>\n\t\t\t<table width=\"100%\" border=\"0\">\n\t\t\t <tr> <router-link to=/event>\n\t\t\t\t<td class=\"ne_font\">展會活動</td>\n\t\t\t    <td class=\"ne_icon\"><img src=\"images/calendar.svg\"></td>\n\t\t\t\t</router-link>\n\t\t\t  </tr>\n\t\t\t  <tr><router-link to=/google>\n\t\t\t   <td class=\"ne_font\">站內搜尋</td>\n\t\t\t   <td class=\"ne_icon\"><img src=\"images/scerch.svg\"></td>\n\t\t\t   </router-link>\n\t\t\t </tr>\n\t\t\t<tr>\n\t\t\t<router-link to=/about/contact>\n\t\t\t   <td class=\"ne_font\">與我聯繫</td>\n\t\t\t   <td class=\"ne_icon\"><img src=\"images/mail.svg\"></td>\n\t\t\t   </router-link>\n\t\t\t </tr>\n\t\t\t <tr><a @click.prevent='vrBtn=!vrBtn'>\n\t\t\t   <td class=\"ne_font\">360°環景圖</td>\n\t\t\t   <td class=\"ne_icon\"><img src=\"images/vr.svg\" alt=\"\"></td>\n\t\t\t   </a>\n\t\t\t </tr>\n\t\t\t <div v-if=vrBtn>\n \t\t\t\t<a href=\"https://livetour.istaging.com/6cd50c47-a76d-4986-8e36-c298bfdd88b2?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=1\"  target=\"_blank\"><li>1館</li></a>\n \t\t\t\t<a href=\"https://livetour.istaging.com/?group=eac1f777-d6f1-4893-b970-ee0b0c8e6708\" target=\"_blank\"><li class=\"side_hall2\">2館</li></a>\n \t\t\t</div>\n\n\t\t\t</table>\n\t\t</div>\n\n\t</div>\n        <div v-if='$route.path!=\"/\"' class=\"pin_L_bg\"><img src=\"images/b1.svg\" alt=\"\"></div>\n\t\t<div v-if='$route.path!=\"/\"' class=\"pin_R_bg\"><img src=\"images/b1.svg\" alt=\"\"></div>\n\n    <header>\n        <div class=\"header_bg\">\n            <div class=\"logo3\"><router-link to=/ ><img src=\"images/logo1_new.svg\" alt=\"\"></router-link></div>\n\n\t\t\t\t<!-- <ul class=\"small_logo\">\n\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su1.png\" alt=\"\"></li>\n\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su2.png\" alt=\"\"></li>\n\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su3.png\" alt=\"\"></li>\n\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su4.png\" alt=\"\"></li>\n\t\t\t\t\t<li class=\"su_icon last_wid\"><img src=\"images/su5.png\" alt=\"\"></li>\n\t\t\t\t</ul> -->\n\n\n            <div class=\"menu_item\">\n                <ul class=\"menu_btn\">\n                    <menu-item v-for='(item,i) in menu' :key=i :item=item no-active />\n                    <li><a :href=switchLangUrl>EN</a></li>\n                </ul>\n            </div>\n            <div class=\"m_menuicon\" @click.prevent=openSideMenu><img src=\"images/menu.svg\" alt=\"\"></div>\n\n\n        </div>\n    </header>\n\n\t<div class=\"m_down_sidemenu\" v-if=showSideMenu>\n\t\t<div class=\"m_close\" @click.prevent=closeSideMenu><img src=\"images/close.svg\" alt=\"\"></div>\n\t\t<ul class=\"down_sidewrap\" @click=closeSideMenu>\n                        <menu-item v-for='(item,i) in menu' :key=i :item=item no-active />\n\t\t\t\t\t\t\t\t\t\t\t\t<a :href=switchLangUrl><li>EN</li></a>\n\t\t\t<!-- <li><a href=\"#\">實景導覽</a></li> -->\n\t\t</ul>\n\t</div>\n\n\n    <router-view :route-config=routeConfig />\n\n\n    <footer>\n        <div class=\"footer_bg\">\n            <div class=\"container footer_wrap\">\n                <div class=\"row\">\n                    <div class=\"col-12 col-md-6 col-lg-4\">\n                        <div class=\"footer_box\">\n                            <ul>\n                                <li class=\"footer_title\">南港展覽館1館</li>\n                                <li>886-2-2725-5200</li>\n\t\t\t\t\t\t\t\t<li>服務台：#5111</li>\n\t\t\t\t\t\t\t\t<li>租借展覽場地：#5521 </li>\n\t\t\t\t\t\t\t\t<li>租借會議室：#5527</li>\n\t\t\t\t\t\t\t\t<li>租借展覽及會議以外之其他各類型活動場地：#5523</li>\n\t\t\t\t\t\t\t\t<li>台北市 11568 南港區經貿二路 1 號</li>\n                                <li>niec@taitra.org.tw</li>\n\t\t\t\t\t\t\t\t<!-- <a href=\"https://www.tainex1.com.tw/zh-tw/\" target=\"_blank\"><li>舊南港1館官網</li></a> -->\n                            </ul>\n                        </div>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-4\">\n                        <div class=\"footer_box\">\n                            <ul>\n                                <li class=\"footer_title\">南港展覽館2館</li>\n                                <li>886-2-2725-5200</li>\n                                <li>服務台：#6101；租借場地：展覽#5521 & #6614、活動#6616、會議#6614、#6617</li>\n                                <li>台北市 11568 南港區經貿二路 2 號</li>\n                                <li>tainex2@taitra.org.tw</li>\n\t\t\t\t\t\t\t\t<!-- <a href=\"https://www.tainex2.com.tw/\" target=\"_blank\"><li>舊南港2館官網</li></a> -->\n                            </ul>\n                        </div>\n                    </div>\n\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-4\">\n\t\t\t\t\t\t<ul class=\"small_logo footer_right\">\n\t\t\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su1.png\" alt=\"\"></li>\n\t\t\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su2.png\" alt=\"\"></li>\n\t\t\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su3.png\" alt=\"\"></li>\n\t\t\t\t\t\t\t<li class=\"su_icon\"><img src=\"images/su4.png\" alt=\"\"></li>\n\t\t\t\t\t\t\t<li class=\"su_icon last_wid\"><img src=\"images/su5.png\" alt=\"\"></li>\n\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t</div>\n                    <!-- <div class=\"col-4 col-md-4 col-lg-4\">\n                        <div class=\"footer_logo_box\">\n                            <ul class=\"ft_logo\">\n                                <li><img src=\"images/logo.svg\" alt=\"\"></li>\n                                <li><img src=\"images/logo_50.png\" alt=\"\"></li>\n                            </ul>\n                        </div>\n                    </div> -->\n                </div>\n            </div>\n        </div>\n        <div class=\"footer_deepbg\">\n            <div class=\"container\">\n                <div class=\"copyright\">© Taipei Nangang Exhibition Center, Hall 1 & 2.\n             All Rights Reserved.</div>\n            </div>\n        </div>\n    </footer>\n</div>\n";

////// text!src/template/menu-item.html (rvalue)
module[12]="<router-link :to='item.defaultFullPath||item.fullPath'>\n  <li :class=liClass>\n    <slot>{{item.label}}</slot>\n  </li>\n</router-link>\n";

////// ls!src/google (sdefine)
load(13,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    var go, google;
    go = void 8;
    google = void 8;
    return {
      mounted: function(){
        var x$, script;
        if (go) {
          return go();
        }
        window.__gcse = {
          parsetags: 'explicit',
          initializationCallback: function(){
            script.parentNode.removeChild(script);
            google = window.google;
            go = function(){
              window.google = google;
              google.search.cse.element.render({
                div: 'google',
                tag: 'search'
              });
            };
            go();
          }
        };
        x$ = script = document.createElement('script');
        x$.src = 'https://cse.google.com/cse.js?cx=b64c8b0ce0e11de71';
        document.head.appendChild(x$);
      }
    };
  });
}).call(this);
});

////// text!src/template/google.html (rvalue)
module[14]="<div id=google class=\"google_box\">\n\n\n</div>\n";

////// ls!src/simple (sdefine)
load(15,[8,160,143],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!menu-item', 'ls!is-en', 'ls!ajax'], function(compMenuItem, isEn, ajax){
    return {
      template: '<div></div>',
      components: {
        'menu-item': compMenuItem
      },
      computed: {
        group: function(){
          var g, that;
          g = (that = isEn && this.menu.groupEn)
            ? that
            : this.menu.group;
          if ('function' !== typeof g) {
            return g;
          }
          g(this.menu, ajax);
          return [];
        }
      },
      methods: {
        groupLabel: function(labelStr){
          var that, label, labelEn;
          if (that = /(.*?)\|(.*)/.exec(labelStr)) {
            label = that[1];
            labelEn = that[2];
            if (isEn) {
              return labelEn;
            } else {
              return label;
            }
          } else {
            return labelStr;
          }
        },
        expand: function(g){
          var i$, len$, j;
          if (g instanceof Array) {
            for (i$ = 0, len$ = g.length; i$ < len$; ++i$) {
              j = g[i$];
              if (0 === (this.$route.path + "/").indexOf(this.menu.item[j].activeFullPath + "/")) {
                return true;
              }
            }
          }
          return false;
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/social-responsibility/license/2.html (rvalue)
module[16]="<div>\n\t\t\t\t\t\t<div class=\"onder_title\">建築相關設施合格認證</div>\n\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t<li>相關標章及設施文件 ：</li>\n\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t維護管理規定 ：建築法第 77 條第 3 項及建築物公共安全檢查簽證及申報辦法。 相關證明資料 ：臺北市建築物公共安全自主檢查合格標章(如下圖)。\n\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t<li class=\"add_mb\">黃金級綠建築標章(如下圖):</li>\n\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t\t\t<div class=\"col-6 col-md-6 col-lg-6\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about6.jpg\" data-fancybox=\"images\" data-caption=\"綠建築標章\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about6.jpg\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t\t<div class=\"col-6 col-md-6 col-lg-6\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t                                <a href=\"images/about7.jpg\" data-fancybox=\"images\" data-caption=\"綠建築標章證書\">\n\t\t                                <img src=\"images/about7.jpg\" alt=\"\">\n\t\t                                </a>\n\t\t                            </div>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t\t<li>消防安全設備檢修申報：</li>\n\t\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t\t維護管理規定:依消防法每半年執行消防安全設備檢修申報。\n\t\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about8.png\" data-fancybox=\"images\" data-caption=\"消防安全設備檢修申報\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about8.png\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t\t<li>高低壓設備</li>\n\t\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t\t維護管理規定:電業法\n\t\t\t\t\t\t\t\t\t相關證明資料:檢附用電裝置檢查紀錄表(如下圖)。\n\t\t\t\t\t\t\t\t\t註:高低壓設備係委託勇帥電氣技術顧問股份有限公司辦理每月檢查，檢附本(109)年5月份資料以茲代表。\n\t\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about9.png\" data-fancybox=\"images\" data-caption=\"高低壓設備\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about9.png\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\n\n\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t\t<li>昇降設備</li>\n\t\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t\t維護管理規定:內政部建築法第七十七條之四第九項規定檢查管理辦法。\n\t\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about10_1.png\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about10_1.png\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about10_2.png\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about10_2.png\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t\t\t\t<a href=\"images/about10_3.png\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n\t\t\t\t\t\t\t\t\t\t<img src=\"images/about10_3.png\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</div>\n\n\n\t\t\t\t\t\t\t</div>\n</div>\n";

////// text!src/template/social-responsibility/license/1.html (rvalue)
module[17]="<div>\n        <div class=\"onder_title\">建築相關設施合格認證</div>\n        <ul class=\"onder_list_title\">\n                <li>相關標章及設施文件 ：</li>\n                <p class=\"aboutcontent\">\n                        維護管理規定 ：建築法第 77 條第 3 項及建築物公共安全檢查簽證及申報辦法。\n相關證明資料 ：臺北市建築物公共安全自主檢查合格標章(如下圖)。\n                </p>\n                <li>綠建築標章 ：</li>\n                <p class=\"aboutcontent\">\n                        維護管理規定 ：綠建築標章申請審核認可及使用作業要點。\n                        相關證明資料 ：綠建築標章證書(如下圖)。\n                </p>\n        </ul>\n\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/110年建築物公共安全檢查合格標章_2年期.pdf\" target=\"_blank\">110年建築物公共安全檢查合格標章</a></li>\n        </ul>\n\n                <div class=\"row\">\n                        <!-- <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/110年建築物公共安全檢查合格標章_2年期.jpg\" data-fancybox=\"images\" data-caption=\"綠建築標章\">\n                                        <img src=\"images/110年建築物公共安全檢查合格標章_2年期.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div> -->\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                            <div class=\"aboutpic\">\n                                <a href=\"images/fireproof.jpg\" data-fancybox=\"images\" data-caption=\"防火標章\">\n                                <img src=\"images/fireproof.jpg\" alt=\"\">\n                                </a>\n                            </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/綠建築標章.jpg\" data-fancybox=\"images\" data-caption=\"綠建築標章證書\">\n                                        <img src=\"images/綠建築標章.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n\n\n                </div>\n\n                <ul class=\"onder_list_title\">\n                        <li>消防安全設備檢修申報：</li>\n                        <p class=\"aboutcontent\">\n                                維護管理規定:依消防法每半年執行消防安全設備檢修申報。\n                        </p>\n                </ul>\n\n                <ul class=\"download_goto\">\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a href=\"images/download/111年消防安全設備檢修申報紀錄.pdf\" target=\"_blank\">111年消防安全設備檢修申報紀錄</a></li>\n                </ul>\n\n                <ul class=\"onder_list_title\">\n                        <li>高低壓設備</li>\n                        <p class=\"aboutcontent\">\n                                維護管理規定:電業法\n                                相關證明資料:檢附用電裝置檢查紀錄表(如下圖)。\n                                註:高低壓設備係委託勇帥電氣技術顧問股份有限公司辦理每月檢查，檢附本(111)年4月5月份資料以茲代表。\n                        </p>\n                </ul>\n                <ul class=\"download_goto\">\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a href=\"images/download/111年4月用電設備及發電機巡檢紀錄.pdf\" target=\"_blank\">111年4月用電設備及發電機巡檢紀錄</a></li>\n                </ul>\n                <ul class=\"download_goto\">\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a href=\"images/download/111年5月用電設備及發電機巡檢紀錄.pdf\" target=\"_blank\">111年5月用電設備及發電機巡檢紀錄</a></li>\n                </ul>\n                <ul class=\"download_goto\">\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a href=\"images/download/111年6月用電設備及發電機巡檢紀錄.pdf\" target=\"_blank\">111年6月用電設備及發電機巡檢紀錄</a></li>\n                </ul>\n\n\n                <ul class=\"onder_list_title\">\n                        <li>昇降設備</li>\n                        <p class=\"aboutcontent\">\n                                維護管理規定:內政部建築法第七十七條之四第九項規定檢查管理辦法。\n                        </p>\n                </ul>\n                <ul class=\"download_goto\">\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a href=\"images/download/111年昇降設備使用許可.pdf\" target=\"_blank\">111年昇降設備使用許可</a></li>\n                </ul></br></br>\n\n                <!-- <div class=\"row\">\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be1.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be1.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be2.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be2.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be3.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be3.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be7.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be7.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be6.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be6.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be5.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be5.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n                        <div class=\"col-6 col-md-6 col-lg-6\">\n                                <div class=\"aboutpic\">\n                                        <a href=\"images/be4.jpg\" data-fancybox=\"images\" data-caption=\"昇降設備\">\n                                        <img src=\"images/be4.jpg\" alt=\"\">\n                                        </a>\n                                </div>\n                        </div>\n\n                </div> -->\n</div>\n";

////// text!src/template/social-responsibility/license.html (rvalue)
module[18]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">建築相關設施合格認證</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n\n\n\n\n\n</div>\n";

////// text!src/template/social-responsibility/friendly.html (rvalue)
module[19]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">敦親睦鄰計畫</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <div class=\"onder_title\">敦親睦鄰暑期成長營，一起FUN心做公益 </div>\n        <p class=\"aboutcontent\">\n            文/圖 南港1館 林家豪\n        </p>\n        <div class=\"aboutcontent\">\n            南港1館已成立逾10年，南港2館亦於今年3月開幕，為強化社會責任，南港1館首度發想以教育活動為主軸，針對國小學童開辦「Fun暑假成長營」活動，主要對象以弱勢家庭、新住民、隔代教養等需要社會資源的家庭為優先。自7月15日開始至8月26日，每周一、三、五的全天活動，共有24位小朋友參加。\n        <br><br>\n           參與成長營的同仁無不絞盡腦汁，發揮想像力並竭盡所能運用各方人脈，帶給小朋友超過50堂的精彩活動。從超受歡迎的7-11一日小店長，讓小朋友體驗服務客人所需具備的熱忱與態度；各式DIY手作課程，提高小朋友專注力、激發想像力外，所完成的作品也常讓同仁驚艷；具有工程相關背景同仁貢獻科學小實驗活動，透過遊戲及實作方式，讓小朋友輕鬆認識基礎科學小常識。動腦遊戲及大地團康遊戲，提供小朋友大量的互動學習，讓他們在最短時間與其他學員連結，進而強化團體合作的精神。而每週一次的亮點活動如展館大探索、參訪台灣精品館等，也讓孩童對於展館及貿協業務有更深度的瞭解。此外，同仁也善用南港1館環境，祭出各類體育活動，例如在4樓光廊的羽毛球大戰就讓大人小孩玩得不亦樂乎。除了課程安排，營隊期間的餐點規劃也是不馬虎。南港1館商店街、餐廳、會議茶點等合約商的溫暖贊助，讓小朋友都能快樂享用健康美味的早、午餐與下午茶點心。\n        <br><br>\n          8月26日成長營的最後一天，由南港1、2館主任及南港區、里長陪同小朋友們，前往國貿大樓與黃董事長James 進行童言童語互動，應該也是James辦公室最吵鬧可愛的一天。接下來的101的觀景台行程、鼎泰豐吃體驗、培訓中心與外師互動的豐富行程，勢必讓成長營小朋友留下深刻的回憶。而最後的分享會，邀請家長共襄盛舉，欣賞小寶貝們帶來的跳舞及歌唱表演，並分享這段期間的作品及心得點滴。希望藉由參與此次活動，在小朋友心中種下幼苗與正面能量，如同貫穿成長營的歌曲\"螢火蟲\"，在生命裡努力的發光，讓黑暗的世界充滿希望。除了陪伴孩童，參與同仁也熱情投入，從自身經驗分享給小朋友外，亦從活動中受益良多，互相學習成長。\n        <br><br>\n           不讓「Fun暑假成長營」專美於前，今年3月4日正式啟用的南港2館，為會展產業注入新能量，帶動南港區的區域發展。為嘉勉及協助清寒優秀學生順利完成學業，善盡社會責任，特別設立「南港區國中、小學清寒優秀獎助學金」。南港展覽館2館每年分上、下學期受理設籍於南港區六個月以上且現就讀於南港區4所國中、7所國小之中、低收入戶在學學生獎學金，受獎生每校每學期各9名，國中生每學期獎助8,300元、國小生每學期獎助3,200元，合計每年提供之獎助學金超過100萬，以期回饋鄰里、服務社會。\n        <br><br>\n           除此之外，為響應紓解血荒，台北國際會議中心與台北世貿中心也於今年再度共同發起捐血活動，透過縝密規劃事前宣傳活動及TICC FB粉絲專頁積極推廣，成功號召本會同仁與鄰近企業員工踴躍捐血，總計共募集71袋熱血，並獲台北捐血中心頒發感謝狀。\n        </div>\n\n        <div class=\"aboutpic\">\n                <a href=\"images/friendly1.jpg\" data-fancybox=\"images\" data-caption=\"成長營小朋友high翻董事長辦公室\">\n                <img src=\"images/friendly1.jpg\" alt=\"\">\n                </a>\n        </div>\n        <div class=\"aboutpic\">\n                <a href=\"images/friendly2.jpg\" data-fancybox=\"images\" data-caption=\"學到消防知識又可以玩水(誤)真是一舉兩得\">\n                <img src=\"images/friendly2.jpg\" alt=\"\">\n                </a>\n        </div>\n\n</div>\n";

////// text!src/template/social-responsibility/iso20121.html (rvalue)
module[20]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n\t\t\t\t\t\t<div class=\"line_top_title\">ISO 20121</div>\n\t\t\t\t\t\t<div class=\"title_line\">\n\t\t\t\t\t\t\t<div class=\"blue_line\"></div>\n\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t<div class=\"onder_title\">ISO 20121證書</div>\n\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t外貿協會台北南港展覽館 成為永續展館典範<br>\n\t\t\t\t\t\t\t取得臺灣首張場館ISO 20121證書\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t外貿協會台北南港展覽館致力於環保節能，除取得綠建築標章、執行碳盤查、力行各項綠色措施之外，自2014年5月起與國際潮流接軌(台北南港展覽館2館自2020年5月起)，導入ISO 20121活動永續性管理系統(Event Sustainability Management Systems)，將「社會面」、「經濟面」及「環境面」各項永續作法，均列為管理營運的一環!\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<div class=\"row rw_bm\">\n\t\t\t\t\t\t\t<div class=\"col-12 col-md-12 col-lg-12\">\n\t\t\t\t\t\t\t\t<div class=\"fontbox_mg\">\n\t\t\t\t\t\t\t\t<ul class=\"onder_dotelist\">\n\t\t\t\t\t\t\t\t\t<li>社會面：關注弱勢、強化安全。</li>\n\t\t\t\t\t\t\t\t\t<li>經濟面：提升服務、永續營運。</li>\n\t\t\t\t\t\t\t\t\t<li>環境面：推動環保、落實清潔。</li>\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t<div class=\"aboutpic2\">\n\t\t\t\t\t\t\t<a href=\"images/ISO20121.jpg\" data-fancybox=\"images\" data-caption=\"ISO 20121\">\n\t\t\t\t\t\t\t<img src=\"images/ISO20121.jpg\" alt=\"\">\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<ul class=\"download_goto\">\n\t\t\t\t            <li><i class=\"mdi mdi-export\"></i></li>\n\t\t\t\t            <li><a href=\"images/download/ISO2020121證書_2020.pdf\" target=\"_blank\">ISO2020121證書</a></li>\n\t\t\t\t        </ul>\n\t\t\t\t\t\t<ul class=\"download_goto\">\n\t\t\t\t            <li><i class=\"mdi mdi-export\"></i></li>\n\t\t\t\t            <li><a href=\"images/download/ISO20121聲明與原則中文版.pdf\" target=\"_blank\">ISO20121聲明與原則中文版</a></li>\n\t\t\t\t        </ul>\n\n\n\t\t\t\t\t\t<!-- <div class=\"onder_title\">外貿協會台北南港展覽館1、2館活動永續發展聲明、原則及政策</div> -->\n\n\t\t\t\t\t\t<!-- <div class=\"aboutpic\">\n\t\t\t\t\t\t\t<a href=\"images/iso20121.png\" data-fancybox=\"images\" data-caption=\"ISO 20121\">\n\t\t\t\t\t\t\t<img src=\"images/iso20121.png\" alt=\"\">\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"aboutpic\">\n\t\t\t\t\t\t\t<a href=\"images/iso20121_1.png\" data-fancybox=\"images\" data-caption=\"ISO 20121\">\n\t\t\t\t\t\t\t<img src=\"images/iso20121_1.png\" alt=\"\">\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t</div> -->\n\n\t\t\t\t\t</div>\n";

////// text!src/template/side-menu.html (rvalue)
module[21]="<div class=\"row\">\n  <div class=\"side_menu col-12 col-md-3 col-lg-3\">\n    <ul class=\"side_list\">\n      <template v-for='(g,i) in group'>\n        <menu-item :item=menu.item[g] v-if='typeof(g)==\"number\"' />\n        <menu-item :item=menu.item[group[i+1][0]] no-active v-if='typeof(g)==\"string\"'>{{groupLabel(g)}}</menu-item>\n        <ul class=\"ukeun\" v-if=expand(g)>\n          <menu-item v-for='i in g' :key=i :item=menu.item[i] />\n        </ul>\n      </template>\n    </ul>\n  </div>\n  <router-view />\n</div>\n";

////// ls!src/news0 (sdefine)
load(22,[147,143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/news/news0.html', 'ls!ajax', 'ls!is-en'], function(tmpl, ajax, isEn){
    var origDescription, origTitle;
    origDescription = '';
    origTitle = '';
    return {
      template: tmpl,
      data: function(){
        return {
          news: {},
          before: {},
          after: {}
        };
      },
      computed: {
        id: function(){
          return this.$route.params.id | 0;
        }
      },
      methods: {
        fmtDate: function(it){
          var d;
          d = new Date(it * 1000);
          return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate();
        },
        fetch: function(){
          var this$ = this;
          ajax.get("/2021/api/news/" + this.id, function(it){
            var that, ref$, description, title;
            if (it.news) {
              this$.news = it.news;
              this$.before = it.before;
              this$.after = it.after;
              if (isEn) {
                if (that = this$.news.title_en) {
                  this$.news.title = that;
                }
                if (that = this$.news.content_en) {
                  this$.news.content = that;
                }
              }
              description = (ref$ = this$.news.content) != null ? ref$.substr(0, 100) : void 8;
              title = (isEn ? 'TaiNEX' : '南港展覽館') + " ー " + this$.news.title + " " + this$.fmtDate(this$.news.time) + " " + (isEn
                ? "Hall " + this$.news.hall
                : this$.news.hall + "館") + " " + (this$.news.category === 1
                ? (isEn ? 'News' : '新聞') + ""
                : (isEn ? 'Bulletin' : '公告') + "");
              document.head.querySelector('meta[name=description]').content = description;
              document.head.querySelector('meta[property="og:description"]').content = description;
              document.head.querySelector('meta[property="og:title"]').content = title;
            } else {
              this$.$router.push('/news');
            }
          });
        }
      },
      beforeRouteEnter: function(to, from, next){
        next(function(vm){
          vm.fetch();
        });
      },
      beforeRouteUpdate: function(to, from, next){
        next();
        this.fetch();
      },
      beforeDestroy: function(){
        document.head.querySelector('meta[name=description]').content = origDescription;
        document.head.querySelector('meta[property="og:description"]').content = origDescription;
        document.head.querySelector('meta[property="og:title"]').content = origTitle;
      }
    };
  });
}).call(this);
});

////// ls!src/download (sdefine)
load(23,[148,143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/news/download.html', 'ls!ajax', 'ls!is-en'], function(tmpl, ajax, isEn){
    return {
      template: tmpl,
      data: function(){
        return {
          listData: [void 8, [], []],
          page: 1,
          pageSize: 9
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall;
        },
        list: function(){
          return this.listData[this.hall].slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
        },
        lastPage: function(){
          return (this.listData[this.hall].length + this.pageSize - 1) / this.pageSize | 0;
        },
        pages: function(){
          var i$, to$, results$ = [];
          for (i$ = 1, to$ = this.lastPage; i$ <= to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }
      },
      methods: {
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/download', function(it){
            var i$, ref$, len$, elem, that;
            if (it != null && it.list) {
              this$.listData = [void 8, [], []];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                if (elem.cover_size > 0) {
                  elem.cover_url = "/2021/api/download/" + elem.id + ".jpg";
                  elem.photo_url = "/2021/api/download/" + elem.id + "/" + encodeURIComponent(elem.filename);
                }
                if (that = isEn && elem.title_en) {
                  elem.title = that;
                }
                this$.listData[elem.hall].push(elem);
              }
            }
          });
        },
        go: function(p){
          var ref$, ref1$;
          this.page = (ref$ = 1 > p ? 1 : p) < (ref1$ = this.lastPage) ? ref$ : ref1$;
        }
      },
      mounted: function(){
        this.fetch();
      }
    };
  });
}).call(this);
});

////// ls!src/photo (sdefine)
load(24,[146,143,145,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/news/photo.html', 'ls!ajax', 'ls!d2', 'ls!is-en'], function(tmpl, ajax, d2, isEn){
    return {
      template: tmpl,
      data: function(){
        return {
          listData: [void 8, [], []],
          page: 1,
          pageSize: 9
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall;
        },
        list: function(){
          return this.listData[this.hall].slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
        },
        lastPage: function(){
          return (this.listData[this.hall].length + this.pageSize - 1) / this.pageSize | 0;
        },
        pages: function(){
          var i$, to$, results$ = [];
          for (i$ = 1, to$ = this.lastPage; i$ <= to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }
      },
      methods: {
        fmtDate: function(t){
          var d;
          d = new Date(t * 1000);
          return d.getFullYear() + "/" + d2(d.getMonth() + 1) + "/" + d2(d.getDate());
        },
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/photo', function(it){
            var i$, ref$, len$, elem, that;
            if (it != null && it.list) {
              this$.listData = [void 8, [], []];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                if (elem.cover_size > 0) {
                  elem.cover_url = "/2021/api/photo/" + elem.id + ".jpg";
                  elem.photo_url = "/2021/api/photo/" + elem.id + "/" + encodeURIComponent(elem.filename);
                }
                if (that = isEn && elem.title_en) {
                  elem.title = that;
                }
                this$.listData[elem.hall].push(elem);
              }
            }
          });
        },
        go: function(p){
          var ref$, ref1$;
          this.page = (ref$ = 1 > p ? 1 : p) < (ref1$ = this.lastPage) ? ref$ : ref1$;
        }
      },
      mounted: function(){
        this.fetch();
      }
    };
  });
}).call(this);
});

////// ls!src/video (sdefine)
load(25,[149,143,145,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/news/video.html', 'ls!ajax', 'ls!d2', 'ls!is-en'], function(tmpl, ajax, d2, isEn){
    return {
      template: tmpl,
      data: function(){
        return {
          listData: [void 8, [], []],
          page: 1,
          pageSize: 9
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall;
        },
        list: function(){
          return this.listData[this.hall].slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
        },
        lastPage: function(){
          return (this.listData[this.hall].length + this.pageSize - 1) / this.pageSize | 0;
        },
        pages: function(){
          var i$, to$, results$ = [];
          for (i$ = 1, to$ = this.lastPage; i$ <= to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }
      },
      methods: {
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/video', function(it){
            var i$, ref$, len$, elem, that;
            if (it != null && it.list) {
              this$.listData = [void 8, [], []];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                if (isEn && elem.title_en || !isEn && elem.title) {
                  if (elem.youtube_id) {
                    elem.cover_url = "https://img.youtube.com/vi/" + elem.youtube_id + "/0.jpg";
                    elem.video_url = "https://www.youtube.com/embed/" + elem.youtube_id;
                  }
                  if (that = isEn && elem.title_en) {
                    elem.title = that;
                  }
                  this$.listData[elem.hall].push(elem);
                }
              }
            }
          });
        },
        go: function(p){
          var ref$, ref1$;
          this.page = (ref$ = 1 > p ? 1 : p) < (ref1$ = this.lastPage) ? ref$ : ref1$;
        }
      },
      mounted: function(){
        this.fetch();
      }
    };
  });
}).call(this);
});

////// ls!src/news (sdefine)
load(26,[150,143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  var replace$ = ''.replace;
  define(['text!template/news/news.html', 'ls!ajax', 'ls!is-en'], function(tmpl, ajax, isEn){
    return {
      template: tmpl,
      data: function(){
        return {
          years: [],
          listData: []
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        },
        category: function(){
          return this.$route.params.category | 0;
        },
        year: function(){
          return this.$route.params.year | 0 || this.years[0];
        },
        list: function(){
          var x$, d, btime, y$, etime, i$, ref$, len$, item, results$ = [];
          x$ = d = new Date;
          x$.setFullYear(this.year);
          x$.setMonth(0);
          x$.setDate(1);
          x$.setHours(0);
          x$.setMinutes(0);
          x$.setSeconds(0);
          x$.setMilliseconds(0);
          btime = d.getTime() / 1000;
          y$ = d = new Date;
          y$.setFullYear(this.year + 1);
          y$.setMonth(0);
          y$.setDate(1);
          y$.setHours(0);
          y$.setMinutes(0);
          y$.setSeconds(0);
          y$.setMilliseconds(0);
          etime = d.getTime() / 1000;
          for (i$ = 0, len$ = (ref$ = this.listData).length; i$ < len$; ++i$) {
            item = ref$[i$];
            if ((this.hall === 0 || this.hall & item.hall) && (this.category === 0 || this.category === item.category) && btime <= item.time && item.time < etime) {
              results$.push(item);
            }
          }
          return results$;
        }
      },
      methods: {
        fmtDate: function(it){
          var d;
          d = new Date(it * 1000);
          return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate();
        },
        deHtml: function(it){
          return replace$.call(it, /<[^<>]*>/g, '');
        },
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/news', function(it){
            var minTime, maxTime, list, res$, i$, ref$, len$, item, ref1$, that;
            if (it != null && it.list) {
              minTime = Date.now() / 1000 | 0;
              maxTime = 0;
              res$ = [];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                item = ref$[i$];
                if ((isEn && item.title_en) || (!isEn && item.title)) {
                  minTime <= (ref1$ = item.time) || (minTime = ref1$);
                  maxTime >= (ref1$ = item.time) || (maxTime = ref1$);
                  if (isEn) {
                    if (that = item.title_en) {
                      item.title = that;
                    }
                    if (that = item.content_en) {
                      item.content = that;
                    }
                  }
                  res$.push(item);
                }
              }
              list = res$;
              this$.years = (function(){
                var i$, to$, results$ = [];
                for (i$ = new Date(minTime * 1000).getFullYear(), to$ = new Date(maxTime * 1000).getFullYear(); i$ <= to$; ++i$) {
                  results$.push(i$);
                }
                return results$;
              }()).reverse();
              this$.listData = list;
            }
          });
        },
        dropdownToggle: function(ev){
          var dom;
          dom = ev.target;
          while (!dom.classList.contains('dropdown')) {
            dom = dom.parentNode;
          }
          if (dom.querySelector('button').classList.contains('show')) {
            dom.querySelector('button').classList.remove('show');
            dom.querySelector('ul').classList.remove('show');
          } else {
            dom.querySelector('button').classList.add('show');
            dom.querySelector('ul').classList.add('show');
          }
        }
      },
      mounted: function(){
        this.fetch();
      }
    };
  });
}).call(this);
});

////// ls!src/food (sdefine)
load(27,[143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!ajax', 'ls!is-en'], function(ajax, isEn){
    return {
      data: function(){
        return {
          food: [void 8, [], []]
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        }
      },
      mounted: function(){
        var i$, ref$, len$;
        for (i$ = 0, len$ = (ref$ = [1, 2]).length; i$ < len$; ++i$) {
          (fn$.call(this, ref$[i$]));
        }
        function fn$(hall){
          var this$ = this;
          ajax.get("/2021/api/shop/" + (hall + 2), function(it){
            var i$, ref$, len$, shop, that, res$, j$, ref1$, len1$, item;
            if (it != null && it.list) {
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                shop = ref$[i$];
                if (shop.photo_size > 0) {
                  shop.photo_url = "/2021/api/shop/" + shop.id + ".jpg";
                }
                if (isEn) {
                  if (that = shop.title_en) {
                    shop.title = that;
                  }
                  if (that = shop.content_en) {
                    shop.content = that;
                  }
                  if (that = shop.webpage_en) {
                    shop.webpage = that;
                  }
                }
                if (shop.show_menu) {
                  res$ = [];
                  for (j$ = 0, len1$ = (ref1$ = shop.menu).length; j$ < len1$; ++j$) {
                    item = ref1$[j$];
                    if (item > 0) {
                      res$.push({
                        id: item,
                        url: "/2021/api/shop-menu/" + item + ".jpg"
                      });
                    }
                  }
                  shop.menu = res$;
                  if (!shop.menu.length) {
                    shop.show_menu = 0;
                  }
                }
              }
              this$.food.splice(hall, 1, it.list);
            }
          });
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/service/food.html (rvalue)
module[28]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">餐飲服務</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n                        <ul class=\"hall_tab\">\n                                <router-link :to='\"/service/food/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n                                  <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n                                </router-link>\n                        </ul>\n\n\t\t\t\t\t<div class=\"row\">\n                                            <template v-for='_ in food[hall]'>\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n                                                        <template v-if=_.photo_url>\n                                                            <a v-if=_.webpage :href=_.webpage target=_blank><div class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div></a>\n                                                            <div v-else class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div>\n                                                        </template>\n                                                        <template v-if=_.show_menu>\n                                                          <div style=display:none :id='\"menu-\"+_.id'>\n                                                            <center v-for='menu_img in _.menu'><img :src=menu_img.url></center>\n                                                          </div>\n                                                          <center><a :class='hall==1 ? \"blue\" : \"blue_d\"' data-fancybox :data-src='\"#menu-\"+_.id' href=javascript:>查看菜單/MENU</a></center>\n                                                        </template>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">{{_.title}}</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\" v-html=_.content>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n                                            </template>\n\n\t\t\t\t\t</div>\n\n\n                        <!--\n                        <ul class=\"prev_btn onlinepage lt_mb\">\n                                <a href=\"#\"><li>< Prev</li></a>\n                                <a href=\"#\"><li class=\"actvie\">1</li></a>\n                                <a href=\"#\"><li>2</li></a>\n                                <a href=\"#\"><li>3</li></a>\n                                <a href=\"#\"><li>4</li></a>\n                                <a href=\"#\"><li>Next ></li></a>\n                        </ul>\n                        -->\n</div>\n";

////// text!src/template/service/transportation/parking-garage.html (rvalue)
module[29]="<div>\n                <!--停車場-->\n                        <ul class=\"tficc\">\n                                <li class=\"bus_icon\">\n                                        <img src=\"images/park.svg\" alt=\"\">\n                                </li>\n                                <li>停車場</li>\n                        </ul>\n                        <div class=\"row\">\n                                <div class=\"col-12 col-md-10 col-lg-10\">\n\n\n\n\n\n                                        <ul class=\"park_bggreen\">\n                                                <li>台北南港展覽館1館 地下停車場停車辦法：</li>\n                                        </ul>\n\n                                        <p class=\"aboutcontent\">\n                                                1.車輛入場車牌辨識，離開時至自動繳費機繳費後出場。\n                                        </p>\n                                        <p class=\"aboutcontent\">\n                                                2.機車計次30元。\n                                        </p>\n                                        <p class=\"aboutcontent\">\n                                                3.本停車場各項收費標準如下(含展覽及活動期間)\n                                        </p>\n\n                                        <ul class=\"onder_list_title\">\n                                                <li>平日： </li>\n                                                <p class=\"aboutcontent\">\n                                                        停放15分鐘至1小時內者停車費新臺幣30元。超過1小時以上，每增加半小時加收15 元，不滿半小時以半小時計，每日收費上限180元，停放之車輛如逾晚間10時仍未駛離，須另繳付過夜停車費300元。15分鐘內離場者免收費。\n                                                </p>\n                                                <li>展覽期間：</li>\n                                                <p class=\"aboutcontent\">\n                                                         每小時60元，第1小時未滿1小時者以1小時計，爾後每增加半小時加收30元，不滿半小時以半小時計，超過半小時而未滿1小時以1小時計，每日收費最高上限依各別展覽調整，停放之車輛，如逾晚間10時仍未駛離，須另繳付過夜停車費300元。\n                                                </p>\n                                                <li>展覽進場最後一天：</li>\n                                                <p class=\"aboutcontent\">\n                                                        每小時60元，第1小時未滿1小時者以1小時計，爾後每增加半小時加收30元，不滿半小時以半小時計，超過半小時而未滿1小時以1小時計，每日收費上限350元，持有臺灣職安卡之裝潢廠商可享有上限180元優惠。停放之車輛如逾晚間10時仍未駛離，須另繳付過夜停車費300元。15分鐘內離場者免收費。\n                                                </p>\n                                                <li>活動期間：</li>\n                                                <p class=\"aboutcontent\">\n                                                        停放15分鐘至1小時內者停車費新臺幣60元。超過半小時加收30元，不滿半小時以半小時計，每日收費上限350元，停放之車輛如逾晚間10時仍未駛離，須另繳付過夜停車費300元。15分鐘內離場者免收費。\n                                                </p>\n                                        </ul>\n\n                                        <p class=\"aboutcontent\">\n                                                4.以上費率如遇調整，以現場實際公告之費率為準。\n                                        </p>\n\n                                        <ul class=\"park_bggreen2\">\n                                                <li>台北南港展覽館2館 地下停車場服務資訊：</li>\n                                        </ul>\n\n\n                                        <ul class=\"onder_list_title\">\n                                                <li>停車空間：</li>\n                                                <p class=\"aboutcontent\">\n                                                        地下停車場 1,290個汽車停車位、機車格113格\n                                                </p>\n                                                <li>開放時間</li>\n                                                <p class=\"aboutcontent\">\n                                                        每日上午 7時至晚間 10時。\n                                                </p>\n                                                <li>各項收費標準： </li>\n                                                <p class=\"aboutcontent\">\n                                                        本停車場各項收費標準如下(含展覽及活動期間)\n                                                </p>\n                                                <li>非展覽期間(含平日及各項活動)：</li>\n                                                <p class=\"aboutcontent\">\n                                                        汽車15分鐘內離場者免收費，停放15分鐘至1小時內者停車費新臺幣30元。超過1小時以上，每增加半小時加收15 元，不滿半小時以半小時計，每日收費最高180元，停放之車輛，如逾晚間10時仍未駛離，須另繳付過夜停車費300元。\n                                                </p>\n                                                <li>展覽期間(含南港1館有展時):</li>\n                                                <p class=\"aboutcontent\">\n                                                         每小時60元，第1小時未滿1小時者以1小時計，爾後每增加半小時加收30元，不滿半小時以半小時計，超過半小時而未滿1小時以1小時計，每日收費最高上限依各別展覽調整，停放之車輛，如逾晚間10時仍未駛離，須另繳付過夜停車費300元。\n                                                </p>\n\n                                                <li>大型車： </li>\n                                                <p class=\"aboutcontent\">\n                                                        進出場期間大型車(3噸(含)以上)可於B1卸貨區臨時停車每小時120元，第1小時未滿1小時者以1小時計，爾後每增加半小時加收60元，不滿半小時以半小時計。\n                                                </p>\n\n                                                <li>機車： </li>\n                                                <p class=\"aboutcontent\">\n                                                        機車計次30元，以車牌辨識入場，重型車輛請由汽車出入口入場並至B1管理室確認是否有入場紀錄。\n                                                </p>\n\n\n                                        </ul>\n\n                                        <p class=\"aboutcontent\">\n                                                身心障礙者憑身心障礙手冊，汽、機車停車費以8折計收。<br>\n                                                以上費率如遇調整，以現場實際公告之費率為準。<br>\n                                                台北南港展覽館2館停車場車位有限，請多搭乘公共運輸及大眾捷運系統\n                                        </p>\n\n                                </div>\n                        </div>\n                        <div class=\"aboutpic\">\n                                <a href=\"images/map2.jpg\" data-fancybox=\"images\" data-caption=\"「南港展覽館-桃園國際機場」路線圖\">\n                                        <img src=\"images/map2.jpg\" alt=\"\">\n                                </a>\n                        </div>\n                <!--停車場End-->\n</div>\n";

////// text!src/template/service/transportation/airport.html (rvalue)
module[30]="<div>\n                <!--機場-->\n                        <ul class=\"tficc\">\n                                <li class=\"bus_icon\">\n                                        <img src=\"images/airplane.svg\" alt=\"\">\n                                </li>\n                                <li>機場</li>\n                        </ul>\n                        <div class=\"row\">\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <ul class=\"tficc_ti\">\n                                                <li>搭乘1843-國光客運</li>\n                                        </ul>\n                                        <ul class=\"onder_dotelist fontbox_mg\">\n                                                <li>旅程時間：約01時20分鐘。</li>\n                                                <li>起站：南港展覽館</li>\n                                                <li>迄站：桃園機場</li>\n                                                <li>電話：886-3-383-4004</li>\n                                        </ul>\n                                </div>\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <div class=\"bus_logo\"><img src=\"images/kuo.png\" alt=\"\"></div>\n                                </div>\n                        </div>\n                        <div class=\"aboutpic\">\n                                <a href=\"images/map3.jpg\" data-fancybox=\"images\" data-caption=\"「南港展覽館-桃園國際機場」路線圖\">\n                                        <img src=\"images/map3.jpg\" alt=\"\">\n                                </a>\n                        </div>\n                <!--機場end-->\n</div>\n";

////// text!src/template/service/transportation/hsr.html (rvalue)
module[31]="<div>\n                <!--高鐵-->\n                        <ul class=\"tficc\">\n                                <li class=\"bus_icon\">\n                                        <img src=\"images/thsr.jpg\" alt=\"\">\n                                </li>\n                                <li>搭乘高鐵</li>\n                        </ul>\n                        <div class=\"row\">\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <p class=\"aboutcontent\">\n                                                搭乘台灣高鐵至南港站(終點站)，再轉捷運板南線至南港展覽館站。\u000b\n                                        </p>\n                                </div>\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <div class=\"bus_logo\"><img src=\"images/unnamed2.png\" alt=\"\"></div>\n                                </div>\n                        </div>\n\n                        <div class=\"aboutpic\">\n                                <a href=\"images/his.jpg\" data-fancybox=\"images\" data-caption=\"「高鐵站」路線圖\">\n                                        <img src=\"images/his.jpg\" alt=\"\">\n                                </a>\n                        </div>\n                <!--高鐵end-->\n</div>\n";

////// text!src/template/service/transportation/mrt.html (rvalue)
module[32]="<div>\n                <!--捷運end-->\n                        <ul class=\"tficc\">\n                                <li class=\"bus_icon\">\n                                        <img src=\"images/bus3.svg\" alt=\"\">\n                                </li>\n                                <li>搭乘捷運</li>\n                        </ul>\n                        <div class=\"row\">\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <p class=\"aboutcontent\">\n                                                搭乘捷運至南港展覽館站\n                                        </p>\n                                        <ul class=\"tficc_ti\">\n\n                                                <li>前往台北南港展覽館：</li>\n                                        </ul>\n                                        <ul class=\"onder_dotelist fontbox_mg\">\n                                                <li>搭乘捷運「文湖線」於「南港展覽館站」下車，並於1號出口離站沿左側至南港1館 ; 沿右側「南港2館地下連通道」至南港2館。</li>\n                                                <li>搭乘捷運「板南線」於「南港展覽館站」下車，並於1號出口離站沿左側至南港1館 ; 沿右側「南港2館地下連通道」至南港2館</li>\n                                        </ul>\n                                </div>\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                                        <div class=\"bus_logo\"><img src=\"images/logo_trtc.png\" alt=\"\"></div>\n                                </div>\n                        </div>\n\n                        <div class=\"aboutpic\">\n                                <a href=\"images/routemap2020.jpg\" data-fancybox=\"images\" data-caption=\"「捷運」路線圖\">\n                                        <img src=\"images/routemap2020.jpg\" alt=\"\">\n                                </a>\n                        </div>\n                <!--捷運end-->\n</div>\n";

////// text!src/template/service/transportation/drive.html (rvalue)
module[33]="<div>\n        <!--自行開車-->\n        <ul class=\"tficc\">\n                <li class=\"bus_icon\">\n                        <img src=\"images/car.svg\" alt=\"\">\n                </li>\n                <li>自行開車</li>\n        </ul>\n        <div class=\"row\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"googlemap\">\n                                <iframe src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.340520421688!2d121.61575725077483!3d25.05644518388317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442aca818fcc561%3A0x9c78adbe2dea2828!2zMTE15Y-w5YyX5biC5Y2X5riv5Y2A57aT6LK_5LqM6LevMeiZnw!5e0!3m2!1szh-TW!2stw!4v1623224045917!5m2!1szh-TW!2stw\"\n\n\n                                width=\"100%\" height=\"350\" frameborder=\"0\" style=\"border:0;\" allowfullscreen=\"\" aria-hidden=\"false\" tabindex=\"0\"></iframe>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"googlemap\">\n                                <iframe src=\"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.3464699999527!2d121.61342971524738!3d25.0562434435529!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442ab580cfa8a8d%3A0xe3cc15e5ce6220ef!2zMTE15Y-w5YyX5biC5Y2X5riv5Y2A57aT6LK_5LqM6LevMuiZnw!5e0!3m2!1szh-TW!2stw!4v1610366316163!5m2!1szh-TW!2stw\"\n                                        width=\"100%\" height=\"350\" frameborder=\"0\" style=\"border:0;\" allowfullscreen=\"\" aria-hidden=\"false\" tabindex=\"0\"></iframe>\n                        </div>\n                </div>\n\n                <div class=\"col-12 col-md-12 col-lg-12\">\n\n\n                        <ul class=\"tficc_ti\">\n                                <!-- <li class=\"ti_icon\">\n                                        <img src=\"images/m1.svg\" alt=\"\">\n                                </li> -->\n                                <li>利用國道一號北上及南下之行車路線利用國道一號北上或南下的車輛(含大型車輛)，請於「內湖交流道」下高速公路，接「成功路」，直行過「成功橋」， 左轉接「重陽路」至南港展館(可利用原路線接國道一號南下或北上)。</li>\n                        </ul>\n                        <ul class=\"onder_dotelist fontbox_mg\">\n                                <li>利用國道一號北上或南下的車輛(含大型車輛)，請於「內湖交流道」下高速公路，接「成功路」，直行過「成功橋」， 左轉接「重陽路」至南港展館(可利用原路線接國道一號南下或北上)。</li>\n                                <li>或於「汐止系統交流道」離開國道一號，再接國道三號繼續往南行駛，至「新台五路交流道」下高速公路，右轉接 「新台五路」，再左轉「大同路」，直行接南港路至南港展館(所有車輛可利用原路接國道一號南下或北上)。</li>\n                                <li>利用國道一號北上至南港展館的所有車輛亦可前行至「東湖交流道」下高速公路，右轉接「康寧路」，過「南湖大橋」後，接「三重路」、左轉「經貿二路」至南港展館(自南港展館出發，可利用原路接國道一號南下，惟無法北上)。</li>\n                        </ul>\n                        <ul class=\"tficc_ti\">\n                                <!-- <li class=\"ti_icon\">\n                                        <img src=\"images/m2.svg\" alt=\"\">\n                                </li> -->\n                                <li>利用國​道三號北上及南下之行車路線(含國道五號北宜高速公路)：</li>\n                        </ul>\n                        <ul class=\"onder_dotelist fontbox_mg\">\n                                <li>利用國道三號北上或南下的車輛(含大型車輛)，請於「新台五路交流道」下高速公路，接「新台五路」、左轉「大同 路」、直行接「南港路」至南港展館(所有車輛可利用原路接國道三號南下或北上)。</li>\n                                <li>除貨櫃車及聯結車外，其他車輛可於「南港交流道」下高速公路，接「南港聯絡道」後靠內側車道行駛，直行至「南港經貿園區」出口下聯絡道，左轉接經貿一路至南港展館(貨櫃車及聯結車除外，其他車輛可利用原路接國道三號南下，惟無法北上)。</li>\n                                <li>利用國道五號往台北的小型車輛，行至「南港系統交流道」匯接國道三號，靠右側車道行駛約1公里，於「南港交流道」接「南港聯絡道」至南港展館(小型車輛可利用原路上國道五號 )。</li>\n                        </ul>\n                        <div class=\"aboutpic\">\n                                <a href=\"images/11.png\" data-fancybox=\"images\" data-caption=\"「自行開車」路線圖\">\n                                        <img src=\"images/11.png\" alt=\"\">\n                                </a>\n                        </div>\n                <!--自行開車end-->\n                </div>\n          </div>\n</div>\n";

////// text!src/template/service/transportation/bus.html (rvalue)
module[34]="<div>\n        <ul class=\"tficc\">\n                <li class=\"bus_icon\">\n                        <img src=\"images/bus1.svg\" alt=\"\">\n                </li>\n                <li>搭乘公車</li>\n        </ul>\n        <!-- <div class=\"row\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                                1.使用GoogleMap查詢公車路線<br>\n                                2.使用 「<a href=\" http://www.5284.com.tw/ \">我愛巴士 台北市公車資訊</a>」\n                        </p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"bus_logo\"><img src=\"images/busi.jpg\" alt=\"\"></div>\n                </div>\n        </div> -->\n\n        <div class=\"row\">\n                <div class=\"col-12 col-md-10 col-lg-10\">\n                        <ul class=\"onder_list_title\">\n                                <li>南港國小：</li>\n                                <p class=\"aboutcontent\">\n                                        北市南港路 1 段 77 號（向西）；北市南港路 TS12C83 電桿旁（向東）\u000b<br>\n                                        212、276、306(三重)、306(大都會)、306、605、620、629、645、645、668、675、小1、小12、小12、小5、藍15、藍22、藍23、205\u000b\n                                </p>\n\n                                <li>南港軟體園區北站：</li>\n                                <p class=\"aboutcontent\">\n                                        北市三重路 39 號候車亭旁（向南）；北市三重路 39 號對面(向北)\u000b\u000b<br>\n                                        203、281、620、620、629、645、551、711、817、小1、紅32、藍12、藍22、棕9、棕10\u000b\n                                </p>\n                                <li>經貿一路口：</li>\n                                <p class=\"aboutcontent\">\n                                        北市南港路 1 段上距經貿路口 10M 西側（向西）\u000b\u000b<br>\n                                        605、629、668、675、南21、51\n                                </p>\n                                <li>南港軟體園區南站：</li>\n                                <p class=\"aboutcontent\">\n                                        北市三重路 19 之 2 號前（向南）；北市三重路 19-2 號對面(向北)<br>\n                                        51、203、281、620、620、629、645、551、711、817、小1、紅32、藍12、藍21、藍22\n                                </p>\n\n                        </ul>\n                </div>\n        </div>\n</div>\n";

////// text!src/template/service/transportation.html (rvalue)
module[35]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">交通資訊</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <!-- <p class=\"aboutcontent\">\n                本館鄰近南港展覽館捷運站(步行1分鐘) ，開車民眾行駛國道一號、國道三號皆方便，腹地廣大停車方便\n        </p> -->\n\n\n\n        <ul class=\"trans_item\">\n                <menu-item v-for='(item, i) in menu.item' active-class=trans_active :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n</div>\n";

////// text!src/template/service/facilities/2/7F.html (rvalue)
module[36]="<div class=\"aboutpic\">\n    <a href=\"images/7Fs.jpg\" data-fancybox=\"images\" data-caption=\"7F\">\n    <img src=\"images/7Fs.jpg\" alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/2/4F.html (rvalue)
module[37]="<div class=\"aboutpic\">\n    <a href=\"images/4F.jpg\" data-fancybox=\"images\" data-caption=\"4F\">\n    <img src=\"images/4F.jpg\" alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/2/1F.html (rvalue)
module[38]="<div class=\"aboutpic\">\n    <a href=\"images/1F.jpg\" data-fancybox=\"images\" data-caption=\"1F\">\n    <img src=\"images/1F.jpg\" alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/2.html (rvalue)
module[39]="<div>\n\n\n        <div class=\"floor\">\n            <ul>\n                <menu-item v-for='(item, i) in menu.item' active-class=active2 :key=i :item=item class=mr-0.5 />\n            </ul>\n        </div>\n        <div class=\"ui-content\">\n                <div class=\"table_ttte\">\n                        <div class=\"rowtable\">\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed01.svg\" alt=\"\"></span><span>洗手間</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed02.svg\" alt=\"\"></span><span>手扶梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed04.svg\" alt=\"\"></span><span>服務台</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed05.svg\" alt=\"\"></span><span>醫護室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed06.svg\" alt=\"\"></span><span>逃生口</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed07.svg\" alt=\"\"></span><span>貴賓室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed08.svg\" alt=\"\"></span><span>哺集乳室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed09.svg\" alt=\"\"></span><span>辦公室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed10.svg\" alt=\"\"></span><span>簡報室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed03.svg\" alt=\"\"></span><span>電梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed11.svg\" alt=\"\"></span><span>男回教祈禱室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed12.svg\" alt=\"\"></span><span>女回教祈禱室</span></div>\n                        </div>\n                </div>\n        </div>\n        <router-view />\n</div>\n";

////// text!src/template/service/facilities/1/6F.html (rvalue)
module[40]="<div class=\"aboutpic\">\n    <a href=images/h1_6F_01.png data-fancybox=\"images\" data-caption=\"6F\">\n    <img src=images/h1_6F_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1/5F.html (rvalue)
module[41]="<div class=\"aboutpic\">\n    <a href=images/h1_5F_01.png data-fancybox=\"images\" data-caption=\"5F\">\n    <img src=images/h1_5F_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1/4F.html (rvalue)
module[42]="<div class=\"aboutpic\">\n    <a href=images/h1_4F_01.png data-fancybox=\"images\" data-caption=\"4F\">\n    <img src=images/h1_4F_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1/3F.html (rvalue)
module[43]="<div class=\"aboutpic\">\n    <a href=images/h1_3F_01.png data-fancybox=\"images\" data-caption=\"3F\">\n    <img src=images/h1_3F_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1/1F.html (rvalue)
module[44]="<div class=\"aboutpic\">\n    <a href=images/h1_1F_01.png data-fancybox=\"images\" data-caption=\"1F\">\n    <img src=images/h1_1F_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1/B1.html (rvalue)
module[45]="<div class=\"aboutpic\">\n    <a href=images/h1_b1_01.png data-fancybox=\"images\" data-caption=\"B1\">\n    <img src=images/h1_b1_01.png alt=\"\">\n    </a>\n</div>\n";

////// text!src/template/service/facilities/1.html (rvalue)
module[46]="<div>\n        <!-- <div class=\"aboutpic\">\n            <a href=\"images/31.jpg\" data-fancybox=\"images\" data-caption=\"My caption\">\n            <img src=\"images/31.jpg\" alt=\"\">\n            </a>\n        </div>\n        <div class=\"onder_title\">洽詢貿協會台北南港展覽館館公共空間借用流程</div>\n\n        <ul class=\"onder_list_title\">\n            <li>公共空間借用流程</li>\n        </ul>\n        <div class=\"fontbox_mg\">\n            <ul class=\"onder_dotelist\">\n                <li>Step1:「借用收費基準及實施規範」請詳閱：【單獨租用】公共空間收費基準及實施規範</li>\n                <li>Step2:「公共空間申請表」請依需求下載後回傳：【其他】公共空間申請表</li>\n            </ul>\n        </div>\n\n        <div class=\"call_box lt_mb\">\n            <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n            <div class=\"call_font\">連絡電話: 886-2-2725-5200 分機6614 黃先生</div>\n        </div> -->\n        \n        <div class=\"floor\">\n            <ul>\n                <menu-item v-for='(item, i) in menu.item' active-class=active :key=i :item=item class=mr-0.5 />\n            </ul>\n        </div>\n        <div class=\"ui-content\">\n                <div class=\"table_ttte\">\n                        <div class=\"rowtable\">\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c02.png\" alt=\"\"></span><span>洗手間</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c06.png\" alt=\"\"></span><span>ATM</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c20.png\" alt=\"\"></span><span>TAITRA Lounge</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c04.png\" alt=\"\"></span><span>手扶梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c07.png\" alt=\"\"></span><span>電梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c21.png\" alt=\"\"></span><span>咖啡／商店</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c09.png\" alt=\"\"></span><span>餐廳</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c01.png\" alt=\"\"></span><span>汽車停車格</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c03.png\" alt=\"\"></span><span>機車停車格</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c08.png\" alt=\"\"></span><span>腳踏車停車格</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c24.png\" alt=\"\"></span><span>急救設備</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c22.png\" alt=\"\"></span><span>捷運</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c23.png\" alt=\"\"></span><span>公車站</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c25.png\" alt=\"\"></span><span>計程車</span></div>\n                        </div>\n                </div>\n        </div>\n        <router-view />\n</div>\n";

////// text!src/template/service/facilities.html (rvalue)
module[47]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">公共設施</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <ul class=\"hall_tab\">\n            <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n\n\n        <!--\n        <div class=\"floor\">\n                <ul>\n                        <li class=\"active\">1F</li>\n                        <li>3F</li>\n                        <li>4F</li>\n                        <li>5F</li>\n                        <li>6F(暫時隱藏)</li>\n                </ul>\n        </div>\n        <div class=\"floor\">\n                <ul>\n                        <li class=\"active2\">1F</li>\n                        <li>3F</li>\n                        <li>4F</li>\n                        <li>7F</li>\n                </ul>\n        </div>\n        -->\n        <router-view />\n</div>\n";

////// ls!src/contractors (sdefine)
load(48,[143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!ajax', 'ls!is-en'], function(ajax, isEn){
    return {
      data: function(){
        return {
          tea: [void 8, [], [], void 8, void 8, void 8, [], []]
        };
      },
      computed: {
        services: function(){
          var list;
          list = [
            {
              path: 'hinet',
              label: isEn ? 'Telecommunications' : '中華電信'
            }, {
              path: 'plumber-electrician',
              label: isEn ? 'Water & Electricity Services' : '水電服務'
            }, {
              path: 'facial-recognition',
              label: isEn ? ' Facial Recognition' : '人臉辨識'
            }, {
              path: 'tea',
              label: isEn ? 'Refreshments for Meetings' : '會議茶點'
            }, {
              path: 'commodity',
              label: isEn ? 'Snack Bar' : '展場販賣部'
            }
          ];
          if (!isEn) {
            list.push({
              path: 'eticket',
              label: '票務系統'
            });
          }
          return list;
        },
        hall: function(){
          return this.$route.params.hall | 0;
        },
        service: function(){
          return this.$route.params.service;
        }
      },
      mounted: function(){
        var i$, ref$, len$;
        for (i$ = 0, len$ = (ref$ = [1, 2, 6, 7]).length; i$ < len$; ++i$) {
          (fn$.call(this, ref$[i$]));
        }
        function fn$(category){
          var this$ = this;
          ajax.get("/2021/api/shop/" + category, function(it){
            var i$, ref$, len$, shop, that;
            if (it != null && it.list) {
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                shop = ref$[i$];
                if (shop.photo_size > 0) {
                  shop.photo_url = "/2021/api/shop/" + shop.id + ".jpg";
                }
                if (isEn) {
                  if (that = shop.title_en) {
                    shop.title = that;
                  }
                  if (that = shop.content_en) {
                    shop.content = that;
                  }
                  if (that = shop.webpage_en) {
                    shop.webpage = that;
                  }
                }
              }
              this$.tea.splice(category, 1, it.list);
            }
          });
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/service/contractors.html (rvalue)
module[49]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">廠商配合服務</div>\n\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n            <router-link :to='\"/service/contractors/\"+_+\"/\"+service' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n              <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n            </router-link>\n        </ul>\n        <ul class=\"trans_item\">\n            <router-link :to='\"/service/contractors/\"+hall+\"/\"+_.path' v-for='_ in services' :key=_.path>\n              <li style=margin-right:0.125rem :class='{trans_active:hall==1&&service==_.path,trans_active2:hall==2&&service==_.path}'>{{_.label}}</li>\n            </router-link>\n        </ul>\n\n        <template v-if='service==\"hinet\"&&hall==1'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/telecom.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">中華電信股份有限公司台北東區服務中心臨時電話班</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>服務電話： 886-2-27200149</li>\n\t\t\t\t\t\t\t\t\t<li>南港展覽館1館展場服務及障礙維修電話： 886-2-2655-9456 (展覽期間)</li>\n                                    <li>電信服務相關申請表如下:</li>\n\t\t\t\t\t\t\t\t</ul>\n                                <ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/臨時室內電話租用申請書_南港1館.docx\" target=\"_blank\">南港1館臨時室內電話租用申請書</a></li>\n\t\t\t\t\t\t\t\t</ul>\n                                <ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/臨時光纖網路租用申請書_南港1館.docx\" target=\"_blank\">南港1館臨時光纖網路租用申請書</a></li>\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"hinet\"&&hall==2'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/telecom.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">中華電信股份有限公司台北東區服務中心臨時電話班</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>服務電話： 886-2-27200149</li>\n\t\t\t\t\t\t\t\t\t<li>南港展覽館2館展場服務及障礙維修電話： 886-2-2788-9944(展覽期間)</li>\n                                    <li>電信服務相關申請表如下:</li>\n\t\t\t\t\t\t\t\t</ul>\n                                <ul class=\"download_noline_2\">\n                                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                                    <li><a href=\"images/download/南港2館臨時光纖網路租用申請書.docx\" target=\"_blank\">南港2館臨時光纖網路租用申請書</a></li>\n                                </ul>\n                                <ul class=\"download_noline_2\">\n                                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                                    <li><a href=\"images/download/南港2館臨時室內電話租用申請書.docx\" target=\"_blank\">南港2館臨時室內電話租用申請書</a></li>\n                                </ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"plumber-electrician\"&&hall==1'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/bssin4.jpg);\" alt=\"\">\n\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">外貿協會推薦水電裝潢商聯絡資料</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>外貿協會推薦水電裝潢商聯絡資料</li>\n\t\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t\t<ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/外貿協會推薦水電裝潢商聯絡資料.pdf\" target=\"_blank\">文件下載</a></li>\n\t\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"plumber-electrician\"&&hall==2'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/bssin4.jpg);\" alt=\"\">\n\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<!-- <div class=\"live_title\">外貿協會推薦水電裝潢商聯絡資料</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>外貿協會推薦水電裝潢商聯絡資料</li>\n\t\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t\t<ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/外貿協會推薦水電裝潢商聯絡資料.pdf\" target=\"_blank\">文件下載</a></li>\n\t\t\t\t\t\t\t\t</ul>\n\n\t\t\t\t\t\t\t</div> -->\n\n                            <div class=\"live_title\">展覽推薦水電裝潢商聯絡資料</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/外貿協會推薦水電裝潢商聯絡資料.pdf\" target=\"_blank\">文件下載</a></li>\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\n                            <div class=\"live_title\">活動電器承裝廠商聯絡資料</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\">\n\t\t\t\t\t\t\t\t<ul class=\"download_noline_2\">\n\t\t\t\t\t\t\t\t\t<li><i class=\"mdi mdi-file-pdf\"></i></li>\n\t\t\t\t\t\t\t\t\t<li><a href=\"images/download/台北南港展覽館2館外借活動電器承裝廠商管理規定1090203.pdf\" target=\"_blank\">文件下載</a></li>\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"facial-recognition\"&&hall==1'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/face.jpg);\" alt=\"\">\n\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">裝潢商人臉辨識註冊</div>\n\t\t\t\t\t\t\t<div class=\"food_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>貿協會展服務證有效期限至109年12月31日止，自110年1月1日起，進入南港1、2館及世貿1館施工人員將驗證職安卡， 請裝潢廠商務必盡速取得臺北市勞動檢查處核發之職安卡。 (申辦職安卡網址：<a href=\"https://oshcard.osha.gov.tw/\" target=\"_blank\">https://oshcard.osha.gov.tw/</a>)</li>\n\t\t\t\t\t\t\t\t\t<li>1間公司/廠商僅能以統編註冊1組帳號密碼，但可多人共用並上傳個人資料；未有統編之個人或工作室，請以身分證字號/護照號碼申請註冊。<br>註冊連結：<a href=\"http://61.220.184.20/system/index\" target=\"_blank\">http://61.220.184.20/system/index</a></li>\n\t\t\t\t\t\t\t\t\t<li>展館現場亦開放臨時註冊，但僅限當日有效，建議事先註冊加速入場施工。</li>\n\t\t\t\t\t\t\t\t\t<li>人臉辨識系統問題請聯繫：</li>\n                                    <li>南港1館 : 02-2725-5200 #5564 陳小姐 chenwendy@taitra.org.tw</li>\n\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"facial-recognition\"&&hall==2'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/face.jpg);\" alt=\"\">\n\n\t\t\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">裝潢商人臉辨識註冊</div>\n\t\t\t\t\t\t\t<div class=\"food_smfont\">\n\t\t\t\t\t\t\t\t<ul>\n\t\t\t\t\t\t\t\t\t<li>貿協會展服務證有效期限至109年12月31日止，自110年1月1日起，進入南港1、2館及世貿1館施工人員將驗證職安卡， 請裝潢廠商務必盡速取得臺北市勞動檢查處核發之職安卡。 (申辦職安卡網址：<a href=\"https://oshcard.osha.gov.tw/\" target=\"_blank\">https://oshcard.osha.gov.tw/</a>)</li>\n\t\t\t\t\t\t\t\t\t<li>1間公司/廠商僅能以統編註冊1組帳號密碼，但可多人共用並上傳個人資料；未有統編之個人或工作室，請以身分證字號/護照號碼申請註冊。<br>註冊連結：<a href=\"http://61.220.184.20/system/index\" target=\"_blank\">http://61.220.184.20/system/index</a></li>\n\t\t\t\t\t\t\t\t\t<li>展館現場亦開放臨時註冊，但僅限當日有效，建議事先註冊加速入場施工。</li>\n\t\t\t\t\t\t\t\t\t<li>人臉辨識系統問題請聯繫：</li>\n                                    <!-- <li>世貿1館：02-2725-5200 #2688 涂欣旺 hsing@taitra.org.tw</li>\n                                    <li>南港1館：02-2725-5200 #5564 陳程雯 chenwendy@taitra.org.tw</li> -->\n                                    <li>南港1館 : 02-2725-5200 #5564 陳小姐 chenwendy@taitra.org.tw</li>\n\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n        <template v-if='service==\"tea\"'>\n\n\t\t\t\t\t<div class=\"row\">\n                                            <template v-for='_ in tea[hall]'>\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n                                                        <template v-if=_.photo_url>\n                                                            <a v-if=_.webpage :href=_.webpage target=_blank><div class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div></a>\n                                                            <div v-else class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div>\n                                                        </template>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">{{_.title}}</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\" v-html=_.content>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n                                            </template>\n\n\n\n<!--\n\n\n\n\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/56cc26e898184.jpg);\" alt=\"\">\n                                </div>\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">飛士蘭外燴家 Freshline Catering(當季食材菜單)</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：余小姐 886-2-2793-7070</li>\n                                    <li>電子信箱:demi0322@fresh-line.com.tw</li>\n                                    <li>網址:http://www.fresh-line.com.tw</li>\n                                    <li>食品安全管理系統符合以下認證標準 ISO 22000:2005 及 HACCP</li>\n                                    <li>最低訂量：茶點3000元以上</li>\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/papago.jpg);\" alt=\"\">\n\n                                </div>\n\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">趴趴走 Papago</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：張鑑弘 886-2-2793-7070</li>\n                                    <li>網址:http://www.papagofood.com.tw/</li>\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/56cc26af9cde1.jpg);\" alt=\"\">\n\n                                </div>\n\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">魅色時尚餐飲Michael Tu Messe Bistro\u000b</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：886-2-2786-7800</li>\n\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/MrBrownLogo.jpg);\" alt=\"\">\n\n                                </div>\n\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">伯朗咖啡Mr. Brown Coffee</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：886-2-2783-6963</li>\n\n\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/56cc2668d3898.jpg);\" alt=\"\">\n\n                                </div>\n\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">世紀茶點 Century Food</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：張先生 886-2-2792-1515</li>\n                                    <li>最低訂量：餐盒20個以上茶點2000元以上</li>\n                                    <li>食品安全管理系統符合以下認證標準ISO 2200:2005 及 HACCP</li>\n\n                                </ul>\n                            </div>\n                        </div>\n                        <div class=\"live_box col-3 col-md-3 col-lg-3\">\n\n                                <div class=\"facilities_boderpic\" style=\"background-image:url(images/sushin.jpg);\" alt=\"\">\n\n                                </div>\n\n                        </div>\n                        <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                            <div class=\"live_title\">富信大飯店</div>\n                            <div class=\"live_smfont\">\n                                <ul>\n                                    <li>電　話：886-2-2641-6422分機5210、5213、5283</li>\n                                    <li>電子信箱：banquet@fushin-hotel.com.tw</li>\n                                </ul>\n                            </div>\n                        </div> -->\n\n\n\n\t\t\t\t\t</div>\n        <!--\n        <ul class=\"prev_btn onlinepage lt_mb\">\n                <a href=\"#\"><li>< Prev</li></a>\n                <a href=\"#\"><li class=\"actvie\">1</li></a>\n                <a href=\"#\"><li>2</li></a>\n                <a href=\"#\"><li>3</li></a>\n                <a href=\"#\"><li>4</li></a>\n                <a href=\"#\"><li>Next ></li></a>\n        </ul>\n        -->\n        </template>\n        <template v-if='service==\"commodity\"'>\n\n\t\t\t\t\t<div class=\"row\">\n                                            <template v-for='_ in tea[5+hall]'>\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n                                                        <template v-if=_.photo_url>\n                                                            <a v-if=_.webpage :href=_.webpage target=_blank><div class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div></a>\n                                                            <div v-else class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div>\n                                                        </template>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">{{_.title}}</div>\n\t\t\t\t\t\t\t<div class=\"live_smfont\" v-html=_.content>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n                                            </template>\n                                        </div>\n        </template>\n        <template v-if='service==\"eticket\"'>\n\n\t\t\t\t\t<div class=\"row\">\n\t\t\t\t\t\t<div class=\"live_box col-3 col-md-3 col-lg-3\">\n                            <a href=\"https://taitix.com.tw\" target=\"_blank\">\n\t\t\t\t\t\t\t\t<div class=\"facilities_boderpic\" style=\"background-image:url(images/eticketlogo.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t</div>\n                            </a>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"live_box col-9 col-md-9 col-lg-9\">\n\t\t\t\t\t\t\t<div class=\"live_title\">固定式驗票閘門X電子票券系統</div>\n\t\t\t\t\t\t\t<div class=\"food_smfont\">\n                                <ul>\n                                    <li>本館提供一站式數位票務系統，幫助展覽活動主辦單位上架活動、管理票劵及核驗對帳。票務系統問題請聯繫：02-2725-5200 #5564 陳小姐chenwendy@taitra.org.tw</li>\n\t\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t\t</div>\n                            <div class=\"live_smfont\">\n                                <ul class=\"download_noline_2\">\n                                    <li><a href=\"https://docs.google.com/presentation/d/1afSAnKzDtffMZk9iL9n0BTArIDSzuS4u99AfNMU3BUc/edit?usp=sharing\"  target=\"_blank\"><i class=\"mdi mdi-link-variant\"></i></a></li>\n                                    <li><a href=\"https://docs.google.com/presentation/d/1afSAnKzDtffMZk9iL9n0BTArIDSzuS4u99AfNMU3BUc/edit?usp=sharing\"  target=\"_blank\">票務系統簡介</a></li>\n                                </ul>\n                                <ul class=\"download_noline_2\">\n                                    <li><a href=\"images/download/台北南港展覽館1館 TaiTIX票務系統收費基準暨申請表-外借0220.docx\"  target=\"_blank\"><i class=\"mdi mdi-link-variant\"></i></a></li>\n                                    <li><a href=\"images/download/台北南港展覽館1館 TaiTIX票務系統收費基準暨申請表-外借0220.docx\"  target=\"_blank\">票務系統申請</a></li>\n                                </ul>\n                            </div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n        </template>\n\n</div>\n";

////// text!src/template/empty.html (rvalue)
module[50]="<br>\n";

////// ls!src/app (sdefine)
load(51,[52,143,8,151,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/venue/app.html', 'ls!ajax', 'ls!menu-item', 'ls!app-section-list', 'ls!is-en'], function(tmpl, ajax, compMenuItem, appSectionList, isEn){
    return {
      template: tmpl,
      components: {
        menuItem: compMenuItem
      },
      data: function(){
        return {
          list: [void 8, [], [], void 8, void 8, void 8, void 8, []],
          categoryDescription: ''
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        },
        sectionList: function(){
          var i$, ref$, len$, i, label, ref1$, key$, results$ = [];
          for (i$ = 0, len$ = (ref$ = appSectionList[this.menu.category - 1]).length; i$ < len$; ++i$) {
            i = i$;
            label = ref$[i$];
            if (((ref1$ = this.list[this.hall])[key$ = i + 1] || (ref1$[key$] = [])).length > 0) {
              results$.push({
                label: label,
                i: i
              });
            }
          }
          return results$;
        }
      },
      mounted: function(){
        var this$ = this;
        ajax.getCache('/2021/api/app-category', function(it){
          var i$, ref$, len$, c;
          if (it != null && it.list) {
            for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
              c = ref$[i$];
              if (c.id == this$.menu.category) {
                this$.categoryDescription = [void 8, c.description1, c.description2];
                this$.categoryDescription[7] = c.description7;
              }
            }
          }
        });
        return ajax.getCache('/2021/api/app', function(it){
          var i$, ref$, len$, app, that, ref1$, key$, ref2$, key1$;
          if (it != null && it.list) {
            it.list = it.list.sort(function(a, b){
              return b.seq - a.seq || a.id - b.id;
            });
            this$.list = [void 8, [], []];
            this$.list[7] = [];
            for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
              app = ref$[i$];
              if (app.category === this$.menu.category) {
                if (isEn) {
                  if (that = app.title_en) {
                    app.title = that;
                  }
                  if (that = app.filename_en) {
                    app.filename = that;
                  }
                  if (app.content_size_en) {
                    app.id = "en/" + app.id;
                  }
                }
                ((ref1$ = (ref2$ = this$.list)[key1$ = app.hall] || (ref2$[key1$] = []))[key$ = app.section] || (ref1$[key$] = [])).push(app);
              }
            }
          }
        });
      },
      beforeRouteEnter: function(t, f, next){
        var that;
        if (/app-[a-z-]*$/.exec(t.path)) {
          if (that = /app-(?!year-end-party\/7)[a-z-]*\/(\d+)/.exec(f.path)) {
            next(t.path + "/" + that[1]);
          } else {
            next(t.path + "/1");
          }
        } else {
          next();
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/venue/app.html (rvalue)
module[52]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">{{menu.label}}</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n\n    <ul class=\"hall_tab\">\n        <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n\n    <div class=\"app_year_content\" v-html=categoryDescription[hall] />\n    <template v-for='(section, i) in sectionList'>\n        <div class=\"onder_title\">{{i+1}}.{{section.label}}</div>\n        <div class=\"download_word lt_mb\">\n            <ul class=\"download_line\" v-for='app in list[hall][section.i+1]||[]'>\n                    <li><i class=\"mdi mdi-file-pdf\"></i></li>\n                    <li><a :href='\"/2021/api/app/\"+app.id+\"/\"+app.filename'>{{app.title}}</a></li>\n            </ul>\n        </div>\n    </template>\n</div>\n";

////// text!src/template/venue/ad-shoot/2.html (rvalue)
module[53]="<!-- <div class=\"aboutpic\">\n        <a href=\"images/56f38bf8bd22c.jpg\" data-fancybox=\"images\" data-caption=\"200吋LED\">\n        <img src=\"images/56f38bf8bd22c.jpg\" alt=\"\">\n        </a>\n</div> -->\n<!-- <div class=\"onder_title\">網頁建置中</div> -->\n\n<div class=\"call_box lt_mb\">\n<div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n<div class=\"call_font\">如需租借場地拍攝廣告及電影，請連絡電話: 886-2-2725-5200 分機: 6614 黃先生</div>\n</div>\n";

////// text!src/template/venue/ad-shoot/1.html (rvalue)
module[54]="<!-- <div class=\"aboutpic\">\n        <a href=\"images/56f38bf8bd22c.jpg\" data-fancybox=\"images\" data-caption=\"200吋LED\">\n        <img src=\"images/56f38bf8bd22c.jpg\" alt=\"\">\n        </a>\n</div> -->\n<!-- <div class=\"onder_title\">網頁建置中</div> -->\n<div class=\"call_box lt_mb\">\n<div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n<div class=\"call_font\">如需租借場地拍攝廣告及電影，請連絡電話: 886-2-2725-5200 分機: 5527 張先生</div>\n</div>\n";

////// text!src/template/venue/ad-shoot.html (rvalue)
module[55]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">廣告拍攝</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n        <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n\n\n    <router-view />\n    <div class=\"none_content\"></div>\n</div>\n";

////// text!src/template/venue/ad-led200.html (rvalue)
module[56]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">200吋LED</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n                        <ul class=\"hall_tab\">\n                                <router-link :to=menu.fullPath><li class=\"active\">1館</li></router-link>\n                        </ul>\n\n<!--1館-->\n                        <div class=\"aboutpic\">\n                                <a href=\"images/w01.jpg\" data-fancybox=\"images\" data-caption=\"200吋LED\">\n                                <img src=\"images/w01.jpg\" alt=\"\">\n                                </a>\n                        </div>\n\n                        <ul class=\"download_goto\">\n                            <li><i class=\"mdi mdi-export\"></i></li>\n                            <li><a href=\"/venue/app-ad/1\" >廣告申請專區</a></li>\n                        </ul>\n\n<!--1館-->\n\n\n</div>\n";

////// text!src/template/venue/ad-lcd-bulletin-board/2.html (rvalue)
module[57]="<div class=\"for_hall_2\">\n<!--2館-->\n    <div class=\"aboutpic\">\n        <a href=\"images/30.jpg\" data-fancybox=\"images\" data-caption=\"電子看板\">\n        <img src=\"images/30.jpg\" alt=\"\">\n        </a>\n    </div>\n    <ul class=\"download_goto\">\n        <li><i class=\"mdi mdi-export\"></i></li>\n        <li><a href=\"/venue/app-ad/2\" >廣告申請專區</a></li>\n    </ul>\n\n<!--2館-->\n</div>\n";

////// text!src/template/venue/ad-lcd-bulletin-board/1.html (rvalue)
module[58]="<div class=\"for_hall_1\">\n<!--1館-->\n                        <div class=\"aboutpic\">\n                                <a href=\"images/adver2.png\" data-fancybox=\"images\" data-caption=\"電子看板\">\n                                <img src=\"images/adver2.png\" alt=\"\">\n                                </a>\n                        </div>\n\n                        <ul class=\"download_goto\">\n                            <li><i class=\"mdi mdi-export\"></i></li>\n                            <li><a href=\"/venue/app-ad/1\" >廣告申請專區</a></li>\n                        </ul>\n\n<!--1館-->\n</div>\n";

////// text!src/template/venue/ad-lcd-bulletin-board.html (rvalue)
module[59]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">電子看板</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n            <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n    <router-view />\n</div>\n";

////// text!src/template/venue/ad/2.html (rvalue)
module[60]="<div class=\"for_hall_2\">\n<!--2館-->\n    <div class=\"aboutpic\">\n        <a href=\"images/31.jpg\" data-fancybox=\"images\" data-caption=\"\">\n        <img src=\"images/31.jpg\" alt=\"\">\n        </a>\n    </div>\n    <div class=\"onder_title\">廣告點位</div>\n\n    <ul class=\"onder_list_title\">\n        <li>台北南港展覽館2館臨時廣告物申請流程</li>\n    </ul>\n    <div class=\"fontbox_mg\">\n        <ul class=\"onder_dotelist\">\n            <li>Step1:「設置實施規範」請下載詳閱。</li>\n            <li>Step2:「廣告點位及收費基準」請下載參考。</li>\n            <li>Step3:「申請表」、「切結書」請填寫後回傳。</li>\n        </ul>\n    </div>\n\n    <div class=\"call_box lt_mb\">\n        <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n        <div class=\"call_font\">展覽、活動、會議之主辦單位請洽本中心專案窗口。 如須長期租用廣告點位，請洽連絡電話: 886-2-2725-5200 分機: 6614黃先生</div>\n    </div>\n    <ul class=\"download_goto\">\n        <li><i class=\"mdi mdi-export\"></i></li>\n        <li><a href=\"/venue/app-ad/2\" >廣告申請專區</a></li>\n    </ul>\n<!--2館-->\n</div>\n";

////// text!src/template/venue/ad/1.html (rvalue)
module[61]="<div class=\"for_hall_1\">\n<!--1館-->\n<div class=\"aboutpic\">\n<a href=\"images/Advertisements1.jpg\" data-fancybox=\"images\" data-caption=\"\">\n<img src=\"images/Advertisements1.jpg\" alt=\"\">\n</a>\n</div>\n\n<ul class=\"onder_list_title\">\n<li>台北南港展覽館1館臨時廣告物申請流程</li>\n</ul>\n<div class=\"fontbox_mg\">\n<ul class=\"onder_dotelist\">\n<li>Step1:「設置實施規範」請下載詳閱。</li>\n<li>Step2:「廣告點位及收費基準」請下載參考。</li>\n<li>Step3: 「申請表」、「切結書」請填寫後回傳。</li>\n</ul>\n</div>\n\n\n<div class=\"call_box lt_mb\">\n<div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n<div class=\"call_font\">展覽、活動、會議之主辦單位請洽本中心專案窗口。如須長期租用廣告點位，請洽連絡電話: 886-2-2725-5200  分機:  5527</div>\n</div>\n<ul class=\"download_goto\">\n    <li><i class=\"mdi mdi-export\"></i></li>\n    <li><a href=\"/venue/app-ad/1\" >廣告申請專區</a></li>\n</ul>\n\n<!--1館-->\n</div>\n";

////// text!src/template/venue/ad.html (rvalue)
module[62]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">廣告刊登</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n            <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n    <router-view />\n</div>\n";

////// text!src/template/venue/other-room/2/4.html (rvalue)
module[63]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>R/S區主辦單位辦公室</li>\n                </ul>\n                <a href=\"images/room_r.jpg\" data-fancybox=\"images\" data-caption=\"R/S區主辦單位辦公室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_r.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">11㎡/ 4.12 x 2.8 x 2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$1,000 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n</div>\n";

////// text!src/template/venue/other-room/2/1.html (rvalue)
module[64]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>P/Q區主辦單位辦公室</li>\n                </ul>\n                <a href=\"images/room_p.jpg\" data-fancybox=\"images\" data-caption=\"P/Q區主辦單位辦公室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_p.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">11㎡/ 4.12 x 2.8 x 2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$1,000 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n</div>\n";

////// text!src/template/venue/other-room/2.html (rvalue)
module[65]="<div class=\"for_hall_2\">\n    <!-- <div class=\"onder_title\">*僅開放展覽、活動、會議之主辦單位租用。</div> -->\n    <div class=\"floor\">\n            <ul>\n                    <menu-item v-for='(item, i) in menu.item' active-class=active2 :key=i :item=item class=mr-0.5 />\n            </ul>\n    </div>\n    <router-view />\n</div>\n";

////// text!src/template/venue/other-room/1/5.html (rvalue)
module[66]="<div class=\"for_hall_1\">\n        <!--1館-->\n        <div class=\"expo_table\">\n            <table width=\"100%\" border=\"0\">\n                            <tbody>\n                                <tr>\n                                    <td colspan=\"6\" bgcolor=\"#006182\">\n                                        <p align=\"center\"><strong class=\"hall1_yo_title\">5樓西側-收費基準</strong></p>\n                                    </td>\n                                </tr>\n                                <tr>\n                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                        <p><strong>空間編號</strong></p>\n                                    </td>\n                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p align=\"center\"><strong>面積</strong><br />\n                                      <strong>(平方公尺)</strong></p>\n                                    </td>\n                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                        <p align=\"center\">坪</p>\n                                    </td>\n                                    <td colspan=\"2\" bgcolor=\"#dfdfdf\">\n                                        <p><strong>每時段租金(4小時/時段)</strong></p>\n                                    </td>\n                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p>尺寸長x寬x高(m)</p></td>\n                                </tr>\n                                <tr>\n                                    <td bgcolor=\"#dfdfdf\">\n                                        <p>周一至周五日間</p>\n                                    </td>\n                                    <td bgcolor=\"#dfdfdf\">\n                                        <p>夜間、例假日及室內攤位展出</p>\n                                    </td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                      <p>521</p>\n                                    </td>\n                                    <td>\n                                        <p>171.98</p>\n                                    </td>\n                                    <td>\n                                        <p>52.02</p>\n                                    </td>\n                                    <td>\n                                        <p>$7,500</p>\n                                    </td>\n                                    <td>\n                                        <p>$9,000</p>\n                                    </td>\n                                    <td>\n                                        <p>17.85 x 7.94 x 3</p>\n                                    </td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                      <p>532</p>\n                                    </td>\n                                    <td>\n                                        <p>64.4</p>\n                                    </td>\n                                    <td>\n                                        <p>19.48</p>\n                                    </td>\n                                    <td>\n                                        <p>$4,400</p>\n                                    </td>\n                                    <td>\n                                        <p>$5,280</p>\n                                    </td>\n                                    <td>9.91 x 6.5 x 2.67</td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                      <p>533</p>\n                                    </td>\n                                    <td>\n                                        <p>54</p>\n                                    </td>\n                                    <td>\n                                        <p>16.34</p>\n                                    </td>\n                                    <td>\n                                        <p>$3,700</p>\n                                    </td>\n                                    <td>\n                                        <p>$4,440</p>\n                                    </td>\n                                    <td>\n                                        <p>5.48 x 10.38 x 2.7</p>\n                                    </td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                      <p>534</p>\n                                    </td>\n                                    <td>\n                                        <p>59.84</p>\n                                    </td>\n                                    <td>\n                                        <p>18.1</p>\n                                    </td>\n                                    <td>\n                                        <p>$3,800</p>\n                                    </td>\n                                    <td>\n                                        <p>$4,560</p>\n                                    </td>\n                                    <td>8.8 x 6.8 x 3</td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                      <p>535</p>\n                                    </td>\n                                    <td>\n                                        <p>32.99</p>\n                                    </td>\n                                    <td>\n                                        <p>9.98</p>\n                                    </td>\n                                    <td>\n                                        <p>$3,200</p>\n                                    </td>\n                                    <td>\n                                        <p>$3,840</p>\n                                    </td>\n                                    <td><p>7.69 x 4.4 x 3</p></td>\n                                </tr>\n\n                            </tbody>\n                        </table>\n\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/多功能空間借用基準及實施規範.pdf\" target=\"_blank\">多功能空間借用基準及實施規範</a></li>\n        </ul>\n\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5F-多功能空間編號平面圖</li>\n                                </ul>\n                                <a href=\"images/Function_5F.jpg\" data-fancybox=\"images\" data-caption=\"5F-多功能空間編號平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/Function_5F.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n        <!--1館-->\n</div>\n";

////// text!src/template/venue/other-room/1/4.html (rvalue)
module[67]="<div class=\"for_hall_1\">\n        <!--1館-->\n        <div class=\"expo_table\">\n            <table width=\"100%\" border=\"0\">\n                        <tbody>\n                            <tr>\n                                <td colspan=\"6\" bgcolor=\"#006182\">\n                                    <p align=\"center\"><strong class=\"hall1_yo_title\">4樓西側-收費基準</strong></p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                    <p><strong>空間編號</strong></p>\n                                </td>\n                                <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p align=\"center\"><strong>面積</strong><br />\n                                  <strong>(平方公尺)</strong></p>\n                                </td>\n                                <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                    <p align=\"center\">坪</p>\n                                </td>\n                                <td colspan=\"2\" bgcolor=\"#dfdfdf\">\n                                    <p><strong>每時段租金(4小時/時段)</strong></p>\n                                </td>\n                                <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p>尺寸長x寬x高(m)</p></td>\n                            </tr>\n                            <tr>\n                                <td bgcolor=\"#dfdfdf\">\n                                    <p>周一至周五日間</p>\n                                </td>\n                                <td bgcolor=\"#dfdfdf\">\n                                    <p>夜間、例假日及室內攤位展出</p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td>\n                                  <p>406</p>\n                                </td>\n                                <td>\n                                    <p>46.46</p>\n                                </td>\n                                <td>\n                                    <p>14.05</p>\n                                </td>\n                                <td>\n                                    <p>$3,800</p>\n                                </td>\n                                <td>\n                                    <p>$4,560</p>\n                                </td>\n                                <td>\n                                    <p>9.7 x 5.04 x 3.23</p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td>\n                                  <p>429</p>\n                                  <p>429-1</p>\n                                </td>\n                                <td>\n                                    <p>66.26</p>\n                                    <p>9.65</p></td>\n                                <td>\n                                    <p>20.04 2.91</p>\n                                </td>\n                                <td>\n                                    <p>$5,000</p>\n                                </td>\n                                <td>\n                                    <p>$6,000</p>\n                                </td>\n                                <td><p>8.16 x 9.63 x 3.23</p>\n                                <p>3.81 x 2.56 x 3.23</p></td>\n                            </tr>\n                            <tr>\n                                <td>\n                                  <p>434</p>\n                                </td>\n                                <td>\n                                    <p>29.93</p>\n                                </td>\n                                <td>\n                                    <p>9.05</p>\n                                </td>\n                                <td>\n                                    <p>$3, 200</p>\n                                </td>\n                                <td>\n                                    <p>$3,840</p>\n                                </td>\n                                <td>\n                                    <p>7.86 x 4.28 x 3.23</p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td>\n                                  <p>435</p>\n                                </td>\n                                <td>\n                                    <p>32.83</p>\n                                </td>\n                                <td>\n                                    <p>9.93</p>\n                                </td>\n                                <td>\n                                    <p>$3, 200</p>\n                                </td>\n                                <td>\n                                    <p>$3,840</p>\n                                </td>\n                                <td>7.86 x 4.33 x 3.23</td>\n                            </tr>\n                            <tr>\n                                <td>\n                                  <p>439</p>\n                                </td>\n                                <td>\n                                    <p>32.94</p>\n                                </td>\n                                <td>\n                                    <p>9.96</p>\n                                </td>\n                                <td>\n                                    <p>$3,200</p>\n                                </td>\n                                <td>\n                                    <p>$3,840</p>\n                                </td>\n                                <td><p>6.85 x 5 x 3.29</p></td>\n                            </tr>\n                             <tr>\n                                <td>\n                                  <p>441</p>\n                                </td>\n                                <td>\n                                    <p>41.62</p>\n                                </td>\n                                <td>\n                                    <p>12.59</p>\n                                </td>\n                                <td>\n                                    <p>$3,800</p>\n                                </td>\n                                <td>\n                                    <p>$4,560</p>\n                                </td>\n                                <td><p>7.77 x 5.47 x 3.23</p></td>\n                            </tr>\n                             <tr>\n                                <td>\n                                  <p>442</p>\n                                </td>\n                                <td>\n                                    <p>10.70</p>\n                                </td>\n                                <td>\n                                    <p>3.23</p>\n                                </td>\n                                <td>\n                                    <p>$1,200</p>\n                                </td>\n                                <td>\n                                    <p>$1,440</p>\n                                </td>\n                                <td><p>3.65 x 3.09 x 3.23</p></td>\n                            </tr>\n                             <tr>\n                                <td>\n                                  <p>449</p>\n                                  <p>450</p>\n                                </td>\n                                <td>\n                                    <p>79.30</p>\n                                    <p>8.30</p>\n                                </td>\n                                <td>\n                                    <p>23.98</p>\n                                    <p>2.51</p>\n                                </td>\n                                <td>\n                                    <p>$5,000</p>\n                                </td>\n                                <td>\n                                    <p>$6,000</p>\n                                </td>\n                                <td><p>8.83 x 9.64 x 3.4</p></td>\n                            </tr>\n\n                        </tbody>\n                    </table>\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/多功能空間借用基準及實施規範.pdf\" target=\"_blank\">多功能空間借用基準及實施規範</a></li>\n        </ul>\n\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4F-多功能空間編號平面圖</li>\n                                </ul>\n                                <a href=\"images/Function_4F.jpg\" data-fancybox=\"images\" data-caption=\"1F-多功能空間編號平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/Function_4F.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n        <!--1館-->\n</div>\n";

////// text!src/template/venue/other-room/1/1.html (rvalue)
module[68]="<div class=\"for_hall_1\">\n        <!--1館-->\n        <div class=\"expo_table\">\n            <table width=\"100%\" border=\"0\">\n                <tbody>\n                    <tr>\n                        <td colspan=\"6\" bgcolor=\"#006182\">\n                            <p align=\"center\"><strong class=\"hall1_yo_title\">1樓西側-收費基準</strong></p>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                            <p><strong>空間編號</strong></p>\n                        </td>\n                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p align=\"center\"><strong>面積</strong><br />\n                          <strong>(平方公尺)</strong></p>\n                        </td>\n                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                            <p align=\"center\">坪</p>\n                        </td>\n                        <td colspan=\"2\" bgcolor=\"#dfdfdf\">\n                            <p><strong>每時段租金(4小時/時段)</strong></p>\n                        </td>\n                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\"><p>尺寸長x寬x高(m)</p></td>\n                    </tr>\n                    <tr>\n                        <td bgcolor=\"#dfdfdf\">\n                            <p>周一至周五日間</p>\n                        </td>\n                        <td bgcolor=\"#dfdfdf\">\n                            <p>夜間、例假日及室內攤位展出</p>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <p>107</p>\n                        </td>\n                        <td>\n                            <p>19.07</p>\n                            <p>11.10</p>\n                        </td>\n                        <td>\n                            <p>5.76</p>\n                            <p>3.36</p>\n                        </td>\n                        <td>\n                            <p>$3,200</p>\n                        </td>\n                        <td>\n                            <p>$3,840</p>\n                        </td>\n                        <td>\n                            <p>3.9x4.89x32</p>\n                            <p>6x1.85x3.2</p>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <p>129</p>\n                        </td>\n                        <td>\n                            <p>41.46</p>\n                        </td>\n                        <td>\n                            <p>12.54</p>\n                        </td>\n                        <td>\n                            <p>$3,800</p>\n                        </td>\n                        <td>\n                            <p>$4,560</p>\n                        </td>\n                        <td>8.13x5.1x3.2</td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <p>134</p>\n                            <p>135</p>\n                        </td>\n                        <td>\n                            <p>46.84</p>\n                            <p>29.17</p>\n                        </td>\n                        <td>\n                            <p>14.06</p>\n                            <p>8.82</p>\n                        </td>\n                        <td>\n                            <p>$5,000</p>\n                        </td>\n                        <td>\n                            <p>$6,000</p>\n                        </td>\n                        <td>\n                            <p>6.47x6.44x3.2</p>\n                            <p>6.48x3.13x3.2</p>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <p>145</p>\n                        </td>\n                        <td>\n                            <p>60.57</p>\n                        </td>\n                        <td>\n                            <p>18.32</p>\n                        </td>\n                        <td>\n                            <p>$3,800</p>\n                        </td>\n                        <td>\n                            <p>$4,560</p>\n                        </td>\n                        <td>7.3x8.62x3.2</td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <p>152</p>\n                            <p>153</p>\n                        </td>\n                        <td>\n                            <p>37.01</p>\n                            <p>22.44</p>\n                        </td>\n                        <td>\n                            <p>11.19</p>\n                            <p>6.78</p>\n                        </td>\n                        <td>\n                            <p>$3,800</p>\n                        </td>\n                        <td>\n                            <p>$4,560</p>\n                        </td>\n                        <td><p>6.5x5.94x3.2</p>\n                        <p>6.4x3.7x4.1</p></td>\n                    </tr>\n\n                </tbody>\n            </table>\n\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/多功能空間借用基準及實施規範.pdf\" target=\"_blank\">多功能空間借用基準及實施規範</a></li>\n        </ul>\n\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>1F-多功能空間編號平面圖</li>\n                                </ul>\n                                <a href=\"images/Function_1F.jpg\" data-fancybox=\"images\" data-caption=\"1F-多功能空間編號平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/Function_1F.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n        <!--1館-->\n</div>\n";

////// text!src/template/venue/other-room/1.html (rvalue)
module[69]="<div class=\"for_hall\">\n    <!-- <div class=\"onder_title\">*僅開放展覽、活動、會議之主辦單位租用。</div> -->\n    <div class=\"floor\">\n            <ul>\n                    <menu-item v-for='(item, i) in menu.item' active-class=active :key=i :item=item class=mr-0.5 />\n            </ul>\n    </div>\n\n    <router-view />\n\n\n</div>\n";

////// text!src/template/venue/other-room.html (rvalue)
module[70]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">多功能空間</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n        <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n    <router-view />\n</div>\n";

////// text!src/template/venue/vip-room/2/7.html (rvalue)
module[71]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(7F) 貴賓休息室(附洗手間)</li>\n                </ul>\n                <a href=\"images/vip_room.jpg\" data-fancybox=\"images\" data-caption=\"(7F) 貴賓休息室(附洗手間)\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/vip_room.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">66㎡/ 8.5 x 7.2 x 2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$4,000 </span>(新台幣/未稅)</li>\n                </ul>\n\n        </div>\n\n\n</div>\n";

////// text!src/template/venue/vip-room/2/4.html (rvalue)
module[72]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(4F) 第2貴賓室</li>\n                </ul>\n                <a href=\"images/4F_vip.jpg\" data-fancybox=\"images\" data-caption=\"(4F) 第2貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/4F_vip.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">96㎡/11.4 x 8.4 x2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$6,000 </span>(新台幣/未稅)</li>\n                </ul>\n\n        </div>\n\n</div>\n";

////// text!src/template/venue/vip-room/2/1.html (rvalue)
module[73]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(1F) 第1貴賓室</li>\n                </ul>\n                <a href=\"images/1F_vip2.jpg\" data-fancybox=\"images\" data-caption=\"(1F) 第1貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/1F_vip2.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">92㎡/11.4 x 8.1 x2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$6,000 </span>(新台幣/未稅)</li>\n                </ul>\n\n        </div>\n\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(1F) 貴賓簡報室</li>\n                </ul>\n                <a href=\"images/1F_vip.jpg\" data-fancybox=\"images\" data-caption=\"(1F) 貴賓簡報室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/1F_vip.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">96㎡/11.4 x 8.4 x 2.6m</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$6,000 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n\n</div>\n";

////// text!src/template/venue/vip-room/2.html (rvalue)
module[74]="<div class=\"for_hall_2\">\n<!--2館-->\n\n                        <div class=\"floor\">\n                                <ul>\n                                        <menu-item v-for='(item, i) in menu.item' active-class=active2 :key=i :item=item class=mr-0.5 />\n                                </ul>\n                        </div>\n                        <div class=\"onder_title\">*僅開放展覽、活動、會議之主辦單位租用。</div>\n                        <router-view />\n<!--2館-->\n</div>\n";

////// text!src/template/venue/vip-room/1/4.html (rvalue)
module[75]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(4F) 第3貴賓室</li>\n                </ul>\n                <a href=\"images/4FVIP4.jpg\" data-fancybox=\"images\" data-caption=\"(4F) 第3貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/4FVIP4.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">47.10㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$1,600 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(4F) 第4貴賓室</li>\n                </ul>\n                <a href=\"images/4FVIP3.jpg\" data-fancybox=\"images\" data-caption=\"(4F) 第4貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/4FVIP3.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">46.21㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$2,000 </span>(新台幣/未稅)</li>\n                        <li class=\"room_sm\">※內設廁所1間</li>\n                </ul>\n        </div>\n\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(4F) 貴賓簡報室</li>\n                </ul>\n                <a href=\"images/S__5095626_0.jpg\" data-fancybox=\"images\" data-caption=\"(4F) 貴賓簡報室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/S__5095626_0.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">188.06㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$4,000 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(4F) 新聞中心</li>\n                </ul>\n                <a href=\"images/56cc1b27afcd2.jpg\" data-fancybox=\"images\" data-caption=\"(4F) 新聞中心\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/56cc1b27afcd2.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">174㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$2,500 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n\n</div>\n";

////// text!src/template/venue/vip-room/1/1.html (rvalue)
module[76]="<div class=\"row\">\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(1F) 第1貴賓室</li>\n                </ul>\n                <a href=\"images/56cc1a8b781d9.jpg\" data-fancybox=\"images\" data-caption=\"(1F) 第1貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/56cc1a8b781d9.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">47.21㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$1,600 </span>(新台幣/未稅)</li>\n                </ul>\n        </div>\n\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(1F) 第2貴賓室</li>\n                </ul>\n                <a href=\"images/5c483218c6db0.jpg\" data-fancybox=\"images\" data-caption=\"(1F) 第2貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/5c483218c6db0.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">46.53㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$2,000 </span>(新台幣/未稅)</li>\n                        <li class=\"room_sm\">※內設廁所1間</li>\n                </ul>\n        </div>\n        <div class=\"col-12 col-md-4 col-lg-4\">\n                <ul class=\"onder_list_title\">\n                        <li>(1F) 第5貴賓室</li>\n                </ul>\n                <a href=\"images/56cc1adb1079d.jpg\" data-fancybox=\"images\" data-caption=\"(1F) 第5貴賓室\">\n                        <div class=\"about_boderpic\" style=\"background-image:url(images/56cc1adb1079d.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                        </div>\n                </a>\n\n                <ul class=\"room_title\">\n                        <li class=\"room_st\">面積</li>\n                        <li class=\"room_sm\">78.43㎡</li>\n                        <li class=\"room_st\">租金/每小時</li>\n                        <li class=\"room_sm\"><span class=\"price\">NT$3,000 </span>(新台幣/未稅)</li>\n                        <li class=\"room_sm\">※內設廁所1間</li>\n                </ul>\n        </div>\n</div>\n";

////// text!src/template/venue/vip-room/1.html (rvalue)
module[77]="<div class=\"for_hall_1\">\n<!--1館-->\n\n                        <div class=\"floor\">\n                                <ul>\n                                        <menu-item v-for='(item, i) in menu.item' active-class=active :key=i :item=item class=mr-0.5 />\n                                </ul>\n                        </div>\n                        <div class=\"onder_title\">*僅開放展覽、活動、會議之主辦單位租用。</div>\n                        <router-view />\n\n<!--1館-->\n</div>\n";

////// text!src/template/venue/vip-room.html (rvalue)
module[78]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">貴賓室及新聞中心</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n            <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n    </ul>\n    <router-view />\n</div>\n";

////// text!src/template/venue/public-space/2/4.html (rvalue)
module[79]="<!DOCTYPE html>\n<html lang=\"zh-Hant-TW\">\n\t<head>\n\t\t<meta charset=\"utf-8\">\n                <script>(function(){\n                  if(!location.host.match(/^www\\./))\n                    location.host = 'www.'+location.host;\n                  var base = document.createElement('base');\n                  base.href = location.pathname.match(/^\\/(2021(-dev)?\\/)?(en\\/)?/)[0];\n                  document.head.appendChild(base);\n                })()</script>\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\t\t<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n\t\t<meta name=\"description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\">\n\t\t<meta name=\"keywords\" content=\"台北南港展覽館, 南港展覽館, 南港, 展覽, 演唱會, 會議, 餐會, 尾牙, 春酒, 場地, 租借, 場地租借\">\n\t\t<meta property=\"og:title\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\" />\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://www.tainex.com.tw/\" />\n\t\t<meta property=\"og:site_name\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:image\" content=\"https://www.tainex.com.tw/images/1200x630.jpg\" />\n\t\t<link rel=\"shortcut icon\" href=\"images/tainex_ico.svg\" type=\"favicon.ico\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap\" rel=\"stylesheet\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=cwTeXYen\" rel=\"stylesheet\">\n\t\t<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>\n\t\t<!-- bootstrap -->\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW\" crossorigin=\"anonymous\"></script>\n\t\t<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css\" integrity=\"sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2\" crossorigin=\"anonymous\">\n\t\t<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css\">\n\t\t<!-- reset -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css\">\n\t\t<!-- mdi -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/5.8.55/css/materialdesignicons.min.css\">\n\t\t<!-- aos -->\n\t\t<link href=\"https://unpkg.com/aos@2.3.1/dist/aos.css\" rel=\"stylesheet\">\n\t\t<script src=\"https://unpkg.com/aos@2.3.1/dist/aos.js\"></script>\n\t\t<!-- fancybox -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css\">\n\t\t<script src=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js\" charset=\"utf-8\"></script>\n\t\t<!-- swiper -->\n\t\t<link rel=\"stylesheet\" href=\"https://unpkg.com/swiper/swiper-bundle.min.css\">\n\t\t<script src=\"https://unpkg.com/swiper/swiper-bundle.min.js\"></script>\n\t\t<!-- Customiz -->\n\t\t<link rel=\"stylesheet\" href=\"css/main.css\">\n                <script>\n                  if( location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ){\n                    var css_en = document.createElement('link');\n                    css_en.rel = 'stylesheet';\n                    css_en.href = 'css/main_en.css';\n                    document.head.appendChild(css_en);\n                  }\n                </script>\n                <style>\n                  .mr-0\\.5 {margin-right: 0.125rem}\n                  .underline {text-decoration: underline}\n                </style>\n    <title>南港展覽館</title>\n    <script type=\"text/javascript\">\n        $(document).ready(function() {\n            AOS.init({\n                once: true,\n                duration: 1200\n            })\n            //可以自動彈出來\n            // $.fancybox.open($('#hidden-content'))\n        })\n    </script>\n\n</head>\n\n\n  <body><div id=body></div>\n    <script>(function(){\n      var xhr = new XMLHttpRequest;\n      xhr.onreadystatechange = function(){\n        if( xhr.readyState===4 ){\n          xhr.onreadystatechange = new Function('');\n          (new Function('config', xhr.responseText))({\n              base: 'src',\n              plugins: {\n                  ls: 'plugins/ls',\n                  text: 'plugins/text',\n                  defer: 'plugins/defer',\n                  global: 'plugins/global'\n              },\n              main: 'ls!main',\n              verbose: true,\n              compile: window.location.search.match(/compile/) ? {\n                  template: 'template',\n\n                  output: 'download',\n                  filename: location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ? 'compiled-en.js' : 'compiled.js',\n              } : null\n          });\n        }\n      };\n      xhr.open('GET', 'src/define.js?now='+Date.now());\n      xhr.send(null);\n    })()</script>\n  </body>\n\t<script>\n\t$(window).scroll(function() {\n\t\tif(!$(\".side_list\").position()){\n                        $(\".bread_crumb\").removeClass(\"gofixed\")\n\t\t\treturn\n\t\t}\n\t\tif(!$(\".side_menucontent\").position()){\n\t\t\treturn\n\t\t}\n\t\tif($(\".side_menucontent\").height()<=$(\".side_list\").height()){\n\t\t\treturn\n\t\t}\n\t\tvar lastScrollTop = 0;\n\t\tvar winww = $(window).width()\n\t\tvar winhh = $(window).height()\n\t\tvar dochh = $(document).height()\n\t\tvar breadhh = $(\".bread_crumb\").height()\n\t\tvar bannerhh = $(\".page_banner\").height()\n\t\tvar hheader = $(\"header\").height()\n\t\tvar footerhh = $(\"footer\").height()\n\t\tvar baseheight = bannerhh+30\n\t\tvar barpos = $(\".side_list\").position().top\n\t\tvar breadpos = $(\".bread_crumb\").position().top\n\t\tvar footerpos = $(\"footer\").position().top\n\t\tvar wtop = $(this).scrollTop();\n\t\tvar sidetop = hheader+breadhh+30\n\t\tvar pb = 0\n\t\tif(winww>=768){\n\t\t}else{\n\t\t\tbaseheight = baseheight+breadhh\n\t\t\tsidetop = bannerhh+30\n\t\t\tpb = 80\n\n\t\t}\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"footerpos:\"+footerpos);\n\t\tif (wtop > lastScrollTop){\n\t     // downscroll code\n\t\t\t if(wtop>=baseheight){\n\t\t\t\t $(\".side_list\").addClass(\"gofixed\")\n\t\t\t\t $(\".side_list\").css(\"top\",sidetop)\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",pb)\n\t\t\t\t $(\".bread_crumb\").addClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",hheader)\n\n\t\t\t\t var botpos = wtop+$(\".side_list\").height()\n\n\t\t\t\t //console.log(\"winhh:\"+winhh);\n\t\t\t\t //console.log(\"dochh:\"+dochh);\n\t\t\t\t //console.log(\"wtop:\"+wtop);\n\t\t\t\t if(winww>=768){\n\t\t\t\t\t var pp =(wtop+bannerhh+breadhh+$(\".side_list\").height())+60\n\t\t\t\t\t\tvar aa = dochh-pp\n\t\t\t\t\t\tvar sub = footerhh-aa\n\t\t\t\t\t\tif(sub>=0){\n\t\t\t\t\t\t\tvar bb = sidetop-sub\n\t\t\t\t\t\t\t$(\".side_list\").css(\"top\",bb)\n\t\t\t\t\t\t\t//console.log(\"=====bb:\"+bb);\n\t\t\t\t\t\t}\n\t\t\t\t\t\t//console.log(\"pp:\"+pp);\n\t\t\t\t\t\t//console.log(\"aa:\"+aa);\n\t\t\t\t\t\t//console.log(\"sub:\"+sub);\n\t\t\t\t\t\t//console.log(\"==================\")\n\n\t\t\t\t }\n\t\t\t\t // console.log(\"1111\");\n\t\t\t }else{\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t\t // console.log(\"222\");\n\t\t\t }\n\t  } else {\n\t     // upscroll code\n\t\t\t if(wtop<=hheader){\n\t\t\t\t // console.log(\"333\");\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t }else{\n\t\t\t\t // console.log(\"444\");\n\t\t\t }\n\t  }\n\t  lastScrollTop = wtop;\n\t\t//\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"breadpos:\"+breadpos);\n\t\t// console.log(\"======\")\n\t});\n\n\t</script>\n</html>\n";

////// text!src/template/venue/public-space/2/1.html (rvalue)
module[80]="<!DOCTYPE html>\n<html lang=\"zh-Hant-TW\">\n\t<head>\n\t\t<meta charset=\"utf-8\">\n                <script>(function(){\n                  if(!location.host.match(/^www\\./))\n                    location.host = 'www.'+location.host;\n                  var base = document.createElement('base');\n                  base.href = location.pathname.match(/^\\/(2021(-dev)?\\/)?(en\\/)?/)[0];\n                  document.head.appendChild(base);\n                })()</script>\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\t\t<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n\t\t<meta name=\"description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\">\n\t\t<meta name=\"keywords\" content=\"台北南港展覽館, 南港展覽館, 南港, 展覽, 演唱會, 會議, 餐會, 尾牙, 春酒, 場地, 租借, 場地租借\">\n\t\t<meta property=\"og:title\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\" />\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://www.tainex.com.tw/\" />\n\t\t<meta property=\"og:site_name\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:image\" content=\"https://www.tainex.com.tw/images/1200x630.jpg\" />\n\t\t<link rel=\"shortcut icon\" href=\"images/tainex_ico.svg\" type=\"favicon.ico\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap\" rel=\"stylesheet\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=cwTeXYen\" rel=\"stylesheet\">\n\t\t<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>\n\t\t<!-- bootstrap -->\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW\" crossorigin=\"anonymous\"></script>\n\t\t<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css\" integrity=\"sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2\" crossorigin=\"anonymous\">\n\t\t<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css\">\n\t\t<!-- reset -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css\">\n\t\t<!-- mdi -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/5.8.55/css/materialdesignicons.min.css\">\n\t\t<!-- aos -->\n\t\t<link href=\"https://unpkg.com/aos@2.3.1/dist/aos.css\" rel=\"stylesheet\">\n\t\t<script src=\"https://unpkg.com/aos@2.3.1/dist/aos.js\"></script>\n\t\t<!-- fancybox -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css\">\n\t\t<script src=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js\" charset=\"utf-8\"></script>\n\t\t<!-- swiper -->\n\t\t<link rel=\"stylesheet\" href=\"https://unpkg.com/swiper/swiper-bundle.min.css\">\n\t\t<script src=\"https://unpkg.com/swiper/swiper-bundle.min.js\"></script>\n\t\t<!-- Customiz -->\n\t\t<link rel=\"stylesheet\" href=\"css/main.css\">\n                <script>\n                  if( location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ){\n                    var css_en = document.createElement('link');\n                    css_en.rel = 'stylesheet';\n                    css_en.href = 'css/main_en.css';\n                    document.head.appendChild(css_en);\n                  }\n                </script>\n                <style>\n                  .mr-0\\.5 {margin-right: 0.125rem}\n                  .underline {text-decoration: underline}\n                </style>\n    <title>南港展覽館</title>\n    <script type=\"text/javascript\">\n        $(document).ready(function() {\n            AOS.init({\n                once: true,\n                duration: 1200\n            })\n            //可以自動彈出來\n            // $.fancybox.open($('#hidden-content'))\n        })\n    </script>\n\n</head>\n\n\n  <body><div id=body></div>\n    <script>(function(){\n      var xhr = new XMLHttpRequest;\n      xhr.onreadystatechange = function(){\n        if( xhr.readyState===4 ){\n          xhr.onreadystatechange = new Function('');\n          (new Function('config', xhr.responseText))({\n              base: 'src',\n              plugins: {\n                  ls: 'plugins/ls',\n                  text: 'plugins/text',\n                  defer: 'plugins/defer',\n                  global: 'plugins/global'\n              },\n              main: 'ls!main',\n              verbose: true,\n              compile: window.location.search.match(/compile/) ? {\n                  template: 'template',\n\n                  output: 'download',\n                  filename: location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ? 'compiled-en.js' : 'compiled.js',\n              } : null\n          });\n        }\n      };\n      xhr.open('GET', 'src/define.js?now='+Date.now());\n      xhr.send(null);\n    })()</script>\n  </body>\n\t<script>\n\t$(window).scroll(function() {\n\t\tif(!$(\".side_list\").position()){\n                        $(\".bread_crumb\").removeClass(\"gofixed\")\n\t\t\treturn\n\t\t}\n\t\tif(!$(\".side_menucontent\").position()){\n\t\t\treturn\n\t\t}\n\t\tif($(\".side_menucontent\").height()<=$(\".side_list\").height()){\n\t\t\treturn\n\t\t}\n\t\tvar lastScrollTop = 0;\n\t\tvar winww = $(window).width()\n\t\tvar winhh = $(window).height()\n\t\tvar dochh = $(document).height()\n\t\tvar breadhh = $(\".bread_crumb\").height()\n\t\tvar bannerhh = $(\".page_banner\").height()\n\t\tvar hheader = $(\"header\").height()\n\t\tvar footerhh = $(\"footer\").height()\n\t\tvar baseheight = bannerhh+30\n\t\tvar barpos = $(\".side_list\").position().top\n\t\tvar breadpos = $(\".bread_crumb\").position().top\n\t\tvar footerpos = $(\"footer\").position().top\n\t\tvar wtop = $(this).scrollTop();\n\t\tvar sidetop = hheader+breadhh+30\n\t\tvar pb = 0\n\t\tif(winww>=768){\n\t\t}else{\n\t\t\tbaseheight = baseheight+breadhh\n\t\t\tsidetop = bannerhh+30\n\t\t\tpb = 80\n\n\t\t}\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"footerpos:\"+footerpos);\n\t\tif (wtop > lastScrollTop){\n\t     // downscroll code\n\t\t\t if(wtop>=baseheight){\n\t\t\t\t $(\".side_list\").addClass(\"gofixed\")\n\t\t\t\t $(\".side_list\").css(\"top\",sidetop)\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",pb)\n\t\t\t\t $(\".bread_crumb\").addClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",hheader)\n\n\t\t\t\t var botpos = wtop+$(\".side_list\").height()\n\n\t\t\t\t //console.log(\"winhh:\"+winhh);\n\t\t\t\t //console.log(\"dochh:\"+dochh);\n\t\t\t\t //console.log(\"wtop:\"+wtop);\n\t\t\t\t if(winww>=768){\n\t\t\t\t\t var pp =(wtop+bannerhh+breadhh+$(\".side_list\").height())+60\n\t\t\t\t\t\tvar aa = dochh-pp\n\t\t\t\t\t\tvar sub = footerhh-aa\n\t\t\t\t\t\tif(sub>=0){\n\t\t\t\t\t\t\tvar bb = sidetop-sub\n\t\t\t\t\t\t\t$(\".side_list\").css(\"top\",bb)\n\t\t\t\t\t\t\t//console.log(\"=====bb:\"+bb);\n\t\t\t\t\t\t}\n\t\t\t\t\t\t//console.log(\"pp:\"+pp);\n\t\t\t\t\t\t//console.log(\"aa:\"+aa);\n\t\t\t\t\t\t//console.log(\"sub:\"+sub);\n\t\t\t\t\t\t//console.log(\"==================\")\n\n\t\t\t\t }\n\t\t\t\t // console.log(\"1111\");\n\t\t\t }else{\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t\t // console.log(\"222\");\n\t\t\t }\n\t  } else {\n\t     // upscroll code\n\t\t\t if(wtop<=hheader){\n\t\t\t\t // console.log(\"333\");\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t }else{\n\t\t\t\t // console.log(\"444\");\n\t\t\t }\n\t  }\n\t  lastScrollTop = wtop;\n\t\t//\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"breadpos:\"+breadpos);\n\t\t// console.log(\"======\")\n\t});\n\n\t</script>\n</html>\n";

////// text!src/template/venue/public-space/2.html (rvalue)
module[81]="<div class=\"for_hall_2\">\n        <!--2館-->\n\n        <!-- <div class=\"onder_title\">洽詢公共空間</div> -->\n        <!-- <ul class=\"onder_list_title\">\n                <li>洽詢貿協會台北南港展覽館館公共空間借用流程</li>\n        </ul>\n\n        <div class=\"fontbox_mg\">\n                <ul class=\"onder_dotelist\">\n                        <li>Step1:「借用收費基準及實施規範」請詳閱：【單獨租用】公共空間收費基準及實施規範</li>\n                        <li>Step2:「公共空間申請表」請依需求下載後回傳：【其他】公共空間申請表</li>\n                </ul>\n        </div> -->\n\n        <!-- <div class=\"call_box lt_mb\">\n                <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n                <div class=\"call_font\">連絡電話: 886-2-2725-5200 分機6614 黃先生</div>\n        </div> -->\n\n\n        <div class=\"onder_title\">2館-公共空間收費基準</div>\n        <ul class=\"onder_list_title\">\n                <li>適用單獨租用客戶</li>\n        </ul>\n\n        <div class=\"expo_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                    <td colspan=\"5\" bgcolor=\"#00AA9D\">\n                                    <p align=\"center\"><strong class=\"hall1_yo_title\">2館-公共空間收費基準</strong>\n                                    </p>\n                                    </td>\n                                </tr>\n                                <tr>\n                                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                <p><strong>公共空間地點</strong></p>\n                                        </td>\n                                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                <p align=\"center\"><strong>面積</strong><strong> </strong><br>\n                                                        <strong>(平方公尺)</strong></p>\n                                        </td>\n                                        <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                <p align=\"center\"><strong>尺寸</strong><strong> </strong><br>\n                                                        <strong>(長 </strong><strong>x </strong><strong>寬 </strong><strong>)</strong><strong>(m)</strong></p>\n                                        </td>\n                                        <td colspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                <p><strong>租金(小時</strong><strong>)</strong></p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#dfdfdf\">\n                                                <p><strong>週一至週五</strong></p>\n                                        </td>\n                                        <td bgcolor=\"#dfdfdf\">\n                                                <p><strong>夜間、例假日或</strong><strong><br>\n                                                        </strong><strong>室內攤位展出</strong></p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>1樓東側廊道北區</p>\n                                        </td>\n                                        <td>\n                                                <p>96</p>\n                                        </td>\n                                        <td>\n                                                <p>16 x 6</p>\n                                        </td>\n                                        <td>\n                                                <p>4,800</p>\n                                        </td>\n                                        <td>\n                                                <p>6,200</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>1樓東側廊道南區</p>\n                                        </td>\n                                        <td>\n                                                <p>36</p>\n                                        </td>\n                                        <td>\n                                                <p>6 x 6</p>\n                                        </td>\n                                        <td>\n                                                <p>1,800</p>\n                                        </td>\n                                        <td>\n                                                <p>2,300</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>1樓戶外北區</p>\n                                        </td>\n                                        <td>\n                                                <p>1,512</p>\n                                        </td>\n                                        <td>\n                                                <p>168 x 9</p>\n                                        </td>\n                                        <td>\n                                                <p>5,000</p>\n                                        </td>\n                                        <td>\n                                                <p>6,500</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>1樓戶外西區</p>\n                                        </td>\n                                        <td>\n                                                <p>1,040</p>\n                                        </td>\n                                        <td>\n                                                <p>13 x 80</p>\n                                        </td>\n                                        <td>\n                                                <p>3,000</p>\n                                        </td>\n                                        <td>\n                                                <p>3,900</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>1樓戶外南區</p>\n                                        </td>\n                                        <td>\n                                                <p>1,512</p>\n                                        </td>\n                                        <td>\n                                                <p>21 x 72</p>\n                                        </td>\n                                        <td>\n                                                <p>10,000</p>\n                                        </td>\n                                        <td>\n                                                <p>13,000</p>\n                                        </td>\n                                </tr>\n\n                                <tr>\n                                        <td>\n                                                <p>B1連通道門廳</p>\n                                        </td>\n                                        <td>\n                                                <p>104</p>\n                                        </td>\n                                        <td>\n                                                <p>13 x 8</p>\n                                        </td>\n                                        <td>\n                                                <p>2,100</p>\n                                        </td>\n                                        <td>\n                                                <p>2,700</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>3樓東側廊道</p>\n                                        </td>\n                                        <td>\n                                                <p>967</p>\n                                        </td>\n                                        <td>\n                                                <p>101.8 x 9.5</p>\n                                        </td>\n                                        <td>\n                                                <p>20,000</p>\n                                        </td>\n                                        <td>\n                                                <p>26,000</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>4樓廊道南/北區</p>\n                                        </td>\n                                        <td>\n                                                <p>267</p>\n                                        </td>\n                                        <td>\n                                                <p>44.5 x 6</p>\n                                        </td>\n                                        <td>\n                                                <p>5,400</p>\n                                        </td>\n                                        <td>\n                                                <p>7,000</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓星光長廊全區</p>\n                                        </td>\n                                        <td>\n                                                <p>2,796</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                        <td>\n                                                <p>138,000</p>\n                                        </td>\n                                        <td>\n                                                <p>179,400</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓星光長廊a-j各區</p>\n                                        </td>\n                                        <td>\n                                                <p> 180</p>\n                                        </td>\n                                        <td>\n                                                <p>18 x 10</p>\n                                        </td>\n                                        <td>\n                                                <p>6,000</p>\n                                        </td>\n                                        <td>\n                                                <p>7,800</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓星光長廊k/l各區</p>\n                                        </td>\n                                        <td>\n                                                <p>486</p>\n                                        </td>\n                                        <td>\n                                                <p>27 x 18</p>\n                                        </td>\n                                        <td>\n                                                <p>45,000</p>\n                                        </td>\n                                        <td>\n                                                <p>58,500</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓空中花園全區</p>\n                                        </td>\n                                        <td>\n                                                <p>6,166</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓空中花園東區</p>\n                                        </td>\n                                        <td>\n                                                <p>1,260</p>\n                                        </td>\n                                        <td>\n                                                <p>90 x 14</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td>\n                                                <p>7樓空中花園南/北區</p>\n                                        </td>\n                                        <td>\n                                                <p>2,592</p>\n                                        </td>\n                                        <td>\n                                                <p>18 x 144</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                        <td>\n                                                <p>N/A</p>\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td colspan=\"5\">【註】廊道需保持3公尺以上之淨空</td>\n                                </tr>\n                        </tbody>\n                </table>\n\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/南港2館公共空間租用收費基準_230215.pdf\" target=\"_blank\">公共空間租用收費基準</a></li>\n        </ul>\n\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>1F</li>\n                                </ul>\n                                <a href=\"images/南港展覽館2館1F_平面圖_230216.jpg\" data-fancybox=\"images\" data-caption=\"1F\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館1F_平面圖_230216.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4F</li>\n                                </ul>\n                                <a href=\"images/南港展覽館2館4F_平面圖_202111.jpg\" data-fancybox=\"images\" data-caption=\"4F\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館4F_平面圖_202111.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>7F</li>\n                                </ul>\n                                <a href=\"images/南港展覽館2館7F_全場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"7F\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_全場平面圖_202205.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n\n\n                </div>\n        </div>\n\n        <!--2館-->\n</div>\n";

////// text!src/template/venue/public-space/1/4.html (rvalue)
module[82]="<!DOCTYPE html>\n<html lang=\"zh-Hant-TW\">\n\t<head>\n\t\t<meta charset=\"utf-8\">\n                <script>(function(){\n                  if(!location.host.match(/^www\\./))\n                    location.host = 'www.'+location.host;\n                  var base = document.createElement('base');\n                  base.href = location.pathname.match(/^\\/(2021(-dev)?\\/)?(en\\/)?/)[0];\n                  document.head.appendChild(base);\n                })()</script>\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\t\t<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n\t\t<meta name=\"description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\">\n\t\t<meta name=\"keywords\" content=\"台北南港展覽館, 南港展覽館, 南港, 展覽, 演唱會, 會議, 餐會, 尾牙, 春酒, 場地, 租借, 場地租借\">\n\t\t<meta property=\"og:title\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\" />\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://www.tainex.com.tw/\" />\n\t\t<meta property=\"og:site_name\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:image\" content=\"https://www.tainex.com.tw/images/1200x630.jpg\" />\n\t\t<link rel=\"shortcut icon\" href=\"images/tainex_ico.svg\" type=\"favicon.ico\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap\" rel=\"stylesheet\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=cwTeXYen\" rel=\"stylesheet\">\n\t\t<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>\n\t\t<!-- bootstrap -->\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW\" crossorigin=\"anonymous\"></script>\n\t\t<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css\" integrity=\"sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2\" crossorigin=\"anonymous\">\n\t\t<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css\">\n\t\t<!-- reset -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css\">\n\t\t<!-- mdi -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/5.8.55/css/materialdesignicons.min.css\">\n\t\t<!-- aos -->\n\t\t<link href=\"https://unpkg.com/aos@2.3.1/dist/aos.css\" rel=\"stylesheet\">\n\t\t<script src=\"https://unpkg.com/aos@2.3.1/dist/aos.js\"></script>\n\t\t<!-- fancybox -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css\">\n\t\t<script src=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js\" charset=\"utf-8\"></script>\n\t\t<!-- swiper -->\n\t\t<link rel=\"stylesheet\" href=\"https://unpkg.com/swiper/swiper-bundle.min.css\">\n\t\t<script src=\"https://unpkg.com/swiper/swiper-bundle.min.js\"></script>\n\t\t<!-- Customiz -->\n\t\t<link rel=\"stylesheet\" href=\"css/main.css\">\n                <script>\n                  if( location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ){\n                    var css_en = document.createElement('link');\n                    css_en.rel = 'stylesheet';\n                    css_en.href = 'css/main_en.css';\n                    document.head.appendChild(css_en);\n                  }\n                </script>\n                <style>\n                  .mr-0\\.5 {margin-right: 0.125rem}\n                  .underline {text-decoration: underline}\n                </style>\n    <title>南港展覽館</title>\n    <script type=\"text/javascript\">\n        $(document).ready(function() {\n            AOS.init({\n                once: true,\n                duration: 1200\n            })\n            //可以自動彈出來\n            // $.fancybox.open($('#hidden-content'))\n        })\n    </script>\n\n</head>\n\n\n  <body><div id=body></div>\n    <script>(function(){\n      var xhr = new XMLHttpRequest;\n      xhr.onreadystatechange = function(){\n        if( xhr.readyState===4 ){\n          xhr.onreadystatechange = new Function('');\n          (new Function('config', xhr.responseText))({\n              base: 'src',\n              plugins: {\n                  ls: 'plugins/ls',\n                  text: 'plugins/text',\n                  defer: 'plugins/defer',\n                  global: 'plugins/global'\n              },\n              main: 'ls!main',\n              verbose: true,\n              compile: window.location.search.match(/compile/) ? {\n                  template: 'template',\n\n                  output: 'download',\n                  filename: location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ? 'compiled-en.js' : 'compiled.js',\n              } : null\n          });\n        }\n      };\n      xhr.open('GET', 'src/define.js?now='+Date.now());\n      xhr.send(null);\n    })()</script>\n  </body>\n\t<script>\n\t$(window).scroll(function() {\n\t\tif(!$(\".side_list\").position()){\n                        $(\".bread_crumb\").removeClass(\"gofixed\")\n\t\t\treturn\n\t\t}\n\t\tif(!$(\".side_menucontent\").position()){\n\t\t\treturn\n\t\t}\n\t\tif($(\".side_menucontent\").height()<=$(\".side_list\").height()){\n\t\t\treturn\n\t\t}\n\t\tvar lastScrollTop = 0;\n\t\tvar winww = $(window).width()\n\t\tvar winhh = $(window).height()\n\t\tvar dochh = $(document).height()\n\t\tvar breadhh = $(\".bread_crumb\").height()\n\t\tvar bannerhh = $(\".page_banner\").height()\n\t\tvar hheader = $(\"header\").height()\n\t\tvar footerhh = $(\"footer\").height()\n\t\tvar baseheight = bannerhh+30\n\t\tvar barpos = $(\".side_list\").position().top\n\t\tvar breadpos = $(\".bread_crumb\").position().top\n\t\tvar footerpos = $(\"footer\").position().top\n\t\tvar wtop = $(this).scrollTop();\n\t\tvar sidetop = hheader+breadhh+30\n\t\tvar pb = 0\n\t\tif(winww>=768){\n\t\t}else{\n\t\t\tbaseheight = baseheight+breadhh\n\t\t\tsidetop = bannerhh+30\n\t\t\tpb = 80\n\n\t\t}\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"footerpos:\"+footerpos);\n\t\tif (wtop > lastScrollTop){\n\t     // downscroll code\n\t\t\t if(wtop>=baseheight){\n\t\t\t\t $(\".side_list\").addClass(\"gofixed\")\n\t\t\t\t $(\".side_list\").css(\"top\",sidetop)\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",pb)\n\t\t\t\t $(\".bread_crumb\").addClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",hheader)\n\n\t\t\t\t var botpos = wtop+$(\".side_list\").height()\n\n\t\t\t\t //console.log(\"winhh:\"+winhh);\n\t\t\t\t //console.log(\"dochh:\"+dochh);\n\t\t\t\t //console.log(\"wtop:\"+wtop);\n\t\t\t\t if(winww>=768){\n\t\t\t\t\t var pp =(wtop+bannerhh+breadhh+$(\".side_list\").height())+60\n\t\t\t\t\t\tvar aa = dochh-pp\n\t\t\t\t\t\tvar sub = footerhh-aa\n\t\t\t\t\t\tif(sub>=0){\n\t\t\t\t\t\t\tvar bb = sidetop-sub\n\t\t\t\t\t\t\t$(\".side_list\").css(\"top\",bb)\n\t\t\t\t\t\t\t//console.log(\"=====bb:\"+bb);\n\t\t\t\t\t\t}\n\t\t\t\t\t\t//console.log(\"pp:\"+pp);\n\t\t\t\t\t\t//console.log(\"aa:\"+aa);\n\t\t\t\t\t\t//console.log(\"sub:\"+sub);\n\t\t\t\t\t\t//console.log(\"==================\")\n\n\t\t\t\t }\n\t\t\t\t // console.log(\"1111\");\n\t\t\t }else{\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t\t // console.log(\"222\");\n\t\t\t }\n\t  } else {\n\t     // upscroll code\n\t\t\t if(wtop<=hheader){\n\t\t\t\t // console.log(\"333\");\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t }else{\n\t\t\t\t // console.log(\"444\");\n\t\t\t }\n\t  }\n\t  lastScrollTop = wtop;\n\t\t//\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"breadpos:\"+breadpos);\n\t\t// console.log(\"======\")\n\t});\n\n\t</script>\n</html>\n";

////// text!src/template/venue/public-space/1/1.html (rvalue)
module[83]="<!DOCTYPE html>\n<html lang=\"zh-Hant-TW\">\n\t<head>\n\t\t<meta charset=\"utf-8\">\n                <script>(function(){\n                  if(!location.host.match(/^www\\./))\n                    location.host = 'www.'+location.host;\n                  var base = document.createElement('base');\n                  base.href = location.pathname.match(/^\\/(2021(-dev)?\\/)?(en\\/)?/)[0];\n                  document.head.appendChild(base);\n                })()</script>\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\t\t<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n\t\t<meta name=\"description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\">\n\t\t<meta name=\"keywords\" content=\"台北南港展覽館, 南港展覽館, 南港, 展覽, 演唱會, 會議, 餐會, 尾牙, 春酒, 場地, 租借, 場地租借\">\n\t\t<meta property=\"og:title\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:description\" content=\"台北南港展覽館，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。\" />\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://www.tainex.com.tw/\" />\n\t\t<meta property=\"og:site_name\" content=\"南港展覽館\" />\n\t\t<meta property=\"og:image\" content=\"https://www.tainex.com.tw/images/1200x630.jpg\" />\n\t\t<link rel=\"shortcut icon\" href=\"images/tainex_ico.svg\" type=\"favicon.ico\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap\" rel=\"stylesheet\">\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=cwTeXYen\" rel=\"stylesheet\">\n\t\t<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script>\n\t\t<!-- bootstrap -->\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW\" crossorigin=\"anonymous\"></script>\n\t\t<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css\" integrity=\"sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2\" crossorigin=\"anonymous\">\n\t\t<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css\">\n\t\t<!-- reset -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css\">\n\t\t<!-- mdi -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/5.8.55/css/materialdesignicons.min.css\">\n\t\t<!-- aos -->\n\t\t<link href=\"https://unpkg.com/aos@2.3.1/dist/aos.css\" rel=\"stylesheet\">\n\t\t<script src=\"https://unpkg.com/aos@2.3.1/dist/aos.js\"></script>\n\t\t<!-- fancybox -->\n\t\t<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css\">\n\t\t<script src=\"https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js\" charset=\"utf-8\"></script>\n\t\t<!-- swiper -->\n\t\t<link rel=\"stylesheet\" href=\"https://unpkg.com/swiper/swiper-bundle.min.css\">\n\t\t<script src=\"https://unpkg.com/swiper/swiper-bundle.min.js\"></script>\n\t\t<!-- Customiz -->\n\t\t<link rel=\"stylesheet\" href=\"css/main.css\">\n                <script>\n                  if( location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ){\n                    var css_en = document.createElement('link');\n                    css_en.rel = 'stylesheet';\n                    css_en.href = 'css/main_en.css';\n                    document.head.appendChild(css_en);\n                  }\n                </script>\n                <style>\n                  .mr-0\\.5 {margin-right: 0.125rem}\n                  .underline {text-decoration: underline}\n                </style>\n    <title>南港展覽館</title>\n    <script type=\"text/javascript\">\n        $(document).ready(function() {\n            AOS.init({\n                once: true,\n                duration: 1200\n            })\n            //可以自動彈出來\n            // $.fancybox.open($('#hidden-content'))\n        })\n    </script>\n\n</head>\n\n\n  <body><div id=body></div>\n    <script>(function(){\n      var xhr = new XMLHttpRequest;\n      xhr.onreadystatechange = function(){\n        if( xhr.readyState===4 ){\n          xhr.onreadystatechange = new Function('');\n          (new Function('config', xhr.responseText))({\n              base: 'src',\n              plugins: {\n                  ls: 'plugins/ls',\n                  text: 'plugins/text',\n                  defer: 'plugins/defer',\n                  global: 'plugins/global'\n              },\n              main: 'ls!main',\n              verbose: true,\n              compile: window.location.search.match(/compile/) ? {\n                  template: 'template',\n\n                  output: 'download',\n                  filename: location.pathname.match(/^\\/(2021(-dev)?\\/)?en\\//) ? 'compiled-en.js' : 'compiled.js',\n              } : null\n          });\n        }\n      };\n      xhr.open('GET', 'src/define.js?now='+Date.now());\n      xhr.send(null);\n    })()</script>\n  </body>\n\t<script>\n\t$(window).scroll(function() {\n\t\tif(!$(\".side_list\").position()){\n                        $(\".bread_crumb\").removeClass(\"gofixed\")\n\t\t\treturn\n\t\t}\n\t\tif(!$(\".side_menucontent\").position()){\n\t\t\treturn\n\t\t}\n\t\tif($(\".side_menucontent\").height()<=$(\".side_list\").height()){\n\t\t\treturn\n\t\t}\n\t\tvar lastScrollTop = 0;\n\t\tvar winww = $(window).width()\n\t\tvar winhh = $(window).height()\n\t\tvar dochh = $(document).height()\n\t\tvar breadhh = $(\".bread_crumb\").height()\n\t\tvar bannerhh = $(\".page_banner\").height()\n\t\tvar hheader = $(\"header\").height()\n\t\tvar footerhh = $(\"footer\").height()\n\t\tvar baseheight = bannerhh+30\n\t\tvar barpos = $(\".side_list\").position().top\n\t\tvar breadpos = $(\".bread_crumb\").position().top\n\t\tvar footerpos = $(\"footer\").position().top\n\t\tvar wtop = $(this).scrollTop();\n\t\tvar sidetop = hheader+breadhh+30\n\t\tvar pb = 0\n\t\tif(winww>=768){\n\t\t}else{\n\t\t\tbaseheight = baseheight+breadhh\n\t\t\tsidetop = bannerhh+30\n\t\t\tpb = 80\n\n\t\t}\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"footerpos:\"+footerpos);\n\t\tif (wtop > lastScrollTop){\n\t     // downscroll code\n\t\t\t if(wtop>=baseheight){\n\t\t\t\t $(\".side_list\").addClass(\"gofixed\")\n\t\t\t\t $(\".side_list\").css(\"top\",sidetop)\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",pb)\n\t\t\t\t $(\".bread_crumb\").addClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",hheader)\n\n\t\t\t\t var botpos = wtop+$(\".side_list\").height()\n\n\t\t\t\t //console.log(\"winhh:\"+winhh);\n\t\t\t\t //console.log(\"dochh:\"+dochh);\n\t\t\t\t //console.log(\"wtop:\"+wtop);\n\t\t\t\t if(winww>=768){\n\t\t\t\t\t var pp =(wtop+bannerhh+breadhh+$(\".side_list\").height())+60\n\t\t\t\t\t\tvar aa = dochh-pp\n\t\t\t\t\t\tvar sub = footerhh-aa\n\t\t\t\t\t\tif(sub>=0){\n\t\t\t\t\t\t\tvar bb = sidetop-sub\n\t\t\t\t\t\t\t$(\".side_list\").css(\"top\",bb)\n\t\t\t\t\t\t\t//console.log(\"=====bb:\"+bb);\n\t\t\t\t\t\t}\n\t\t\t\t\t\t//console.log(\"pp:\"+pp);\n\t\t\t\t\t\t//console.log(\"aa:\"+aa);\n\t\t\t\t\t\t//console.log(\"sub:\"+sub);\n\t\t\t\t\t\t//console.log(\"==================\")\n\n\t\t\t\t }\n\t\t\t\t // console.log(\"1111\");\n\t\t\t }else{\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t\t // console.log(\"222\");\n\t\t\t }\n\t  } else {\n\t     // upscroll code\n\t\t\t if(wtop<=hheader){\n\t\t\t\t // console.log(\"333\");\n\t\t\t\t $(\".side_list\").removeClass(\"gofixed\")\n \t\t\t\t $(\".side_list\").css(\"top\",\"\")\n\t\t\t\t $(\".bread_crumb\").removeClass(\"gofixed\")\n\t \t\t\t $(\".bread_crumb\").css(\"top\",\"\")\n\t\t\t\t $(\".side_list\").css(\"padding-bottom\",\"\")\n\t\t\t }else{\n\t\t\t\t // console.log(\"444\");\n\t\t\t }\n\t  }\n\t  lastScrollTop = wtop;\n\t\t//\n\t\t// console.log(\"baseheight:\"+baseheight);\n\t\t// console.log(\"wtop:\"+wtop);\n\t\t// console.log(\"barpos:\"+barpos);\n\t\t// console.log(\"breadpos:\"+breadpos);\n\t\t// console.log(\"======\")\n\t});\n\n\t</script>\n</html>\n";

////// text!src/template/venue/public-space/1.html (rvalue)
module[84]="<div class=\"for_hall_1\">\n        <!--1館-->\n\n        <div class=\"onder_title\">1館-公共空間收費基準</div>\n        <ul class=\"onder_list_title\">\n                <li>適用單獨租用</li>\n        </ul>\n\n\n        <div class=\"expo_table\">\n            <table width=\"100%\" border=\"0\">\n                                    <tbody>\n                                            <tr>\n                                                <td colspan=\"6\" bgcolor=\"#006182\" >\n                                                    <p align=\"center\"><strong class=\"hall1_yo_title\">1館-公共空間收費基準</strong>\n                                                    </p>\n                                                </td>\n                                            </tr>\n                                            <tr>\n                                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                            <p><strong>公共空間地點</strong></p>\n                                                    </td>\n                                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                            <p align=\"center\"><strong>面積</strong><strong> </strong><br>\n                                                                    <strong>(平方公尺)</strong></p>\n                                                    </td>\n                                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                            <p align=\"center\">搭建限高(公尺)</p>\n                                                    </td>\n                                                    <td rowspan=\"2\" bgcolor=\"#dfdfdf\">載重(噸)</td>\n                                                    <td colspan=\"2\" bgcolor=\"#dfdfdf\">\n                                                            <p><strong>租金</strong></p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td bgcolor=\"#dfdfdf\">\n                                                            <p>進場/出場期間</p>\n                                                    </td>\n                                                    <td bgcolor=\"#dfdfdf\">\n                                                            <p>活動期間(室內空間含空調) </p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>1戶外空間A區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>132</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$4,800</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$6,000</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>戶外空間B區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>154</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$5,700</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$6,900</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>戶外空間C區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>130</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$4,800</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$5,700</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>戶外空間D區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>27</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$1,200</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$1,500</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>戶外空間E區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>165</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$6,000</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$7,200</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>戶外空間F區</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>135</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$5,100</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$6,000</p>\n                                                    </td>\n                                            </tr>\n                                            <!-- <tr>\n                                                    <td>\n                                                            <p>經貿廣場</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>380</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>N/A</p>\n                                                    </td>\n                                                    <td>5</td>\n                                                    <td>\n                                                            <p>$13,800</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$16,500</p>\n                                                    </td>\n                                            </tr> -->\n                                            <tr>\n                                                    <td>\n                                                            <p>1樓光廊</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>60</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>6</p>\n                                                    </td>\n                                                    <td>1</td>\n                                                    <td>\n                                                            <p>$3,600</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$13,800</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>1樓門廳</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>139.5</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>6</p>\n                                                    </td>\n                                                    <td>1</td>\n                                                    <td>\n                                                            <p>$8,400</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$20,100</p>\n                                                    </td>\n                                            </tr>\n                                            <!-- <tr>\n                                                    <td>\n                                                            <p>3樓大廳(303)</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>140</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>3.4</p>\n\n                                                    </td>\n                                                    <td>0.5</td>\n                                                    <td>\n                                                            <p>$5,100</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$15,300</p>\n                                                    </td>\n                                            </tr> -->\n                                            <tr>\n                                                    <td>\n                                                            <p>L區門廳(光廊)</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>414</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>6</p>\n                                                    </td>\n                                                    <td>0.5</td>\n                                                    <td>\n                                                            <p>$15,000</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$27,000</p>\n                                                    </td>\n                                            </tr>\n            <tr>\n                                                    <td>\n                                                            <p>M區門廳</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>189.2</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>6</p>\n                                                    </td>\n                                                    <td>0.5</td>\n                                                    <td>\n                                                            <p>$6,900</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$17,700</p>\n                                                    </td>\n                                            </tr>\n                                            <tr>\n                                                    <td>\n                                                            <p>Taitra Lounge</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>200</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>2.2</p>\n                                                    </td>\n                                                    <td>0.5</td>\n                                                    <td>\n                                                            <p>$12,000</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$23,700</p>\n                                                    </td>\n                                            </tr>\n            <tr>\n                                                    <td>\n                                                            <p>5樓大廳(522)</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>156</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>2.2</p>\n                                                    </td>\n                                                    <td>0.5</td>\n                                                    <td>\n                                                            <p>$5,700</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$16,200</p>\n                                                    </td>\n                                            </tr>\n            <tr>\n                                                    <td>\n                                                            <p>5樓廊道</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>975</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>2.2</p>\n                                                    </td>\n                                                    <td>2.2</td>\n                                                    <td>\n                                                            <p>$15,900</p>\n                                                    </td>\n                                                    <td>\n                                                            <p>$28,500</p>\n                                                    </td>\n                                            </tr>\n\n                                            <tr>\n                                                    <td colspan=\"6\">【註】如需搭建高於 4 公尺之裝潢物等，需遵循「外貿協會會展中心裝潢作業規範」之  相關規定提出申請。</td>\n                                            </tr>\n                                    </tbody>\n                            </table>\n\n\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/外貿協會台北南港展覽館1館公共空間借用收費基準及實施規範(含公設)_主辦單位.pdf\" target=\"_blank\">公共空間借用收費基準及實施規範-主辦單位專用</a></li>\n        </ul>\n\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-file-pdf\"></i></li>\n            <li><a href=\"images/download/外貿協會台北南港展覽館1館公共空間借用收費基準及實施規範-單獨租用_20221201.pdf\" target=\"_blank\">公共空間借用收費基準及實施規範-單獨租用</a></li>\n        </ul>\n\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>1F公共空間平面圖</li>\n                                </ul>\n                                <a href=\"images/1669946586521.jpg\" data-fancybox=\"images\" data-caption=\"1F公共空間平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/1669946586521.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>3F西側平面圖</li>\n                                </ul>\n                                <a href=\"images/1669946586462.jpg\" data-fancybox=\"images\" data-caption=\"3F西側平面圖<\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/1669946586462.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4F西側平面圖</li>\n                                </ul>\n                                <a href=\"images/1hall_exh04.png\" data-fancybox=\"images\" data-caption=\"4F西側平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/1hall_exh04.png);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5F西側平面圖</li>\n                                </ul>\n                                <a href=\"images/1hall_exh05.png\" data-fancybox=\"images\" data-caption=\"5F西側平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/1hall_exh05.png);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>6F西側平面圖</li>\n                                </ul>\n                                <a href=\"images/1hall_exh06.png\" data-fancybox=\"images\" data-caption=\"6F西側平面圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/1hall_exh06.png);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n\n\n                </div>\n        </div>\n\n        <!--1館-->\n</div>\n";

////// text!src/template/venue/public-space.html (rvalue)
module[85]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">公共空間</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n</div>\n";

////// ls!src/room-streaming (sdefine)
load(86,[143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!ajax', 'ls!is-en'], function(ajax, isEn){
    return {
      data: function(){
        return {
          shop: []
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        }
      },
      mounted: function(){
        var this$ = this;
        ajax.get('/2021/api/shop/5', function(it){
          var i$, ref$, len$, shop, that;
          if (it != null && it.list) {
            for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
              shop = ref$[i$];
              if (shop.photo_size > 0) {
                shop.photo_url = "/2021/api/shop/" + shop.id + ".jpg";
              }
              if (isEn) {
                if (that = shop.title_en) {
                  shop.title = that;
                }
                if (that = shop.content_en) {
                  shop.content = that;
                }
                if (that = shop.webpage_en) {
                  shop.webpage = that;
                }
              }
            }
            this$.shop = it.list;
          }
        });
      }
    };
  });
}).call(this);
});

////// text!src/template/venue/room-streaming.html (rvalue)
module[87]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">直播服務</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <div class=\"aboutcontent\">\n                為提供多元服務，自112年1月1日起，南港1、2館提供會議室直播服務，各類直播需求請逕洽各合約商(如下列資訊)。\n        </div>\n        <div class=\"row\">\n            <template v-for='_ in shop'>\n                <div class=\"live_box col-3 col-md-3 col-lg-3\">\n                        <template v-if=_.photo_url>\n                            <a v-if=_.webpage :href=_.webpage target=_blank><div class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div></a>\n                            <div v-else class=\"facilities_boderpic\" :style='{backgroundImage:\"url(\"+_.photo_url+\")\"}' alt=\"\"></div>\n                        </template>\n                </div>\n                <div class=\"live_box col-9 col-md-9 col-lg-9\">\n                        <div class=\"live_title\">{{_.title}}</div>\n                        <div class=\"live_smfont\" v-html=_.content>\n                        </div>\n                </div>\n            </template>\n        </div>\n\n        <!--\n        <ul class=\"prev_btn onlinepage lt_mb\">\n                <a href=\"#\"><li>< Prev</li></a>\n                <a href=\"#\"><li class=\"actvie\">1</li></a>\n                <a href=\"#\"><li>2</li></a>\n                <a href=\"#\"><li>3</li></a>\n                <a href=\"#\"><li>4</li></a>\n                <a href=\"#\"><li>Next ></li></a>\n        </ul>\n        -->\n</div>\n";

////// ls!src/room-query (sdefine)
load(88,[152,145,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  var replace$ = ''.replace;
  define(['ls!fmt-num', 'ls!d2', 'ls!is-en'], function(fmtNum, d2, isEn){
    return {
      data: function(){
        var d;
        return {
          style: 2,
          capacity: 0,
          roomI: 0,
          segmentData: [],
          input: {
            date: (d = new Date, d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate())),
            time: 0,
            holiday: false,
            type: 0,
            room: void 8
          }
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        },
        typeList: function(){
          if (isEn) {
            return ['Event', 'Set-up/Dismantling'];
          } else {
            return ['活動', '佈置/拆場'];
          }
        },
        styleList: function(){
          var styles;
          styles = isEn
            ? ['Theater', 'Classroom', 'Standard']
            : ['劇院型', '教室型', '標準型'];
          if (this.hall === 1) {
            if (isEn) {
              styles.push('U-shape', 'Square');
            } else {
              styles.push('馬蹄型', '口字型');
            }
          }
          return styles;
        },
        capacityList: function(){
          if (this.hall === 1) {
            return [
              {
                capacity: 0,
                label: '50↓'
              }, {
                capacity: 50,
                label: '50-100'
              }, {
                capacity: 100,
                label: '100-200'
              }, {
                capacity: 200,
                label: '200-300'
              }, {
                capacity: 300,
                label: '300↑'
              }
            ];
          } else {
            return [
              {
                capacity: 0,
                label: '50↓'
              }, {
                capacity: 50,
                label: '50-100'
              }, {
                capacity: 100,
                label: '100-200'
              }, {
                capacity: 200,
                label: '200-500'
              }, {
                capacity: 500,
                label: '500-1000'
              }, {
                capacity: 1000,
                label: '1000-1500'
              }, {
                capacity: 1500,
                label: '1500↑'
              }
            ];
          }
        },
        timeList: function(){
          return [
            {
              label: '08:00-12:00',
              type: 0
            }, {
              label: '13:00-17:00',
              type: 0
            }, {
              label: '18:00-22:00',
              type: 1
            }
          ];
        },
        totalPrice: function(){
          return this.price * 1.05;
        },
        vat: function(){
          return this.price * 0.05;
        },
        roomCandidate: function(){
          var candidate, i$, ref$, len$, part, room, j$, ref1$, len1$, c;
          candidate = [];
          if (this.hall === 1) {
            candidate.push({
              label: '福軒',
              capacity: [60, 32, 48, 20, 28],
              price: [13800, 16600]
            });
            candidate.push({
              label: '401',
              capacity: [384, 144, 216, 52, 72],
              price: [39900, 47900]
            });
            candidate.push({
              label: '402',
              capacity: [369, 168, 224, 62, 80],
              price: [39400, 47300]
            });
            candidate.push({
              label: '402a',
              capacity: [100, 56, 72, 26, 36],
              price: [12900, 15500]
            });
            candidate.push({
              label: '402b',
              capacity: [110, 56, 72, 26, 36],
              price: [12900, 15500]
            });
            candidate.push({
              label: '402c',
              capacity: [110, 56, 72, 26, 36],
              price: [13600, 16300]
            });
            candidate.push({
              label: '402a+b',
              capacity: [234, 108, 144, 42, 56],
              price: [25800, 31000]
            });
            candidate.push({
              label: '402b+c',
              capacity: [234, 108, 144, 42, 56],
              price: [26500, 31800]
            });
            candidate.push({
              label: '403',
              capacity: [125, 68, 92, 34, 44],
              price: [15600, 18700]
            });
            candidate.push({
              label: '404',
              capacity: [90, 48, 72, 26, 36],
              price: [14000, 16800]
            });
            candidate.push({
              label: '500',
              capacity: [140, 72, 116, 46, 52],
              price: [16700, 20000]
            });
            candidate.push({
              label: '501',
              capacity: [105, 56, 84, 30, 36],
              price: [13800, 16600]
            });
            candidate.push({
              label: '502',
              capacity: [95, 34, 68, 26, 32],
              price: [10700, 12800]
            });
            candidate.push({
              label: '503',
              capacity: [110, 56, 84, 30, 36],
              price: [15600, 18700]
            });
            candidate.push({
              label: '504',
              capacity: [504, 224, 360, 68, 84],
              price: [52700, 63300]
            });
            candidate.push({
              label: '504a',
              capacity: [165, 80, 120, 38, 44],
              price: [19300, 23200]
            });
            candidate.push({
              label: '504b',
              capacity: [165, 80, 120, 38, 44],
              price: [17600, 21100]
            });
            candidate.push({
              label: '504c',
              capacity: [165, 80, 120, 38, 44],
              price: [15800, 19000]
            });
            candidate.push({
              label: '504a+b',
              capacity: [336, 144, 216, 48, 64],
              price: [36900, 44300]
            });
            candidate.push({
              label: '504b+c',
              capacity: [312, 128, 216, 48, 64],
              price: [33400, 40100]
            });
            candidate.push({
              label: '505',
              capacity: [504, 224, 360, 68, 84],
              price: [53300, 64000]
            });
            candidate.push({
              label: '505a',
              capacity: [165, 80, 120, 38, 44],
              price: [18600, 22300]
            });
            candidate.push({
              label: '505b',
              capacity: [150, 80, 120, 38, 44],
              price: [17800, 21400]
            });
            candidate.push({
              label: '505c',
              capacity: [150, 80, 120, 38, 44],
              price: [16900, 20300]
            });
            candidate.push({
              label: '505a+b',
              capacity: [336, 144, 216, 48, 64],
              price: [36400, 43700]
            });
            candidate.push({
              label: '505b+c',
              capacity: [312, 128, 216, 48, 64],
              price: [34700, 41700]
            });
            candidate.push({
              label: '506',
              capacity: [165, 80, 120, 38, 44],
              price: [18500, 22200]
            });
            candidate.push({
              label: '507',
              capacity: [165, 80, 120, 38, 44],
              price: [18500, 22200]
            });
          } else {
            candidate.push({
              label: '701',
              capacity: [3240, 1512, 2236],
              price: [370000, 481000]
            });
            for (i$ = 0, len$ = (ref$ = ['ABCEFG', 'BCDFGH']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 3/4 " + part,
                capacity: [2340, 1152, 1612],
                price: [280000, 364000]
              });
            }
            candidate.push({
              label: "701 2/3 ABCD",
              capacity: [2000, 972, 1440],
              price: [258000, 335400]
            });
            for (i$ = 0, len$ = (ref$ = ['ABEF', 'CDGH']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 1/2 " + part,
                capacity: [1560, 728, 1156],
                price: [194000, 252200]
              });
            }
            for (i$ = 0, len$ = (ref$ = ['AB', 'CD', 'EFGH']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 1/3 " + part,
                capacity: [1000, 474, 648],
                price: [136000, 176800]
              });
            }
            for (i$ = 0, len$ = (ref$ = ['AE', 'BF', 'CG', 'DH']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 1/4 " + part,
                capacity: [780, 360, 544],
                price: [103000, 133900]
              });
            }
            for (i$ = 0, len$ = (ref$ = ['A', 'B', 'C', 'D', 'EF', 'GH']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 1/6 " + part,
                capacity: [500, 240, 400],
                price: [71000, 92300]
              });
            }
            for (i$ = 0, len$ = (ref$ = ['E', 'F', 'G', 'H']).length; i$ < len$; ++i$) {
              part = ref$[i$];
              candidate.push({
                label: "701 1/12 " + part,
                capacity: [240, 126, 200],
                price: [46000, 59800]
              });
            }
            for (i$ = 0, len$ = (ref$ = ['702', '703']).length; i$ < len$; ++i$) {
              room = ref$[i$];
              candidate.push({
                label: room,
                capacity: [180, 60, 112],
                price: [17000, 22100]
              });
              candidate.push({
                label: room + " BC",
                capacity: [120, 48, 96],
                price: [13000, 16900]
              });
              candidate.push({
                label: room + " AB",
                capacity: [90, 32, 72],
                price: [11000, 14300]
              });
              candidate.push({
                label: room + " C",
                capacity: [60, 24, 48],
                price: [8000, 10400]
              });
              for (j$ = 0, len1$ = (ref1$ = ['B', 'A']).length; j$ < len1$; ++j$) {
                part = ref1$[j$];
                candidate.push({
                  label: room + " " + part,
                  capacity: [42, 16, 32],
                  price: [6000, 7800]
                });
              }
            }
            candidate.push({
              label: '601',
              capacity: [64, 36, 48],
              price: [7000, 9100]
            });
            candidate.push({
              label: '602',
              capacity: [70, 28, 36],
              price: [7000, 9100]
            });
            candidate.push({
              label: '603',
              capacity: [50, 24, 28],
              price: [5000, 6500]
            });
            candidate.push({
              label: '401',
              capacity: [80, 48, 72],
              price: [10000, 13000]
            });
          }
          for (i$ = 0, len$ = candidate.length; i$ < len$; ++i$) {
            c = candidate[i$];
            c.photo = c.label.substr(0, 3) + (replace$.call(c.label, /[^A-Za-z]/g, '')) + '.jpg';
          }
          return candidate;
        },
        roomList: function(){
          var out, res$, i$, ref$, len$, c;
          res$ = [];
          for (i$ = 0, len$ = (ref$ = this.roomCandidate).length; i$ < len$; ++i$) {
            c = ref$[i$];
            if (c.capacity[this.style] >= this.capacityList[this.capacity].capacity && (this.capacity === this.capacityList.length - 1 || c.capacity[this.style] <= this.capacityList[this.capacity + 1].capacity)) {
              res$.push(c);
            }
          }
          out = res$;
          if (this.roomI >= out.length) {
            this.roomI = out.length - 1;
          }
          return out;
        },
        segment: function(){
          var out, res$, i$, ref$, len$, s, d, holidayLabel, timeType, price, ai, a, j$, len1$, bi, b;
          res$ = [];
          for (i$ = 0, len$ = (ref$ = this.segmentData).length; i$ < len$; ++i$) {
            s = ref$[i$];
            d = new Date(s.date);
            holidayLabel = '';
            timeType = this.timeList[s.time].type;
            if (s.holiday || d.getDay() === 0 || d.getDay() === 6) {
              timeType = 1;
              holidayLabel = isEn ? '(holiday)' : '(假日)';
            }
            price = s.room.price[timeType];
            if (s.type === 1) {
              price *= 0.6;
            }
            res$.push(import$(clone$(s), {
              timeLabel: this.timeList[s.time].label,
              holidayLabel: holidayLabel,
              roomLabel: s.room.label,
              typeLabel: this.typeList[s.type],
              price: price,
              error: ''
            }));
          }
          out = res$;
          for (i$ = 0, len$ = out.length; i$ < len$; ++i$) {
            ai = i$;
            a = out[i$];
            for (j$ = 0, len1$ = out.length; j$ < len1$; ++j$) {
              bi = j$;
              b = out[j$];
              if (ai === bi) {
                continue;
              }
              if (a.date !== b.date) {
                continue;
              }
              if (a.room.label === b.room.label && a.timeLabel === b.timeLabel) {
                a.error = isEn ? 'Time-range overlapped' : '時間區間重疊';
              }
            }
          }
          out = out.sort(function(a, b){
            if (a.date < b.date) {
              return -1;
            }
            if (a.date > b.date) {
              return 1;
            }
            if (a.timeLabel < b.timeLabel) {
              return -1;
            }
            if (a.timeLabel > b.timeLabel) {
              return 1;
            }
            return a.price - b.price;
          });
          return out;
        },
        price: function(){
          var out, i$, ref$, len$, s;
          out = 0;
          for (i$ = 0, len$ = (ref$ = this.segment).length; i$ < len$; ++i$) {
            s = ref$[i$];
            if (s.error) {
              return 0;
            }
            out += s.price;
          }
          return out;
        }
      },
      methods: {
        fmtNum: fmtNum,
        d2: d2,
        chooseRoom: function(i){
          this.roomI = i;
        },
        zoomRoom: function(src){
          $.fancybox.open("<img src=" + src + ">");
        },
        add: function(){
          var ref$;
          this.segmentData.push((ref$ = JSON.parse(JSON.stringify(this.input)), ref$.room = this.roomList[this.roomI], ref$));
        },
        remove: function(i){
          this.segmentData.splice(i, 1);
        }
      }
    };
  });
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
}).call(this);
});

////// text!src/template/venue/room-query.html (rvalue)
module[89]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">查詢場地 &amp; 場租試算</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <router-link :to='\"/venue/room-query/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n                  <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n                </router-link>\n        </ul>\n\n        <div class=\"venue_Bg lt_mb\">\n                <div class=\"venue_top_pd\">\n                        <!--\n                        <div class=\"onder_title\">活動類型</div>\n                        <ul class=\"venue_ck_box\">\n                                <li><input name=\"\" type=\"checkbox\" value=\"\" /> 活動</li>\n                                <li><input name=\"\" type=\"checkbox\" value=\"\" /> 會議</li>\n                        </ul>\n                        -->\n\n                        <div class=\"onder_title\">人數範圍</div>\n                        <ul class=\"venue_ck_box\">\n                                <li v-for='(_,i) in capacityList'><label><input type=radio :value=i v-model=capacity>{{_.label}}</label></li>\n                        </ul>\n\n                        <div class=\"onder_title\">使用形式</div>\n                        <ul class=\"venue_ck_box\">\n                                <li v-for='(_,i) in styleList'><label><input type=radio :value=i v-model=style>{{_}}</label></li>\n                        </ul>\n                        <!-- <a href=\"images/green.jpg\" data-fancybox=\"images\" data-caption=\"\">\n                        <div class=\"teu_pic\"><img :src='\"images/桌椅排法\"+hall+\".jpg\"'></div>\n                        </a> -->\n                        <div class=\"row rw_bm\">\n                                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a :href='\"images/桌椅排法\"+hall+\".jpg\"' data-fancybox=\"images\" data-caption=\"\">\n                            <div class=\"about_boderpic\" :style='{backgroundImage:\"url(images/桌椅排法\"+hall+\".jpg)\"}'>\n\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                        </div>\n                        </div>\n                        <!--\n                        <ul class=\"content_btn lt_mb\">\n                                <li><button class=\"content_btn\">重填</button></li>\n                                <li class=\"ac_cont\"><button class=\"content_btn \">查詢</button></li>\n                        </ul>\n                        -->\n                </div>\n                <div class=\"venue_bottom_bg\">\n                        <div class=\"onder_title\">選擇會議室</div>\n                        <div class=\"row\">\n                                <div class=\"col-12 col-md-4 col-lg-4 roomborder\" v-for='(room,i) in roomList' :style='{borderColor:roomI==i?\"#7fc0d6\":\"transparent\", backgroundColor: roomI==i?\"#fff\":\"transparent\"}' @click.prevent=chooseRoom(i)>\n                                        <ul class=\"onder_list_title\">\n                                                <li>{{room.label}} ({{room.capacity[style]}} 人)</li>\n                                        </ul>\n                                        <div class=\"about_boderpic\" :style='{backgroundImage:\"url(images/room/\"+hall+\"/\"+room.photo+\")\"}'>\n                                                <div class=\"zoomin_icon\" @click.prevent.stop='zoomRoom(\"images/room/\"+hall+\"/\"+room.photo)'><img src=\"images/zoomin.svg\"></div>\n                                        </div>\n                                </div>\n                        </div>\n                </div>\n                <div class=\"venue_top_pd\">\n                        <div class=\"panel_table\">\n                            <table width=\"100%\" border=\"0\">\n                              <tr>\n                                <td colspan=\"8\" bgcolor=\"#DEDEDE\">\n                                    <ul class=\"panel_li\">\n                                        <li>\n                                          <label v-for='(_,i) in typeList'><input type=radio v-model=input.type :value=i>{{_}}</label>\n                                        </li>\n                                        <li>日期：</li>\n                                        <li><input type=\"date\" v-model=input.date></li>\n                                        <li>\n                                          <label><input type=checkbox v-model=input.holiday>假日</label>\n                                        </li>\n                                        <li>時段：</li>\n                                        <li>\n                                          <li v-for='(_,i) in timeList'><label><input type=radio :value=i v-model=input.time>{{_.label}}</label></li>\n                                        </li>\n                                        <li class=\"add_icon\" style=cursor:pointer @click.prevent=add><img src=\"images/plus.svg\" alt=\"\"></li>\n                                    </ul>\n                                </td>\n                              </tr>\n                              <tr>\n                                <td>日期</td>\n                                <td>時段</td>\n                                <td>房間</td>\n                                <td>類型</td>\n                                <td>金額</td>\n                                <td></td>\n                              </tr>\n                              <tr v-for='(_,i) in segment'>\n                                <td>{{_.date}}{{_.holidayLabel}}</td>\n                                <td align=center>{{_.timeLabel}}</td>\n                                <td>{{_.roomLabel}}</td>\n                                <td>{{_.typeLabel}}</td>\n                                <td align=right>{{fmtNum(_.price)}}</td>\n                                <td>\n                                  <ul class=\"panel_li\"><li class=add_icon><img src=\"images/x-mark.svg\" style=cursor:pointer @click.prevent=remove(i)></li></ul>\n                                  <b style=color:red>{{_.error}}</b>\n                                </td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>小計</td>\n                                <td align=right>{{fmtNum(price)}}</td>\n                                <td></td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>5% VAT</td>\n                                <td align=right>{{fmtNum(vat)}}</td>\n                                <td></td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>合計</td>\n                                <td align=right>{{fmtNum(totalPrice)}}</td>\n                                <td></td>\n                              </tr>\n                            </table>\n                        </div>\n                        <div class=\"red\">※場租試算僅供參考，不等同正式報價。</div>\n                </div>\n\n        </div>\n\n\n\n\n\n</div>\n";

////// text!src/template/venue/room-info/2/7/703.html (rvalue)
module[90]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>7樓 703 會議室空間資訊</li>\n                </ul>\n                <!-- <div class=\"aboutpic\">\n                        <a href=\"images/7F_703top.jpg\" data-fancybox=\"images\" data-caption=\"My caption\">\n                                <img src=\"images/7F_703top.jpg\" alt=\"\">\n                        </a>\n                </div> -->\n\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"meet_center confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"3\">標準容量(人)</td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積\n                                                        (平方公尺)\n                                                </td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">尺寸<br>\n                                                        (長x寬x高)\n                                                </td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"2\">每時段租金</td>\n                                        </tr>\n                                        <tr class=\"meet_center\">\n                                                <td>劇院型</td>\n                                                <td>教室型</td>\n                                                <td>標準型</td>\n                                                <td>週一至週五 (未稅)</td>\n                                                <td>夜間、例假日或\n                                                        室內攤位展出 (未稅)\n                                                </td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 全室</td>\n                                                <td valign=\"middle\">180</td>\n                                                <td valign=\"middle\">60</td>\n                                                <td valign=\"middle\">112</td>\n                                                <td valign=\"middle\">181</td>\n                                                <td valign=\"middle\">20.6 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">17,000</td>\n                                                <td valign=\"middle\">22,100</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 BC</td>\n                                                <td valign=\"middle\">120</td>\n                                                <td valign=\"middle\">48</td>\n                                                <td valign=\"middle\">96</td>\n                                                <td valign=\"middle\">129</td>\n                                                <td valign=\"middle\">14.7 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">13,000</td>\n                                                <td valign=\"middle\">16,900</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 AB</td>\n                                                <td valign=\"middle\">90</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">72</td>\n                                                <td valign=\"middle\">103</td>\n                                                <td valign=\"middle\">11.8 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">11,000</td>\n                                                <td valign=\"middle\">14,300</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 C</td>\n                                                <td valign=\"middle\">60</td>\n                                                <td valign=\"middle\">24</td>\n                                                <td valign=\"middle\">48</td>\n                                                <td valign=\"middle\">77</td>\n                                                <td valign=\"middle\">8.8 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">8,000</td>\n                                                <td valign=\"middle\">10,400</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 B</td>\n                                                <td valign=\"middle\">42</td>\n                                                <td valign=\"middle\">16</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">51</td>\n                                                <td valign=\"middle\">5.9 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">6,000</td>\n                                                <td valign=\"middle\">7,800</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">703 A</td>\n                                                <td valign=\"middle\">42</td>\n                                                <td valign=\"middle\">16</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">51</td>\n                                                <td valign=\"middle\">5.9 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">6,000</td>\n                                                <td valign=\"middle\">7,800</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_全場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓平面圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_全場平面圖_202205.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_分場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓配置圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_分場平面圖_202205.jpg);\" alt=\"\">\n                                    <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2/7/702.html (rvalue)
module[91]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>7樓 702 會議室空間資訊</li>\n                </ul>\n                <!-- <div class=\"aboutpic\">\n                        <a href=\"images/7F_702top.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓會議室\">\n                                <img src=\"images/7F_702top.jpg\" alt=\"\">\n                        </a>\n                </div> -->\n\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"meet_center confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"3\">標準容量(人)</td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積\n                                                        (平方公尺)\n                                                </td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">尺寸<br>\n                                                        (長x寬x高)\n                                                </td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"2\">每時段租金</td>\n                                        </tr>\n                                        <tr class=\"meet_center\">\n                                                <td>劇院型</td>\n                                                <td>教室型</td>\n                                                <td>標準型</td>\n                                                <td>週一至週五 (未稅)</td>\n                                                <td>夜間、例假日或\n                                                        室內攤位展出 (未稅)\n                                                </td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 全室</td>\n                                                <td valign=\"middle\">180</td>\n                                                <td valign=\"middle\">60</td>\n                                                <td valign=\"middle\">112</td>\n                                                <td valign=\"middle\">181</td>\n                                                <td valign=\"middle\">20.6 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">17,000</td>\n                                                <td valign=\"middle\">22,100</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 BC</td>\n                                                <td valign=\"middle\">120</td>\n                                                <td valign=\"middle\">48</td>\n                                                <td valign=\"middle\">96</td>\n                                                <td valign=\"middle\">129</td>\n                                                <td valign=\"middle\">14.7 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">13,000</td>\n                                                <td valign=\"middle\">16,900</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 AB</td>\n                                                <td valign=\"middle\">90</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">72</td>\n                                                <td valign=\"middle\">103</td>\n                                                <td valign=\"middle\">11.8 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">11,000</td>\n                                                <td valign=\"middle\">14,300</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 C</td>\n                                                <td valign=\"middle\">60</td>\n                                                <td valign=\"middle\">24</td>\n                                                <td valign=\"middle\">48</td>\n                                                <td valign=\"middle\">77</td>\n                                                <td valign=\"middle\">8.8 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">8,000</td>\n                                                <td valign=\"middle\">10,400</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 B</td>\n                                                <td valign=\"middle\">42</td>\n                                                <td valign=\"middle\">16</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">51</td>\n                                                <td valign=\"middle\">5.9 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">6,000</td>\n                                                <td valign=\"middle\">7,800</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">702 A</td>\n                                                <td valign=\"middle\">42</td>\n                                                <td valign=\"middle\">16</td>\n                                                <td valign=\"middle\">32</td>\n                                                <td valign=\"middle\">51</td>\n                                                <td valign=\"middle\">5.9 x 8.8 x 2.7</td>\n                                                <td valign=\"middle\">6,000</td>\n                                                <td valign=\"middle\">7,800</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_全場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓平面圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_全場平面圖_202205.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_分場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓配置圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_分場平面圖_202205.jpg);\" alt=\"\">\n                                    <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2/7/701.html (rvalue)
module[92]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>7樓 701 會議室空間資訊</li>\n                </ul>\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"meet_center confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"3\">標準容量(人)</td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積(平方公尺)</td>\n                                                <td bgcolor=\"#DEDEDE\" rowspan=\"2\">尺寸<br>(長x寬x高)</td>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"2\">每時段租金</td>\n                                        </tr>\n                                        <tr class=\"meet_center\">\n                                                <td>劇院型</td>\n                                                <td>教室型</td>\n                                                <td>標準型</td>\n                                                <td>週一至週五 (未稅)</td>\n                                                <td>夜間、例假日或\n                                                        室內攤位展出 (未稅)\n                                                </td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 全室</td>\n                                                <td valign=\"middle\">3,240</td>\n                                                <td valign=\"middle\">1,512</td>\n                                                <td valign=\"middle\">2,236</td>\n                                                <td valign=\"middle\">3,880</td>\n                                                <td valign=\"middle\">72 x 53.9 x 9</td>\n                                                <td valign=\"middle\">370,000</td>\n                                                <td valign=\"middle\">481,000</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 3/4室\n                                                        ABCEFG/BCDFGH</td>\n                                                <td valign=\"middle\">2,340</td>\n                                                <td valign=\"middle\">1,152</td>\n                                                <td valign=\"middle\">1,612</td>\n                                                <td valign=\"middle\">2,910</td>\n                                                <td valign=\"middle\">54 x 53.9 x 9</td>\n                                                <td valign=\"middle\">280,000</td>\n                                                <td valign=\"middle\">364,000</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 2/3室\n                                                        ABCD</td>\n                                                <td valign=\"middle\">2,000</td>\n                                                <td valign=\"middle\">972</td>\n                                                <td valign=\"middle\">1,440</td>\n                                                <td valign=\"middle\">2,584</td>\n                                                <td valign=\"middle\">72 x 35.9 x 9</td>\n                                                <td valign=\"middle\">258,000</td>\n                                                <td valign=\"middle\">335,400</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 1/2室\n                                                        ABEF/CDGH</td>\n                                                <td valign=\"middle\">1,560</td>\n                                                <td valign=\"middle\">728</td>\n                                                <td valign=\"middle\">1,156</td>\n                                                <td valign=\"middle\">1,940</td>\n                                                <td valign=\"middle\">36 x 53.9 x 9</td>\n                                                <td valign=\"middle\">194,000</td>\n                                                <td valign=\"middle\">252,200</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 1/3室\n                                                        AB/CD/EFGH</td>\n                                                <td valign=\"middle\">1,000</td>\n                                                <td valign=\"middle\">474</td>\n                                                <td valign=\"middle\">648</td>\n                                                <td valign=\"middle\">1,292</td>\n                                                <td valign=\"middle\">36 x 35.9 x 9</td>\n                                                <td valign=\"middle\">136,000</td>\n                                                <td valign=\"middle\">176,800</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 1/4室\n                                                        AE/BF/CG/DH</td>\n                                                <td valign=\"middle\">780</td>\n                                                <td valign=\"middle\">360</td>\n                                                <td valign=\"middle\">544</td>\n                                                <td valign=\"middle\">972</td>\n                                                <td valign=\"middle\">18 x 54 x 9</td>\n                                                <td valign=\"middle\">103,000</td>\n                                                <td valign=\"middle\">133,900</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 1/6室\n                                                        A/B/C/D/EF/GH</td>\n                                                <td valign=\"middle\">500</td>\n                                                <td valign=\"middle\">240</td>\n                                                <td valign=\"middle\">400</td>\n                                                <td valign=\"middle\">646</td>\n                                                <td valign=\"middle\">18 x 35.9 x 9</td>\n                                                <td valign=\"middle\">71,000</td>\n                                                <td valign=\"middle\">92,300</td>\n                                        </tr>\n                                        <tr>\n                                                <td valign=\"middle\">701 1/12室\n                                                        E/F/G/H</td>\n                                                <td valign=\"middle\">240</td>\n                                                <td valign=\"middle\">126</td>\n                                                <td valign=\"middle\">200</td>\n                                                <td valign=\"middle\">324</td>\n                                                <td valign=\"middle\">18 x 18 x 9</td>\n                                                <td valign=\"middle\">46,000</td>\n                                                <td valign=\"middle\">59,800</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_全場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓平面圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_全場平面圖_202205.jpg);\" alt=\"\">\n                                    <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/南港展覽館2館7F_分場平面圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓配置圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館7F_分場平面圖_202205.jpg);\" alt=\"\">\n                                    <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2/7.html (rvalue)
module[93]="<div>\n                <!--2館7F-->\n                <div class=\"aboutpic\">\n                        <a href=\"images/7Fs.jpg\" data-fancybox=\"images\" data-caption=\"2館7樓會議室\">\n                                <img src=\"images/7Fs.jpg\" alt=\"\">\n                        </a>\n                </div>\n\n\n                <div class=\"call_box lt_mb\">\n                        <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n                        <div class=\"call_font\">更多資訊請洽 :886-2-2725-5200 #6614 黃先生、#6617 林小姐(參展廠商於展覽期間租用會議室請洽展覽主辦單位)。</div>\n                </div>\n\n                <!-- <div class=\"onder_title\">台北南港展覽館2館 7樓 會議室空間資訊</div> -->\n\n                <ul class=\"room_item\">\n                        <menu-item v-for='(item, i) in menu.item' active-class=room_active2 :key=i :item=item class=mr-0.5 />\n                        <a href=\"https://livetour.istaging.com/2749bc3b-0bb2-4f39-8f87-a6323afc42d8?group=eac1f777-d6f1-4893-b970-ee0b0c8e6708&index=1\" target=\"_blank\">\n                            <li class=\"active2\">360°環景圖</li>\n                        </a>\n                </ul>\n                <router-view />\n                <!--2館7F end-->\n</div>\n";

////// text!src/template/venue/room-info/2/6/603.html (rvalue)
module[94]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>台北南港展覽館2館 6樓 603 會議室空間資訊</li>\n                </ul>\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center tk_center\">租借詳細資訊</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">會議室</td>\n                                                <td>603</td>\n                                                <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                                <td>08-12 / 13-17 / (夜間)18-22</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                                <td>62</td>\n                                                <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                                <td>$5,000</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">尺寸(長x寬x高)</td>\n                                                <td>7 x 8.8 x 2.9</td>\n                                                <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                                <td>$6,500</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n\n                <ul class=\"onder_list_title\">\n                        <li>容納座位數（由多至少）</li>\n                </ul>\n\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                                <td bgcolor=\"#DEDEDE\">教室型</td>\n                                                <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        </tr>\n                                        <tr class=\"confre_gray\">\n                                                <td>50</td>\n                                                <td>24</td>\n                                                <td>28</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2/6/602.html (rvalue)
module[95]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>台北南港展覽館2館 6樓 602 會議室空間資訊</li>\n                </ul>\n\n                <div class=\"confre_table\">\n            <table width=\"100%\" border=\"0\">\n                  <tbody><tr>\n                    <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center tk_center\">租借詳細資訊</td>\n                  </tr>\n                  <tr>\n                    <td bgcolor=\"#f2f2f2\">會議室</td>\n                    <td>602</td>\n                    <td bgcolor=\"#f2f2f2\">時段區分</td>\n                    <td>08-12 / 13-17 / (夜間)18-22</td>\n                  </tr>\n                  <tr>\n                    <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                    <td>81</td>\n                    <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                    <td>$7,000</td>\n                  </tr>\n                  <tr>\n                    <td bgcolor=\"#f2f2f2\">尺寸(長x寬x高)</td>\n                    <td>6.9 x 11.8 x 2.9</td>\n                    <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                    <td>$9,100</td>\n                  </tr>\n                </tbody></table>\n        </div>\n                        <ul class=\"onder_list_title\">\n                        <li>容納座位數（由多至少）</li>\n                </ul>\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                                <td bgcolor=\"#DEDEDE\">教室型</td>\n                                                <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        </tr>\n                                        <tr class=\"confre_gray\">\n                                                <td>70</td>\n                                                <td>28</td>\n                                                <td>36</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n\n\n                <!--2館6F-->\n                <!-- <div class=\"aboutpic\">\n                        <a href=\"images/6F_601top.jpg\" data-fancybox=\"images\" data-caption=\"2館6樓會議室\">\n                                <img src=\"images/6F_601top.jpg\" alt=\"\">\n                        </a>\n                </div> -->\n</div>\n";

////// text!src/template/venue/room-info/2/6/601.html (rvalue)
module[96]="<div>\n                <ul class=\"onder_list_title\">\n                        <li>台北南港展覽館2館 6樓 601 會議室空間資訊</li>\n                </ul>\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center tk_center\">租借詳細資訊</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">會議室</td>\n                                                <td>601</td>\n                                                <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                                <td>08-12 / 13-17 / (夜間)18-22</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                                <td>87</td>\n                                                <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                                <td>$7,000</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">尺寸(長x寬x高)</td>\n                                                <td>6.0 x 14.6 x 2.9</td>\n                                                <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                                <td>$9,100</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n                <ul class=\"onder_list_title\">\n                        <li>容納座位數（由多至少）</li>\n                </ul>\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                                <td bgcolor=\"#DEDEDE\">教室型</td>\n                                                <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        </tr>\n                                        <tr class=\"confre_gray\">\n                                                <td>64</td>\n                                                <td>36</td>\n                                                <td>48</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2/6.html (rvalue)
module[97]="<div>\n                <div class=\"aboutpic\">\n                        <a href=\"images/6F.jpg\" data-fancybox=\"images\" data-caption=\"2館6樓會議室\">\n                                <img src=\"images/6F_2.jpg\" alt=\"\">\n                        </a>\n                </div>\n\n\n                <div class=\"call_box lt_mb\">\n                        <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n                        <div class=\"call_font\">更多資訊請洽 :886-2-2725-5200 #6614 黃先生、#6617 林小姐(參展廠商於展覽期間租用會議室請洽展覽主辦單位)。</div>\n                </div>\n                <ul class=\"room_item\">\n                        <menu-item v-for='(item, i) in menu.item' active-class=room_active2 :key=i :item=item class=mr-0.5 />\n                </ul>\n                <router-view />\n                <!--2館6Fend-->\n</div>\n";

////// text!src/template/venue/room-info/2/4.html (rvalue)
module[98]="<div>\n                <div class=\"aboutpic\">\n                        <a href=\"images/4F.jpg\" data-fancybox=\"images\" data-caption=\"2館4樓會議室\">\n                                <img src=\"images/4F.jpg\" alt=\"\">\n                        </a>\n                </div>\n\n\n                <div class=\"call_box lt_mb\">\n                        <div class=\"callicon\"><img src=\"images/call.svg\" alt=\"\"></div>\n                        <div class=\"call_font\">更多資訊請洽 :886-2-2725-5200 #6614 黃先生、#6617 林小姐(參展廠商於展覽期間租用會議室請洽展覽主辦單位)。</div>\n                </div>\n\n                <!-- <div class=\"onder_title\">台北南港展覽館2館 7樓 會議室空間資訊</div> -->\n                <!-- <div class=\"aboutpic\">\n                        <a href=\"images/2_401.jpg\" data-fancybox=\"images\" data-caption=\"401\">\n                                <img src=\"images/2_401.jpg\" alt=\"\">\n                        </a>\n                </div> -->\n                <ul class=\"onder_list_title\">\n                        <li>台北南港展覽館2館 4樓 會議室空間資訊</li>\n                </ul>\n\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr>\n                                                <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">會議室</td>\n                                                <td>401</td>\n                                                <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                                <td>08-12 / 13-17 / (夜間)18-22</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                                <td>96</td>\n                                                <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                                <td>$10,000</td>\n                                        </tr>\n                                        <tr>\n                                                <td bgcolor=\"#f2f2f2\">尺寸(長x寬x高)</td>\n                                                <td>11.4 x 8.4 x 2.6</td>\n                                                <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                                <td>$13,000</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n\n                <ul class=\"onder_list_title\">\n                        <li>容納座位數（由多至少）</li>\n                </ul>\n                <div class=\"confre_table\">\n                        <table width=\"100%\" border=\"0\">\n                                <tbody>\n                                        <tr class=\"confre_graydeep\">\n                                                <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                                <td bgcolor=\"#DEDEDE\">教室型</td>\n                                                <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        </tr>\n                                        <tr class=\"confre_gray\">\n                                                <td>80</td>\n                                                <td>48</td>\n                                                <td>72</td>\n                                        </tr>\n                                </tbody>\n                        </table>\n                </div>\n</div>\n";

////// text!src/template/venue/room-info/2.html (rvalue)
module[99]="<div class=\"for_hall_2\">\n        <!--2館 會議室介紹 -->\n        <div class=\"exh_room_box\">\n\n                <!--2館會議室-->\n                <div class=\"floor\">\n                        <ul>\n                                <menu-item v-for='(item, i) in menu.item' active-class=active2 :key=i :item=item class=mr-0.5 />\n                        </ul>\n                </div>\n                <!--2館會議室-->\n                <router-view />\n        </div>\n        <!--2館 會議室介紹 end-->\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-room/2\">會議室申請專區</a></li>\n        </ul>\n        \n</div>\n";

////// text!src/template/venue/room-info/1/5/507.html (rvalue)
module[100]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 507會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>507</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>176.7</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$18,500</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.7</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$22,200</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>165</td>\n                                        <td>120</td>\n                                        <td>80</td>\n                                        <td>44</td>\n                                        <td>38</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>507</li>\n                                </ul>\n                                <a href=\"images/room_info/507.jpg\" data-fancybox=\"images\" data-caption=\"507\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/507.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/505_507.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505_507.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n</div>\n";

////// text!src/template/venue/room-info/1/5/506.html (rvalue)
module[101]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 506會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>506</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>176.7</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$18,500</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.7</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$22,200</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>165</td>\n                                        <td>120</td>\n                                        <td>80</td>\n                                        <td>44</td>\n                                        <td>38</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>506</li>\n                                </ul>\n                                <a href=\"images/room_info/506.jpg\" data-fancybox=\"images\" data-caption=\"506\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/506.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/505_507.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505_507.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5/505.html (rvalue)
module[102]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 505會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>505</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>511.1</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$53,300</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.7</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$64,000</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>504</td>\n                                        <td>360</td>\n                                        <td>224</td>\n                                        <td>84</td>\n                                        <td>68</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 505abc會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"meet_center confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"5\">標準容量(人)</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積 / ㎡</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">高度 / m</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\">每時段租金</td>\n                                </tr>\n                                <tr class=\"meet_center\">\n                                        <td >劇院型</td>\n                                        <td >標準型</td>\n                                        <td >教室型</td>\n                                        <td >口字型</td>\n                                        <td >馬蹄型</td>\n                                        <td>週一至週五 (未稅)</td>\n                                        <td>夜間、例假日或\n                                                室內攤位展出 (未稅)\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">505a</td>\n                                        <td valign=\"middle\">165</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">178.6</td>\n                                        <td valign=\"middle\">2.7</td>\n                                        <td valign=\"middle\">$18,600</td>\n                                        <td valign=\"middle\">$22,300</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">505b</td>\n                                        <td valign=\"middle\">150</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">171</td>\n                                        <td valign=\"middle\">2.7</td>\n                                        <td valign=\"middle\">$17,800</td>\n                                        <td valign=\"middle\">$21,400</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">505c</td>\n                                        <td valign=\"middle\">150</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">161.5</td>\n                                        <td valign=\"middle\">2.7</td>\n                                        <td valign=\"middle\">$16,900</td>\n                                        <td valign=\"middle\">$20,300</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">505a+b</td>\n                                        <td valign=\"middle\">336</td>\n                                        <td valign=\"middle\">216</td>\n                                        <td valign=\"middle\">144</td>\n                                        <td valign=\"middle\">64</td>\n                                        <td valign=\"middle\">48</td>\n                                        <td valign=\"middle\">349.6</td>\n                                        <td valign=\"middle\">2.7</td>\n                                        <td valign=\"middle\">$36,400</td>\n                                        <td valign=\"middle\">$43,700</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">505b+c</td>\n                                        <td valign=\"middle\">312</td>\n                                        <td valign=\"middle\">216</td>\n                                        <td valign=\"middle\">128</td>\n                                        <td valign=\"middle\">64</td>\n                                        <td valign=\"middle\">48</td>\n                                        <td valign=\"middle\">332.5</td>\n                                        <td valign=\"middle\">2.7</td>\n                                        <td valign=\"middle\">$34,700</td>\n                                        <td valign=\"middle\">$41,700</td>\n                                </tr>\n\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>505a</li>\n                                </ul>\n                                <a href=\"images/room_info/505a.jpg\" data-fancybox=\"images\" data-caption=\"505a\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505a.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>505b</li>\n                                </ul>\n                                <a href=\"images/room_info/505b.jpg\" data-fancybox=\"images\" data-caption=\"505b\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505b.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>505c</li>\n                                </ul>\n                                <a href=\"images/room_info/505c.jpg\" data-fancybox=\"images\" data-caption=\"505c\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505c.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>505ab</li>\n                                </ul>\n                                <a href=\"images/room_info/505ab.jpg\" data-fancybox=\"images\" data-caption=\"505ab\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505ab.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>505bc</li>\n                                </ul>\n                                <a href=\"images/room_info/505bc.jpg\" data-fancybox=\"images\" data-caption=\"505bc\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505bc.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/505_507.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/505_507.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5/504.html (rvalue)
module[103]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 504會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>504</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>505.4</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$52,700</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.8</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$63,300</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>504</td>\n                                        <td>360</td>\n                                        <td>224</td>\n                                        <td>84</td>\n                                        <td>68</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 504abc會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"meet_center confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"5\">標準容量(人)</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積 / ㎡</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">高度 / m</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\">每時段租金</td>\n                                </tr>\n                                <tr class=\"meet_center\">\n                                        <td >劇院型</td>\n                                        <td >標準型</td>\n                                        <td >教室型</td>\n                                        <td >口字型</td>\n                                        <td >馬蹄型</td>\n                                        <td>週一至週五 (未稅)</td>\n                                        <td>夜間、例假日或\n                                                室內攤位展出 (未稅)\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">504a</td>\n                                        <td valign=\"middle\">165</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">184.3</td>\n                                        <td valign=\"middle\">2.8</td>\n                                        <td valign=\"middle\">$19,300</td>\n                                        <td valign=\"middle\">$23,200</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">504b</td>\n                                        <td valign=\"middle\">150</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">169.1</td>\n                                        <td valign=\"middle\">2.8</td>\n                                        <td valign=\"middle\">$17,600</td>\n                                        <td valign=\"middle\">$21,100</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">504c</td>\n                                        <td valign=\"middle\">150</td>\n                                        <td valign=\"middle\">120</td>\n                                        <td valign=\"middle\">80</td>\n                                        <td valign=\"middle\">44</td>\n                                        <td valign=\"middle\">38</td>\n                                        <td valign=\"middle\">152.0</td>\n                                        <td valign=\"middle\">2.8</td>\n                                        <td valign=\"middle\">$15,800</td>\n                                        <td valign=\"middle\">$19,000</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">504a+b</td>\n                                        <td valign=\"middle\">336</td>\n                                        <td valign=\"middle\">216</td>\n                                        <td valign=\"middle\">144</td>\n                                        <td valign=\"middle\">64</td>\n                                        <td valign=\"middle\">48</td>\n                                        <td valign=\"middle\">353.4</td>\n                                        <td valign=\"middle\">2.8</td>\n                                        <td valign=\"middle\">$36,900</td>\n                                        <td valign=\"middle\">$44,300</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">504b+c</td>\n                                        <td valign=\"middle\">312</td>\n                                        <td valign=\"middle\">216</td>\n                                        <td valign=\"middle\">128</td>\n                                        <td valign=\"middle\">64</td>\n                                        <td valign=\"middle\">48</td>\n                                        <td valign=\"middle\">321.1</td>\n                                        <td valign=\"middle\">2.8</td>\n                                        <td valign=\"middle\">$33,400</td>\n                                        <td valign=\"middle\">$40,100</td>\n                                </tr>\n\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>504a</li>\n                                </ul>\n                                <a href=\"images/room_info/504a.jpg\" data-fancybox=\"images\" data-caption=\"504a\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/504a.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>504b</li>\n                                </ul>\n                                <a href=\"images/room_info/504b.jpg\" data-fancybox=\"images\" data-caption=\"504b\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/504b.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>504c</li>\n                                </ul>\n                                <a href=\"images/room_info/504c.jpg\" data-fancybox=\"images\" data-caption=\"504c\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/504c.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>504ab</li>\n                                </ul>\n                                <a href=\"images/room_info/504ab.jpg\" data-fancybox=\"images\" data-caption=\"504ab\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/504ab.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>504bc</li>\n                                </ul>\n                                <a href=\"images/room_info/504bc.jpg\" data-fancybox=\"images\" data-caption=\"504bc\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/504bc.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/500_504.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500_504.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n</div>\n";

////// text!src/template/venue/room-info/1/5/503.html (rvalue)
module[104]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 503會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>503</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>150.9</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$15,600</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.8</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$18,700</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>110</td>\n                                        <td>84</td>\n                                        <td>56</td>\n                                        <td>36</td>\n                                        <td>30</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>503</li>\n                                </ul>\n                                <a href=\"images/room_info/503.jpg\" data-fancybox=\"images\" data-caption=\"503\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/503.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/500_504.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500_504.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5/502.html (rvalue)
module[105]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 502會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>502</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>102.3</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$10,700</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.8</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$12,800</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>95</td>\n                                        <td>68</td>\n                                        <td>34</td>\n                                        <td>32</td>\n                                        <td>26</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>502</li>\n                                </ul>\n                                <a href=\"images/room_info/502.jpg\" data-fancybox=\"images\" data-caption=\"502\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/502.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/500_504.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500_504.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5/501.html (rvalue)
module[106]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 501會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>501</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>131.1</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$13,800</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.8</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$16,600</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>105</td>\n                                        <td>84</td>\n                                        <td>56</td>\n                                        <td>36</td>\n                                        <td>30</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>501</li>\n                                </ul>\n                                <a href=\"images/room_info/501.jpg\" data-fancybox=\"images\" data-caption=\"501\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/501.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/500_504.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500_504.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5/500.html (rvalue)
module[107]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 5樓 500會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>500</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>159.8</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$16,700</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>2.8</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$20,000</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>140</td>\n                                        <td>116</td>\n                                        <td>72</td>\n                                        <td>52</td>\n                                        <td>46</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>500</li>\n                                </ul>\n                                <a href=\"images/room_info/500.jpg\" data-fancybox=\"images\" data-caption=\"500\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>5樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/500_504.jpg\" data-fancybox=\"images\" data-caption=\"5樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/500_504.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/5.html (rvalue)
module[108]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/conference_1hall_5f.jpg\" data-fancybox=\"images\" data-caption=\"1館5樓會議室\">\n                        <img src=\"images/conference_1hall_5f.jpg\" alt=\"\">\n                </a>\n        </div>\n        <ul class=\"room_item\">\n                <menu-item v-for='(item, i) in menu.item' active-class=room_active :key=i :item=item class=mr-0.5 />\n                <a href=\"https://livetour.istaging.com/dae5eeb0-7a8b-4898-8143-b569d729629d?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=8\" target=\"_blank\">\n                    <li class=\"active2\">360°環景圖</li>\n                </a>\n        </ul>\n        <router-view />\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-room/1\">會議室申請專區</a></li>\n        </ul>\n</div>\n";

////// text!src/template/venue/room-info/1/4/404.html (rvalue)
module[109]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 4樓 404會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>404</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>133.5</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$14,000</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>3.5</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$16,800</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>90</td>\n                                        <td>72</td>\n                                        <td>48</td>\n                                        <td>36</td>\n                                        <td>26</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>404</li>\n                                </ul>\n                                <a href=\"images/room_info/404.jpg\" data-fancybox=\"images\" data-caption=\"404\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/404.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/401_404.jpg\" data-fancybox=\"images\" data-caption=\"4樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/401_404.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n\n</div>\n";

////// text!src/template/venue/room-info/1/4/403.html (rvalue)
module[110]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 4樓 403會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>403</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>149.5</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$15,600</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>3.5</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$18,700</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>125</td>\n                                        <td>92</td>\n                                        <td>68</td>\n                                        <td>44</td>\n                                        <td>34</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>403</li>\n                                </ul>\n                                <a href=\"images/room_info/403.jpg\" data-fancybox=\"images\" data-caption=\"403\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/403.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/401_404.jpg\" data-fancybox=\"images\" data-caption=\"4樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/401_404.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/4/402.html (rvalue)
module[111]="<div>\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 4樓 402會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>402</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>372.6</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$39,400</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>3.5</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$47,300</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>396</td>\n                                        <td>224</td>\n                                        <td>168</td>\n                                        <td>80</td>\n                                        <td>62</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 4樓 402abc會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"meet_center confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">會議室名稱</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"5\">標準容量(人)</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">面積 / ㎡</td>\n                                        <td bgcolor=\"#DEDEDE\" rowspan=\"2\">高度 / m</td>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\">每時段租金</td>\n                                </tr>\n                                <tr class=\"meet_center\">\n                                        <td >劇院型</td>\n                                        <td >標準型</td>\n                                        <td >教室型</td>\n                                        <td >口字型</td>\n                                        <td >馬蹄型</td>\n                                        <td>週一至週五 (未稅)</td>\n                                        <td>夜間、例假日或\n                                                室內攤位展出 (未稅)\n                                        </td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">402a</td>\n                                        <td valign=\"middle\">100</td>\n                                        <td valign=\"middle\">72</td>\n                                        <td valign=\"middle\">56</td>\n                                        <td valign=\"middle\">36</td>\n                                        <td valign=\"middle\">26</td>\n                                        <td valign=\"middle\">121.4</td>\n                                        <td valign=\"middle\">3.5</td>\n                                        <td valign=\"middle\">$12,900</td>\n                                        <td valign=\"middle\">$15,500</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">402b</td>\n                                        <td valign=\"middle\">110</td>\n                                        <td valign=\"middle\">72</td>\n                                        <td valign=\"middle\">56</td>\n                                        <td valign=\"middle\">36</td>\n                                        <td valign=\"middle\">26</td>\n                                        <td valign=\"middle\">122.8</td>\n                                        <td valign=\"middle\">3.5</td>\n                                        <td valign=\"middle\">$12,900</td>\n                                        <td valign=\"middle\">$15,500</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">402c</td>\n                                        <td valign=\"middle\">110</td>\n                                        <td valign=\"middle\">72</td>\n                                        <td valign=\"middle\">56</td>\n                                        <td valign=\"middle\">36</td>\n                                        <td valign=\"middle\">26</td>\n                                        <td valign=\"middle\">128.3</td>\n                                        <td valign=\"middle\">3.5</td>\n                                        <td valign=\"middle\">$13,600</td>\n                                        <td valign=\"middle\">$16,300</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">402a+b</td>\n                                        <td valign=\"middle\">234</td>\n                                        <td valign=\"middle\">144</td>\n                                        <td valign=\"middle\">108</td>\n                                        <td valign=\"middle\">56</td>\n                                        <td valign=\"middle\">42</td>\n                                        <td valign=\"middle\">244.3</td>\n                                        <td valign=\"middle\">3.5</td>\n                                        <td valign=\"middle\">$25,800</td>\n                                        <td valign=\"middle\">$31,000</td>\n                                </tr>\n                                <tr>\n                                        <td valign=\"middle\">402b+c</td>\n                                        <td valign=\"middle\">234</td>\n                                        <td valign=\"middle\">144</td>\n                                        <td valign=\"middle\">108</td>\n                                        <td valign=\"middle\">56</td>\n                                        <td valign=\"middle\">42</td>\n                                        <td valign=\"middle\">251.2</td>\n                                        <td valign=\"middle\">3.5</td>\n                                        <td valign=\"middle\">$26,500</td>\n                                        <td valign=\"middle\">$31,800</td>\n                                </tr>\n\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>402a</li>\n                                </ul>\n                                <a href=\"images/room_info/402a.jpg\" data-fancybox=\"images\" data-caption=\"402a\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/402a.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>402b</li>\n                                </ul>\n                                <a href=\"images/room_info/402b.jpg\" data-fancybox=\"images\" data-caption=\"402b\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/402b.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>402c</li>\n                                </ul>\n                                <a href=\"images/room_info/402c.jpg\" data-fancybox=\"images\" data-caption=\"402c\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/402c.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>402ab</li>\n                                </ul>\n                                <a href=\"images/room_info/402ab.jpg\" data-fancybox=\"images\" data-caption=\"402ab\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/402ab.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>402bc</li>\n                                </ul>\n                                <a href=\"images/room_info/402bc.jpg\" data-fancybox=\"images\" data-caption=\"402bc\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/402bc.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/401_404.jpg\" data-fancybox=\"images\" data-caption=\"4樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/401_404.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/4/401.html (rvalue)
module[112]="<div>\n\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 4樓 401會議室空間資訊</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>401</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>375.7</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$39,900</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>3.5</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$47,900</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>384</td>\n                                        <td>216</td>\n                                        <td>144</td>\n                                        <td>72</td>\n                                        <td>52</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>401</li>\n                                </ul>\n                                <a href=\"images/room_info/401.jpg\" data-fancybox=\"images\" data-caption=\"401\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/401.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>4樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/會議室尺寸401_404.jpg\" data-fancybox=\"images\" data-caption=\"4樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/會議室尺寸401_404.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1/4.html (rvalue)
module[113]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/conference_1hall_4f.png\" data-fancybox=\"images\" data-caption=\"1館4樓會議室\">\n                        <img src=\"images/conference_1hall_4f.png\" alt=\"\">\n                </a>\n        </div>\n        <ul class=\"room_item\">\n                <menu-item v-for='(item, i) in menu.item' active-class=room_active :key=i :item=item class=mr-0.5 />\n                <a href=\"https://livetour.istaging.com/d543f7aa-ee10-42a7-a3b2-c0310bc97c37?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=9\" target=\"_blank\">\n                    <li class=\"active2\">360°環景圖</li>\n                </a>\n        </ul>\n        <router-view />\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-room/1\">會議室申請專區</a></li>\n        </ul>\n\n\n\n\n\n</div>\n";

////// text!src/template/venue/room-info/1/3.html (rvalue)
module[114]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/conference_1hall_3f.png\" data-fancybox=\"images\" data-caption=\"1館3樓會議室\">\n                        <img src=\"images/conference_1hall_3f.png\" alt=\"\">\n                </a>\n        </div>\n\n\n        <ul class=\"room_item\">\n                <menu-item v-for='(item, i) in menu.item' active-class=room_active :key=i :item=item class=mr-0.5 />\n                <a href=\"https://livetour.istaging.com/1b896f7f-7ef7-45b2-8654-c3a0ed39432c?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=2\" target=\"_blank\">\n                    <li class=\"active2\">360°環景圖</li>\n                </a>\n        </ul>\n        <router-view />\n        <!-- <div class=\"onder_title\">台北南港展覽館2館 7樓 會議室空間資訊</div> -->\n        <ul class=\"onder_list_title\">\n                <li>台北南港展覽館1館 3樓 會議室空間資訊</li>\n        </ul>\n\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\" colspan=\"4\" class=\"confre_graydeep meet_center\">租借詳細資訊</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">會議室</td>\n                                        <td>福軒</td>\n                                        <td bgcolor=\"#f2f2f2\">時段區分</td>\n                                        <td>08-12 / 13-17 / (夜間)18-22</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">面積 / ㎡</td>\n                                        <td>83.5</td>\n                                        <td bgcolor=\"#f2f2f2\">週一至週五 (未稅)</td>\n                                        <td>$13,800</td>\n                                </tr>\n                                <tr>\n                                        <td bgcolor=\"#f2f2f2\">高度 / m</td>\n                                        <td>3.9</td>\n                                        <td bgcolor=\"#f2f2f2\">夜間、例假日及展覽 (未稅)</td>\n                                        <td>$16,600</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <ul class=\"onder_list_title\">\n                <li>容納座位數（由多至少）</li>\n        </ul>\n        <div class=\"confre_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr class=\"confre_graydeep\">\n                                        <td bgcolor=\"#DEDEDE\">劇院型</td>\n                                        <td bgcolor=\"#DEDEDE\">標準型</td>\n                                        <td bgcolor=\"#DEDEDE\">教室型</td>\n                                        <td bgcolor=\"#DEDEDE\">口字型</td>\n                                        <td bgcolor=\"#DEDEDE\">馬蹄型</td>\n                                </tr>\n                                <tr class=\"confre_gray\">\n                                        <td>60</td>\n                                        <td>48</td>\n                                        <td>32</td>\n                                        <td>28</td>\n                                        <td>20</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-room/1\">會議室申請專區</a></li>\n        </ul>\n\n        <div class=\"news_wrap fopdf_mt\">\n                <div class=\"row fontbox_mg \">\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>福軒</li>\n                                </ul>\n                                <a href=\"images/room_info/福軒.jpg\" data-fancybox=\"images\" data-caption=\"福軒\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/福軒.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-6 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>3樓【會議室尺寸圖】</li>\n                                </ul>\n                                <a href=\"images/room_info/happiness.jpg\" data-fancybox=\"images\" data-caption=\"3樓【會議室尺寸圖】\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/room_info/happiness.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n                </div>\n        </div>\n</div>\n";

////// text!src/template/venue/room-info/1.html (rvalue)
module[115]="<div class=\"for_hall_1\">\n        <!--1館 會議室介紹-->\n        \n        <!--1館會議室-->\n        <div class=\"floor\">\n                <ul>\n                        <menu-item v-for='(item, i) in menu.item' active-class=active :key=i :item=item class=mr-0.5 />\n                </ul>\n        </div>\n        <!--1館會議室-->\n        <router-view />\n        <!--1館 會議室介紹 end-->\n</div>\n";

////// text!src/template/venue/room-info.html (rvalue)
module[116]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">基本資訊</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n</div>\n";

////// ls!src/showgrounds-query (sdefine)
load(117,[145,152,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!d2', 'ls!fmt-num', 'ls!is-en'], function(d2, fmtNum, isEn){
    return {
      data: function(){
        var d;
        return {
          area: 1,
          withFood: false,
          floor: 1,
          input: {
            type: '1',
            date: (d = new Date, d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate())),
            holiday: false,
            btime: 0,
            etime: 24
          },
          inputSegment: []
        };
      },
      computed: {
        hall: function(){
          return this.$route.params.hall | 0;
        },
        bhours: function(){
          var i$, to$, results$ = [];
          for (i$ = 0, to$ = this.input.etime - 1; i$ <= to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        },
        ehours: function(){
          var i$, results$ = [];
          for (i$ = this.input.btime + 1; i$ <= 24; ++i$) {
            results$.push(i$);
          }
          return results$;
        },
        floors: function(){
          return [1, 4];
        },
        areas: function(){
          if (this.hall === 1) {
            return [1, 1.5, 2, 3];
          } else {
            return [1, 1.5, 2, 3, 4];
          }
        },
        totalPrice: function(){
          return this.price * 1.05;
        },
        vat: function(){
          return this.price * 0.05;
        },
        segment: function(){
          var lastEventI, seg, res$, i$, ref$, len$, i, s, ref1$, eventDayDuration, eventDayHoliday, ai, a, d, j$, len1$, bi, b, out, p, unitPrice;
          lastEventI = -1;
          res$ = [];
          for (i$ = 0, len$ = (ref$ = this.inputSegment).length; i$ < len$; ++i$) {
            i = i$;
            s = ref$[i$];
            if (s.date) {
              res$.push((ref1$ = clone$(s), ref1$.i = i, ref1$.error = '', ref1$));
            }
          }
          seg = res$;
          seg = seg.sort(function(a, b){
            var ad, bd;
            if (a.date !== b.date) {
              ad = a.date.split(/\D+/);
              bd = b.date.split(/\D+/);
              while (ad.length && ad[0] === bd[0]) {
                ad.shift();
                bd.shift();
              }
              return ad[0] - bd[0];
            }
            return a.btime - b.btime || a.etime - b.etime || a.type - b.type;
          });
          eventDayDuration = {};
          eventDayHoliday = {};
          for (i$ = 0, len$ = seg.length; i$ < len$; ++i$) {
            ai = i$;
            a = seg[i$];
            if (a.type === '1') {
              lastEventI = ai;
              eventDayDuration[a.date] = ((ref$ = eventDayDuration[a.date]) != null ? ref$ : 0) + a.etime - a.btime;
              d = new Date(a.date);
              if (a.holiday || d.getDay() === 0 || d.getDay() === 6) {
                eventDayHoliday[a.date] = true;
              }
            }
          }
          for (i$ = 0, len$ = seg.length; i$ < len$; ++i$) {
            ai = i$;
            a = seg[i$];
            for (j$ = 0, len1$ = seg.length; j$ < len1$; ++j$) {
              bi = j$;
              b = seg[j$];
              if (ai === bi) {
                continue;
              }
              if (a.date !== b.date) {
                continue;
              }
              if (a.btime < b.etime && b.btime < a.etime) {
                a.error = isEn ? 'Time-range overlapped' : '時間區間重疊';
              }
            }
            if (a.type === '1' && (a.btime < 7 || a.etime > 23)) {
              a.error = isEn ? 'Time-range is outside 7:00-23:00' : '活動時段超出7:00-23:00';
            }
            if (a.type === '1' && eventDayDuration[a.date] < 4) {
              a.error = isEn ? 'Event time during this day is less than 4 hours' : '本日活動時段少於四小時';
            }
          }
          out = [];
          for (i$ = 0, len$ = seg.length; i$ < len$; ++i$) {
            i = i$;
            s = seg[i$];
            s.typeLabel = isEn
              ? (fn$())
              : (fn1$());
            s.unitPrice = this.area * (fn2$.call(this));
            s.unitPrice = ((s.unitPrice + 999) / 1000 | 0) * 1000;
            s.duration = s.etime - s.btime;
            s.price = s.unitPrice * s.duration;
            out.push(s);
            if (eventDayHoliday[s.date] && (s.type === '1' || s.etime > 7 && i < lastEventI)) {
              out.push({
                isHoliday: true,
                typeLabel: isEn ? 'Holiday' : '假日',
                unitPrice: s.unitPrice * 0.2,
                duration: s.duration,
                price: s.duration * s.unitPrice * 0.2
              });
            }
            if (s.type === '3') {
              unitPrice = d.getMonth() + 1 <= 5 || d.getMonth() + 1 >= 10 ? 14000 : 17000;
              unitPrice *= this.area === 1.5
                ? 2
                : this.area;
              out.push({
                typeLabel: isEn ? 'Air conditioned' : '空調',
                unitPrice: unitPrice,
                duration: s.duration,
                price: s.duration * unitPrice
              });
            }
          }
          return out;
          function fn$(){
            switch (s.type) {
            case '1':
              return 'Event';
            default:
              if (i < lastEventI) {
                return 'Set-up';
              } else {
                return 'Dismantling';
              }
            }
          }
          function fn1$(){
            switch (s.type) {
            case '1':
              return '活動';
            default:
              if (i < lastEventI) {
                return '進場';
              } else {
                return '撤場';
              }
            }
          }
          function fn2$(){
            switch (s.type) {
            case '1':
              p = s.btime < 18 ? 65000 : 82000;
              if (this.hall === 1 && this.floor === 1) {
                p -= 1000;
              }
              return p;
            default:
              if (this.hall === 1 && s.btime < 7) {
                return 12000;
              } else {
                return 20000;
              }
            }
          }
        },
        price: function(){
          var out, i$, ref$, len$, s;
          out = 0;
          for (i$ = 0, len$ = (ref$ = this.segment).length; i$ < len$; ++i$) {
            s = ref$[i$];
            if (s.error !== '') {
              return 0;
            }
            out += s.price;
          }
          return out;
        }
      },
      methods: {
        d2: d2,
        fmtNum: fmtNum,
        add: function(){
          var ref$;
          if (this.input.type === '1' && this.input.btime < 18 && this.input.etime > 18) {
            this.inputSegment.push((ref$ = JSON.parse(JSON.stringify(this.input)), ref$.etime = 18, ref$));
            this.inputSegment.push((ref$ = JSON.parse(JSON.stringify(this.input)), ref$.btime = 18, ref$));
          } else if ((this.input.type === '2' || this.input.type === '3') && this.input.btime < 7 && this.input.etime > 7) {
            this.inputSegment.push((ref$ = JSON.parse(JSON.stringify(this.input)), ref$.etime = 7, ref$));
            this.inputSegment.push((ref$ = JSON.parse(JSON.stringify(this.input)), ref$.btime = 7, ref$));
          } else {
            this.inputSegment.push(JSON.parse(JSON.stringify(this.input)));
          }
          this.input.btime = 0;
          this.input.etime = 24;
        },
        remove: function(i){
          this.inputSegment.splice(i, 1);
        }
      }
    };
  });
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
}).call(this);
});

////// text!src/template/venue/showgrounds-query.html (rvalue)
module[118]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">場地試算</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <router-link :to='\"/venue/showgrounds-query/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n                  <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n                </router-link>\n        </ul>\n\n        <div class=\"venue_Bg lt_mb\">\n                <div class=\"venue_top_pd\">\n                        <template v-if='hall==1'>\n                                <div class=\"onder_title\">選擇樓層</div>\n                                <ul class=\"venue_ck_box\">\n                                        <li v-for='_ in floors'><label><input type=\"radio\" :value=_ v-model=floor /> {{_}}F</label></li>\n                                </ul>\n                        </template>\n                        <div class=\"onder_title\">選擇區域數量</div>\n                        <ul class=\"venue_ck_box\">\n                                <li v-for='_ in areas'><label><input type=radio :value=_ v-model=area />{{_}}區 </label></li>\n                                <li>*1區可容納6,000人，含座位及舞台</li>\n                        </ul>\n                        <!--\n                        <div class=\"onder_title\">是否為餐會活動</div>\n                        <ul class=\"venue_ck_box\">\n                                <li><label><input type=radio value=true v-model=withFood /> 是</label></li>\n                                <li><label><input type=radio value=false v-model=withFood /> 否</label></li>\n                        </ul>\n                        -->\n\n                        <ul class=\"inportant_ps\">\n                                <li>小提醒:</li>\n                                <li>* 進場、撤場可選擇時間為 00:00~24:00。</li>\n                                <li>* 活動期間可選擇時間為 07:00~23:00。</li>\n                                <li>* 活動期間當日逢星期六、日及其他國定假日，加收20％場地費。</li>\n                                <li>* 進場、活動期間、撤場，依時段不同有二種單價。</li>\n                                <li>* 場租試算僅供參考，不等同正式報價。</li>\n                                <li>* 單位:新台幣</li>\n                        </ul>\n\n                        <div class=\"panel_table\">\n                            <table width=\"100%\" border=\"0\">\n                              <tr>\n                                <td colspan=\"7\" bgcolor=\"#DEDEDE\">\n                                    <ul class=\"panel_li\">\n                                        <li>\n                                          <label><input type=radio v-model=input.type value=1>活動</label>\n                                          <label><input type=radio v-model=input.type value=2>進撤場</label>\n                                          <label><input type=radio v-model=input.type value=3>進撤場附空調</label>\n                                        </li>\n                                        <li>日期：</li>\n                                        <li><input type=\"date\" v-model=input.date></li>\n                                        <li>\n                                          <label><input type=checkbox v-model=input.holiday>假日</label>\n                                        </li>\n                                        <li>開始時間：</li>\n                                        <li>\n                                          <select v-model=input.btime>\n                                            <option v-for='h in bhours' :value=h>{{d2(h)}}:00</option>\n                                          </select>\n                                        </li>\n                                        <li>結束時間：</li>\n                                        <li>\n                                          <select v-model=input.etime>\n                                            <option v-for='h in ehours' :value=h>{{d2(h)}}:00</option>\n                                          </select>\n                                        </li>\n                                        <li class=\"add_icon\" style=cursor:pointer @click.prevent=add><img src=\"images/plus.svg\" alt=\"\"></li>\n                                    </ul>\n                                </td>\n                              </tr>\n                              <tr>\n                                <td>日期</td>\n                                <td>時間</td>\n                                <td>類型</td>\n                                <td>單價</td>\n                                <td>單位(小時)</td>\n                                <td>金額</td>\n                                <td></td>\n                              </tr>\n                              <tr v-for='(_,i) in segment'>\n                                <td>{{_.date}}</td>\n                                <td align=center><template v-if=_.date>{{_.btime}}:00 - {{_.etime}}:00</template></td>\n                                <td>{{_.typeLabel}}</td>\n                                <td align=right>{{_.unitPrice &amp;&amp; fmtNum(_.unitPrice)}}</td>\n                                <td align=right>{{_.duration}}</td>\n                                <td align=right>{{fmtNum(_.price)}}</td>\n                                <td>\n                                  <ul class=\"panel_li\" v-if=_.date><li class=add_icon><img src=\"images/x-mark.svg\" style=cursor:pointer @click.prevent=remove(_.i)></li></ul>\n                                  <b style=color:red>{{_.error}}</b>\n                                </td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>小計</td>\n                                <td align=right>{{fmtNum(price)}}</td>\n                                <td></td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>5% VAT</td>\n                                <td align=right>{{fmtNum(vat)}}</td>\n                                <td></td>\n                              </tr>\n                              <tr v-if=price>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td></td>\n                                <td align=right>合計</td>\n                                <td align=right>{{fmtNum(totalPrice)}}</td>\n                                <td></td>\n                              </tr>\n                            </table>\n                        </div>\n\n                        <ul class=\"inportant_ps_red\">\n                                <li>小提醒:</li>\n                                <li>*活動期間的使用時間至少租滿4小時。</li>\n                                <li>*每天07-24至少要租滿8小時(包含進場+活動期間+撤場)。</li>\n                        </ul>\n                </div>\n        </div>\n\n\n\n\n\n</div>\n";

////// text!src/template/venue/showgrounds/2/4.html (rvalue)
module[119]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/4F.jpg\" data-fancybox=\"images\" data-caption=\"4F\">\n                        <img src=\"images/4F.jpg\" alt=\"\">\n                </a>\n        </div>\n\n        <div class=\"ui-content\">\n                <div class=\"table_ttte\">\n                        <div class=\"rowtable\">\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed01.svg\" alt=\"\"></span><span>洗手間</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed02.svg\" alt=\"\"></span><span>手扶梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed04.svg\" alt=\"\"></span><span>服務台</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed05.svg\" alt=\"\"></span><span>醫護室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed06.svg\" alt=\"\"></span><span>逃生口</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed07.svg\" alt=\"\"></span><span>貴賓室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed08.svg\" alt=\"\"></span><span>哺集乳室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed09.svg\" alt=\"\"></span><span>辦公室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed10.svg\" alt=\"\"></span><span>簡報室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed03.svg\" alt=\"\"></span><span>電梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed11.svg\" alt=\"\"></span><span>男回教祈禱室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed12.svg\" alt=\"\"></span><span>女回教祈禱室</span></div>\n                        </div>\n                </div>\n        </div>\n\n\n\n        <div class=\"expo_table\">\n<table width=\"100%\" border=\"0\">\n<tbody><tr>\n<td bgcolor=\"#DEDEDE\">項目</td>\n<td bgcolor=\"#C0C0C0\">四樓展場總計</td>\n<td bgcolor=\"#85ca33\" class=\"fontwt\">R區</td>\n<td bgcolor=\"#f1b315\" class=\"fontwt\">S區</td>\n</tr>\n<tr>\n<td>面積 m2</td>\n<td>15,120</td>\n<td>7,560</td>\n<td>7,560</td>\n</tr>\n<tr>\n<td>標準攤位數(3mx3m)</td>\n<td>872</td>\n<td>436</td>\n<td>436</td>\n</tr>\n<tr>\n<td>載重量</td>\n<td colspan=\"3\">2000KG/ ㎡</td>\n</tr>\n<tr>\n<td>高度</td>\n<td colspan=\"3\">9m</td>\n</tr>\n<tr>\n<td>貨車入口</td>\n<td colspan=\"3\">2座</td>\n</tr>\n<tr>\n<td>貨梯數</td>\n<td colspan=\"3\">2台</td>\n</tr>\n<tr>\n<td>柱距</td>\n<td colspan=\"3\">18m</td>\n</tr>\n</tbody></table>\n</div>\n\n        <div class=\"onder_title\">360°環景照</div>\n        <div class=\"aboutpic\">\n            <iframe src='https://livetour.istaging.com/40edd140-7a4c-4a38-ad52-b03deb50631e?group=eac1f777-d6f1-4893-b970-ee0b0c8e6708' style=width:100%;height:450px></iframe>\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-exhibition/2\">展覽申請專區</a></li>\n        </ul>\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>4樓展場平面圖</li>\n                        </ul>\n                        <a href=\"images/南港展覽館2館4F_攤位圖_202201版.jpg\" data-fancybox=\"images\" data-caption=\"4樓展場平面圖\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館4F_攤位圖_202201版.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <!-- <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>4樓溝槽圖</li>\n                        </ul>\n                        <a href=\"images/4樓溝槽圖.jpg\" data-fancybox=\"images\" data-caption=\"4樓溝槽圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/4樓溝槽圖.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div> -->\n                <!-- <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>4樓管溝圖</li>\n                        </ul>\n                        <a href=\"images/1f_oo.jpg\" data-fancybox=\"images\" data-caption=\"一樓管溝圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/1f_oo.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div> -->\n        </div>\n</div>\n";

////// text!src/template/venue/showgrounds/2/1.html (rvalue)
module[120]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/1F.jpg\" data-fancybox=\"images\" data-caption=\"1F\">\n                        <img src=\"images/1F.jpg\" alt=\"\">\n                </a>\n        </div>\n\n        <div class=\"ui-content\">\n                <div class=\"table_ttte\">\n                        <div class=\"rowtable\">\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed01.svg\" alt=\"\"></span><span>洗手間</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed02.svg\" alt=\"\"></span><span>手扶梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed04.svg\" alt=\"\"></span><span>服務台</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed05.svg\" alt=\"\"></span><span>醫護室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed06.svg\" alt=\"\"></span><span>逃生口</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed07.svg\" alt=\"\"></span><span>貴賓室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed08.svg\" alt=\"\"></span><span>哺集乳室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed09.svg\" alt=\"\"></span><span>辦公室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed10.svg\" alt=\"\"></span><span>簡報室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed03.svg\" alt=\"\"></span><span>電梯</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed11.svg\" alt=\"\"></span><span>男回教祈禱室</span></div>\n                                <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/ed12.svg\" alt=\"\"></span><span>女回教祈禱室</span></div>\n                        </div>\n                </div>\n        </div>\n\n\n\n        <div class=\"expo_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\">項目</td>\n                                        <td bgcolor=\"#C0C0C0\">1樓展場總計</td>\n                                        <td bgcolor=\"#11b5de\" class=\"fontwt\">P區</td>\n                                        <td bgcolor=\"#1faa89\" class=\"fontwt\">Q區</td>\n                                </tr>\n                                <tr>\n                                        <td>面積 m2</td>\n                                        <td>15,120</td>\n                                        <td>7,560</td>\n                                        <td>7,560</td>\n                                </tr>\n                                <tr>\n                                        <td>標準攤位數(3mx3m)</td>\n                                        <td>848</td>\n                                        <td>424</td>\n                                        <td>424</td>\n                                </tr>\n                                <tr>\n                                        <td>載重量</td>\n                                        <td colspan=\"3\">5000KG/ ㎡</td>\n                                </tr>\n                                <tr>\n                                        <td>高度</td>\n                                        <td colspan=\"3\">12m</td>\n                                </tr>\n                                <tr>\n                                        <td>貨車入口</td>\n                                        <td colspan=\"3\">6座</td>\n                                </tr>\n                                <tr>\n                                        <td>貨梯數</td>\n                                        <td colspan=\"3\">2台</td>\n                                </tr>\n                                <tr>\n                                        <td>柱距</td>\n                                        <td colspan=\"3\">18m</td>\n                                </tr>\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"onder_title\">360°環景照</div>\n        <div class=\"aboutpic\">\n            <iframe src='https://livetour.istaging.com/?group=eac1f777-d6f1-4893-b970-ee0b0c8e6708' style=width:100%;height:450px></iframe>\n        </div>\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-exhibition/2\" >展覽申請專區</a></li>\n        </ul>\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓展場平面圖</li>\n                        </ul>\n                        <a href=\"images/南港展覽館2館1F_攤位圖_202205.jpg\" data-fancybox=\"images\" data-caption=\"1樓展場平面圖\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/南港展覽館2館1F_攤位圖_202205.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <!-- <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓溝槽圖</li>\n                        </ul>\n                        <a href=\"images/1樓溝槽平面圖.jpg\" data-fancybox=\"images\" data-caption=\"1樓溝槽平面圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/1樓溝槽平面圖.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div> -->\n                <!-- <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓管溝圖</li>\n                        </ul>\n                        <a href=\"images/1f_oo.jpg\" data-fancybox=\"images\" data-caption=\"一樓管溝圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/1f_oo.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div> -->\n        </div>\n</div>\n";

////// text!src/template/venue/showgrounds/2.html (rvalue)
module[121]="<div class=\"for_hall_2\">\n        \n        <div class=\"floor\">\n                <ul>\n                        <menu-item v-for='(item, i) in menu.item' active-class=active2 :key=i :item=item class=mr-0.5 />\n                </ul>\n        </div>\n        <router-view />\n</div>\n";

////// text!src/template/venue/showgrounds/1/4.html (rvalue)
module[122]="<div>\n    <div class=\"aboutpic\">\n            <a href=\"images/1hall_4f.png\" data-fancybox=\"images\" data-caption=\"4F\">\n                    <img src=\"images/1hall_4f.png\" alt=\"\">\n            </a>\n    </div>\n    <div class=\"ui-content\">\n            <div class=\"table_ttte\">\n                <div class=\"rowtable\">\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c02.png\" alt=\"\"></span><span>洗手間</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c06.png\" alt=\"\"></span><span>ATM</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c20.png\" alt=\"\"></span><span>TAITRA Lounge</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c04.png\" alt=\"\"></span><span>手扶梯</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c07.png\" alt=\"\"></span><span>電梯</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c21.png\" alt=\"\"></span><span>咖啡／商店</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c09.png\" alt=\"\"></span><span>餐廳</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c01.png\" alt=\"\"></span><span>汽車停車格</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c03.png\" alt=\"\"></span><span>機車停車格</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c08.png\" alt=\"\"></span><span>腳踏車停車格</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c24.png\" alt=\"\"></span><span>急救設備</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c22.png\" alt=\"\"></span><span>捷運</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c23.png\" alt=\"\"></span><span>公車站</span></div>\n                        <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c25.png\" alt=\"\"></span><span>計程車</span></div>\n                </div>\n            </div>\n    </div>\n\n    <div class=\"expo_table\">\n            <table width=\"100%\" border=\"0\">\n                    <tbody>\n                            <tr>\n                                    <td bgcolor=\"#DEDEDE\">項目</td>\n                                    <td bgcolor=\"#C0C0C0\">4樓雲端展場總計</td>\n                                    <td bgcolor=\"#6da744\" class=\"fontwt\">L區</td>\n                                    <td bgcolor=\"#f2931e\" class=\"fontwt\">M區</td>\n                                    <td bgcolor=\"#739ad0\" class=\"fontwt\">N區</td>\n                            </tr>\n                            <tr>\n                                    <td>面積 m2</td>\n                                    <td>22,680</td>\n                                    <td>7,560</td>\n                                    <td>7,560</td>\n                                    <td>7,560</td>\n                            </tr>\n                            <tr>\n                                    <td>標準攤位數(3mx3m)</td>\n                                    <td>1,306</td>\n                                    <td>428</td>\n                                    <td>450</td>\n                                    <td>428</td>\n                            </tr>\n                            <tr>\n                                    <td>載重量</td>\n                                    <td colspan=\"4\">2 公噸/m2</td>\n                            </tr>\n                            <tr>\n                                    <td>高度</td>\n                                    <td colspan=\"4\">14.3 ~ 27.3 m</td>\n                            </tr>\n                            <tr>\n                                    <td>貨車入口</td>\n                                    <td colspan=\"4\">3座</td>\n                            </tr>\n                            <tr>\n                                    <td>貨梯數</td>\n                                    <td colspan=\"4\">3台</td>\n                            </tr>\n                            <tr>\n                                    <td>柱距</td>\n                                    <td colspan=\"4\">無柱式展場 （180 X126 m）</td>\n                            </tr>\n\n                    </tbody>\n            </table>\n    </div>\n\n    <div class=\"onder_title\">360°環景照</div>\n    <div class=\"aboutpic\">\n        <iframe src=\"https://livetour.istaging.com/37ac1f07-ccb6-4b91-94c3-ff6a1edafa0b?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=1\" style=width:100%;height:450px></iframe>\n    </div>\n    <!-- <div class=\"aboutpic\">\n        <iframe src=https://livetour.istaging.com/37ac1f07-ccb6-4b91-94c3-ff6a1edafa0b?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=1 style=width:100%;height:450px></iframe>\n    </div>\n    <div class=\"aboutpic\">\n        <iframe src=https://reurl.cc/826qD7 style=width:100%;height:450px></iframe>\n    </div> -->\n\n    <ul class=\"download_goto\">\n        <li><i class=\"mdi mdi-export\"></i></li>\n        <li><a href=\"/venue/app-exhibition/1\" >展覽申請專區</a></li>\n    </ul>\n    <div class=\"row rw_bm\">\n            <div class=\"col-12 col-md-6 col-lg-6\">\n                    <ul class=\"onder_list_title\">\n                            <li>4樓展場平面圖</li>\n                    </ul>\n                    <a href=\"images/1hall_4f.jpg\" data-fancybox=\"images\" data-caption=\"4樓雲端展場平面圖\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/1hall_4f.jpg);\" alt=\"\">\n                                    <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                    </a>\n            </div>\n\n    </div>\n</div>\n";

////// text!src/template/venue/showgrounds/1/1.html (rvalue)
module[123]="<div>\n        <div class=\"aboutpic\">\n                <a href=\"images/1hall_1f.png\" data-fancybox=\"images\" data-caption=\"1F\">\n                        <img src=\"images/1hall_1f.png\" alt=\"\">\n                </a>\n        </div>\n        <div class=\"ui-content\">\n                <div class=\"table_ttte\">\n                    <div class=\"rowtable\">\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c02.png\" alt=\"\"></span><span>洗手間</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c06.png\" alt=\"\"></span><span>ATM</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c20.png\" alt=\"\"></span><span>TAITRA Lounge</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c04.png\" alt=\"\"></span><span>手扶梯</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c07.png\" alt=\"\"></span><span>電梯</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c21.png\" alt=\"\"></span><span>咖啡／商店</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c09.png\" alt=\"\"></span><span>餐廳</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c01.png\" alt=\"\"></span><span>汽車停車格</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c03.png\" alt=\"\"></span><span>機車停車格</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c08.png\" alt=\"\"></span><span>腳踏車停車格</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c24.png\" alt=\"\"></span><span>急救設備</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c22.png\" alt=\"\"></span><span>捷運</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c23.png\" alt=\"\"></span><span>公車站</span></div>\n                            <div class=\"cell1\"><span class=\"cellicon\"><img src=\"images/c25.png\" alt=\"\"></span><span>計程車</span></div>\n                    </div>\n                </div>\n        </div>\n\n        <div class=\"expo_table\">\n                <table width=\"100%\" border=\"0\">\n                        <tbody>\n                                <tr>\n                                        <td bgcolor=\"#DEDEDE\">項目</td>\n                                        <td bgcolor=\"#C0C0C0\">1樓展場總計</td>\n                                        <td bgcolor=\"#6da744\" class=\"fontwt\">I區</td>\n                                        <td bgcolor=\"#f2931e\" class=\"fontwt\">J區</td>\n                                        <td bgcolor=\"#739ad0\" class=\"fontwt\">K區</td>\n                                </tr>\n                                <tr>\n                                        <td>面積 m2</td>\n                                        <td>22,680</td>\n                                        <td>7,750</td>\n                                        <td>7,180</td>\n                                        <td>7,550</td>\n                                </tr>\n                                <tr>\n                                        <td>標準攤位數(3mx3m)</td>\n                                        <td>1,161</td>\n                                        <td>392</td>\n                                        <td>377</td>\n                                        <td>392</td>\n                                </tr>\n                                <tr>\n                                        <td>載重量</td>\n                                        <td colspan=\"4\">5 公噸/m2</td>\n                                </tr>\n                                <tr>\n                                        <td>高度</td>\n                                        <td colspan=\"4\">9m</td>\n                                </tr>\n                                <tr>\n                                        <td>貨車入口</td>\n                                        <td colspan=\"4\">3座</td>\n                                </tr>\n                                <tr>\n                                        <td>貨梯數</td>\n                                        <td colspan=\"4\">3台</td>\n                                </tr>\n                                <tr>\n                                        <td>柱距</td>\n                                        <td colspan=\"4\">18X18 m</td>\n                                </tr>\n\n                        </tbody>\n                </table>\n        </div>\n\n        <div class=\"onder_title\">360°環景照</div>\n        <div class=\"aboutpic\">\n            <iframe src=\"https://livetour.istaging.com/7383fdf3-1fd2-4a88-94c5-067b36c8b54e?group=91868c1d-632b-4ea0-86ba-e860d7983550&index=1\" style=width:100%;height:450px></iframe>\n        </div>\n        <!-- <div class=\"aboutpic\">\n            <iframe src=\"https://www.google.com/maps/embed?pb=!4v1635734521534!6m8!1m7!1sCAoSLEFGMVFpcE1RTUdkRUQtaHB2c045VnZNTS0yZ1VIdW9ZM2J4azVBSzdqVHR0!2m2!1d25.05675428394416!2d121.6173904609605!3f96.3758817086528!4f-0.580186199342819!5f0.4000000000000002\" style=width:100%;height:450px></iframe>\n        </div>\n        <div class=\"aboutpic\">\n            <iframe src=\"https://www.google.com/maps/embed?pb=!4v1635734559242!6m8!1m7!1sCAoSLEFGMVFpcE9POWowMThRalNDcHY0bGhEOHlpREJrTkRHSDA1NmV3RUN2Tkp5!2m2!1d25.056672832167!2d121.6181359!3f319.75!4f-1.7600000000000051!5f0.4000000000000002\" style=width:100%;height:450px></iframe>\n        </div> -->\n        <!-- <div class=\"onder_title\">1樓展場平面圖</div> -->\n        <ul class=\"download_goto\">\n            <li><i class=\"mdi mdi-export\"></i></li>\n            <li><a href=\"/venue/app-exhibition/1\">展覽申請專區</a></li>\n        </ul>\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓展場平面圖</li>\n                        </ul>\n                        <a href=\"images/1hall_1f.jpg\" data-fancybox=\"images\" data-caption=\"1樓展場平面圖\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/1hall_1f.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <!-- <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓溝槽圖</li>\n                        </ul>\n                        <a href=\"images/1樓溝槽平面圖.jpg\" data-fancybox=\"images\" data-caption=\"1樓溝槽平面圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/1樓溝槽平面圖.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <ul class=\"onder_list_title\">\n                                <li>1樓管溝圖</li>\n                        </ul>\n                        <a href=\"images/1f_oo.jpg\" data-fancybox=\"images\" data-caption=\"一樓管溝圖\">\n                                <div class=\"about_boderpic pc_mg\" style=\"background-image:url(images/1f_oo.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div> -->\n        </div>\n</div>\n";

////// text!src/template/venue/showgrounds/1.html (rvalue)
module[124]="<div class=\"for_hall_1\">\n\n        <div class=\"floor\">\n                <ul>\n                        <menu-item v-for='(item, i) in menu.item' active-class=active :key=i :item=item class=mr-0.5 />\n                </ul>\n        </div>\n        <router-view />\n</div>\n";

////// text!src/template/venue/showgrounds.html (rvalue)
module[125]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">展覽場地</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n</div>\n";

////// ls!src/event0 (sdefine)
load(126,[156,155,143,160,154,153],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/event0.html', 'ls!day-name', 'ls!ajax', 'ls!is-en', 'ls!website-link', 'ls!event-normalize'], function(tmpl, dayName, ajax, isEn, websiteLink, eventNormalize){
    var d2, origDescription, origTitle;
    d2 = function(it){
      if (it < 10) {
        return "0" + it;
      } else {
        return it + "";
      }
    };
    origDescription = '';
    origTitle = '';
    return {
      template: tmpl,
      data: function(){
        return {
          list: [void 8, [], [], []]
        };
      },
      methods: {
        websiteLink: websiteLink,
        fmtTime: function(it){
          var d;
          d = new Date(it * 1000);
          return d.getFullYear() + "/" + (1 + d.getMonth()) + "/" + d.getDate() + " " + d2(d.getHours()) + ":" + d2(d.getMinutes());
        },
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/event', function(it){
            var origDescription, origTitle, i$, category, ref$, len$, elem, ref1$, key$;
            if (it) {
              origDescription = document.head.querySelector('meta[name=description]').content;
              origTitle = document.head.querySelector('meta[property="og:title"]').content;
              for (i$ = 1; i$ <= 3; ++i$) {
                category = i$;
                this$.list[category].splice(0, this$.list[category].length);
              }
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                eventNormalize(elem);
                ((ref1$ = this$.list)[key$ = elem.category] || (ref1$[key$] = [])).push(elem);
              }
            }
          });
        }
      },
      computed: {
        category: function(){
          if (isEn) {
            switch (this.event.category) {
            case 1:
              return 'Exhibition';
            case 2:
              return 'Event';
            case 3:
              return 'Meeting';
            }
          } else {
            switch (this.event.category) {
            case 1:
              return '展覽';
            case 2:
              return '活動';
            case 3:
              return '會議';
            }
          }
        },
        events: function(){
          var id, i$, category, j$, ref$, len$, i, ev, bd, ed;
          id = this.$route.params.id | 0;
          for (i$ = 1; i$ <= 3; ++i$) {
            category = i$;
            for (j$ = 0, len$ = (ref$ = this.list[category]).length; j$ < len$; ++j$) {
              i = j$;
              ev = ref$[j$];
              if (ev.id === id) {
                if (ev.photo_size > 0) {
                  ev.photo = "/2021/api/event/" + id + ".jpg";
                } else {
                  ev.photo = "images/event-default-" + ev.hall + ".jpg";
                }
                bd = new Date(ev.btime * 1000);
                ed = new Date(ev.etime * 1000);
                ev.byear = bd.getFullYear();
                ev.bdate = d2(bd.getMonth() + 1) + "." + d2(bd.getDate());
                ev.bday = dayName[bd.getDay()];
                ev.eyear = ed.getFullYear();
                ev.edate = d2(ed.getMonth() + 1) + "." + d2(ed.getDate());
                ev.eday = dayName[ed.getDay()];
                return {
                  curr: ev,
                  prev: this.list[category][i - 1],
                  next: this.list[category][i + 1]
                };
              }
            }
          }
          return {
            curr: {},
            prev: void 8,
            next: void 8
          };
        },
        event: function(){
          var ev, ref$, description, title;
          ev = this.events.curr;
          description = (ref$ = ev.content) != null ? ref$.substr(0, 100) : void 8;
          title = (isEn ? 'TaiNEX' : '南港展覽館') + " ー " + ev.title + " " + ev.byear + "." + ev.bdate + "~" + ev.eyear + "." + ev.edate + " " + (isEn
            ? "Hall " + ev.hall
            : ev.hall + "館") + " " + ev.location;
          document.head.querySelector('meta[name=description]').content = description;
          document.head.querySelector('meta[property="og:description"]').content = description;
          document.head.querySelector('meta[property="og:title"]').content = title;
          return this.events.curr;
        },
        eventPrev: function(){
          return this.events.prev;
        },
        eventNext: function(){
          return this.events.next;
        }
      },
      mounted: function(){
        this.fetch();
      },
      beforeDestroy: function(){
        document.head.querySelector('meta[name=description]').content = origDescription;
        document.head.querySelector('meta[property="og:description"]').content = origDescription;
        document.head.querySelector('meta[property="og:title"]').content = origTitle;
      }
    };
  });
}).call(this);
});

////// ls!src/event (sdefine)
load(127,[158,157,143,160,153],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/event.html', 'ls!fmt-date-range', 'ls!ajax', 'ls!is-en', 'ls!event-normalize'], function(tmpl, fmtDateRange, ajax, isEn, eventNormalize){
    return {
      template: tmpl,
      data: function(){
        return {
          hall: 0,
          list: [],
          viewLen: [void 8, 3, 3, 3]
        };
      },
      computed: {
        age: function(){
          return this.$route.params.age;
        },
        view1: function(){
          return this.takeView(1);
        },
        view2: function(){
          return this.takeView(2);
        },
        view3: function(){
          return this.takeView(3);
        }
      },
      methods: {
        fmtDateRange: fmtDateRange,
        more: function(category){
          this.viewLen.splice(category, 1, this.viewLen[category] + 3);
        },
        takeView: function(category){
          var len, more, list, res$, i$, ref$, len$, e;
          len = 0;
          more = false;
          res$ = [];
          for (i$ = 0, len$ = (ref$ = this.list).length; i$ < len$; ++i$) {
            e = ref$[i$];
            if (e.category !== category) {
              continue;
            }
            if (this.hall && (e.hall & this.hall) === 0) {
              continue;
            }
            if (len >= this.viewLen[category]) {
              more = true;
              break;
            }
            ++len;
            res$.push(e);
          }
          list = res$;
          list.more = more;
          return list;
        },
        toggleHall: function(hall){
          if (this.hall === hall) {
            this.hall = 0;
          } else {
            this.hall = hall;
          }
        },
        fetch: function(){
          var this$ = this;
          ajax.get("/2021/api/event" + (this.$route.params.age === 'event' ? '' : '/past'), function(it){
            var now, res$, i$, ref$, len$, elem;
            if (it) {
              now = Date.now() / 1000;
              res$ = [];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                eventNormalize(elem);
                if (elem.photo_size > 0) {
                  elem.photo = "/2021/api/event/" + elem.id + ".jpg";
                } else {
                  elem.photo = "images/event-default-" + elem.hall + ".jpg";
                }
                res$.push(elem);
              }
              this$.list = res$;
            }
          });
        },
        reset: function(){
          var i$, category;
          for (i$ = 1; i$ <= 3; ++i$) {
            category = i$;
            this.viewLen[category] = 3;
          }
        }
      },
      mounted: function(){},
      beforeRouteEnter: function(to, from, next){
        next(function(vm){
          vm.reset();
          vm.fetch();
        });
      },
      beforeRouteUpdate: function(to, from, next){
        next();
        this.reset();
        this.fetch();
      }
    };
  });
}).call(this);
});

////// ls!src/contact (sdefine)
load(128,[143,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!ajax', 'ls!is-en'], function(ajax, isEn){
    var renderGrecaptcha;
    renderGrecaptcha = function(){
      var i$, ref$, len$, cntr;
      for (i$ = 0, len$ = (ref$ = document.querySelectorAll('.grecaptcha')).length; i$ < len$; ++i$) {
        cntr = ref$[i$];
        cntr.dataset.grecaptcha = grecaptcha.render(cntr, {
          sitekey: '6Lf5pg8bAAAAAIbES5zrqKDaM46fc4oeewp8SUTi'
        });
      }
    };
    window.grecaptchaOnloadCallback = function(){
      window.grecaptchaOnloadCallback = void 8;
      renderGrecaptcha();
    };
    return {
      data: function(){
        return {
          subject: '',
          category: 0,
          name: '',
          company: '',
          phone: '',
          email: '',
          content: ''
        };
      },
      methods: {
        reset: function(){
          this.subject = this.name = this.company = this.phone = this.email = this.content = '';
          this.category = 0;
        },
        submit: function(){
          var subject, ref$, this$ = this;
          if (/^\s*$/.exec(this.name)) {
            if (isEn) {
              alert('Please provide your name.');
            } else {
              alert('請提供您的名字');
            }
            return;
          }
          if (/^\s*$/.exec(this.subject)) {
            if (isEn) {
              alert('Please fill the subject');
            } else {
              alert('請輸入主旨');
            }
            return;
          }
          if (/^\s*$/.exec(this.content)) {
            if (isEn) {
              alert('Please fill the question');
            } else {
              alert('請輸入提問內容');
            }
            return;
          }
          if (/^\s*$/.exec(this.phone) && /^\s*$/.exec(this.email)) {
            if (isEn) {
              alert('Please provide your phone number or E-mail address.');
            } else {
              alert('請提供您的電話號碼或是電子信箱');
            }
            return;
          }
          subject = (function(){
            switch (this.category) {
            case '1':
              return "[1館] " + this.subject;
            case '2':
              return "[2館] " + this.subject;
            default:
              return this.subject;
            }
          }.call(this));
          ajax.post('/2021/api/contact', (ref$ = {
            name: this.name,
            company: this.company,
            phone: this.phone,
            email: this.email,
            content: this.content
          }, ref$.subject = subject, ref$.grecaptcha = grecaptcha.getResponse(this.$refs.grecaptcha.dataset.grecaptcha), ref$), function(it){
            var i$, ref$, len$, cntr;
            for (i$ = 0, len$ = (ref$ = document.querySelectorAll('.grecaptcha')).length; i$ < len$; ++i$) {
              cntr = ref$[i$];
              grecaptcha.reset(cntr.dataset.grecaptcha);
            }
            if (it.success) {
              if (isEn) {
                alert("Submitted. We will contact you soon.");
              } else {
                alert("已送出訊息，我們將盡速與您聯絡。");
              }
              this$.reset();
            } else {
              alert(it.message + " is wrong. Please try again later.");
            }
          });
        }
      },
      mounted: function(){
        var x$;
        this.reset();
        if (window.grecaptchaOnloadCallback) {
          x$ = document.createElement('script');
          x$.src = 'https://www.google.com/recaptcha/api.js?onload=grecaptchaOnloadCallback&render=explicit';
          document.head.appendChild(x$);
        } else {
          renderGrecaptcha();
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/about/contact.html (rvalue)
module[129]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">聯絡我們</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <div class=\"onder_title\">歡迎填寫下表單與我們聯繫</div>\n        <div class=\"row\">\n                <div class=\"col-12 col-md-12 col-lg-12\">\n                        <div class=\"name\">\n                                <input type=\"text\" placeholder=\"*主旨\" v-model=subject>\n                        </div>\n                        <div class=\"name2\">\n                                <select v-model=category>\n                                        <option value=0>詢問項目</option>\n                                        <option value=1>1館</option>\n                                        <option value=2>2館</option>\n                                        <option value=9>其他</option>\n                                </select>\n                        </div>\n\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"name\">\n                                <input type=\"text\" placeholder=\"*名字\" v-model=name>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"name\">\n                                <input type=\"text\" placeholder=\"*公司/機購\" v-model=company>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"name\">\n                                <input type=\"text\" placeholder=\"*電話/手機\" v-model=phone>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"name\">\n                                <input type=\"text\" placeholder=\"*電子郵件\" v-model=email>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-12 col-lg-12\">\n                        <div class=\"name\">\n                                <textarea placeholder=提問內容 v-model=content></textarea>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-12 col-lg-12\">\n                        <div class=\"robit grecaptcha\" ref=grecaptcha></div>\n                        <div class=\"aboutcontent\">以上資料僅供本會透過電話、郵件等通訊方式與提供資料之個人聯繫接洽用。提供資料之個人可就其個人資料：1.查詢或請求閱覽。2.請求製給複製本。3.請求補充或更正。4.請求停止蒐集、處理或利用。5.請求刪除。如欲行使以上權利，請洽本活動業務承辦人。</div>\n                        <div class=\"msg\"></div>\n\n                        <ul class=\"content_btn lt_mb\">\n                                <li><button class=\"content_btn\" @click.prevent=reset>重填</button></li>\n                                <li class=\"ac_cont\"><button class=\"content_btn\" @click.prevent=submit>送出</button></li>\n                        </ul>\n\n\n                </div>\n\n        </div>\n\n\n</div>\n";

////// text!src/template/about/arts/2.html (rvalue)
module[130]="<div class=\"for_hall_2\">\n<!--2館-->\n        <div class=\"art_title\">作品名 : 度境</div>\n        <div class=\"art_smfont\">作者 : Heike Weber, Walter Eul</div>\n        <div class=\"art_line\"></div>\n\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">天體運動橫越於廣漠的星際時空中，有如有機的生命活體，無比壯觀，\n                                生命力無比豐沛！ Transit，具有軌跡通道之意，反應建築作為一個動態的場所，以及生命交流的場所本質。\n                                藝術家結合數學空間 概念以及人性與有機的特性，反應人性以及科技的二元性。</p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                        材質 : 手工製玻璃、不鏽鋼索、LED<br>\n                        年份 : 2018<br>\n                        尺寸 : 80.3 x 6.5 x 4.2m\n                        </p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/TaipeiCycle_92.jpg\" data-fancybox=\"images\" data-caption=\"度境\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/TaipeiCycle_92.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/度境2.jpg\" data-fancybox=\"images\" data-caption=\"度境\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/度境2.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n        </div>\n\n\n        <div class=\"art_title\">作品名 : 山．形．誌</div>\n        <div class=\"art_smfont\">作者 : FAHR 021.3</div>\n        <div class=\"art_line\"></div>\n\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">Nappe，在地質學上稱為推覆體。台灣是個山嶺形成的自然實驗室，景觀壯麗多變，能夠代表這項地質傳奇的同義字就是玉山。Nappe，也將是一個開放性的亭子，吸引市民，享受嶄新的都市經驗與感受。</p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                                材質 : 鋼構、漆<br>\n                                年份 : 2018<br>\n                                尺寸 : 22 x 8 x 12m\n                        </p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/山形誌1.jpg\" data-fancybox=\"images\" data-caption=\"山．形．誌\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/山形誌1.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/山形誌2.jpg\" data-fancybox=\"images\" data-caption=\"山．形．誌\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/山形誌2.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n        </div>\n\n\n        <div class=\"art_title\">作品名 : 光牆 Light Wall</div>\n        <div class=\"art_smfont\">作者 : 克里斯‧伍德 Chirs Wood</div>\n        <div class=\"art_line\"></div>\n\n        <div class=\"row rw_bm lt_mb\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\"><光牆>提供觀者一個享受光、色彩及其周遭環境相互運作的過程，作品經光源透射後，產生多變的彩色光線，為屋頂天花、會場外的牆面、旅人行經的長廊及戶外花園，增添絢爛繽紛的流動光彩。從不同角度觀看作品，便能欣賞到多方位的光束組合與顏色，如此充滿多彩光線的環境，使人感到溫暖、療癒，甚至提奮心情，賦予民眾對環境一個全新的感受。作品以不同的排列組合各設置於南北兩側玻璃帷幕上，增加了視覺上的對比與趣味性，如此不但豐富七樓屋頂平台的休憩空間，更創造獨一無二的美感經驗。</p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                                材質 : 分色玻璃 Dichroic glass<br>\n                                年份 : 2018<br>\n                                尺寸 : 單片分色玻璃 20x96cm 厚0.6cm\n                        </p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/lightwall1.jpg\" data-fancybox=\"images\" data-caption=\"光牆 Light Wall\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/lightwall1.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n\n                        <a href=\"images/lightwall2.jpg\" data-fancybox=\"images\" data-caption=\"光牆 Light Wall\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/lightwall2.jpg);\" alt=\"\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n        </div>\n<!--2館-->\n</div>\n";

////// text!src/template/about/arts/1.html (rvalue)
module[131]="<div class=\"for_hall_1\">\n<!--1館-->\n<div class=\"art_title\">作品名 : 四季之歌</div>\n                <div class=\"art_smfont\"></div>\n                <div class=\"art_line\"></div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                            春，喚醒了露珠中沉睡的精靈，如彩蝶翩翩穿梭嫩芽新綠間，搖起片片飛絮漫舞風中。\n                            夏雷如雄獅吼出牠的熱情，金色光芒飛奔蔚藍天際，隆隆高歌生命無限。\n                            秋風翦翦吹來清涼，翻動詩篇蕭索如落葉沙沙，在水晶般透明的秋氣中。\n                            冬之聖堂管風琴合唱起讚美歌，詠嘆生命美好，祈禱聲中似聞嬰兒伊呀，見證了另一個生命的起始。\n                            長廊上的彩色玻璃以脈搏般的節奏，伴隨光效的拍子，引導人們用自然的步伐，走過春夏秋冬四季更替的生命之旅。\n                        </p>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/art_5.jpg\" data-fancybox=\"images\" data-caption=\"四季之歌\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/art_5.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n\n                </div>\n\n\n\n                <div class=\"art_title\">作品名 : 生命之舞</div>\n                <div class=\"art_smfont\"></div>\n                <div class=\"art_line\"></div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                            四季默默執著人們的手，心聲流洩如跳躍的音符，譜出曼波韻律。\n呼應四季時空長廊，七彩斑爛大小不一的圓，有如活躍生命體，由大門處湧入大廳，準備跳一場華麗的圓舞曲。\n以彩色窯燒玻璃製作的圓，層層重疊出無數七彩光環，高高低低懸吊於天花板。特殊吊掛方法，提供一定程度的波動空間。\n經由IC電腦控制，所有的圓，能集體構成波紋狀擴散發光，像深海魚類的生物電能，合作構成組織嚴密的韻律，踏踏踏地攜手跳出歡愉的生命之舞。\n                        </p>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/art_4.jpg\" data-fancybox=\"images\" data-caption=\"生命之舞\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/art_4.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n\n                </div>\n\n\n\n                <div class=\"art_title\">作品名 : 思考之間</div>\n                <div class=\"art_smfont\"></div>\n                <div class=\"art_line\"></div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                            由三角型不鏽鋼柱排成，每邊9公尺的兩只虛實方體，方體間隔遙遙相對，兩方體間以十二個自然形成的紋石排列串聯，巨石經過程度不一的切割貫穿出「虛」的空間，象徵一個念到另一個念之間，有無限的可能。人們在這些空間穿梭巡遊，並思考著文明世界與自然世界的關係。\n人的思考是追求突破提升層次，而思考不是單向的，一個分叉到另一分叉，永遠有兩種以上的選擇。意念的生滅起落，即無窮盡的時空展延。\n不鏽鋼柱朝內一面與巨石切割之地面，以強化玻璃內襯光膜造影，內部並以LED排列，在柱身及地面上呈現抽象式表現，時而表現人類文明發展中的符號與快慢的速度，時而又如自然生物般呼吸著。自然表徵的石頭，象徵文明科技源於自然，也將回歸於與自然。\n                        </p>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/art_2.jpg\" data-fancybox=\"images\" data-caption=\"思考之間\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/art_2.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n\n                </div>\n\n\n\n\n                <div class=\"art_title\">作品名 : 物我無限</div>\n                <div class=\"art_smfont\"></div>\n                <div class=\"art_line\"></div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                            九在東方是很神奇的數字，九九連環有無限的組合，九九歸一又回到初始的圓滿狀態。物我無限的九根三角柱由大地隆起，象徵人類科學始於自然，自然微笑地托起文明，也安慰人類空虛的心靈。\n白天在燦爛的陽光下，三角柱的鏡面不鏽鋼反射出周遭環境過往人潮的疊疊幢影；夜晚日落時分，鏡面的電子顯示屏將閃爍起色彩繽紛、帶有人工生命機制的「晶靈」立體互動動畫。\n在這九根三角柱，設置了高科技互動影像裝置，透過電腦與感應系統，電子顯示屏的「晶靈」會隨著自然界裡的時序與光線而遞變，同時也會與現場觀眾的遠近距離，產生即時的互動變化。科技藝術營造了人與自然的第三類接觸，創造了影像互動的驚奇。無論白晝或黑夜，每分或每秒的演化，亦即時傳播到館內的螢幕屏上，讓館內的觀眾能同步且完整的觀賞到九根三角柱的「晶靈」動畫作品全貌。\n                        </p>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/art_1.jpg\" data-fancybox=\"images\" data-caption=\"物我無限\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/art_1.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n\n                </div>\n\n\n\n                <div class=\"art_title\">作品名 : 天人境界</div>\n                <div class=\"art_smfont\"></div>\n                <div class=\"art_line\"></div>\n\n                <div class=\"row rw_bm\">\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                            文明得到生命的甘泉，滋養了空洞的靈魂，於是歡欣踏出節奏美妙的步伐。\n此處裝置了二只巨大的手，一手指地一手朝天，手指相接處，即天人臨界，彩環代表無窮無盡，無限展延。天人界面，可以遠兆億公里隔萬年時空，窮畢生之力而無一厘之寸功。也可碧落黃泉思路無阻無滯，百代千秋神遊太虛彈指而至。\n以九環相疊之彩色窯燒玻璃，區隔自然的世界與文明的世界。此界面與「思考之間」、「物我無限」等高度，其色彩圓形又與四季之歌生命之舞同節拍，為整個構思詮釋了最佳句點。\n有人瞬間而頓悟，有人遺響於悲風，答案何其紛紛，惟文明對自然充分理解與協調，文明本身方能展延至無盡。\n                        </p>\n                    </div>\n                    <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/art_3.jpg\" data-fancybox=\"images\" data-caption=\"天人境界\">\n                            <div class=\"about_boderpic\" style=\"background-image:url(images/art_3.jpg);\" alt=\"\">\n                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                            </div>\n                        </a>\n                    </div>\n\n                </div>\n\n\n\n\n\n<!--1館-->\n</div>\n";

////// text!src/template/about/arts.html (rvalue)
module[132]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">公共藝術</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n</div>\n";

////// text!src/template/about/floors/2.html (rvalue)
module[133]="<div class=\"for_hall_2\">\n        <div class=\"aboutpic\">\n        <a href=\"images/2hall_3d.jpg\" data-fancybox=\"images\" data-caption=\"2館\">\n                <img src=\"images/2hall_3d.jpg\" alt=\"\">\n        </a>\n        </div>\n</div>\n";

////// text!src/template/about/floors/1.html (rvalue)
module[134]="<div class=\"for_hall_1\">\n        <div class=\"aboutpic\">\n        <a href=\"images/1hall_3ds.jpg\" data-fancybox=\"images\" data-caption=\"1館\">\n                <img src=\"images/1hall_3ds.jpg\" alt=\"\">\n        </a>\n        </div>\n</div>\n";

////// text!src/template/about/floors.html (rvalue)
module[135]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">樓層立體圖</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <ul class=\"hall_tab\">\n                <menu-item v-for='(item, i) in menu.item' :active-class='[\"active\",\"active2\"][i]' :key=i :item=item class=mr-0.5 />\n        </ul>\n        <router-view />\n        <!-- <div class=\"news_wrap\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-4 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>2館-1F立體圖</li>\n                                </ul>\n                                <a href=\"images/h2_1f.jpg\" data-fancybox=\"images\" data-caption=\"2館-1F立體圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/h2_1f.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-4 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>2館-4F立體圖</li>\n                                </ul>\n                                <a href=\"images/h2_4f.jpg\" data-fancybox=\"images\" data-caption=\"2館-4F立體圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/h2_4f.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n                        <div class=\"live_box col-4 col-md-4 col-lg-4\">\n                                <ul class=\"onder_list_title\">\n                                        <li>2館-7F立體圖</li>\n                                </ul>\n                                <a href=\"images/h2_7f.jpg\" data-fancybox=\"images\" data-caption=\"2館-7F立體圖\">\n                                        <div class=\"about_boderpic\" style=\"background-image:url(images/h2_7f.jpg);\" alt=\"\">\n                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                        </div>\n                                </a>\n                        </div>\n\n\n                </div>\n\n</div> -->\n\n\n</div>\n";

////// text!src/template/about/introduction.html (rvalue)
module[136]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">展館介紹</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <div class=\"aboutpic\">\n                <a href=\"images/about1.jpg\" data-fancybox=\"images\" data-caption=\"1館\">\n                <img src=\"images/about1.jpg\" alt=\"\">\n                </a>\n        </div>\n        <div class=\"onder_title\">1館-關於展館</div>\n\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t96年7月底完工、97年3月13日正式營運的台北南港展覽1館，為一擁有上、下層展廳、計可規劃2,467個標準攤位的大型專業展覽館，不但展示面積為台北世貿展覽大樓的兩倍大，其所擁有的13間會議室(可彈性隔間為19間)、2間餐廳及9間面對馬路的商店，均將提供使用者更為人性化及便利性的服務與設施。\n\t\t\t\t\t\t\t<br><br>\n\t\t\t\t\t\t\t台北南港展覽館1館的上層雲端展場屋頂跨距達126 x 180公尺，淨高14.3~27.3公尺，全區無柱位，適合在展覽空檔期間舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會、運動賽事及公司餐會(含尾牙、春酒)等。為打造國際級、一流的會展空間，貿協已針對南港展覽館的特性，增設多項營運設備，包括多國語言的展場指標及線上導覽系統、全館無線上網等。\n\t\t\t\t\t\t\t<br><br>\n\t\t\t\t\t\t\t台北南港展覽館1館的啟用，已帶動南港經貿園區的整體開發，並對我國經濟產值帶來顯著的貢獻。貿協也將更努力提升我國會展產業的產值，除積極規劃辦理新展外， 60個海外辦事處也將進行全球行銷，積極爭取國外展覽公司來台辦展，讓臺灣會展產業在國際間持續發光發熱。\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<div class=\"onder_title\">綠色展館</div>\n\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t台北南港展覽館1館的綠色環保措施\n\t\t\t\t\t\t\t南港1館基於愛護自然環境，積極取得臺灣第一座綠建築標章的展覽館，也是臺灣第一個依照國際標準完成温室氣體查證的場館，以實際行動支持政府推動節能減碳政策方針，從掌握場館碳排放到綠色環保營運及多項綠色環保措施，期待與業界及訪客共同攜手創造永續環境。\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t<li>綠建築標章：</li>\n\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t南1館通過「基地綠化」、「基地保水」、「日常節能」、「二氧化碳減量」、「室內環境」、「水資源」、「污水垃圾改善」等7項指標，獲內政部頒發綠建築標章。\n\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t\t<li>碳盤查：</li>\n\t\t\t\t\t\t\t<p class=\"aboutcontent\">\n\t\t\t\t\t\t\t\t南1館於2009及2011年依照國際標準完成溫室氣體排放量查證，並取得英國標準協會 (The British Standards Institution, BSI) ISO 14064-1碳盤查認證。\n\t\t\t\t\t\t\t</p>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t<li>綠色營運：</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t<ul class=\"onder_dotelist fontbox_mg\">\n\t\t\t\t\t\t\t<li>展覽期間鼓勵展覽主辦單位展場走道不鋪設地毯。</li>\n\t\t\t\t\t\t\t<li>鼓勵參展廠商及設計業者，減少木作裝潢，採重覆使用之系統攤位，減少製造裝潢廢棄物，同時達到資源重複利用(Reuse)及循環使用(Recycle)的節能環保概念。</li>\n\t\t\t\t\t\t\t<li>南1館部分紙類宣傳品採雙面印刷。</li>\n\t\t\t\t\t\t\t<li>於館內廊道多處放置資源回收桶。</li>\n\t\t\t\t\t\t\t<li>於B1用餐區放置廚餘回收桶。</li>\n\t\t\t\t\t\t\t<li>全館洗手間馬桶及小便斗沖水使用雨水回收水。</li>\n\t\t\t\t\t\t\t<li>洗手間裝設感應式水龍頭，降低洗手用水。</li>\n\t\t\t\t\t\t\t<li>設置冷熱水飲水機取代塑膠杯水或瓶裝水。</li>\n\t\t\t\t\t\t\t<li>非展覽/活動期間不開啟電扶梯，僅以電梯載客。</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t<div class=\"row fontbox_mg\">\n\t\t\t\t\t\t\t<div class=\"col-4 col-md-4 col-lg-4\">\n\t\t\t\t\t\t\t\t<a href=\"images/green.jpg\" data-fancybox=\"images\" data-caption=\"\">\n\t\t\t\t\t\t\t\t\t<div class=\"about_boderpic\" style=\"background-image:url(images/green.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t<div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-4 col-md-4 col-lg-4\">\n\t\t\t\t\t\t\t\t<a href=\"images/about3.jpg\" data-fancybox=\"images\" data-caption=\"\">\n\t\t\t\t\t\t\t\t\t<div class=\"about_boderpic\" style=\"background-image:url(images/about3.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t<div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"col-4 col-md-4 col-lg-4\">\n\t\t\t\t\t\t\t\t<a href=\"images/about4.jpg\" data-fancybox=\"images\" data-caption=\"\">\n\t\t\t\t\t\t\t\t\t<div class=\"about_boderpic\" style=\"background-image:url(images/about4.jpg);\" alt=\"\">\n\t\t\t\t\t\t\t\t\t\t<div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<ul class=\"onder_list_title\">\n\t\t\t\t\t\t\t<li>綠色內部管理：</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t<div class=\"fontbox_mg\">\n\t\t\t\t\t\t\t<ul class=\"onder_dotelist\">\n\t\t\t\t\t\t\t\t<li>利用電子郵件發送會展相關訊息，並以EDM進行市場推廣。利用電子郵件發送會展相關訊息，並以EDM進行市場推廣。</li>\n\t\t\t\t\t\t\t\t<li>員工申請假期、社團以網路申請，減少紙張用量。</li>\n\t\t\t\t\t\t\t\t<li>員工電腦強制設定為黑白雙面列印，重要文件才以彩色列印。</li>\n\t\t\t\t\t\t\t\t<li>於員工辦公室內設置「資源回收專區」，進行瓶罐、廢電池、紙類等回收。</li>\n\t\t\t\t\t\t\t\t<li>辦公室內放置背面空白回收紙專區，非重要文件以回收紙列印。</li>\n\t\t\t\t\t\t\t\t<li>員工開會皆自備茶水杯。</li>\n\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t</div>\n                        <div class=\"aboutpic\">\n                        <a href=\"images/about5.jpg\" data-fancybox=\"images\" data-caption=\"2館\">\n                        <img src=\"images/about5.jpg\" alt=\"\">\n                        </a>\n                    </div>\n\n                    <div class=\"onder_title\">2館-關於展館</div>\n                    <p class=\"aboutcontent\">\n                        台北南港展覽2館於107年8月完工、108年3月4日正式營運，擁有雙層展廳(1F 、 4F) ，全館可規劃之室內攤位數2044格，展示面積為台北世貿展覽大樓的1.5倍，全台獨有的多功能活動空間可容3,200人，室內空間 3,880㎡ ， 可依客製化隔出9種尺寸的隔間，餐飲空間設有3樓餐廳可容500人及B1商店街， 停車場設有汽車格1,296位、大型巴士可容32輛、機車格1,136格，提供來賓更便利及舒適的服務與設施。\n                        <br><br>\n                        台北南港展覽館2館一樓展覽空間挑高12公尺，四樓展覽空間挑高9公尺，適合舉辦大型演唱會、直銷會議、獎勵旅遊、宗教集會及公司餐會(含尾牙、春酒)等。打造國際級規格展覽館，貿協已針對使用者需求增設多項營運設備。\n                        <br><br>\n                        台北南港展覽館2館的落成為會展產業注入新能量，藉此帶動南港經貿園區的區域發展，並對我國經濟產值帶來顯著的貢獻。貿協持續注入新血以提升我國會展產業的價值，近年來積極規劃及爭取辦理國內外新展外，放眼全球並參與國外會展產業的展覽，主動邀約國外展覽公司來台辦展，讓臺灣會展產業在國際間能成為辦展第一首選場地。\n                    </p>\n\n                    <div class=\"onder_title\">綠色展館</div>\n\n                    <ul class=\"onder_list_title\">\n                        <li>綠色營運作為：</li>\n                        <p class=\"aboutcontent\">\n                            除依台北南港展覽館1館綠色營運辦理外，台北南港展覽館2館另有下列綠色作為，以迎向國際環保節能潮流：\n                        </p>\n                    </ul>\n\n                    <ul class=\"onder_dotelist fontbox_mg\">\n                        <li>黃金級綠建築</li>\n                        <div class=\"aboutpic2\">\n                            <a href=\"images/黃金及綠建築證書.jpg\" data-fancybox=\"images\" data-caption=\"黃金及綠建築證書\">\n                            <img src=\"images/黃金及綠建築證書.jpg\" alt=\"\">\n                            </a>\n                        </div>\n                        <li>電動充電站共11座</li>\n                        <li>推行「數位化360度導覽」，利用線上導覽，減少客戶來館碳足跡。</li>\n                        <li>鼓勵客戶使用數位化電子看板，減少大型廣告看板輸出。</li>\n                        <li>電動垃圾清運車</li>\n                        <li>採購館內物品優先選用環境友善產品。</li>\n                    </ul>\n\n\n</div>\n";

////// text!src/template/about/operator.html (rvalue)
module[137]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">經營者</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n        <div class=\"aboutpic\">\n                <a href=\"images/about_taitra_cn.jpg\" data-fancybox=\"images\" data-caption=\"About TAITRA\">\n                <img src=\"images/about_taitra_cn.jpg\" alt=\"\">\n                </a>\n        </div>\n        <div class=\"onder_title\">10大核心服務</div>\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"fontbox_mg\">\n                        <ul class=\"onder_dotelist\">\n                        <li>拓銷全球市場</li>\n                        <li>推廣服務業貿易</li>\n                        <li>培訓國際企業人才</li>\n                        <li>推動國際經貿聯繫</li>\n                        <li>辦理台灣國際專業展</li>\n                        </ul>\n                        </div>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <div class=\"fontbox_mg\">\n                                <ul class=\"onder_dotelist\">\n                                        <li>提升臺灣產業形象</li>\n                                        <li>提供市場研析及商情</li>\n                                        <li>加強數位及電商行銷</li>\n                                        <li>運用大數據發掘商機</li>\n                                        <li>營運展覽館及會議中心</li>\n                                </ul>\n                        </div>\n                </div>\n        </div>\n\n\n        <div class=\"row rw_bm\">\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <p class=\"aboutcontent\">\n                                係由中華民國政府於民國59年7月1日結合民間 工商團體，所組成之非營利性財團法人，成立宗旨係協助業界發展我國之對外貿易。\n<br><br>\n為臺灣最重要的貿易推廣機構，係由經濟部結合民間工商團體成立之公益性財團法人，以協助業者拓展對外貿易為設立宗旨。目前，本會擁有1,300多位海內外專業經貿人員，除台北總部外，設有桃園、新竹、台中、台南及高雄等5個國內辦事處和遍佈全球各地61個海外據點，形成完整的貿易服務網，提供零時差、無國界的即時服務，持續與廠商共同追求台灣經濟的穩健發展，是業者拓展貿易的最佳夥伴。\n<br><br>\n為強化跨領域整合創新，本會重新定位為國際鏈結智慧整合中心(smart integrator)，結合法人、大學、觀光、展會、城市、公協會、海外台商，為業者開發國際市場、進行國際合作、連接國際網絡，提供整合性服務。\n\n                        </p>\n                </div>\n                <div class=\"col-12 col-md-6 col-lg-6\">\n                        <a href=\"images/DJI_0933.jpg\" data-fancybox=\"images\" data-caption=\"\">\n                                <div class=\"about_boderpic\" style=\"background-image:url(images/DJI_0933.jpg)\">\n                                        <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div>\n                                </div>\n                        </a>\n                </div>\n\n        </div>\n\n\n\n\n\n\n</div>\n";

////// ls!src/content-page (sdefine)
load(138,[139,160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/content-page.html', 'ls!is-en'], function(tmpl, isEn){
    var routeConfig;
    routeConfig = void 8;
    return {
      template: tmpl,
      props: ['route-config'],
      computed: {
        homeLabel: function(){
          return this.routeConfig[0].label;
        },
        title: function(){
          var i$, ref$, len$, item, ref1$;
          for (i$ = 0, len$ = (ref$ = this.menu.item).length; i$ < len$; ++i$) {
            item = ref$[i$];
            if ('' !== ((ref1$ = item.activeFullPath) != null
              ? ref1$
              : item.fullPath)) {
              if (0 === this.$route.path.indexOf((ref1$ = item.activeFullPath) != null
                ? ref1$
                : item.fullPath)) {
                return item.label;
              }
            }
          }
          return '';
        },
        breadCrumb: function(){
          var menu, out, found, i$, ref$, len$, i, item, ref1$, j$, len1$, j, g, k$, len2$, elem, that, ref2$, groupLabel, groupLabelEn, label;
          menu = this.menu;
          out = [];
          while (true) {
            found = false;
            for (i$ = 0, len$ = (ref$ = menu.item || (menu.item = [])).length; i$ < len$; ++i$) {
              i = i$;
              item = ref$[i$];
              if ('' !== ((ref1$ = item.activeFullPath) != null
                ? ref1$
                : item.fullPath)) {
                if (/\d/.exec(item.label) && !/\d\d/.test(item.label)) {
                  continue;
                }
                if (0 === (this.$route.path + "/").indexOf(((ref1$ = item.activeFullPath) != null
                  ? ref1$
                  : item.fullPath) + "/")) {
                  if (menu.group != null) {
                    for (j$ = 0, len1$ = (ref1$ = menu.group).length; j$ < len1$; ++j$) {
                      j = j$;
                      g = ref1$[j$];
                      if (g instanceof Array) {
                        for (k$ = 0, len2$ = g.length; k$ < len2$; ++k$) {
                          elem = g[k$];
                          if (that = elem === i && /(.*?)\|(.*)/.exec(menu.group[j - 1])) {
                            ref2$ = [that[1], that[2]], groupLabel = ref2$[0], groupLabelEn = ref2$[1];
                            label = isEn ? groupLabelEn : groupLabel;
                            out.push({
                              label: label,
                              fullPath: item.fullPath
                            });
                          }
                        }
                      }
                    }
                  }
                  out.push(item);
                  menu = item;
                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              return out;
            }
          }
        },
        labelItem: function(){
          var i$, ref$, len$, item1, ref1$, j$, len1$, item2, ref2$;
          for (i$ = 0, len$ = (ref$ = this.menu.item).length; i$ < len$; ++i$) {
            item1 = ref$[i$];
            if (0 === this.$route.path.indexOf((ref1$ = item1.activeFullPath) != null
              ? ref1$
              : item1.fullPath)) {
              for (j$ = 0, len1$ = (ref1$ = item1.item || (item1.item = [])).length; j$ < len1$; ++j$) {
                item2 = ref1$[j$];
                if (0 === this.$route.path.indexOf((ref2$ = item2.activeFullPath) != null
                  ? ref2$
                  : item2.fullPath)) {
                  return item2;
                }
              }
              return item1;
            }
          }
          return {
            label: ''
          };
        }
      }
    };
  });
}).call(this);
});

////// text!src/template/content-page.html (rvalue)
module[139]="<section>\n        <div class=\"page_banner\">\n                <div class=\"page_bn_title\">{{title}}</div>\n        </div>\n        <div class=\"container index_wrapper\">\n                <div class=\"bread_crumb mg_top\">\n                        <ul>\n                                <li><router-link to=/ >{{homeLabel}}</router-link></li>\n                                <template v-for='(_,i) in breadCrumb'>\n                                  <li>/</li>\n                                  <li v-if='i&lt;breadCrumb.length-1 || $route.path.match(/^(\\/news\\/news|\\/event)\\/\\d+$/)'><router-link :to=_.defaultFullPath||_.fullPath>{{_.label}}</router-link></li>\n                                  <li v-else class=bread_active>{{_.label}}</li>\n                                </template>\n                        </ul>\n                </div>\n                <router-view />\n        </div>\n</section>\n";

////// ls!src/index (sdefine)
load(140,[159,157,145,143,160,153],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['text!template/index.html', 'ls!fmt-date-range', 'ls!d2', 'ls!ajax', 'ls!is-en', 'ls!event-normalize'], function(tmpl, fmtDateRange, d2, ajax, isEn, eventNormalize){
    return {
      template: tmpl,
      data: function(){
        return {
          hall: 0,
          eventList: [void 8, [], [], []],
          newsList: [],
          banner: [],
          playing: false,
          muted: false,
          swiper: void 8,
          swiperActiveIndex: 0,
          popupwin: void 8
        };
      },
      computed: {
        exhibition: function(){
          var out, res$, i$, ref$, len$, ev;
          if (this.hall) {
            res$ = [];
            for (i$ = 0, len$ = (ref$ = this.eventList[1]).length; i$ < len$; ++i$) {
              ev = ref$[i$];
              if (ev.hall & this.hall) {
                res$.push(ev);
              }
            }
            out = res$;
            return out.slice(0, 4);
          } else {
            return this.eventList[1].slice(0, 4);
          }
        },
        swiperIndices: function(){
          var i$, to$, results$ = [];
          for (i$ = 0, to$ = this.banner.length; i$ <= to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }
      },
      methods: {
        fmtDateRange: fmtDateRange,
        fmtDate: function(it){
          var d;
          d = new Date(it * 1000);
          return d.getFullYear() + "/" + d2(d.getMonth() + 1) + "/" + d2(d.getDate());
        },
        toggleHall: function(hall){
          if (this.hall === hall) {
            this.hall = 0;
          } else {
            this.hall = hall;
          }
        },
        fetch: function(){
          var this$ = this;
          ajax.get('/2021/api/event', function(it){
            var i$, category, ref$, len$, elem, ref1$, key$;
            if (it != null && it.list) {
              for (i$ = 1; i$ <= 3; ++i$) {
                category = i$;
                this$.eventList[category].splice(0, this$.eventList[category].length);
              }
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                elem = ref$[i$];
                eventNormalize(elem);
                if (elem.photo_size) {
                  elem.photo = "/2021/api/event/" + elem.id + ".jpg";
                } else {
                  elem.photo = "images/event-default-" + elem.hall + ".jpg";
                }
                ((ref1$ = this$.eventList)[key$ = elem.category] || (ref1$[key$] = [])).push(elem);
              }
            }
          });
          ajax.get('/2021/api/news', function(it){
            var res$, i$, ref$, len$, item, that;
            if (it != null && it.list) {
              res$ = [];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                item = ref$[i$];
                if (isEn && item.title_en || !isEn && item.title) {
                  if (isEn) {
                    if (that = item.title_en) {
                      item.title = that;
                    }
                    if (that = item.content_en) {
                      item.content = that;
                    }
                  }
                  res$.push(item);
                }
              }
              this$.newsList = res$;
              this$.newsList = this$.newsList.slice(0, 5);
            }
          });
          ajax.get('/2021/api/banner', function(it){
            var bannerList, i$, ref$, len$, banner;
            if (it != null && it.list) {
              this$.swiper = void 8;
              bannerList = [];
              for (i$ = 0, len$ = (ref$ = it.list).length; i$ < len$; ++i$) {
                banner = ref$[i$];
                if (!banner.hide) {
                  if (isEn && banner.webpage_en) {
                    banner.webpage = banner.webpage_en;
                  }
                  bannerList.push(banner);
                }
              }
              this$.banner = bannerList;
            }
          });
          ajax.get('/2021/api/banner-popupwin', function(it){
            if (it != null && it.popupwin) {
              if (it.popupwin.show) {
                this$.popupwin = it.popupwin;
              } else {
                this$.popupwin = void 8;
              }
            }
          });
        },
        play: function(){
          this.$refs.bannerVideo.play();
        },
        pause: function(){
          this.$refs.bannerVideo.pause();
        },
        togglePlay: function(){
          if (this.playing) {
            this.pause();
          } else {
            this.play();
          }
        },
        toggleMute: function(){
          this.$refs.bannerVideo.muted = this.muted = !this.muted;
        },
        swiperGo: function(it){
          var i$, ref$, len$, i, slide;
          if (this.swiper) {
            this.swiper.slideTo(it, 500);
          } else {
            this.swiperActiveIndex = it;
            for (i$ = 0, len$ = (ref$ = document.querySelectorAll('.swiper-slide')).length; i$ < len$; ++i$) {
              i = i$;
              slide = ref$[i$];
              if (it === i) {
                slide.style.display = '';
              } else {
                slide.style.display = 'none';
              }
            }
          }
        }
      },
      mounted: function(){
        var this$ = this;
        this.$refs.bannerVideo.addEventListener('play', function(){
          this$.playing = true;
          this$.swiper.autoplay.stop();
        });
        this.$refs.bannerVideo.addEventListener('pause', function(){
          this$.player = false;
          this$.swiper.autoplay.start();
        });
        this.$refs.bannerVideo.addEventListener('ended', function(){
          this$.playing = false;
          this$.swiper.autoplay.start();
        });
        this.fetch();
      },
      updated: function(){
        var ref$, this$ = this;
        if (!this.swiper) {
          try {
            this.swiper = new Swiper(this.$refs.bannerSwiper, {
              autoplay: {
                delay: 5000,
                disableOnInteraction: false
              },
              on: {
                activeIndexChange: function(it){
                  this$.swiperActiveIndex = it.realIndex;
                }
              }
            });
          } catch (e$) {}
        }
        if ((ref$ = this.popupwin) != null && ref$.show) {
          this.popupwin.show = false;
          $.fancybox.open($('#index-popwin'));
        }
      }
    };
  });
}).call(this);
});

////// ls!src/build-route (sdefine)
load(141,[160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  var replace$ = ''.replace;
  define(['ls!is-en'], function(isEn){
    var core;
    core = function(config, loadedList, path, realPath, out, globalOut){
      var i$, len$;
      for (i$ = 0, len$ = config.length; i$ < len$; ++i$) {
        (fn$.call(this, i$, config[i$]));
      }
      return out;
      function fn$(i, elem){
        var that, tmpl, comp, elemPath, elemRealPath, child, ref$, ref1$;
        if (that = isEn && elem.labelEn) {
          elem.label = that;
        }
        if (elem.tmpl != null || elem.group != null) {
          tmpl = loadedList.shift();
        }
        comp = loadedList.shift();
        elem.fullPath = elemPath = (that = elem.path) != null ? path + "/" + that : path;
        if (that = elem.defaultPath) {
          elem.defaultFullPath = path + "/" + that;
        }
        if (elem.path && elem.activePath == null) {
          elem.activePath = elem.path[0] === ':'
            ? ''
            : replace$.call(elem.path, /\/:.*/, '');
        }
        if (elem.activePath != null) {
          if (that = elem.activePath) {
            elem.activeFullPath = path + "/" + that;
          } else {
            elem.activeFullPath = path;
          }
        }
        elemRealPath = (that = /:(.*)/.exec(elem.path))
          ? realPath + "/" + i + "/:" + that[1]
          : realPath + "/" + i;
        child = [];
        if ((that = elem.item) != null) {
          core(that, loadedList, elemPath, elemRealPath, child, globalOut);
        }
        if (tmpl != null) {
          comp = (ref$ = clone$(comp), ref$.template = tmpl, ref$.computed = (ref1$ = clone$(comp.computed || (comp.computed = {})), ref1$.menu = function(){
            return elem;
          }, ref1$), ref$);
        } else {
          (comp.computed || (comp.computed = {})).menu = function(){
            return elem;
          };
        }
        out.push({
          path: (that = /:(.*)/.exec(elem.path))
            ? i + "/:" + that[1]
            : i + "",
          component: comp
        });
        if (child.length) {
          out[out.length - 1].children = child;
        }
        if (elem.path != null) {
          out[out.length - 1].alias = elemPath;
        }
        if ((that = elem.redir) != null) {
          globalOut.push({
            path: elemPath,
            redirect: elemPath + "/" + that
          });
        }
      }
    };
    return function(config, loadedList){
      var routes, i$, len$, r;
      routes = [];
      routes = core(config, loadedList, '', '', routes, routes);
      for (i$ = 0, len$ = routes.length; i$ < len$; ++i$) {
        r = routes[i$];
        if (r.path[0] !== '/') {
          r.path = '/' + r.path;
        }
      }
      return routes;
    };
  });
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
}).call(this);
});

////// ls!src/ajax (sdefine)
load(143,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    var req, cache;
    req = function(method, url, body, cb, uploadProgressCb){
      var x$, y$;
      x$ = new XMLHttpRequest;
      x$.onreadystatechange = function(){
        var res, e;
        if (this.readyState === 4) {
          this.onreadystatechange = function(){};
          if (cb) {
            try {
              res = JSON.parse(this.responseText);
            } catch (e$) {
              e = e$;
              cb(this.responseText);
              return;
            }
            cb(res);
          }
        }
      };
      if (uploadProgressCb) {
        y$ = x$.upload;
        y$.onloadstart = function(it){
          uploadProgressCb(it.loaded, it.total);
        };
        y$.onprogress = function(it){
          uploadProgressCb(it.loaded, it.total);
        };
        y$.onloadend = function(it){
          uploadProgressCb(it.loaded, it.total);
        };
      }
      x$.open(method, url);
      x$.send(body);
    };
    cache = {};
    return {
      get: function(url, cb){
        req('GET', url, void 8, function(it){
          if (cache[url]) {
            cache[url] = it;
          }
          if (cb) {
            cb(it);
          }
        });
      },
      'delete': function(url, cb){
        req('DELETE', url, void 8, cb);
      },
      post: function(url, params, cb){
        if ('string' !== typeof params) {
          params = JSON.stringify(params);
        }
        req('POST', url, params, cb);
      },
      put: function(url, params, cb){
        var x$, formData, key, value;
        x$ = formData = new FormData;
        for (key in params) {
          value = params[key];
          x$.append(key, value);
        }
        req('PUT', url, formData, cb);
      },
      getCache: function(url, cb){
        var that;
        if (that = cache[url]) {
          cb(that);
        } else {
          req('GET', url, void 8, function(it){
            cache[url] = it;
            if (cb) {
              cb(it);
            }
          });
        }
      },
      putProgress: function(url, params, progressCb, cb){
        var x$, formData, key, value;
        x$ = formData = new FormData;
        for (key in params) {
          value = params[key];
          x$.append(key, value);
        }
        req('PUT', url, formData, cb, progressCb);
      }
    };
  });
}).call(this);
});

////// ls!src/is-en (sdefine)
load(160,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    if (/^\/(2021(-dev)?\/)?en\//.exec(location.pathname)) {
      return true;
    } else {
      return false;
    }
  });
}).call(this);
});

////// ls!src/d2 (sdefine)
load(145,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    return function(n){
      if (n < 10) {
        return "0" + n;
      } else {
        return n + "";
      }
    };
  });
}).call(this);
});

////// text!src/template/news/photo.html (rvalue)
module[146]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">展館照片</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n\n    <ul class=\"hall_tab\">\n        <router-link :to='\"/news/photo/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n          <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n        </router-link>\n    </ul>\n    <div class=\"news_wrap\">\n                                <div class=\"row fontbox_mg\">\n                                        <div class=\"live_box col-6 col-md-4 col-lg-4\" v-for='_ in list'>\n                                                <a v-if=_.photo_url :href=_.photo_url data-fancybox=\"images\" :data-caption=_.title>\n                                                        <div class=\"press_boderpic\" :style='{backgroundImage:\"url(\"+_.cover_url+\")\"}'>\n                                                                        <ul class=\"press_bg\">\n                                                                                <li class=\"press_name\">{{_.title}}</li>\n                                                                                <li>{{fmtDate(_.time)}}</li>\n                                                                        </ul>\n                                                                <!-- <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" alt=\"\"></div> -->\n                                                        </div>\n                                                </a>\n                                        </div>\n                                </div>\n        <ul class=\"prev_btn onlinepage\">\n            <a href=\"#\" @click.prevent=go(page-1)><li>&lt; Prev</li></a>\n            <a href=\"#\" v-for='p in pages' @click.prevent=go(p)><li :class='{actvie:p==page}'>{{p}}</li></a>\n            <a href=\"#\" @click.prevent=go(page+1)><li>Next &gt;</li></a>\n        </ul>\n    </div>\n</div>\n";

////// text!src/template/news/news0.html (rvalue)
module[147]="<div>\n  <div class=\"line_top_title\">{{news.title}}</div>\n\n\n  <div class=\"title_line\">\n      <div class=\"blue_line\"></div>\n  </div>\n\n\n\n\n\n  <div class=\"new_wap\">\n      <div :class='{new_ed_list:news.hall==1,new_ed_list2:news.hall==2,new_ed_list3:news.hall==3}'>{{news.category==1?'新聞':'公告'}}</div>\n      <div class=\"new_ed_date\">發文日期：{{fmtDate(news.time)}}</div>\n      <div v-if=news.hall&amp;1 class=\"new_ed_hall blue\">1館</div>\n      <div v-if=news.hall&amp;2 class=\"new_ed_hall blue_d\">2館</div>\n  </div>\n  <div class=\"news_content\" v-html=news.content>\n\n  </div>\n\n  <div class=\"row prv\">\n      <div class=\"col-6 col-md-6 col-lg-6\" v-if=after>\n          <router-link :to='\"/news/news/\"+after.id'>\n              <div class=\"ns_prev\">\n                  <div class=\"prev_ic\">\n                      <img src=\"images/page1.svg\" alt=\"\"></div>\n              </div>\n              <div class=\"ns_prev2\">\n                  <ul>\n                      <li class=\"pr_L\">上一則新聞</li>\n                      <li class=\"newspoint goleft\">{{after.title}}</li>\n                  </ul>\n              </div>\n          </router-link>\n      </div>\n      <div class=\"col-6 col-md-6 col-lg-6\" v-if=before>\n          <router-link :to='\"/news/news/\"+before.id'>\n              <div class=\"ns_prev2\">\n                  <ul>\n                      <li class=\"pr_R\">下一則新聞</li>\n                      <li class=\"newspoint\">{{before.title}}</li>\n                  </ul>\n              </div>\n              <div class=\"ns_prev\">\n                  <div class=\"prev_ic\"><img src=\"images/page2.svg\" alt=\"\"></div>\n              </div>\n          </router-link>\n      </div>\n  </div>\n</div>\n";

////// text!src/template/news/download.html (rvalue)
module[148]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">圖檔下載專區</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n    <ul class=\"hall_tab\">\n        <router-link :to='\"/news/download/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n          <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n        </router-link>\n    </ul>\n\n    <div class=\"news_wrap\">\n                                <div class=\"row fontbox_mg\">\n                                        <div class=\"live_box col-6 col-md-4 col-lg-4\" v-for='_ in list'>\n\n                                                <a v-if=_.photo_url :href=_.photo_url data-fancybox=\"images\" :data-caption=_.title>\n                                                        <div class=\"about_boderpic\" :style='{backgroundImage:\"url(\"+_.cover_url+\")\"}'>\n                                                                <div class=\"zoomin_icon\"><img src=\"images/zoomin.svg\" :alt=_.title></div>\n                                                        </div>\n                                                </a>\n                                                <ul class=\"onder_list_title\">\n                                                        <li>{{_.title}}</li>\n                                                </ul>\n                                        </div>\n                                </div>\n        <ul class=\"prev_btn onlinepage\">\n            <a href=\"#\" @click.prevent=go(page-1)><li>&lt; Prev</li></a>\n            <a href=\"#\" v-for='p in pages' @click.prevent=go(p)><li :class='{actvie:p==page}'>{{p}}</li></a>\n            <a href=\"#\" @click.prevent=go(page+1)><li>Next &gt;</li></a>\n        </ul>\n    </div>\n</div>\n";

////// text!src/template/news/video.html (rvalue)
module[149]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n        <div class=\"line_top_title\">展館影音</div>\n        <div class=\"title_line\">\n                <div class=\"blue_line\"></div>\n        </div>\n\n        <ul class=\"hall_tab\">\n                <router-link :to='\"/news/video/\"+_' v-for='_ in [1,2]' :key=_ class=mr-0.5>\n                  <li :class='{active:_==1&&hall==_,active2:_==2&&hall==_}'>{{_}}館</li>\n                </router-link>\n        </ul>\n        <div class=\"news_wrap\">\n                <div class=\"row fontbox_mg\">\n                        <div class=\"live_box col-12 col-md-6 col-lg-6\" v-for='_ in list'>\n                                <div class=\"video_boderpic\">\n                                        <ul class=\"onder_list_title\">\n                                                <li>{{_.title}}</li>\n                                        </ul>\n                                        <a data-fancybox=\"\" :href=_.video_url>\n                                                <img :src=_.cover_url>\n                                                <div class=\"play_icon\"><img src=\"images/play2.svg\" alt=\"\"></div>\n                                        </a>\n                                </div>\n                        </div>\n                </div>\n                <ul class=\"prev_btn onlinepage\">\n                    <a href=\"#\" @click.prevent=go(page-1)><li>&lt; Prev</li></a>\n                    <a href=\"#\" v-for='p in pages' @click.prevent=go(p)><li :class='{actvie:p==page}'>{{p}}</li></a>\n                    <a href=\"#\" @click.prevent=go(page+1)><li>Next &gt;</li></a>\n                </ul>\n        </div>\n</div>\n";

////// text!src/template/news/news.html (rvalue)
module[150]="<div class=\"side_menucontent col-12 col-md-9 col-lg-9\">\n    <div class=\"line_top_title\">最新消息</div>\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n\n                        <!-- <ul class=\"news_tab\">\n                                <a href=\"#\"><li >新聞</li></a>\n                                <a href=\"#\"><li class=\"active2\">公告</li></a>\n                        </ul> -->\n\n\n    <div class=\"dropdown desa drsa_mg\" @click=dropdownToggle>\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" aria-expanded=\"false\">{{year}}</button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li v-for='y in years'><router-link class=\"dropdown-item\" :to='\"/news/news/\"+category+\"/\"+hall+\"/\"+y'>{{y}}</router-link></li>\n      </ul>\n    </div>\n\n    <div class=\"dropdown desa drsa_mg\" @click=dropdownToggle>\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" aria-expanded=\"false\">\n        {{hall==0?'館別':hall+'館'}}\n      </button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li><router-link class=\"dropdown-item\" :to='\"/news/news/\"+category+\"/0/\"+year'>全部</router-link></li>\n        <li><router-link class=\"dropdown-item\" :to='\"/news/news/\"+category+\"/1/\"+year'>1館</router-link></li>\n        <li><router-link class=\"dropdown-item\" :to='\"/news/news/\"+category+\"/2/\"+year'>2館</router-link></li>\n      </ul>\n    </div>\n\n                        <div class=\"dropdown desa drsa_mg\" @click=dropdownToggle>\n                          <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n                            {{category!=1?category!=2?'分類':'公告':'新聞'}}\n                          </button>\n                          <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n                                <li><router-link class=\"dropdown-item\" :to='\"/news/news/0/\"+hall+\"/\"+year'>全部</router-link></li>\n                                <li><router-link class=\"dropdown-item\" :to='\"/news/news/1/\"+hall+\"/\"+year'>新聞</router-link></li>\n                                <li><router-link class=\"dropdown-item\" :to='\"/news/news/2/\"+hall+\"/\"+year'>公告</router-link></li>\n                          </ul>\n                        </div>\n\n    <!-- <div class=\"dropdown desa drsa_mg\">\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n        類別\n      </button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li><a class=\"dropdown-item\" href=\"#\">新聞</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">公告</a></li>\n\n      </ul>\n    </div> -->\n\n\n\n\n\n\n\n\n\n    <div class=\"news_wrap\">\n        <div class=\"news_od\" v-for='_ in list'>\n            <div class=\"new_wap\">\n                <div :class='{new_ed_list:_.hall==1,new_ed_list2:_.hall==2,new_ed_list3:_.hall==3}'>{{_.category==1?'新聞':'公告'}}</div>\n                <div v-if=_.hall&amp;1 class=\"new_ed_hall blue\">1館</div>\n                <div v-if=_.hall&amp;2 class=\"new_ed_hall blue_d\">2館</div>\n                <div class=\"new_ed_date\">發文日期：{{fmtDate(_.time)}}</div>\n\n            </div>\n            <router-link :to='\"/news/news/\"+_.id'>\n                <div class=\"card-text-name\">{{_.title}}</div>\n                <p class=\"card-text-info\" v-html=deHtml(_.content)></p>\n                <div class=\"news_readmore\">繼續閱讀</div>\n            </router-link>\n        </div>\n\n\n        <!--\n        <ul class=\"prev_btn onlinepage\">\n            <a href=\"#\"><li>< Prev</li></a>\n            <a href=\"#\"><li class=\"actvie\">1</li></a>\n            <a href=\"#\"><li>2</li></a>\n            <a href=\"#\"><li>3</li></a>\n            <a href=\"#\"><li>4</li></a>\n            <a href=\"#\"><li>Next ></li></a>\n        </ul>\n        -->\n    </div>\n</div>\n";

////// ls!src/app-section-list (sdefine)
load(151,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    return [['申請相關文件', '進出場規範', '其他設施相關文件', '平面圖'], ['申請相關文件', '進出場規範', '其他設施相關文件', '平面圖'], ['200吋LED顯示屏', '電子看板', '臨時廣告物申請'], ['申請相關文件', '進出場規範', '其他設施相關文件', '平面圖'], ['申請相關文件', '外貿協會自辦展參展廠商職安管理辦法', '外貿協會場地借用單位職安管理辦法', '裝潢職安管理辦法'], ['Relevant Documents'], ['Relevant Documents'], ['Relevant Documents'], ['Relevant Documents'], ['Relevant Documents'], ['申請相關文件']];
  });
}).call(this);
});

////// ls!src/fmt-num (sdefine)
load(152,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    return function(it){
      return (it + "").replace(/(\d)(?=(\d\d\d)+$)/g, '$1,');
    };
  });
}).call(this);
});

////// ls!src/event-normalize (sdefine)
load(153,[160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!is-en'], function(isEn){
    return function(event){
      var i$, ref$, len$, f, that;
      event.id |= 0;
      if (isEn) {
        for (i$ = 0, len$ = (ref$ = ['title', 'title_over', 'content', 'location', 'location_over', 'organizer', 'organizer_over', 'webpage', 'webpage_over']).length; i$ < len$; ++i$) {
          f = ref$[i$];
          if (that = event[f + "_en"]) {
            event[f] = that;
          }
        }
      }
      for (i$ = 0, len$ = (ref$ = ['title', 'organizer', 'webpage', 'hall', 'location']).length; i$ < len$; ++i$) {
        f = ref$[i$];
        if (that = event[f + "_over"]) {
          event[f] = that;
        }
      }
    };
  });
}).call(this);
});

////// ls!src/website-link (sdefine)
load(154,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    return function(link){
      if (/(^|:)\/\//.exec(link)) {
        return link;
      } else {
        return "//" + link;
      }
    };
  });
}).call(this);
});

////// ls!src/day-name (sdefine)
load(155,[160],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!is-en'], function(isEn){
    if (isEn) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    } else {
      return '日一二三四五六';
    }
  });
}).call(this);
});

////// text!src/template/event0.html (rvalue)
module[156]="<div>\n          <div class=\"line_top_title\">{{event.title}}</div>\n          <div class=\"title_line\">\n                  <div class=\"blue_line\"></div>\n          </div>\n\n\n\n          <div class=\"new_wap\">\n                  <div :class='{new_ed_list:event.hall==1,new_ed_list2:event.hall==2,new_ed_list3:event.hall==3}'>{{category}}</div>\n                  <div v-if=event.hall&amp;1 class=\"new_ed_hall blue\">1館</div>\n                  <div v-if=event.hall&amp;2 class=\"new_ed_hall blue_d\">2館</div>\n          </div>\n\n          <div class=\"row\">\n                  <div class=\"col-12 col-md-6 col-lg-6\">\n                          <div class=\"clender_sm_t\">展覽活動期間</div>\n                          <!-- <div class=\"cled_time\">{{fmtTime(event.btime)}} - {{fmtTime(event.etime)}}</div> -->\n                        <div class=\"alen_box\">\n                            <div class=\"alen_box_wrap\">\n                                <div class=\"alen_year\">{{event.byear}}</div>\n                                <div class=\"alen_year_end\">{{event.eyear}}</div>\n                            </div>\n\t\t\t\t\t\t<div class=\"alen_borer\">\n\t\t\t\t\t\t\t<ul class=\"alen_li\">\n\t\t\t\t\t\t\t\t<li class=\"alen_date\">{{event.bdate}}</li>\n\t\t\t\t\t\t\t\t<li class=\"alen_se\">({{event.bday}})</li>\n\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"alen_line\"></div>\n\t\t\t\t\t\t<div class=\"alen_borer\">\n\t\t\t\t\t\t\t<ul class=\"alen_li\">\n\t\t\t\t\t\t\t\t<li class=\"alen_date\">{{event.edate}}</li>\n\t\t\t\t\t\t\t\t<li class=\"alen_se\">({{event.eday}})</li>\n\t\t\t\t\t\t\t</ul>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t    </div>\n                          <div class=\"clender_sm_t\">活動地點</div>\n                          <div class=\"cled_plac\">{{event.location}}</div>\n                          <div class=\"clender_sm_t\">主辦單位</div>\n                          <div class=\"cled_plac\">{{event.organizer}}</div>\n                          <div class=\"clender_sm_t\">官方網站</div>\n                          <div class=\"cled_plac\"><a :href=websiteLink(event.webpage) target=_blank>{{event.webpage}}</a></div>\n                          <div class=\"clender_sm_t\">備註</div>\n\t\t\t  <div class=\"clender_p\" v-html=event.content></div>\n                  </div>\n                  <div class=\"col-12 col-md-6 col-lg-6\">\n                          <div class=\"aboutpic\">\n                                  <a :href=event.photo data-fancybox=\"images\" :data-caption=event.title>\n                                          <img :src=event.photo>\n                                  </a>\n                          </div>\n                  </div>\n          </div>\n\n\n          <div class=\"row prv\">\n  <div class=\"col-6 col-md-6 col-lg-6\" v-if=eventPrev>\n      <router-link :to='\"/event/\"+eventPrev.id'>\n          <div class=\"ns_prev\">\n              <div class=\"prev_ic\">\n                  <img src=\"images/page1.svg\" alt=\"\"></div>\n          </div>\n          <div class=\"ns_prev2\">\n              <ul>\n                  <li class=\"pr_L\">上一則活動</li>\n                  <li class=\"newspoint\">{{eventPrev.title}}</li>\n              </ul>\n          </div>\n      </router-link>\n  </div>\n  <div class=\"col-6 col-md-6 col-lg-6\" v-if=eventNext>\n      <router-link :to='\"/event/\"+eventNext.id'>\n          <div class=\"ns_prev2\">\n              <ul>\n                  <li class=\"pr_R\">下一則活動</li>\n                  <li class=\"newspoint\">{{eventNext.title}}</li>\n              </ul>\n          </div>\n          <div class=\"ns_prev\">\n              <div class=\"prev_ic\"><img src=\"images/page2.svg\" alt=\"\"></div>\n          </div>\n      </router-link>\n  </div>\n        </div>\n</div>\n";

////// ls!src/fmt-date-range (sdefine)
load(157,[145,161,155],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define(['ls!d2', 'ls!date-comp', 'ls!day-name'], function(d2, dateComp, dayName){
    return function(btime, etime){
      var bt, et;
      bt = dateComp(btime);
      et = dateComp(etime);
      return bt.yy + " " + d2(bt.mm) + "/" + d2(bt.dd) + "(" + dayName[bt.day] + ")-" + (et.yy === bt.yy
        ? ''
        : et.yy + ' ') + (et.mm === bt.mm
        ? ''
        : d2(et.mm) + '/') + d2(et.dd) + "(" + dayName[et.day] + ")";
    };
  });
}).call(this);
});

////// text!src/template/event.html (rvalue)
module[158]="<div>\n    <ul class=\"hall_tab float-right\">\n        <router-link to=/event>現在</router-link>\n        /\n        <router-link to=/event-past>過去</router-link>\n    </ul>\n    <div class=\"line_top_title\">{{age == 'event' ? '' : '過去'}}展會活動</div>\n\n\n    <div class=\"title_line\">\n        <div class=\"blue_line\"></div>\n    </div>\n\n    <!-- <div class=\"dropdown desa drsa_mg\">\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n        全部\n      </button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li><a class=\"dropdown-item\" href=\"#\">1館</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">2館</a></li>\n\n      </ul>\n    </div>\n\n    <div class=\"dropdown desa drsa_mg\">\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n        展覽\n      </button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li><a class=\"dropdown-item\" href=\"#\">全部</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">展覽</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">活動</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">歷年重大展會</a></li>\n      </ul>\n    </div>\n\n    <div class=\"dropdown desa drsa_mg\">\n      <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n        年份\n      </button>\n      <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n        <li><a class=\"dropdown-item\" href=\"#\">2021</a></li>\n        <li><a class=\"dropdown-item\" href=\"#\">2020</a></li>\n\n      </ul>\n    </div>\n\n\n        <div class=\"calender_search desa\">\n            <ul class=\"searchbar\">\n                <li><input name=\"\" type=\"text\" placeholder=\"請輸入關鍵字\"/></li>\n                <li class=\"searchicon\"><img src=\"images/search.svg\" alt=\"\"></li>\n            </ul>\n        </div> -->\n\n                <div class=\"onder_title\">展覽</div>\n\n                <div class=\"Pavilion_wrap\">\n                    <ul class=\"Pavilion_item\">\n                        <a href=\"#\" @click.prevent=toggleHall(1)><li :class='{in_hall1:hall!=2}'>1館</li></a>\n\n                        <a href=\"#\" @click.prevent=toggleHall(2)><li :class='{in_hall2:hall!=1}'>2館</li></a>\n                    </ul>\n                </div>\n\n\n    <div class=\"event_wrap\">\n        <div class=\"row\">\n\n            <div class=\"m_eventmb col-12 col-md-6 col-lg-4\" v-for='_ in view1'>\n                <router-link :to='\"/event/\"+_.id'>\n                <div class=\"event_box\">\n\n                    <div class=\"event_pic\" :style='{backgroundImage:\"url(\"+_.photo+\")\"}' alt=\"\">\n                        <div class=\"eun_both\">\n                            <div v-if=_.hall&amp;1 class=bor_hall_bg2>1館</div>\n                            <div v-if=_.hall&amp;2 class=bor_hall_bg1>2館</div>\n                        </div>\n                    </div>\n                    <div class=\"en_bx\">\n                        <div class=\"event_date\">{{fmtDateRange(_.btime,_.etime)}}</div>\n                        <div class=\"event_title\">{{_.title}}</div>\n                        <div class=\"event_p\">地點：{{_.location}}</div>\n                    </div>\n                </div>\n                </router-link>\n            </div>\n\n\n        </div>\n\n                        <div class=\"readmore_bg2\" v-if=view1.more>\n                                <ul>\n                                        <a href=\"#\" @click.prevent=more(1)>\n                                                <li>更多展覽</li>\n                                                <li>▼</li>\n                                        </a>\n                                </ul>\n                        </div>\n\n    </div>\n\n\n      <template v-if=view2.length>\n                <div class=\"onder_title\">活動</div>\n\n\n\n                <div class=\"event_wrap\">\n        <div class=\"row\">\n\n            <div class=\"m_eventmb col-12 col-md-6 col-lg-4\" v-for='_ in view2'>\n                                        <router-link :to='\"/event/\"+_.id'>\n                <div class=\"event_box\">\n\n                    <div class=\"event_pic\" :style='{backgroundImage:\"url(\"+_.photo+\")\"}' alt=\"\">\n                        <div class=\"eun_both\">\n                        <div v-if=_.hall&amp;1 class=bor_hall_bg2>1館</div>\n                        <div v-if=_.hall&amp;2 class=bor_hall_bg1>2館</div>\n                        </div>\n                    </div>\n                    <div class=\"en_bx\">\n                        <div class=\"event_date\">{{fmtDateRange(_.btime,_.etime)}}</div>\n                        <div class=\"event_title\">{{_.title}}</div>\n                        <div class=\"event_p\">地點：{{_.location}}</div>\n                    </div>\n                </div>\n                                        </router-link>\n            </div>\n\n\n        </div>\n\n                        <div class=\"readmore_bg2\" v-if=view2.more>\n                                <ul>\n                                        <a href=\"#\" @click.prevent=more(2)>\n                                                <li>更多活動</li>\n                                                <li>▼</li>\n                                        </a>\n                                </ul>\n                        </div>\n\n    </div>\n\n    </template>\n      <template v-if=view3.length>\n                <div class=\"onder_title\">會議</div>\n\n\n\n                <div class=\"event_wrap\">\n        <div class=\"row\">\n\n            <div class=\"m_eventmb col-12 col-md-6 col-lg-4\" v-for='_ in view3'>\n                                        <router-link :to='\"/event/\"+_.id'>\n                <div class=\"event_box\">\n\n                    <div class=\"event_pic\" :style='{backgroundImage:\"url(\"+_.photo+\")\"}' alt=\"\">\n                        <div class=\"eun_both\">\n                            <div v-if=_.hall&amp;1 class=bor_hall_bg2>1館</div>\n                            <div v-if=_.hall&amp;2 class=bor_hall_bg1>2館</div>\n                        </div>\n                    </div>\n                    <div class=\"en_bx\">\n                        <div class=\"event_date\">{{fmtDateRange(_.btime,_.etime)}}</div>\n                        <div class=\"event_title\">{{_.title}}</div>\n                        <div class=\"event_p\">地點：{{_.location}}</div>\n                    </div>\n                </div>\n                                        </router-link>\n            </div>\n\n\n\n        </div>\n\n                        <div class=\"readmore_bg2\" v-if=view3.more>\n                                <ul>\n                                        <a href=\"#\" @click.prevent=more(3)>\n                                                <li>更多會議</li>\n                                                <li>▼</li>\n                                        </a>\n                                </ul>\n                        </div>\n\n    </div>\n    </template>\n</div>\n";

////// text!src/template/index.html (rvalue)
module[159]="<section class=\"had_mot\">\n    <div class=\"container index_wrapper\">\n        <div ref=bannerSwiper class=swiper-container>\n          <div class=swiper-wrapper>\n            <div class=\"swiper-slide banner\">\n                <video ref=bannerVideo style=width:100%;position:absolute src=banner/video.mp4 poster=banner/video.jpg type=video/mp4 @click.prevent=togglePlay></video>\n                <div v-if=!playing @click.prevent=play class=\"ix_play\" style=cursor:pointer><img src=\"images/play2.svg\"></div>\n\n                <ul class=\"side_play\">\n                        <li style=cursor:pointer @click.prevent=toggleMute><img src=\"images/v01.svg\" alt=\"\"></li>\n                        <li style=cursor:pointer v-if=!playing @click.prevent=play><img src=\"images/v02.svg\" alt=\"\"></li>\n                        <li style=cursor:pointer v-if=playing @click.prevent=pause><img src=\"images/v03.svg\" alt=\"\"></li>\n                </ul>\n\n            </div>\n            <template v-for='_ in banner'>\n              <a v-if=_.webpage :href=_.webpage target=_blank class=swiper-slide><div class=\"banner\" :style='{backgroundImage:\"url(banner/\"+_.seq+\".jpg)\"}'></div></a>\n              <div v-else class=\"swiper-slide banner\" :style='{backgroundImage:\"url(banner/\"+_.seq+\".jpg)\"}'></div>\n            </template>\n          </div>\n        </div>\n\n        <ul class=\"bn_dote\">\n            <li :class='{active:_==swiperActiveIndex}' style=cursor:pointer v-for='_ in swiperIndices' @click.prevent=swiperGo(_)></li>\n        </ul>\n\n\n\n\n        <div class=\"all_title\">展會活動</div>\n        <!-- <div class=\"all_en_text\">EVENTS</div> -->\n\n                            <ul class=\"seemore_2\">\n                                <router-link to=/event>\n                                    <li>更多活動</li>\n                                    <li class=\"seemoreicon\"><img src=\"images/seemore.svg\" alt=\"\"></li>\n                                </router-link>\n                            </ul>\n\n                    <div class=\"Pavilion_wrap\">\n                        <ul class=\"Pavilion_item\">\n                            <a href=\"#\" @click.prevent=toggleHall(1)><li :class='{in_hall1:hall!=2}'>1館</li></a>\n\n                            <a href=\"#\" @click.prevent=toggleHall(2)><li :class='{in_hall2:hall!=1}'>2館</li></a>\n                        </ul>\n                    </div>\n        <!-- <div class=\"dropdown desa drsa_mg\">\n          <button class=\"btn btn-secondary dropdown-toggle\" type=\"button\" id=\"dropdownMenuButton\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n            全部\n          </button>\n          <ul class=\"dropdown-menu drop_width\" aria-labelledby=\"dropdownMenuButton\">\n            <li><a class=\"dropdown-item\" href=\"#\">1館</a></li>\n            <li><a class=\"dropdown-item\" href=\"#\">2館</a></li>\n          </ul>\n        </div> -->\n\n\n\n        <div class=\"event_wrap\">\n            <div class=\"row\">\n                <div class=\"m_eventmb col-12 col-md-6 col-lg-3\" v-for='_ in exhibition'>\n                    <router-link :to='\"/event/\"+_.id'>\n                            <div class=\"event_box\">\n                                <div class=\"event_pic\" :style='{backgroundImage:\"url(\"+(_.photo)+\")\"}'>\n                                    <div class=\"eun_both\">\n                                        <div v-if=_.hall&amp;1 class=bor_hall_bg2>1館</div>\n                                        <div v-if=_.hall&amp;2 class=bor_hall_bg1>2館</div>\n                                    </div>\n                                </div>\n                                <div class=\"en_bx\">\n                                    <div class=\"event_date\">{{fmtDateRange(_.btime,_.etime)}}</div>\n                                    <div class=\"event_title\">{{_.title}}</div>\n                                    <div class=\"event_p\">地點：{{_.location}}</div>\n                                </div>\n                            </div>\n                    </router-link>\n                </div>\n            </div>\n            <!-- <div class=\"readmore\">\n                <ul>\n                    <a href=\"calendar.html\">\n                        <li>更多活動</li>\n                        <li>▼</li>\n                    </a>\n                </ul>\n            </div> -->\n        </div>\n\n\n\n\n\n        <div class=\"all_title\">媒體中心</div>\n        <!-- <div class=\"all_en_text\">NEWS</div> -->\n\n                            <ul class=\"seemore_2\">\n                                <router-link to=/news>\n                                    <li>更多消息</li>\n                                    <li class=\"seemoreicon\"><img src=\"images/seemore.svg\" alt=\"\"></li>\n                                </router-link>\n                            </ul>\n\n        <div class=\"news_wrap\">\n                <div  class=\"news_list\">\n                    <table width=\"100%\" border=\"0\">\n                      <tr v-for='_ in newsList'>\n                        <td width=\"100px\">{{fmtDate(_.time)}}</td>\n                        <td width=\"80px\">\n                          <span v-if=_.hall&amp;1 class=blue>1館</span>\n                          <span v-if=_.hall&amp;2 class=blue_d>2館</span>\n                        </td>\n                        <td class=\"news_ft\"><router-link :to='\"/news/news/\"+_.id'>{{_.title}}</router-link></td>\n                      </tr>\n                    </table>\n                </div>\n                <!-- <div class=\"readmore\">\n                    <ul>\n                        <a href=\"news_1.html\">\n                            <li>更多消息</li>\n                            <li>▼</li>\n                        </a>\n                    </ul>\n                </div> -->\n        </div>\n\n\n\n\n    </div>\n    <div v-if=popupwin id=\"index-popwin\">\n    \t<h2>{{popupwin.subject}}</h2>\n    \t<div class=\"popwinblock\">{{popupwin.content}}</div>\n    </div>\n</section>\n";

////// ls!src/date-comp (sdefine)
load(161,[],[],function(define){// Generated by LiveScript 1.6.1
(function(){
  define([], function(){
    return function(unixtime){
      var d;
      d = new Date(unixtime * 1000);
      return {
        yy: d.getFullYear(),
        mm: 1 + d.getMonth(),
        dd: d.getDate(),
        hr: d.getHours(),
        mn: d.getMinutes(),
        sc: d.getSeconds(),
        day: d.getDay()
      };
    };
  });
}).call(this);
});

//////  (defer)
activate(0,1,[1,9,141,140,138,128,127,157,161,126,155,154,153,117,88,152,86,51,151,48,27,26,25,24,145,23,22,15,160,143,13,8]);


    module[0](function(main){
        main()
    })
})(window, [],[],[],[], 0)
