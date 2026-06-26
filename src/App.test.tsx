import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page main title', () => {
  render(<App />);
  const linkElement = screen.getByText(/지구방/i);
  expect(linkElement).toBeInTheDocument();
});
