import Category from '@/models/Category';

describe('Category Model', () => {
  const month = new Date();

  it('sets activity from float', () => {
    const ctg = new Category();
    ctg.setActivity(month, 123.45);
    expect(ctg.getActivity(month)).toBe(123.45);
  });

  it('sets activity from string', () => {
    const ctg = new Category();
    ctg.setActivity(month, 432.12);
    expect(ctg.getActivity(month)).toBe(432.12);
  });

  it('gets formatted activity', () => {
    const ctg = new Category();
    ctg.setActivity(month, 123);
    expect(ctg.getFormattedActivity(month)).toBe('$123.00');

    ctg.setActivity(month, 1894.33);
    expect(ctg.getFormattedActivity(month)).toBe('$1,894.33');
  });

  it('rounds floats when setting activity', () => {
    const ctg = new Category();
    ctg.setActivity(month, 123.44444);
    expect(ctg.getActivity(month)).toBe(123.44);

    ctg.setActivity(month, 123.55555555);
    expect(ctg.getActivity(month)).toBe(123.56);

    ctg.setActivity(month, 123.55555555);
    expect(ctg.getActivity(month)).toBe(123.56);
  });

  it('sets budget from string', () => {
    const ctg = new Category();
    ctg.setBudget(month, 543.21);
    expect(ctg.getBudget(month)).toBe(543.21);
  });

  it('sets budget from float', () => {
    const ctg = new Category();
    // @ts-ignore
    ctg.setBudget(month, 987.654);
    expect(ctg.getBudget(month)).toBe(987.65);
  });

  it('sets goal', () => {
    const ctg = new Category();
    ctg.goal = 123.0;
    expect(ctg.goal).toBe(123.0);

    // @ts-ignore
    ctg.goal = 432.4455555;
    expect(ctg.goal).toBe(432.45);
  });
});
