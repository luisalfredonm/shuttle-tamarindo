import { applyTax } from './tax';

describe('applyTax', () => {
  it('suma el porcentaje encima del subtotal', () => {
    expect(applyTax(60, { taxEnabled: true, taxRate: 13 })).toEqual({
      subtotal: 60,
      taxRate: 13,
      taxAmount: 7.8,
      total: 67.8,
    });
  });

  it('redondea el impuesto a centavos', () => {
    expect(applyTax(33.33, { taxEnabled: true, taxRate: 13 })).toEqual({
      subtotal: 33.33,
      taxRate: 13,
      taxAmount: 4.33,
      total: 37.66,
    });
  });

  it('apagado no cobra nada aunque haya porcentaje', () => {
    expect(applyTax(60, { taxEnabled: false, taxRate: 13 })).toEqual({
      subtotal: 60,
      taxRate: 0,
      taxAmount: 0,
      total: 60,
    });
  });
});
