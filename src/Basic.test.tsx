import { render, screen } from "@testing-library/react";

test("basic test", () => {
  render(<div>Jigubang</div>);
  expect(screen.getByText(/Jigubang/)).toBeInTheDocument();
});
