/*!
 * https://github.com/cho45/micro-template.js
 * 
 * The MIT License
 * Copyright © 2013 cho45 ( http://www.lowreal.net/ )
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function template (id, data) {
	var me = arguments.callee;
	if (!me.cache[id]) me.cache[id] = (function () {
		var name = id, string = /^[\w\-]+$/.test(id) ? me.get(id): (name = 'template(string)', id); // no warnings
		var line = 1, body = (
			"try { " +
				(me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
					"this.ret += '"  +
					string.
						replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
						replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
						replace(/^\s*|\s*$/g, '').
						replace(/\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
						replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
						replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
						replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '") +
				"'; " + (me.variable ? "" : "}") + "return this.ret;" +
			"} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
			"//@ sourceURL=" + name + "\n" // source map
		).replace(/this\.ret \+= '';/g, '');
		var func = new Function(body);
		var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
		var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
		return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, line: 1, ret : '', stash: stash }) };
	})();
	return data ? me.cache[id](data) : me.cache[id];
}
template.cache = {};
template.get = function (id) { return document.getElementById(id).innerHTML };

/**
 * Extended template function:
 *   requires: basic template() function
 *   provides:
 *     include(id)
 *     wrapper(id, function () {})
 */
function extended (id, data) {
	var fun = function (data) {
		data.include = function (name, args) {
			var stash = {};
			for (var key in template.context.stash) if (template.context.stash.hasOwnProperty(key)) {
				stash[key] = template.context.stash[key];
			}
			if (args) for (var key in args) if (args.hasOwnProperty(key)) {
				stash[key] = args[key];
			}
			var context = template.context;
			context.ret += template(name, stash);
			template.context = context;
		};

		data.wrapper = function (name, fun) {
			var current = template.context.ret;
			template.context.ret = '';
			fun.apply(template.context);
			var content = template.context.ret;
			var orig_content = template.context.stash.content;
			template.context.stash.content = content;
			template.context.ret = current + template(name, template.context.stash);
			template.context.stash.content = orig_content;
		};

		return template(id, data);
	};

	return data ? fun(data) : fun;
}

template.get = function (id) {
	var fun = extended.get;
	return fun ? fun(id) : document.getElementById(id).innerHTML;
};
this.template = template;
this.extended = extended;
