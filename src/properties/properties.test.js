import { propertiesMatch, strictPropertiesMatch } from "./properties.js"
import { createTest } from "@dmail/test"
import assert from "assert"
import { createMatcher } from "../matcher.js"
import { passed } from "@dmail/action"

const assertPassedWith = (action, value) => {
	assert.deepEqual(action.getResult(), value)
	assert.equal(action.getState(), "passed")
}

const assertFailedWith = (action, value) => {
	assert.deepEqual(action.getResult(), value)
	assert.equal(action.getState(), "failed")
}

const assertSuccess = (matcher, factory) => {
	const { actual, expected } = factory()
	assertPassedWith(matcher(expected)(actual))
}

const assertFailure = (matcher, factory, expectedFailureMessage) => {
	const { actual, expected } = factory()
	assertFailedWith(matcher(expected)(actual), expectedFailureMessage)
}

export default createTest({
	"called without argument": ({ pass }) => {
		assert.throws(
			() => propertiesMatch(),
			e => e.message === `propertiesMatching must be called with one argument, got 0`,
		)
		assert.throws(
			() => strictPropertiesMatch(),
			e => e.message === `strictPropertiesMatching must be called with one argument, got 0`,
		)
		pass()
	},
	"called with 2 argument": ({ pass }) => {
		assert.throws(
			() => propertiesMatch(true, true),
			e => e.message === `propertiesMatching must be called with one argument, got 2`,
		)
		assert.throws(
			() => strictPropertiesMatch(true, true),
			e => e.message === `strictPropertiesMatching must be called with one argument, got 2`,
		)
		pass()
	},
	"on both null": ({ pass }) => {
		const createBothNull = () => {
			return {
				expected: null,
				actual: null,
			}
		}
		assertSuccess(propertiesMatch, createBothNull)
		assertSuccess(strictPropertiesMatch, createBothNull)
		pass()
	},
	"on expected null and actual non empty object": ({ pass }) => {
		const createExtraFoo = () => {
			return {
				expected: null,
				actual: { foo: true },
			}
		}
		assertSuccess(propertiesMatch, createExtraFoo)
		assertFailure(strictPropertiesMatch, createExtraFoo, "unexpected foo property on value")
		pass()
	},
	"on both undefined": ({ pass }) => {
		const createBothUndefined = () => {
			return {
				expected: undefined,
				actual: undefined,
			}
		}
		assertSuccess(propertiesMatch, createBothUndefined)
		assertSuccess(strictPropertiesMatch, createBothUndefined)
		pass()
	},
	"on both being true": ({ pass }) => {
		const createBothTrue = () => {
			return {
				expected: true,
				actual: true,
			}
		}
		assertSuccess(propertiesMatch, createBothTrue)
		assertSuccess(strictPropertiesMatch, createBothTrue)
		pass()
	},
	"on actual having inherited expected property": ({ pass }) => {
		const factory = () => {
			const actualPrototype = { foo: false }
			return {
				expected: { foo: true },
				actual: Object.create(actualPrototype),
			}
		}
		assertFailure(propertiesMatch, factory, "value foo mismatch: expect true but got false")
		pass()
	},
	"on actual having mismatching expected anonymous symbol": ({ pass }) => {
		const factory = () => {
			const symbol = Symbol()
			return {
				expected: {
					[symbol]: true,
				},
				actual: {
					[symbol]: false,
				},
			}
		}
		assertFailure(propertiesMatch, factory, "value Symbol() mismatch: expect true but got false")
		pass()
	},
	"on actual having inherited expect named symbol at property": ({ pass }) => {
		const factory = () => {
			const symbol = Symbol("foo")
			const actualPrototype = {
				[symbol]: false,
			}
			return {
				expected: {
					[symbol]: true,
				},
				actual: Object.create(actualPrototype),
			}
		}
		assertFailure(propertiesMatch, factory, "value Symbol(foo) mismatch: expect true but got false")
		pass()
	},
	"on empty objects": ({ pass }) => {
		const createMatchingEmptyObjects = () => {
			return {
				actual: {},
				expected: {},
			}
		}
		assertSuccess(propertiesMatch, createMatchingEmptyObjects)
		assertSuccess(strictPropertiesMatch, createMatchingEmptyObjects)
		pass()
	},
	"on objects with matching properties ": ({ pass }) => {
		const createMatchingObjectWithProperty = () => {
			return {
				actual: { foo: true },
				expected: { foo: true },
			}
		}

		assertSuccess(propertiesMatch, createMatchingObjectWithProperty)
		assertSuccess(strictPropertiesMatch, createMatchingObjectWithProperty)
		pass()
	},
	"on nested objects": ({ pass }) => {
		const createMatchingNestedObject = () => {
			return {
				actual: { foo: { bar: true } },
				expected: { foo: { bar: true } },
			}
		}
		assertSuccess(propertiesMatch, createMatchingNestedObject)
		assertSuccess(strictPropertiesMatch, createMatchingNestedObject)
		pass()
	},
	"on mismatch nested objects": ({ pass }) => {
		const createMismatchingNestedObject = () => {
			return {
				expected: { foo: { bar: false } },
				actual: { foo: { bar: true } },
			}
		}

		assertFailure(
			propertiesMatch,
			createMismatchingNestedObject,
			"value foo bar mismatch: expect false but got true",
		)
		assertFailure(
			strictPropertiesMatch,
			createMismatchingNestedObject,
			"value foo bar mismatch: expect false but got true",
		)
		pass()
	},
	"on extra nested property": ({ pass }) => {
		const createNestedExtraProperty = () => {
			return {
				expected: { foo: {} },
				actual: { foo: { bar: true } },
			}
		}

		assertSuccess(propertiesMatch, createNestedExtraProperty)
		assertFailure(
			strictPropertiesMatch,
			createNestedExtraProperty,
			"unexpected bar property on value foo",
		)

		pass()
	},
	"on missing nested property": ({ pass }) => {
		const createNestedMissingProperty = () => {
			return {
				expected: { foo: { bar: true } },
				actual: { foo: {} },
			}
		}

		assertFailure(
			propertiesMatch,
			createNestedMissingProperty,
			"expect bar property on value foo but missing",
		)
		assertFailure(
			strictPropertiesMatch,
			createNestedMissingProperty,
			"expect bar property on value foo but missing",
		)
		pass()
	},
	"on nested circular structure mismatch": ({ pass }) => {
		const createCircularStructureContainingMismatch = () => {
			const actual = {
				foo: {
					bar: true,
				},
			}
			actual.foo.aaa = actual
			const expected = {
				foo: {
					bar: false,
				},
			}
			expected.foo.aaa = expected
			return {
				actual,
				expected,
			}
		}

		assertFailure(
			propertiesMatch,
			createCircularStructureContainingMismatch,
			"value foo bar mismatch: expect false but got true",
		)
		assertFailure(
			strictPropertiesMatch,
			createCircularStructureContainingMismatch,
			"value foo bar mismatch: expect false but got true",
		)
		pass()
	},
	"on missing nested circular structure": ({ pass }) => {
		const createMissingNestedCircularStructure = () => {
			const expected = {
				foo: {
					bar: false,
				},
			}
			expected.foo.aaa = expected
			const actual = {
				foo: {
					bar: false,
				},
			}
			actual.foo.aaa = {}

			return {
				expected,
				actual,
			}
		}

		assertFailure(
			propertiesMatch,
			createMissingNestedCircularStructure,
			"expect value foo aaa to be a circular reference but got an object",
		)
		assertFailure(
			strictPropertiesMatch,
			createMissingNestedCircularStructure,
			"expect value foo aaa to be a circular reference but got an object",
		)
		pass()
	},
	"on unexpected nested circular structure": ({ pass }) => {
		const createExtraNestedCircularStructure = () => {
			const expected = {
				foo: {
					bar: true,
				},
			}
			expected.foo.aaa = {}
			const actual = {
				foo: {
					bar: true,
				},
			}
			actual.foo.aaa = actual

			return {
				actual,
				expected,
			}
		}

		assertSuccess(propertiesMatch, createExtraNestedCircularStructure)
		assertFailure(
			strictPropertiesMatch,
			createExtraNestedCircularStructure,
			`expect value foo aaa to be an object but got a circular reference`,
		)
		pass()
	},
	"on named arrow function": ({ pass }) => {
		const createTwoArrowFunctionsWithDifferentNames = () => {
			return {
				expected: () => {},
				actual: () => {},
			}
		}

		assertFailure(
			propertiesMatch,
			createTwoArrowFunctionsWithDifferentNames,
			`value name mismatch: expect "expected" but got "actual"`,
		)
		assertFailure(
			strictPropertiesMatch,
			createTwoArrowFunctionsWithDifferentNames,
			`value name mismatch: expect "expected" but got "actual"`,
		)
		pass()
	},
	"on anonymous arrow function": ({ pass }) => {
		assertPassedWith(propertiesMatch(() => {})(() => {}))
		assertPassedWith(strictPropertiesMatch(() => {})(() => {}))
		pass()
	},
	"on extra hidden nested property": ({ pass }) => {
		const createNestedExtraHiddenProperty = () => {
			const expected = {
				foo: {},
			}
			const actual = {
				foo: {},
			}
			Object.defineProperty(actual.foo, "bar", {
				enumerable: false,
				value: true,
			})
			return {
				expected,
				actual,
			}
		}

		assertSuccess(propertiesMatch, createNestedExtraHiddenProperty)
		assertSuccess(strictPropertiesMatch, createNestedExtraHiddenProperty)
		pass()
	},
	"on missing hidden property": ({ pass }) => {
		const createNestedMissingHiddenProperty = () => {
			const expected = {
				foo: {},
			}
			Object.defineProperty(expected.foo, "bar", {
				enumerable: false,
				value: true,
			})
			const actual = {
				foo: {},
			}
			return {
				expected,
				actual,
			}
		}

		assertFailure(
			propertiesMatch,
			createNestedMissingHiddenProperty,
			"expect bar property on value foo but missing",
		)
		assertFailure(
			strictPropertiesMatch,
			createNestedMissingHiddenProperty,
			"expect bar property on value foo but missing",
		)
		pass()
	},
	"on mismatch on hidden nested property": ({ pass }) => {
		const createMisMatchingHiddenProperty = () => {
			const expected = { foo: {} }
			Object.defineProperty(expected.foo, "bar", {
				enumerable: false,
				value: true,
			})
			const actual = { foo: {} }
			Object.defineProperty(actual.foo, "bar", {
				enumerable: false,
				value: false,
			})
			return { expected, actual }
		}

		assertFailure(
			propertiesMatch,
			createMisMatchingHiddenProperty,
			"value foo bar mismatch: expect true but got false",
		)
		assertFailure(
			strictPropertiesMatch,
			createMisMatchingHiddenProperty,
			"value foo bar mismatch: expect true but got false",
		)
		pass()
	},
	"on custom matcher": ({ pass }) => {
		const createWithCustomMatcher = () => {
			return {
				expected: {
					foo: createMatcher(() => passed()),
				},
				actual: {
					foo: {},
				},
			}
		}
		assertSuccess(propertiesMatch, createWithCustomMatcher)
		pass()
	},
})
