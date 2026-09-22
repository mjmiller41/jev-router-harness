export const name = 'calculator';
export const description = 'Performs basic arithmetic calculations';
export const parameters = {
  expression: {
    type: 'string',
    description: 'Mathematical expression to evaluate (e.g. 2 + 2)',
    required: true,
  },
};

export async function execute(args: { expression: string }): Promise<{ result: number }> {
  // Safe simple mathematical expression evaluation
  const sanitized = args.expression.replace(/[^0-9+\-*/(). ]/g, '');
  const fn = new Function(`return (${sanitized});`);
  const result = Number(fn());
  return { result };
}
