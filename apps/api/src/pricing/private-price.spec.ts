import { privateTotal, splitInTwo } from './private-price';

const rules = { includedPassengers: 4, extraPassengerPrice: 20 };

describe('privateTotal', () => {
  it('no cobra extras hasta los pasajeros incluidos', () => {
    expect(privateTotal(100, 1, rules).total).toBe(100);
    expect(privateTotal(100, 4, rules).total).toBe(100);
  });

  it('suma cada pasajero por encima de los incluidos', () => {
    expect(privateTotal(100, 5, rules)).toEqual({
      base: 100,
      extraPassengers: 1,
      extrasAmount: 20,
      total: 120,
    });
    expect(privateTotal(100, 10, rules).total).toBe(220);
  });
});

describe('splitInTwo', () => {
  it('reparte sin perder centavos', () => {
    expect(splitInTwo(120)).toEqual([60, 60]);
    expect(splitInTwo(100.01)).toEqual([50.01, 50]);
  });
});
