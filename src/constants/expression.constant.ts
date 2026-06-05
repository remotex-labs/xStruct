/**
 * ASCII character codes used by the expression parser.
 *
 * @remarks
 * Provides named constants for low-level parser token matching using
 * direct `charCodeAt()` comparisons instead of string comparisons.
 *
 * @since 3.0.0
 */

export const enum CharCode {
    Zero = 48,
    Nine = 57,
    Colon = 58,
    UpperA = 65,
    UpperZ = 90,
    LowerA = 97,
    LowerI = 105,
    LowerZ = 122,
    Asterisk = 42,
    LeftBracket = 91,
    RightBracket = 93,
    LeftParenthesis = 40,
    RightParenthesis = 41
}

/**
 * Structured expression parser error codes.
 *
 * @remarks
 * Enumerates all syntax and semantic parser failures that may occur while
 * parsing expressions.
 *
 * @since 3.0.0
 */

export const enum ExpressionErrorCode {
    Expected,
    UnknownType,
    ExpectedInteger,
    EmptyExpression,
    ExpectedIdentifier,
    SizeMustBePositive,
    BitfieldForbidsFloat,
    BitfieldForbidsPointer,
    UnexpectedTrailingInput,
    GroupedStringRequiresSinglePointer
}
