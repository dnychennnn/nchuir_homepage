(function(d){var e="1.4",j=this,c=j.Class,b=false;var i=(function(){$super()}).toString().indexOf("$super")>0;function h(l){return !i||/\B\$super\b/.test(l.toString())}function g(n,l,m){if(m===d){delete n[l]}else{n[l]=m}}function k(m,l){return Object.prototype.hasOwnProperty.call(m,l)?m[l]:d}function f(l){b=true;var m=new l;b=false;return m}var a=function(){};a.$noConflict=function(){try{g(j,"Class",c)}catch(l){j.Class=c}return a};a.$classyVersion=e;a.$extend=function(r){var p=this.prototype;var s=f(this);if(r.__include__){for(var q=0,o=r.__include__.length;q!=o;++q){var v=r.__include__[q];for(var l in v){var t=k(v,l);if(t!==d){s[l]=v[l]}}}}r.__classvars__=r.__classvars__||{};if(s.__classvars__){for(var u in s.__classvars__){if(!r.__classvars__[u]){var t=k(s.__classvars__,u);r.__classvars__[u]=t}}}for(var l in r){var t=k(r,l);if(l==="__include__"||t===d){continue}s[l]=typeof t==="function"&&h(t)?(function(n,w){return function(){var x=k(this,"$super");this.$super=p[w];try{return n.apply(this,arguments)}finally{g(this,"$super",x)}}})(t,l):t}var m=function(){if(b){return}var n=j===this?f(arguments.callee):this;if(n.__init__){n.__init__.apply(n,arguments)}n.$class=m;return n};for(var u in r.__classvars__){var t=k(r.__classvars__,u);if(t!==d){m[u]=t}}m.prototype=s;m.constructor=m;m.$extend=a.$extend;m.$withData=a.$withData;return m};a.$withData=function(n){var o=f(this);for(var l in n){var m=k(n,l);if(m!==d){o[l]=m}}return o};j.Class=a})();