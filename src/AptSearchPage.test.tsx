import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AptSearchPage from "./pages/AptSearchPage";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

test("renders apt search page and filters list", async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: [
      {
        siteSeq: 1,
        aptName: "비산 롯데캐슬",
        addressRoad: "도로명주소 1",
        address: "지번주소 1"
      }
    ]
  });

  render(<BrowserRouter><AptSearchPage /></BrowserRouter>);
  const input = screen.getByPlaceholderText(/키워드/);
  fireEvent.change(input, { target: { value: "비산" } });

  await waitFor(() => {
    expect(screen.getByText(/롯데캐슬/)).toBeInTheDocument();
  });
});
