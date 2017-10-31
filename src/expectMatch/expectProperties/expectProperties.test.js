import {
	expectProperties,
	expectPropertiesAllowingExtra,
	expectPropertyNames,
	expectPropertyNamesAllowingExtra
} from "./expectProperties.js"
import { createTest } from "@dmail/test"
import { matchBelow } from "../expectBelow/expectBelow.js"
import assert from "assert"

const assertPassedWith = (action, value) => {
	assert.equal(action.getState(), "passed")
	assert.deepEqual(action.getResult(), value)
}

const assertFailedWith = (action, value) => {
	assert.equal(action.getState(), "failed")
	assert.deepEqual(action.getResult(), value)
}

export default createTest({
	"expectProperties(null)": ({ pass }) => {
		assertFailedWith(
			expectProperties(null, { foo: true }),
			"expect a function or an object to compare properties but got null"
		)
		pass()
	},
	"expectProperties(undefined)": ({ pass }) => {
		assertFailedWith(
			expectProperties(undefined, { foo: true }),
			"expect a function or an object to compare properties but got undefined"
		)
		pass()
	},
	"expectProperties(true)": ({ pass }) => {
		assertFailedWith(
			expectProperties(true, { foo: true }),
			"expect a function or an object to compare properties but got a boolean: true"
		)
		pass()
	},
	"expectProperties({}, {foo: true})": ({ pass }) => {
		assertFailedWith(expectProperties({}, { foo: true }), "missing foo property")
		pass()
	},
	"expectProperties({foo: true}, {foo: true})": ({ pass }) => {
		assertPassedWith(expectProperties({ foo: true }, { foo: true }), [undefined])
		pass()
	},
	"expectProperties({foo: true}, {})": ({ pass }) => {
		assertFailedWith(expectProperties({ foo: true }, {}), "unexpected foo property")
		pass()
	},
	"expectProperties({foo: 10}, {foo: matchBelow(5)}": ({ pass }) => {
		assertFailedWith(
			expectProperties({ foo: 10 }, { foo: matchBelow(5) }),
			"foo property mismatch: expect a number below 5 but got 10"
		)
		pass()
	},
	"expectPropertiesAllowingExtra({foo: 10}, {})": ({ pass }) => {
		assertPassedWith(expectPropertiesAllowingExtra({ foo: 10 }, {}), [])
		pass()
	},
	"expectPropertiesAllowingExtra({foo: 10, bar: true}, {foo: 10})": ({ pass }) => {
		assertPassedWith(expectPropertiesAllowingExtra({ foo: 10, bar: true }, { foo: 10 }), [
			undefined
		])
		pass()
	},
	"expectPropertyNames({foo: true}, 'foo')": ({ pass }) => {
		assertPassedWith(expectPropertyNames({ foo: true }, "foo"), [undefined])
		pass()
	},
	"expectPropertyNamesAllowingExtra({foo: true})": ({ pass }) => {
		assertPassedWith(expectPropertyNamesAllowingExtra({ foo: true }), [])
		pass()
	},
	"expectPropertyNamesAllowingExtra({foo: true, bar: true}, 'foo')": ({ pass }) => {
		assertPassedWith(expectPropertyNamesAllowingExtra({ foo: true, bar: true }, "foo"), [undefined])
		pass()
	}
})
