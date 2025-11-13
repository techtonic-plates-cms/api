import { builder } from '../../builder.ts';

// ============================================================================
// Filter Input Types
// ============================================================================

export const TextFilterInput = builder.inputType('TextFilter', {
  fields: (t) => ({
    eq: t.string({ required: false }),
    ne: t.string({ required: false }),
    contains: t.string({ required: false }),
    startsWith: t.string({ required: false }),
    endsWith: t.string({ required: false }),
  }),
});

export const NumberFilterInput = builder.inputType('NumberFilter', {
  fields: (t) => ({
    eq: t.float({ required: false }),
    ne: t.float({ required: false }),
    gt: t.float({ required: false }),
    gte: t.float({ required: false }),
    lt: t.float({ required: false }),
    lte: t.float({ required: false }),
  }),
});

export const BooleanFilterInput = builder.inputType('BooleanFilter', {
  fields: (t) => ({
    eq: t.boolean({ required: false }),
  }),
});

export const DateTimeFilterInput = builder.inputType('DateTimeFilter', {
  fields: (t) => ({
    eq: t.string({ required: false }),
    gt: t.string({ required: false }),
    gte: t.string({ required: false }),
    lt: t.string({ required: false }),
    lte: t.string({ required: false }),
  }),
});

export const FieldValueFilterInput = builder.inputType('FieldValueFilter', {
  fields: (t) => ({
    text: t.field({ type: TextFilterInput, required: false }),
    number: t.field({ type: NumberFilterInput, required: false }),
    boolean: t.field({ type: BooleanFilterInput, required: false }),
    dateTime: t.field({ type: DateTimeFilterInput, required: false }),
  }),
});
