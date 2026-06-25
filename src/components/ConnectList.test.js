import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import ConnectList from './ConnectList';
test('ConnectList routes clicks to the handler', () => {
  const handler = jest.fn();
  render(<ConnectList handler={handler} />);
  fireEvent.click(screen.getByText('Create a new Wallet'));
  expect(handler).toHaveBeenCalledWith('create');
});
