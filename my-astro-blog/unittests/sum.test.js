import { expect, expectTypeOf, test } from 'vitest'
import { sum } from './sum.js'

test('1+2 is a number, and that num is 3 ', () => {
  expectTypeOf(sum(1, 2)).toEqualTypeOf(Number)
  expect(sum(1, 2)).toBe(3)
})

test("OMEGA FLOWERY", () => { 
    expectTypeOf("JARONA").not.toEqualTypeOf(Number)
})

test("pukeko", () => {
    expect("Pu" + "Keko").toEqual("PuKeko")
})

test("quick mafs", () => {
    expect(1 + 1).toEqual(3)
}) 