var Exception = Handlebars.Exception;

describe('strict', function () {
  describe('strict mode', function () {
    it('should error on missing property lookup', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should error on missing child', function () {
      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ strict: true })
        .withInput({ hello: { bar: 'foo' } })
        .toCompileTo('foo');

      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ strict: true })
        .withInput({ hello: {} })
        .toThrow(Exception, /"bar" not defined in/);
    });

    it('should handle explicit undefined', function () {
      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ strict: true })
        .withInput({ hello: { bar: undefined } })
        .toCompileTo('');
    });

    it('should error on missing property lookup in known helpers mode', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({
          strict: true,
          knownHelpersOnly: true,
        })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should error on missing context', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true })
        .toThrow(Error);
    });

    it('should error on missing data lookup', function () {
      var xt = expectTemplate('{{@hello}}').withCompileOptions({
        strict: true,
      });

      xt.toThrow(Error);

      xt.withRuntimeOptions({ data: { hello: 'foo' } }).toCompileTo('foo');
    });

    it('should not run helperMissing for helper calls', function () {
      expectTemplate('{{hello foo}}')
        .withCompileOptions({ strict: true })
        .withInput({ foo: true })
        .toThrow(Exception, /"hello" not defined in/);

      expectTemplate('{{#hello foo}}{{/hello}}')
        .withCompileOptions({ strict: true })
        .withInput({ foo: true })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should throw on ambiguous blocks', function () {
      expectTemplate('{{#hello}}{{/hello}}')
        .withCompileOptions({ strict: true })
        .toThrow(Exception, /"hello" not defined in/);

      expectTemplate('{{^hello}}{{/hello}}')
        .withCompileOptions({ strict: true })
        .toThrow(Exception, /"hello" not defined in/);

      expectTemplate('{{#hello.bar}}{{/hello.bar}}')
        .withCompileOptions({ strict: true })
        .withInput({ hello: {} })
        .toThrow(Exception, /"bar" not defined in/);
    });

    it('should allow undefined parameters when passed to helpers', function () {
      expectTemplate('{{#unless foo}}success{{/unless}}')
        .withCompileOptions({ strict: true })
        .toCompileTo('success');
    });

    it('should allow undefined hash when passed to helpers', function () {
      expectTemplate('{{helper value=@foo}}')
        .withCompileOptions({
          strict: true,
        })
        .withHelpers({
          helper: function (options) {
            expect(options.hash).toHaveProperty('value');
            expect(options.hash.value).toBeUndefined();
            return 'success';
          },
        })
        .toCompileTo('success');
    });

    it('should show error location on missing property lookup', function () {
      expectTemplate('\n\n\n   {{hello}}')
        .withCompileOptions({ strict: true })
        .toThrow(Exception, '"hello" not defined in [object Object] - 4:5');
    });

    it('should error contains correct location properties on missing property lookup', function () {
      try {
        var template = CompilerContext.compile('\n\n\n   {{hello}}', {
          strict: true,
        });
        template({});
      } catch (error) {
        expect(error.lineNumber).toBe(4);
        expect(error.endLineNumber).toBe(4);
        expect(error.column).toBe(5);
        expect(error.endColumn).toBe(10);
      }
    });
  });

  describe('strict mode with compat mode', function () {
    it('should resolve a value found on the current context', function () {
      expectTemplate('{{v}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ v: 'a' })
        .toCompileTo('a');
    });

    it('should resolve values from parent contexts like compat mode', function () {
      expectTemplate(
        '{{#outer}}Goodbye {{#inner}}cruel {{omg}}{{/inner}}{{/outer}}'
      )
        .withInput({
          omg: 'OMG!',
          outer: [{ inner: [{ text: 'goodbye' }] }],
        })
        .withCompileOptions({ strict: true, compat: true })
        .toCompileTo('Goodbye cruel OMG!');
    });

    it('should resolve values inside of an each block from parent contexts', function () {
      expectTemplate('{{#each items}}{{name}} {{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({
          items: [{ name: 'Al' }, { name: 'Bo' }],
        })
        .toCompileTo('Al Bo ');
    });

    it('should resolve outer values inside of a with block', function () {
      expectTemplate('{{#with obj}}{{b}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: {}, b: 'outerB' })
        .toCompileTo('outerB');
    });

    it('should resolve a block value that is a primitive', function () {
      expectTemplate('{{#foo}}Hello {{bar}}{{/foo}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ foo: true, bar: 'World' })
        .toCompileTo('Hello World');
    });

    it('should resolve intermediate and terminal parts of depthed paths', function () {
      expectTemplate('{{a.b}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ a: { b: 'B' } })
        .toCompileTo('B');

      expectTemplate('{{a.b.c}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ a: { b: { c: 'C' } } })
        .toCompileTo('C');

      expectTemplate('{{#with a}}{{b.c}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ a: { b: { c: 'deep' } }, c: 'outerC' })
        .toCompileTo('deep');
    });

    it('should handle explicit undefined terminal values', function () {
      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ hello: { bar: undefined } })
        .toCompileTo('');
    });

    it('should fall through an explicit undefined value to an outer context', function () {
      expectTemplate('{{#each items}}{{v}}{{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: [{ v: undefined }, { v: 'b' }], v: 'outer' })
        .toCompileTo('outerb');
    });

    it('should not throw a TypeError when a depth is a primitive', function () {
      expectTemplate('{{#each items}}[{{this}}|{{outer}}]{{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: ['a', 'b'], outer: 'O' })
        .toCompileTo('[a|O][b|O]');

      expectTemplate('{{#each items}}{{this}}-{{x}} {{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: [1, 2], x: 'X' })
        .toCompileTo('1-X 2-X ');
    });

    it('should throw a Handlebars Exception for a missing value on the root context', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should throw a Handlebars Exception for a value missing on every depth', function () {
      expectTemplate('{{#each items}}{{name}} {{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: [{ name: 'Al' }, { other: 1 }] })
        .toThrow(Exception, /"name" not defined in/);

      expectTemplate('{{#with obj}}{{b}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: {}, c: 1 })
        .toThrow(Exception, /"b" not defined in/);
    });

    it('should throw a Handlebars Exception for a missing terminal part', function () {
      expectTemplate('{{a.b}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ a: {} })
        .toThrow(Exception, /"b" not defined in/);

      expectTemplate('{{#with a}}{{b.c}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ a: { b: {} }, c: 'outerC' })
        .toThrow(Exception, /"c" not defined in/);
    });

    it('should show the error location on a missing property lookup', function () {
      expectTemplate('\n\n\n   {{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, '"hello" not defined in [object Object] - 4:5');
    });

    it('should not run helperMissing for helper calls', function () {
      expectTemplate('{{hello foo}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ foo: true })
        .toThrow(Exception, /"hello" not defined in/);

      expectTemplate('{{#hello foo}}{{/hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ foo: true })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should work with knownHelpers and knownHelpersOnly', function () {
      expectTemplate('{{#each items}}{{name}}-{{root}}{{/each}}')
        .withCompileOptions({
          strict: true,
          compat: true,
          knownHelpers: { each: true },
        })
        .withInput({ items: [{ name: 'a' }], root: 'R' })
        .toCompileTo('a-R');

      expectTemplate('{{nope}}')
        .withCompileOptions({
          strict: true,
          compat: true,
          knownHelpersOnly: true,
        })
        .toThrow(Exception, /"nope" not defined in/);
    });

    it('should pass context values to custom helpers', function () {
      expectTemplate('{{shout v}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ v: 'hi' })
        .withHelpers({
          shout: function (value) {
            return String(value).toUpperCase();
          },
        })
        .toCompileTo('HI');
    });

    it('should resolve parent values inside a custom block helper', function () {
      expectTemplate('{{#list items}}<{{this}}:{{outer}}>{{/list}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: ['a', 'b'], outer: 'OUT' })
        .withHelpers({
          list: function (items, options) {
            return items.map((item) => options.fn(item)).join('');
          },
        })
        .toCompileTo('<a:OUT><b:OUT>');
    });

    it('should not resolve prototype properties in a depthed lookup', function () {
      expectTemplate('{{constructor}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({})
        .toThrow(Exception, /"constructor" not defined in/);

      expectTemplate('{{#obj}}{{__proto__}}{{/obj}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: { x: 1 } })
        .toThrow(Exception, /"__proto__" not defined in/);
    });

    it('should resolve own properties that shadow blocked prototype names', function () {
      expectTemplate('{{constructor}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput(Object.assign(Object.create(null), { constructor: 'own' }))
        .toCompileTo('own');
    });
  });

  describe('assume objects with compat mode', function () {
    it('should resolve a value found on the current context', function () {
      expectTemplate('{{x}}')
        .withCompileOptions({ assumeObjects: true, compat: true })
        .withInput({ x: 'X' })
        .toCompileTo('X');
    });

    it('should ignore a missing value without throwing', function () {
      expectTemplate('{{x}}')
        .withCompileOptions({ assumeObjects: true, compat: true })
        .withInput({ a: 1 })
        .toCompileTo('');
    });

    it('should resolve parent values inside of blocks', function () {
      expectTemplate('{{#each items}}[{{name}}/{{outer}}]{{/each}}')
        .withCompileOptions({ assumeObjects: true, compat: true })
        .withInput({
          items: [{ name: 'i1' }, { name: 'i2' }],
          outer: 'O',
        })
        .toCompileTo('[i1/O][i2/O]');
    });

    it('should keep strict semantics when strict is also enabled', function () {
      expectTemplate('{{x}}')
        .withCompileOptions({ strict: true, assumeObjects: true, compat: true })
        .withInput({ a: 1 })
        .toThrow(Exception, /"x" not defined in/);

      expectTemplate('{{x}}')
        .withCompileOptions({ strict: true, assumeObjects: true, compat: true })
        .withInput({ x: 'X' })
        .toCompileTo('X');
    });
  });

  describe('assume objects', function () {
    it('should ignore missing property', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ assumeObjects: true })
        .toCompileTo('');
    });

    it('should ignore missing child', function () {
      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ assumeObjects: true })
        .withInput({ hello: {} })
        .toCompileTo('');
    });

    it('should error on missing object', function () {
      expectTemplate('{{hello.bar}}')
        .withCompileOptions({ assumeObjects: true })
        .toThrow(Error);
    });

    it('should error on missing context', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ assumeObjects: true })
        .withInput(undefined)
        .toThrow(Error);
    });

    it('should error on missing data lookup', function () {
      expectTemplate('{{@hello.bar}}')
        .withCompileOptions({ assumeObjects: true })
        .withInput(undefined)
        .toThrow(Error);
    });

    it('should execute blockHelperMissing', function () {
      expectTemplate('{{^hello}}foo{{/hello}}')
        .withCompileOptions({ assumeObjects: true })
        .toCompileTo('foo');
    });
  });
});
