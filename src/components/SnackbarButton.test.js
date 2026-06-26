import React from 'react';
import {render, screen} from '@testing-library/react';
import SnackbarButton from './SnackbarButton';
test('SnackbarButton renders its trigger child', () => {
  render(
    <SnackbarButton message="Copied">
      <button>Copy</button>
    </SnackbarButton>,
  );
  expect(screen.getByText('Copy')).toBeTruthy();
});
