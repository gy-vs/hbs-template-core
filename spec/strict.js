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

  describe('strict mode with compat', function () {
    it('should look up a property on the root context', function () {
      expectTemplate('{{v}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ v: 'a' })
        .toCompileTo('a');
    });

    it('should resolve compat (depthed) lookups inside blocks', function () {
      expectTemplate('{{#foo}}Hello {{bar}}{{/foo}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ foo: true, bar: 'World' })
        .toCompileTo('Hello World');
    });

    it('should resolve properties in each blocks', function () {
      expectTemplate('{{#each items}}{{name}} {{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: [{ name: 'a' }, { name: 'b' }] })
        .toCompileTo('a b ');
    });

    it('should look up outer variables from inside a with block', function () {
      expectTemplate('{{#with obj}}{{b}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: { a: 1 }, b: 'outer b' })
        .toCompileTo('outer b');
    });

    it('should do deep recursive lookups', function () {
      expectTemplate(
        '{{#outer}}Goodbye {{#inner}}cruel {{omg}}{{/inner}}{{/outer}}'
      )
        .withCompileOptions({ strict: true, compat: true })
        .withInput({
          omg: 'OMG!',
          outer: [{ inner: [{ text: 'goodbye' }] }],
        })
        .toCompileTo('Goodbye cruel OMG!');
    });

    it('should resolve depthed pathed lookups', function () {
      expectTemplate(
        '{{#outer}}Goodbye {{#inner}}cruel {{omg.yes}}{{/inner}}{{/outer}}'
      )
        .withCompileOptions({ strict: true, compat: true })
        .withInput({
          omg: { yes: 'OMG!' },
          outer: [{ inner: [{ yes: 'no', text: 'goodbye' }] }],
        })
        .toCompileTo('Goodbye cruel OMG!');
    });

    it('should throw (not TypeError) on a missing root property', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should throw on a name missing from every context', function () {
      expectTemplate('{{#outer}}{{#inner}}{{omg}}{{/inner}}{{/outer}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ outer: [{ inner: [{}] }] })
        .toThrow(Exception, /"omg" not defined in/);
    });

    it('should show error location on missing property lookup', function () {
      expectTemplate('\n\n\n   {{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, '"hello" not defined in [object Object] - 4:5');
    });

    it('should error with correct location properties on missing lookup', function () {
      try {
        var template = CompilerContext.compile('\n\n\n   {{hello}}', {
          strict: true,
          compat: true,
        });
        template({});
      } catch (error) {
        expect(error.lineNumber).toBe(4);
        expect(error.endLineNumber).toBe(4);
        expect(error.column).toBe(5);
        expect(error.endColumn).toBe(10);
      }
    });

    it('should treat explicit undefined as defined', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ hello: undefined })
        .toCompileTo('');

      expectTemplate('{{#with obj}}{{hello}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: {}, hello: undefined })
        .toCompileTo('');
    });

    it('should throw on missing terminal of depthed pathed lookup', function () {
      expectTemplate(
        '{{#outer}}Goodbye {{#inner}}cruel {{omg.yes}}{{/inner}}{{/outer}}'
      )
        .withCompileOptions({ strict: true, compat: true })
        .withInput({
          omg: { no: 'OMG!' },
          outer: [{ inner: [{ yes: 'no', text: 'goodbye' }] }],
        })
        .toThrow(Exception, /"yes" not defined in/);
    });

    it('should allow undefined parameters when passed to helpers', function () {
      expectTemplate('{{#unless foo}}success{{/unless}}')
        .withCompileOptions({ strict: true, compat: true })
        .toCompileTo('success');
    });

    it('should allow undefined hash when passed to helpers', function () {
      expectTemplate('{{helper value=@foo}}')
        .withCompileOptions({ strict: true, compat: true })
        .withHelpers({
          helper: function (options) {
            expect(options.hash).toHaveProperty('value');
            expect(options.hash.value).toBeUndefined();
            return 'success';
          },
        })
        .toCompileTo('success');
    });

    it('should prefer custom helpers over context values', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ hello: 'world' })
        .withHelpers({
          hello: function () {
            return 'helper result';
          },
        })
        .toCompileTo('helper result');
    });

    it('should work with block params', function () {
      expectTemplate('{{#each items as |item|}}{{item.name}} {{/each}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ items: [{ name: 'a' }, { name: 'b' }] })
        .toCompileTo('a b ');
    });

    it('should error on missing data lookup', function () {
      var xt = expectTemplate('{{@hello}}').withCompileOptions({
        strict: true,
        compat: true,
      });

      xt.toThrow(Error);

      xt.withRuntimeOptions({ data: { hello: 'foo' } }).toCompileTo('foo');
    });

    it('should skip null/undefined contexts while searching depths', function () {
      expectTemplate('{{#with obj}}{{v}}{{/with}}')
        .withCompileOptions({ strict: true, compat: true })
        .withInput({ obj: {}, v: 'from outer' })
        .toCompileTo('from outer');
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

    it('should throw on ambiguous blocks', function () {
      expectTemplate('{{#hello}}{{/hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, /"hello" not defined in/);

      expectTemplate('{{^hello}}{{/hello}}')
        .withCompileOptions({ strict: true, compat: true })
        .toThrow(Exception, /"hello" not defined in/);
    });
  });

  describe('strict mode with compat and knownHelpers', function () {
    it('should error on missing property lookup', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({
          strict: true,
          compat: true,
          knownHelpersOnly: true,
        })
        .toThrow(Exception, /"hello" not defined in/);
    });

    it('should resolve context values with knownHelpersOnly', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({
          strict: true,
          compat: true,
          knownHelpersOnly: true,
        })
        .withInput({ hello: 'world' })
        .toCompileTo('world');
    });

    it('should invoke known helpers', function () {
      expectTemplate('{{#if hello}}yes{{/if}}')
        .withCompileOptions({
          strict: true,
          compat: true,
          knownHelpers: { if: true },
          knownHelpersOnly: true,
        })
        .withInput({ hello: true })
        .toCompileTo('yes');
    });
  });

  describe('strict mode with compat and assumeObjects', function () {
    it('should look up existing root and depthed properties', function () {
      expectTemplate('{{v}}')
        .withCompileOptions({ strict: true, compat: true, assumeObjects: true })
        .withInput({ v: 'a' })
        .toCompileTo('a');

      expectTemplate('{{#foo}}{{bar}}{{/foo}}')
        .withCompileOptions({ strict: true, compat: true, assumeObjects: true })
        .withInput({ foo: true, bar: 'World' })
        .toCompileTo('World');
    });

    it('should throw on names missing from every context', function () {
      expectTemplate('{{hello}}')
        .withCompileOptions({ strict: true, compat: true, assumeObjects: true })
        .toThrow(Exception, /"hello" not defined in/);
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
