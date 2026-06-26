import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';
test('ConfirmDialog confirm/cancel call handler with the right value', () => {
  const handler = jest.fn();
  render(
    <ConfirmDialog
      open
      title="t"
      message="m"
      buttonCancel="Cancel"
      buttonConfirm="Confirm"
      handler={handler}
    />,
  );
  fireEvent.click(screen.getByText('Confirm'));
  expect(handler).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByText('Cancel'));
  expect(handler).toHaveBeenCalledWith(false);
});
