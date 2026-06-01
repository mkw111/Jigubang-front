import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AptSearchPage from "./pages/AptSearchPage";

test("renders apt search page and filters list", () => {
  render(<BrowserRouter><AptSearchPage /></BrowserRouter>);
  const input = screen.getByPlaceholderText(/검색/);
  fireEvent.change(input, { target: { value: "비산" } });
  expect(screen.getByText(/롯데캐슬/)).toBeInTheDocument();
});
