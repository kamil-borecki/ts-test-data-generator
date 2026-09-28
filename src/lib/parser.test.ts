import { strict as assert } from 'node:assert'
import test from 'node:test'

import { createField, generateRows } from './generator.ts'
import { parseTypeText } from './parser.ts'

const sample = `
enum OrderStatus {
  New = 'new',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
}

interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: Address;
}

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  tags: string[];
  paid: boolean;
  createdAt: Date;
  note?: string | null;
}
`

test('parseTypeText supports enums, nested interfaces and array/object references', () => {
  const fields = parseTypeText(sample)
  if (!fields) {
    throw new Error('Expected parseTypeText to return fields for the sample schema')
  }

  assert.equal(fields.length >= 7, true)
  assert.ok(fields.some((field) => field.name === 'status' && field.type === 'enum'))
  assert.ok(fields.some((field) => field.name === 'customer' && field.type === 'object'))
  assert.ok(fields.some((field) => field.name === 'items' && field.type === 'array'))
  assert.ok(fields.some((field) => field.name === 'tags' && field.type === 'array'))
  assert.ok(fields.some((field) => field.name === 'note' && field.nullable === true))
})

test('parseTypeText recognizes inline string literal enum unions pasted in a type definition', () => {
  const fields = parseTypeText(`
    type Order = {
      status: 'new' | 'paid' | 'shipped';
      paymentState: 'pending' | 'paid' | 'failed';
      customerId: string;
    }
  `)

  if (!fields) {
    throw new Error('Expected parseTypeText to return fields for inline enum unions')
  }

  assert.ok(fields.some((field) => field.name === 'status' && field.type === 'enum'))
  assert.ok(fields.some((field) => field.name === 'status' && field.enumValues?.includes('new')))
  assert.ok(fields.some((field) => field.name === 'paymentState' && field.type === 'enum'))
  assert.ok(fields.some((field) => field.name === 'paymentState' && field.enumValues?.includes('failed')))
})

test('generateRows supports auto increment and custom date formatting', () => {
  const idField = createField({
    name: 'id',
    type: 'number',
    numberVariant: 'int',
    min: 100,
    max: 100,
    autoIncrement: true,
    autoIncrementStep: 2,
  })

  const createdAtField = createField({
    name: 'createdAt',
    type: 'date',
    dateVariant: 'iso',
    dateFormat: 'yyyy-MM-dd',
  })

  const rows = generateRows([idField, createdAtField], 3)

  assert.deepEqual(rows.map((row) => row.id), [100, 102, 104])
  assert.ok(rows[0].createdAt && typeof rows[0].createdAt === 'string')
})

test('Date is parsed as a string variant, not a separate field type', () => {
  const fields = parseTypeText(`
    type Order = {
      createdAt: Date;
      note: string;
    }
  `)

  if (!fields) {
    throw new Error('Expected parseTypeText to return fields for Date fields')
  }

  const createdAt = fields.find((field) => field.name === 'createdAt')
  assert.ok(createdAt)
  assert.equal(createdAt.type, 'string')
  assert.equal(createdAt.stringVariant, 'date')
})

test('array of custom object keeps the real item type name instead of CustomType', () => {
  const fields = parseTypeText(`
    interface OrderItem {
      sku: string;
    }

    type Order = {
      items: OrderItem[];
    }
  `)

  if (!fields) {
    throw new Error('Expected parseTypeText to return fields for item arrays')
  }

  const items = fields.find((field) => field.name === 'items')
  assert.ok(items)
  assert.equal(items.type, 'array')
  assert.equal(items.arrayItemType, 'object')
  assert.equal(items.objectType, 'OrderItem')
})
