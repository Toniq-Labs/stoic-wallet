import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import AlertDialog from './AlertDialog';
test('AlertDialog shows title and message when open', () => {
  render(<AlertDialog open title="Heads up" message="It happened" />);
  expect(screen.getByText('Heads up')).toBeTruthy();
  expect(screen.getByText('It happened')).toBeTruthy();
});
test('AlertDialog calls handler on click', () => {
  const handler = jest.fn();
  render(<AlertDialog open title="t" message="m" buttonLabel="OK" handler={handler} />);
  fireEvent.click(screen.getByText('OK'));
  expect(handler).toHaveBeenCalled();
});
