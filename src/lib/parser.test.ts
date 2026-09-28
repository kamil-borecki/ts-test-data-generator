import { strict as assert } from 'node:assert'
import test from 'node:test'

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
