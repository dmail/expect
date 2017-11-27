import { label, createMatcher, matchAll } from "../matcher.js"
import { any } from "../any/any.js"
import { failed, passed } from "@dmail/action"
import { oneOrMoreParamSignature } from "../helper.js"

const matchFunction = any(Function)
const getValueThrowedByFunctionCall = fn => {
	return matchFunction(fn).then(() => {
		let throwed = false
		let throwedValue

		try {
			fn()
		} catch (e) {
			throwed = true
			throwedValue = e
		}

		if (throwed === false) {
			return failed("missing throw")
		}
		return passed(label(throwedValue), `${fn} throw`)
	})
}

export const throwMatching = () =>
	oneOrMoreParamSignature({
		fn: (...args) =>
			createMatcher(actual => {
				return getValueThrowedByFunctionCall(actual).then(matchAll(...args))
			}),
		createMessage: () =>
			`throwMatching() must be called with one or more argument, you can use throwMatching(any())`,
	})