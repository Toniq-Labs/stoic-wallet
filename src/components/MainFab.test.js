import React from 'react';
import {render, screen} from '@testing-library/react';
import MainFab from './MainFab';
test('MainFab renders its children', () => {
  render(<MainFab>Send</MainFab>);
  expect(screen.getByText('Send')).toBeTruthy();
});
